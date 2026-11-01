# Meshwork

<div align="center">
  <img src="public/meshwork-logo.svg" alt="Meshwork" width="96" height="96" />
</div>

**Meshwork is an agent-operated workspace and a collaborative connectivity economy.** It combines the ZCode agent-workspace experience — tasks with thinking and tool traces, automations, plugin marketplace, browser/terminal/devices docks, settings with model providers — with the Meshwork connectivity network: path inventory, five aggregation modes, the connection marketplace and community demand pools.

This is the Meshwork web application: a self-contained [Next.js 16](https://nextjs.org) app (App Router, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma + SQLite) that runs anywhere Node or Bun runs — clone, install, `bun run dev`, done. No external services are required: the workspace seeds itself on first run.

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#one-command-setup">One-command setup</a> ·
  <a href="#scripts">Scripts</a> ·
  <a href="#project-structure">Project structure</a> ·
  <a href="#deployment">Deployment</a>
</p>

## Features

### Workspace (ZCode behavior, preserved)
- **New task** composer — project picker, permission mode, model select, quick actions, connectivity summary and orchestration capabilities panels.
- **Task conversations** — every task opens the full ZCode-style trace UI: user bubbles, assistant markdown, **thinking traces** (`Thought · N seconds`, expandable reasoning), **tool call rows** (Read / Terminal / Search / Fetch / Todos … with expandable arguments & output), timeline markers (`Using GLM 5.3 Max`), a working indicator with elapsed timer, and a composer to continue the task (follow-ups generate new reasoning + tool + answer rows).
- **Projects & task groups** — projects with colors and a New project dialog; ZCode "By group" manual groups (colored hash marks, rename, 7 group colors, move tasks between groups, count badges) plus **Recent** and **Unread** task-list views with a persistent view filter.
- **Browser / Terminal / Devices dock** — a resizable right dock with the browser pane (address bar), terminal session pane, and connected-devices pane; toggled from the workspace titlebar.
- **Automations** — ZCode scheduled tasks: status filters (All / In progress / Completed / Failed), schedule builder (hourly / daily / weekday / weekly / monthly / custom cron with live preview), run-now, pause/continue, restart, run history table (Triggered / Source / Status / Duration, 8 per page), templates, 20-task limit with zcode's exact guard message.
- **Plugin Marketplace** — Public / Community / Personal segments, Featured section, category sections, search, install/uninstall (with zcode's confirmation copy), update + "Update all", enable toggles, plugin detail view (MCP servers / Skills / Commands / Subagents / Hooks, Information, advanced details), marketplace sources dialog with the add-source risk flow.
- **Settings** — the ZCode settings structure restored: Basics (General, Appearance, **Model settings**, Browser Use, Keyboard Shortcuts), Agent capabilities (Personalization, Memory, Subagents, Plugins, MCP Servers, Skills, Commands, Hooks), Data & statistics (Usage stats, Projects, Archives) plus the Meshwork network sections (Network, Node, Privacy, Marketplace, Advanced, Remote devices, Computer Use). **Model settings** is the full ZCode Model Provider page: preset providers (Z.ai, BigModel) with connection modes and plan status, custom providers with base URL / API format / API key, per-provider model lists with context-window and vision badges, per-model test/edit/enable/delete, the add-model dialog (smart configuration, token limits, input types, capabilities, reasoning levels) and the Add-provider template picker (Zhipu + Other catalogs).
- **Settings opens as a full workspace replacement** (ZCode behavior) — "Back to workspace" restores the previous view exactly.

### Connectivity network (Meshwork)
- **Connections** — path inventory (Home fibre / 5G hotspot / Starlink with measured RTT, loss and freshness), the **five aggregation modes** (Single path, Load balance, Bond, Failover, Redundancy), estimates with provenance, traffic allocation table, preferences and the community connectivity panel.
- **Connection Marketplace** — buy access (listings with filters), sell capacity (offer dialog), group purchase (pools with terms and join flow).
- **Devices & Nodes** — this-device node card, node permissions, sharing consent.
- **My Offers / Group Buying** — seller-side offer management and demand-pool coordination.

## Quick start

Prerequisites: [Bun](https://bun.sh) 1.1+ (recommended) or Node.js 20+ with npm.

One command (installs the app and a `meshwork` command — see the repo root [install.sh](../install.sh) and [INSTALLATION.md](../docs/INSTALLATION.md)):

```bash
curl -fsSL https://raw.githubusercontent.com/payswapdotorg/MeshWork/main/install.sh | sh
meshwork start
```

Or manually:

```bash
git clone https://github.com/payswapdotorg/MeshWork.git
cd MeshWork/app

bun install                # or: npm install
cp .env.example .env       # default SQLite path works out of the box
bun run db:push            # create the schema

bun run dev                # http://localhost:3000
```

The workspace **seeds itself on the first request** — projects, tasks with full conversation traces, task groups, automations with run history, the plugin catalog with marketplace sources, model providers and settings. No seed command, no fixtures to import.

## One-command setup

```bash
./setup.sh
```

`setup.sh` checks the runtime, installs dependencies, writes `.env` (if missing), generates the Prisma client, pushes the schema and prints the next step.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the dev server on port 3000 (logs to `dev.log` and stdout) |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Start the standalone production server |
| `bun run lint` | ESLint (includes the strict React hooks ruleset) |
| `bun run db:push` | Apply `prisma/schema.prisma` to the database |
| `bun run db:generate` | Regenerate the Prisma client |
| `bun run db:studio` | Browse the database in Prisma Studio |

## Environment

`.env` (see [.env.example](.env.example)):

```bash
# SQLite database file (relative to prisma/schema.prisma)
DATABASE_URL=file:../db/custom.db
```

That's the only required variable. The app deliberately has no external service dependencies — providers, marketplaces and telemetry are simulated locally behind typed view models so the workspace runs fully offline.

## Project structure

```
app/                          # this Next.js application
├── prisma/schema.prisma      # Project, Task, TaskMessage, TaskGroup, Automation,
│                             # AutomationRun, Plugin, MarketplaceSource,
│                             # ModelProvider, ModelEntry, Setting
├── src/app
│   ├── page.tsx              # the workspace (single-route app shell)
│   └── api/                  # tasks (+[id], messages), projects, groups,
│                             # automations (+runs), plugins (+sources),
│                             # connections, marketplace, nodes, settings
│                             # (+model-providers, usage)
├── src/components/meshwork   # app shell, sidebar, topbar, dock panel and views
│   └── views/                # new-task, task (+parts), tasks, automations,
│                             # plugin-marketplace, connections, marketplace,
│                             # settings (+parts), nodes, my-offers, group-buying
├── src/lib/meshwork          # typed view models, store (Zustand), navigation,
│                             # seeds and domain data
├── src/lib/server            # seeding, VM mappers, trace generation
└── src/hooks/meshwork        # TanStack Query data hooks
```

Product requirements, architecture decisions, the TL design handoff and design references live in the repository root: [docs/](../docs) and [design/](../design).

## Deployment

The app is a standard Next.js 16 project and deploys anywhere Node runs.

- **Any Node host / VPS / container** — `bun run build && bun run start` (standalone output). Keep `db/custom.db` (or point `DATABASE_URL` elsewhere) on a persistent volume.
- **Vercel / serverless** — the bundled SQLite file works for preview/evaluation. For durable production data switch the Prisma `provider` in `prisma/schema.prisma` to Postgres (e.g. Neon), set `DATABASE_URL`, run `db:push`, and deploy — no code changes are required; all data access goes through Prisma.

## Design authority

- **Workspace / New task / Connections** — the approved dark Meshwork references (`upload/new_task.html` in the design handoff; accepted Connections design with all five aggregation modes).
- **Connection Marketplace** — [Figma frame 8:36](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36).
- **Settings / Automations / Plugin Marketplace / task traces / groups** — the ZCode reference implementation ([zai-org/ZCode](https://github.com/zai-org/ZCode)); restored, not redesigned.

## Credits

Meshwork builds on the [ZCode](https://github.com/zai-org/ZCode) agent-workspace UX (Apache-2.0). Task traces, automations, the plugin marketplace and settings follow the upstream product's interaction design.
