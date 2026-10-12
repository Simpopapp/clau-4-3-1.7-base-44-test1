// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Base44 sandbox preview reaches this dev server through a per-port proxy host
// (`<port>-<sandbox id>.${BASE44_SANDBOX_HOST_DOMAIN}`), which Vite rejects as an unknown Host
// unless it is allowlisted. The leading dot is Vite's "this domain and any subdomain" wildcard.
// Only extend the allowlist when the sandbox flag is exactly "1"; with it unset or any other
// value the wrapper's defaults stand untouched.
const sandboxHostDomain =
  process.env["BASE44_PREVIEW_MODE"] === "1"
    ? process.env["BASE44_SANDBOX_HOST_DOMAIN"]
    : undefined;
const sandboxAllowedHosts = sandboxHostDomain ? [`.${sandboxHostDomain}`] : [];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      ...(sandboxAllowedHosts.length > 0 ? { allowedHosts: sandboxAllowedHosts } : {}),
    },
  },
});
