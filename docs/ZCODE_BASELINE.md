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

## 4. Baseline functional verification (runtime smoke — performed)

The vendored runtime was launched for a real smoke check: the **genuine ZCode server v3.17.1** (from the vendored tree, zero modifications) booted with clean SQLite migrations and served `/api/server-info` (capabilities on, `failedPathCount: 0`); the web dev server served the genuine ZCode login/workspace UI; websocket RPC round-trips succeeded (`provider-settings.refresh OK`). The interactive session is blocked twice over: login needs Z.ai/BigModel credentials or their API keys (not in this project's key set), and the vite dev dep-optimizer was OOM-killed at 2.58 GB RSS against the 4 GiB cgroup while the MeshWork dev server was resident. Screenshot: [evidence/zcode-baseline-login-web.png](evidence/zcode-baseline-login-web.png); full details in [zcode-baseline-functional.md](zcode-baseline-functional.md).

The remaining M0 checklist items — projects/tasks, task session, Browser, Terminal, automations, plugins, settings, memory — need the sized runner **and** provider credentials; honest status: **open, recorded rather than faked.**

## 5. Repo layout after vendoring

```
MeshWork/
├── app/        # Meshwork web workspace (Next.js 16) — TL UI handoff implementation
├── zcode/      # vendored zai-org/ZCode @ a60ba6a7e5 (pristine, Apache-2.0)
├── design/     # approved HTML design prototypes (reference only)
└── docs/       # requirements, ADRs, handoffs, reports, evidence
```

## 6. CI installer pipeline (M0)

The renderer-build blocker in §3 is a memory ceiling of this sandbox, not of the code.
[`.github/workflows/installers.yml`](../.github/workflows/installers.yml) completes the
baseline on GitHub-hosted runners (16 GB), directly using the toolchain pins from §2:

| Job | Runner | Commands | Artifacts |
|---|---|---|---|
| `linux` | `ubuntu-latest` + `rpm libarchive-tools fakeroot` | `pnpm install` → `pnpm bundle:desktop --linux --x64` | `.AppImage`, `.deb`, `.rpm`, `.pkg.tar.zst` + `SHA256SUMS-linux.txt` |
| `windows` | `windows-latest` | `pnpm install` → `pnpm bundle:desktop --win --x64` | NSIS `.exe` (+ blockmap) + `SHA256SUMS-windows.txt` |
| `runtime` | `ubuntu-latest` | `pnpm install` → `pnpm build:zcode --base-url <release-url>` (+ tarball extract + `zcode.mjs --version` smoke) | runtime `tar.gz`, `sha256.txt`, `latest.json`, `install.sh` |
| `release` | on `v*` tags | collects the above | GitHub Release with all installers + notes |

`bundle:desktop` runs upstream's own `prepare:runtime-assets` → `build` → electron-builder
chain inside `packages/desktop/scripts/bundle.mjs`; native-search tools fall back to the
repository-bundled prebuilt archives when no intranet mirror is configured. Nothing under
`zcode/` is modified — this is the pristine-baseline build the M0 exit criteria ask for.

**Run evidence** (to be appended as runs complete):

- _pending first dispatch — see the [Installers workflow runs](https://github.com/payswapdotorg/MeshWork/actions/workflows/installers.yml)._

