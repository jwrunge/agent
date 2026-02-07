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

### End-user usage (no Bun/Node/npm required)

The wrapper is compiled to a standalone binary:

   dist/pi-agent-sandbox

End users only need a container runtime (Docker/Podman; on macOS we use Colima). On first run, the wrapper will:
- prompt to install prerequisites if missing
- create a default per-user sandbox config if none exists
- build the container image if missing
- run the agent container and clean it up when the wrapper exits

### Development usage

Run the sandboxed dev environment (uses [agent-sandbox.dev.json](agent-sandbox.dev.json)):

   bun run dev:sandbox

Profiles:
- Use `--profile <name>` to load `agent-sandbox.<name>.json` (local) or `<userConfig>/sandbox/profiles/<name>.json` (per-user).

Edit `agent-sandbox.json` to control what host paths are mounted read-only / read-write.

## Notes
- The SDK example uses `createAgentSession()` and streams text deltas to stdout.
- For interactive use, prefer the CLI.
