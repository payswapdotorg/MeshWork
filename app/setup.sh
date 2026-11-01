#!/usr/bin/env bash
# Meshwork app — one-command setup.
# Checks the runtime, installs dependencies, prepares .env, the Prisma client
# and the database schema. Safe to re-run.
set -euo pipefail

cd "$(dirname "$0")"

say() { printf '\033[1;36m▸ %s\033[0m\n' "$1"; }

# --- runtime -------------------------------------------------------------
if command -v bun >/dev/null 2>&1; then
  PM="bun"
elif command -v npm >/dev/null 2>&1; then
  PM="npm"
  node_major="$(node --version | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "${node_major:-0}" -lt 20 ]; then
    echo "Node.js 20+ (or Bun 1.1+) is required. Found: $(node --version 2>/dev/null || echo none)"
    exit 1
  fi
else
  echo "Neither bun nor npm found. Install Bun 1.1+ (https://bun.sh) or Node.js 20+."
  exit 1
fi
say "Using $PM"

# --- dependencies ----------------------------------------------------------
say "Installing dependencies"
if [ "$PM" = "bun" ]; then bun install; else npm install; fi

# --- environment -----------------------------------------------------------
if [ ! -f .env ]; then
  say "Writing .env from .env.example"
  cp .env.example .env
else
  say ".env already exists — leaving it untouched"
fi

# --- database --------------------------------------------------------------
say "Generating Prisma client + pushing the schema"
if [ "$PM" = "bun" ]; then
  bun run db:generate
  bun run db:push
else
  npm run db:generate
  npm run db:push
fi

# --- done -------------------------------------------------------------------
printf '\n'
say "Setup complete. Start the workspace:"
if [ "$PM" = "bun" ]; then
  printf '    bun run dev\n\n'
else
  printf '    npm run dev\n\n'
fi
printf 'The workspace seeds itself on the first request — open http://localhost:3000\n'
