# Minimal container image for running the agent workflow under Bun.
# This is intentionally Linux-only; macOS/Windows run it via a Linux VM layer.

FROM oven/bun:1.2.2

WORKDIR /app

# Install minimal tooling commonly needed by coding agents.
USER root
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN mkdir -p /workspace /app \
	&& chown -R bun:bun /workspace /app

USER bun

# Install deps first for better caching.
COPY package.json bun.lock tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Patch pi config (postinstall) and install deps.
RUN bun install --production

# Default: run the interactive workflow.
WORKDIR /workspace
CMD ["bun", "run", "/app/src/run-workflow.ts"]
