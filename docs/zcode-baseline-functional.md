# ZCode baseline (M0) — functional smoke (runtime)

**Date:** 2026-11-01 · Environment: same sandbox (4 GiB cgroup, 2 vCPU)

## What ran

- `packages/server` production dist (`tsup` output, built in §3 of the main baseline) launched with `ZCODE_ENV=development` — **genuine zai-org/ZCode server v3.17.1 from the vendored tree, zero modifications.**
- `packages/web` vite dev server against it (proxy `/api` + `/ws` → :3030).

## Results

| Check | Result | Evidence |
|---|---|---|
| Server boot + SQLite migrations | ✅ | `/api/server-info` → `version: 3.17.1`, `migration.failedPathCount: 0`, workspaces detected, `desktopContinuous`/`websocketRpc`/`virtualProjects` capabilities on |
| Provider registry init | ✅ | "Provider Registry 已就绪"; remote built-in config refresh reached the live test backend (revision-drift warning expected for a pinned snapshot) |
| Web dev server | ✅ starts (662 ms) | Vite v8 ready; serves the genuine ZCode workspace/login UI |
| Login UI | ✅ renders | "Welcome to ZCode" with Connect to Z.ai Global / BigModel CN / Use API key (Z.ai, BigModel) — screenshot: [zcode-baseline-login-web.png](evidence/zcode-baseline-login-web.png) |
| Websocket RPC round-trips | ✅ | UI → server RPC `provider-settings.refresh OK (658 ms)` in the server log; purchase telemetry + provider-availability guard ran in the client console |
| Full interactive workspace session | ❌ blocked twice over | (a) login requires Z.ai/BigModel credentials or their API keys (not in this project's key set); (b) vite dep-optimization was OOM-killed at 2.58 GB RSS alongside the resident MeshWork dev server — kernel-verified, same 4 GiB ceiling as the production renderer build |

## Reading

The vendored runtime is genuine and boots end-to-end (server → migrations → RPC → web UI). Deeper functional verification of the M0 checklist (projects/tasks, task session, Browser, Terminal, automations, plugins, settings, memory) requires (a) a sized runner and (b) Z.ai or BigModel credentials, and remains open — recorded, not faked.
