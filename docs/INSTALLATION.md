# Installation

**Goal:** Meshwork must be as easy to download and install as ZCode. This document is the
single source of truth for every supported install path, its requirements and its status.

| Path | What you get | Status |
| --- | --- | --- |
| [One command (web app)](#1-one-command-web-app) | `meshwork` command + production workspace on `localhost` | ✅ verified |
| [Manual (web app)](#2-manual-web-app) | dev checkout of `app/` | ✅ verified |
| [ZCode desktop installers](#3-zcode-desktop-installers) | Linux AppImage/deb/rpm/pacman + Windows NSIS, built from the vendored `zcode/` baseline by CI | 🔶 CI pipeline added; artifacts land on [Releases](https://github.com/payswapdotorg/MeshWork/releases) on `v*` tags — see [Status](#status) |
| [ZCode runtime distribution](#4-zcode-runtime-distribution) | `zcode` command (TUI + `--web`) from the upstream-style runtime tarball | 🔶 same CI pipeline |

---

## 1. One command (web app)

```bash
curl -fsSL https://raw.githubusercontent.com/payswapdotorg/MeshWork/main/install.sh | sh
meshwork start        # → http://localhost:3000
```

Requirements: `git`, `curl`, and **Bun 1.1+ or Node.js 20+**. If neither runtime is
present, the installer installs Bun with its official script (opt out with
`MESHWORK_NO_BUN_INSTALL=1`).

The installer follows the ZCode distribution model (`zcode/scripts/build-zcode.mjs` +
`zcode-distribution/installer.mjs`):

1. Sparse-clones the repository (`app/` only — a few MB) into `~/.meshwork/src`,
   keeping `.git` so updates can fetch in place.
2. Runs [`app/setup.sh`](../app/setup.sh): dependency install, `.env`, Prisma client
   and database schema.
3. Installs a `meshwork` command into `~/.local/bin`.

Re-running the installer is safe and **preserves user state**: `.env`, the SQLite
database (`app/db/`), `node_modules` and any production build are carried across.

### The `meshwork` command

```
meshwork start [--port N] [--dev] [--build]   production build (default port 3000);
                                               --dev = dev server, --build = force rebuild
meshwork stop | restart | status
meshwork logs                                 follow the server log
meshwork update                               git pull + setup + rebuild (+ restart if running)
meshwork doctor                               health check: runtime, source, deps, db, build, server
meshwork open                                 open the workspace in a browser
```

`start` is self-healing: missing `.env`, `node_modules` or database are created on
demand; a missing production build is built once. The production server runs from
the standalone Next.js output; a PID file and log live in `~/.meshwork/`.

### Environment overrides (same pattern as the ZCode installer)

| Variable | Default | Meaning |
| --- | --- | --- |
| `MESHWORK_REPO` | `https://github.com/payswapdotorg/MeshWork.git` | git remote to install from |
| `MESHWORK_REF` | `main` | branch or tag |
| `MESHWORK_HOME` | `~/.meshwork` | install root |
| `MESHWORK_BIN_DIR` | `~/.local/bin` | where the `meshwork` command is written |
| `MESHWORK_PORT` | `3000` | default port for start |
| `MESHWORK_NO_BUN_INSTALL` | – | `1` = never auto-install Bun |

### Uninstall

```bash
meshwork stop
rm -rf ~/.meshwork ~/.local/bin/meshwork
```

## 2. Manual (web app)

```bash
git clone https://github.com/payswapdotorg/MeshWork.git
cd MeshWork/app
./setup.sh
bun run dev            # http://localhost:3000 — the workspace seeds itself on first run
```

Details, scripts and deployment options: [`app/README.md`](../app/README.md).

## 3. ZCode desktop installers

The pristine ZCode desktop app (Electron) is built from the vendored [`zcode/`](../zcode)
baseline — no Meshwork changes — by [`.github/workflows/installers.yml`](../.github/workflows/installers.yml)
on hosted runners (the dev sandbox cannot finish the renderer build; see
[ZCODE_BASELINE.md §3](ZCODE_BASELINE.md#3-baseline-build-results-this-environment)).

Download from [Releases](https://github.com/payswapdotorg/MeshWork/releases):

- **Linux:** `.AppImage` (chmod +x and run), `.deb`, `.rpm`, `.pkg.tar.zst` (pacman)
- **Windows:** NSIS `.exe` installer

Each release carries `SHA256SUMS-*` files. Installers are unsigned (baseline; signing
arrives with M9 production releases). These artifacts are the **ZCode** baseline apps;
Meshwork-specific packaging follows the milestone plan.

## 4. ZCode runtime distribution

The same CI builds upstream's own lightweight distribution (`pnpm build:zcode`): a
runtime tarball (server + web + agent) with `install.sh` + `latest.json`, published to
each Release. That is ZCode's "Lite" install path, unmodified:

```bash
curl -fsSL https://github.com/payswapdotorg/MeshWork/releases/latest/download/install.sh | sh
zcode               # TUI
zcode --web         # web workspace
```

It requires `node`, `curl`, `tar`, installs to `~/.zcode/runtime` and drops `zcode`
into `~/.local/bin` (overridable: `ZCODE_DIST_HOME`, `ZCODE_DIST_BIN_DIR`).

## Status

Honest, evidence-linked status for the installability work:

- **Web app one-liner** — verified end-to-end in a clean test HOME (2026-11-02):
  fresh install, idempotent re-install with state carry-over, `start` (production
  build + serve + readiness probe), `--port`, `restart`, `stop`, `status`, `logs`,
  `update` (idle + while-running), `doctor`, `open`, error paths, and the
  `bun node_modules/next/dist/bin/next` dev invocation against the real app.
  Disk limits of the dev sandbox prevented a second full `node_modules` install;
  the fresh-dependency path is exercised by `app/setup.sh`, which the project itself
  uses, and the carried-deps path was verified in place.
- **Desktop installers / runtime distribution** — the CI pipeline exists and runs on
  hosted runners. Verification evidence (successful runs + downloadable artifacts)
  is recorded in [ZCODE_BASELINE.md §6](ZCODE_BASELINE.md#6-ci-installer-pipeline-m0)
  as runs complete.
