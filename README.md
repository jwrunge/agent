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

1) Run the sandboxed dev environment:

   bun run dev:sandbox

This uses [agent-sandbox.dev.json](agent-sandbox.dev.json) (dev-oriented defaults).

2) (Optional) Create/install sandbox config + prerequisites:

The sandbox wrapper itself lives at [src/sandbox/cli.ts](src/sandbox/cli.ts). For now, run it directly via bun:

   bun run src/sandbox/cli.ts init
   bun run src/sandbox/cli.ts install
   bun run src/sandbox/cli.ts launch

Profiles:
- Use `--profile <name>` to load `agent-sandbox.<name>.json` (local) or `<userConfig>/sandbox/profiles/<name>.json` (per-user).

Edit `agent-sandbox.json` to control what host paths are mounted read-only / read-write.

## Notes
- The SDK example uses `createAgentSession()` and streams text deltas to stdout.
- For interactive use, prefer the CLI.
