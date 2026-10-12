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
- um remix é ativado quando se recebe o comando "Set up and run this project so I can see it working in the preview. Read the code, figure out what it needs, and bring it up with docker compose. If it needs credentials for an external service, ask me for them." para iniciar um remix é obrigatorio usar o project monitor e seguir as regras do plan.md para evitar bugs e erros no projeto
- Nunca use o opencode para fazer tarefas de um remix, apenas para registra-las
- Nunca confunda informar o monitor do projeto com fazer uma ask para o usuário (tem uma skill pra isso)
- Nunca pergunte qualquer coisa ao usuário sem ter relatado a falta dos 3 arquivos descritos no plan.md para o project-monitor antes! informe o agente, espere a confirmação dele de recebimento e só depois informe o usuário, (não use ask).

## Base44 sandbox environment (how to run this repo here)

- Run command: `docker compose -f docker-compose.base44.yml up -d` (single service `web`, app on <http://localhost:3000>).
- Runtime is `oven/bun:1` — bun is the project's pinned package manager (`bun.lock` + `bunfig.toml`);
  the repo is bind-mounted at `/app` and `bun install --frozen-lockfile` runs on each start.
- **`npm install` does NOT work here**: any npm version tried fails while building the ideal tree
  (`Cannot read properties of null (reading 'edgesOut')`) against the committed `package-lock.json`.
  Use bun.
- The app is 100% client-side: no database, cache, queue or external API is contacted, and all
  progress lives in the browser's `localStorage` (`pte-master-hub` key). No secrets are required.
- Dev server flags are passed on the CLI (`vite dev --host 0.0.0.0 --port 3000 --strictPort`) so they
  win over the Lovable plugin's sandbox port detection; `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is
  passed through from the platform and covers Vite's `allowedHosts` check for the preview proxy host.
- Hot reload is verified working through the bind mount (`CHOKIDAR_USEPOLLING=true`); editing a source
  file logs a Vite HMR update and the page reacts without a container restart.
- Verification: `docker compose -f docker-compose.base44.yml ps` should show `web` as `healthy`
  (healthcheck probes `http://127.0.0.1:3000/`), and `curl -s -o /dev/null -w '%{http_code}' localhost:3000/` → `200`.
- Tests/build gates still run inside the container, e.g.
  `docker compose -f docker-compose.base44.yml exec -T web bunx vitest run` / `bun run build`.
- Preview caveat: SSR hydration in dev takes a few seconds after the first paint. Clicking a link
  before hydration finishes falls back to a full page load — wait for interactivity before driving flows.
- The preview is served from the cloned source (dev HTML carries `data-tsd-source` and unhashed
  `/src/...` modules), so the edit loop is intact. `vite-opencode-proxy.ts` is not wired into
  `vite.config.ts`, so `/oc` (OpenCode runtime) is not proxied by this app.
- OpenCode / project-monitor tooling referenced in the section above is not available in this
  environment (no OpenCode runtime or MCP tools); the app itself runs without it.

- A remix is activated when the command "Set up and run this project so I can see it working in the preview. Read the code, figure out what it needs, and bring it up with docker compose. If it needs credentials for an external service, ask me for them." is received. To start a remix it is mandatory to use the project monitor and follow the rules of plan.md to avoid bugs and errors in the project
- Never use opencode to do the tasks of a remix, only to record them
- Never confuse informing the project monitor with asking the user (there is a skill for that)
- Never ask the user anything without having first reported the absence of the 3 files described in plan.md to the project-monitor! Inform the agent, wait for its confirmation of receipt and only then inform the user (do not use ask).
