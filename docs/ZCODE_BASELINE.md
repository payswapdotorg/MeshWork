# ZCode baseline (M0) — upstream fork record

**Date:** 2026-11-01
**Status:** Source vendored at pinned upstream commit; install + partial build baseline recorded; renderer build blocked by sandbox memory ceiling (evidence below).

## 1. Upstream identification

| Field | Value |
|---|---|
| Repository | https://github.com/zai-org/zcode |
| Pinned commit | `a60ba6a7e5a06742270ca605f5d2cc2766afa7e1` |
| Commit date | 2026-10-30 ("chore: sync ZCode source") |
| Version | 3.17.1 (`package.json`) |
| Licence | Apache-2.0 (`zcode/LICENSE`, 11,344 bytes) |
| Notices | `zcode/NOTICE.md` (28,939 B) and `zcode/THIRD-PARTY-NOTICES.md` (1,996,610 B) preserved verbatim |
| Submodules / nested repos | None (verified: no `.gitmodules`, no nested `.git`) |
| Files > 100 MB (GitHub limit) | None (largest tracked file well under limit) |

## 2. Vendoring strategy

The upstream tree is vendored **as-is** under [`zcode/`](../zcode) using `git archive HEAD` from a shallow clone at the pinned commit — a pristine snapshot with no Meshwork modifications:

- Preserves upstream licence, notices, third-party attributions, `.gitattributes`, `.husky`, `.agents`, `AGENTS.md`, `architecture-policy.yaml` and the full monorepo (`apps/`, `packages/`, `scripts/`, `specs/`, `third-party/`, `config/`, `patches/`, `public/`, `docs/`).
- No build outputs, `node_modules` or local state are committed (the snapshot is exactly the upstream tracked tree).
- **Upstream sync strategy:** re-vendor by re-running `git archive` at a newer pinned commit and recording the new hash here. Upstream's own history is squashed mirror commits ("chore: sync ZCode source"), so a snapshot-per-upgrade with a recorded pin is the honest equivalent of a fork-with-history for our purposes.
- **First Meshwork change rule (ADR-001):** Meshwork features are added as extensions in the existing boundaries; nothing in this baseline is deleted. Changes to files under `zcode/` must reference the upstream file they modify.

Toolchain pins (from upstream `mise.toml`): Node 24.14.0, pnpm 10.33.2, `ELECTRON_MIRROR` for downloads. `.nvmrc` = 24.

## 3. Baseline build results (this environment)

Environment: sandbox container — 4 GiB memory cgroup (`memory.max` = 4,294,967,296), 2 vCPU, 9.9 GB disk, Node v24.22.1, pnpm 10.33.2 (pinned version installed).

| Step | Result | Evidence |
|---|---|---|
| `pnpm install` (root, hoisted linker) | ✅ **Success** — 1 m 5 s | full dep tree installed; engine warning only (wanted Node 24.14.0, ran 24.22.1) |
| `prepare` (husky + `build:cua`) | ✅ Success | `zcode-cua` typecheck + build Done |
| `packages/desktop` postinstall (node-pty electron-rebuild) | ✅ Success | "✔ Rebuild Complete", `prebuilds/linux-x64/pty.node` |
| Package builds: `server`, `rpc`, `provider`, `provider-node`, `formal-proof`, `model-option-map`, `stream-animate`, `zcode-server-cli` | ✅ Success | `dist/` outputs produced |
| `web-share` vite build | ✅ Success | 82 MB dist with JS bundles |
| `desktop` `tsc -b tsconfig.host.json` | ✅ Success | exit 0 |
| `desktop` tsup (main + host + preload bundles) | ✅ Success | `out/host/index.js` 3.86 MB, "Build success in 4654 ms" |
| `@zcode/web` vite build (8,302 modules) | ❌ **OOM-killed** | kernel: `anon-rss: 3,543,224 kB` (3.54 GB) at kill; `memory.max` 4 GiB; exit 137 |
| `desktop` renderer vite build (8,278 modules) | ❌ OOM at chunk rendering | all modules transformed; process killed during "rendering chunks..." under memory pressure |
| `build:bootstrap` (completion), `bundle:desktop` (electron-builder), Linux/Windows installers, desktop E2E | ⛔ Blocked by the renderer build above | not attempted further — same memory class |

### Root cause and requirement

The vite 8 / rolldown production build of the workspace UI (web + desktop renderer, ~8.3 k modules each) peaks above 3.5 GB RSS and is killed by the 4 GiB cgroup OOM killer — a **resource ceiling of this verification environment, not an upstream code failure**. The same install and lighter builds succeed here. Completing the baseline (renderer build → electron-builder installers for Linux and Windows) requires a runner with **≥ 8 GB RAM** (16 GB recommended); the pinned toolchain and commands are exactly as above. Recommended next environment: GitHub Actions `ubuntu-latest` / `windows-latest` hosted runners, which also match upstream's CI matrix (`scripts/` contains the electron-builder mirror verification and E2E container scripts).

## 4. Baseline functional verification

Not yet performed against the real ZCode runtime in this environment: the desktop app needs the renderer build above, and this container has no display. The M0 checklist items — projects/tasks, task session, Browser, Terminal, automations, plugins, settings, memory — remain open until the baseline build runs on an adequately sized runner. Honest status: **not verified here; blocked by resources, recorded rather than faked.**

## 5. Repo layout after vendoring

```
MeshWork/
├── app/        # Meshwork web workspace (Next.js 16) — TL UI handoff implementation
├── zcode/      # vendored zai-org/ZCode @ a60ba6a7e5 (pristine, Apache-2.0)
├── design/     # approved HTML design prototypes (reference only)
└── docs/       # requirements, ADRs, handoffs, reports, evidence
```
