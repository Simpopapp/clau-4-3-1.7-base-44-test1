# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.
- The OpenCode proxy exposes the OpenCode runtime at the `/oc` route. It is hidden from the app routes; only use the OpenCode runtime

## Verification and Quality
- Verification gates: `bunx vitest run` (or `npm run test`) + `bun run build` + lint with `bun run lint` (or `npm run lint`).
- tsconfig uses `noPropertyAccessFromIndexSignature` and `exactOptionalPropertyTypes`: use bracket access on `Record<string, unknown>` and conditional spread for optional props.

## Remix Roles
- A remix is activated when the command "Set up and run this project so I can see it working in the preview. Read the code, figure out what it needs, and bring it up with docker compose. If it needs credentials for an external service, ask me for them." is received. To start a remix it is mandatory to use the project monitor and follow the rules of plan.md to avoid bugs and errors in the project
- Never use opencode to do the tasks of a remix, only to record them
- Never confuse informing the project monitor with asking the user (there is a skill for that)
- Never ask the user anything without having first reported the absence of the 3 files described in plan.md to the project-monitor! Inform the agent, wait for its confirmation of receipt and only then inform the user (do not use ask).

## Base44 sandbox (docker compose)

This repository also runs in the Base44 sandbox, which is a different environment from the
`base44 dev` flow in `README.md`: no Base44 CLI, no `base44 login`/`base44 link`, no hosted
backend. Environment setup and verification in Base44 sessions follow the platform flow
(`docker-compose.base44.yml`, `.base44/environment.json`); the "Remix Roles" protocol above is
not run by Base44.

- Start: `docker compose -f docker-compose.base44.yml up -d`. The preview is on host port **3000**,
  mapped to the dev server's own 8080 (the `@lovable.dev/vite-tanstack-config` wrapper pins it).
- `bun.lock` is the authoritative lockfile. `package-lock.json` is stale (it pins
  `@lovable.dev/vite-tanstack-config` 2.25.1 against 2.25.3 in `package.json`), so `npm ci` fails.
- The app is one TanStack Start process: question banks under `src/data`, all user state in
  `localStorage`. No database, cache or third-party credential is required to boot.
- Sandbox-only override, gated on `BASE44_PREVIEW_MODE === "1"` in `vite.config.ts`: the per-port
  preview host (`<port>-<sandbox id>.<BASE44_SANDBOX_HOST_DOMAIN>`) is added to Vite's
  `server.allowedHosts`. Without it Vite answers `Blocked request. This host is not allowed.` With
  the flag unset or any other value the wrapper's defaults are untouched.
- Project gates (run inside the container): `docker compose -f docker-compose.base44.yml exec web bun run test`,
  `... exec web bun run lint`, `... exec web bun run build`.
- Health: SSR `GET /` on `127.0.0.1:8080` (the compose healthcheck).
- Monitor (OpenCode): the compose file also runs an `opencode` service (the OpenCode CLI is installed at
  container start, then `opencode serve` on 4096, repo bind-mounted at `/app`). The committed dev proxy
  `vite-opencode-proxy.ts` is registered as a Vite plugin in `vite.config.ts` and exposes the monitor UI
  on `/oc` (forwarding to `$OPENCODE_URL`, which compose sets to `http://opencode:4096`; the code default
  is `127.0.0.1:4096`). `/oc` and `/api/health` are **not app routes** — they are separate proxied
  documents, so they need a full page load (client-side/SPA navigation cannot reach them and Vite's
  middleware, not the TanStack router, answers them). When the monitor is down the proxy answers
  502 `OpenCode indisponível`; the app itself keeps working.
  - Monitor health: `curl -sf http://localhost:3000/api/health` (proxied) or
    `docker compose -f docker-compose.base44.yml exec opencode bun -e 'const r=await fetch("http://127.0.0.1:4096/api/health"); if(!r.ok) process.exit(1)'`.
  - No model provider credential is configured in the repo (there is no `opencode.json`), so the monitor
    UI runs but agent runs need the user's own provider key/config.
