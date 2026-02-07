# Minimal container image for running the agent workflow.
# This is intentionally Linux-only; macOS/Windows run it via a Linux VM layer.

# Builder stage: compile the agent to a Linux binary.
FROM oven/bun:1.2.2 AS build

WORKDIR /app

# Install minimal tooling commonly needed by coding agents at runtime.
# We install it here so we can reuse package caching layers.
USER root
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

USER bun

# Install deps first for better caching.
COPY package.json bun.lock tsconfig.json ./
COPY packages ./packages
COPY src ./src
COPY scripts ./scripts

RUN bun install --production

# Compile to a Linux binary inside the Linux builder image.
RUN bun build --compile src/run-workflow.ts --outfile /out/pi-agent

# Runtime stage: no Bun needed.
FROM debian:bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates git \
	&& rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 10001 agent \
	&& mkdir -p /workspace /app \
	&& chown -R agent:agent /workspace /app

COPY --from=build /out/pi-agent /app/pi-agent

USER agent
WORKDIR /workspace
CMD ["/app/pi-agent"]
