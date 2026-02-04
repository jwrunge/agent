# pi-coding-agent TypeScript scaffold

This workspace provides a minimal TypeScript SDK example for @mariozechner/pi-coding-agent, plus quick notes for the CLI.

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

## SDK quickstart
```
npm install
npm run start
```

## Notes
- The SDK example uses `createAgentSession()` and streams text deltas to stdout.
- For interactive use, prefer the CLI.
