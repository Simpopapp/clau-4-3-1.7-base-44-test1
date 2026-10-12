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
