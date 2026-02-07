# pi-coding-agent Bun scaffold

This workspace provides a minimal Bun SDK example for @mariozechner/pi-coding-agent, plus quick notes for the CLI.

## Structure
- src/: minimal SDK workflow runner

## Setup
1) Copy the environment template:

   cp .env.example .env

2) Fill in your provider API key(s) in `.env` (e.g. `ANTHROPIC_API_KEY`).

## CLI quickstart
```
npm install -g @mariozechner/pi-coding-agent
pi
```
Then run `/login` or set provider keys in `.env` and restart.

## SDK quickstart (Bun)
```
bun install
bun run dev
```

## Build a binary
```
bun run compile
```

## Containerized sandbox wrapper (recommended)

This repo includes a lightweight wrapper that runs the agent inside an OCI container with a declarative `agent-sandbox.json` config (bind mounts + read-only rootfs + optional offline networking).

1) Create your sandbox config (per-user by default):

   bun run sandbox:init

   - Writes to your per-user config directory (via `env-paths`) so you don’t need a config in every project.
   - If you prefer a project-local config, use:

     bun run sandbox:init:local

2) Install/check prerequisites:

   bun run sandbox:install

   - macOS: installs Colima + Docker CLI via Homebrew (prompted)
   - Windows: run inside WSL2
   - Linux: install Podman (rootless) or Docker Engine

3) Launch:

   bun run sandbox:launch

Profiles:
- Use `--profile <name>` to load `agent-sandbox.<name>.json` (local) or `<userConfig>/sandbox/profiles/<name>.json` (per-user).

Edit `agent-sandbox.json` to control what host paths are mounted read-only / read-write.

## Notes
- The SDK example uses `createAgentSession()` and streams text deltas to stdout.
- For interactive use, prefer the CLI.
