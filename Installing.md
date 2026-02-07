# Installing

This doc is for end users installing the sandbox wrapper from GitHub Releases.

The goal is: run a single wrapper command on the host; the agent runs inside a Linux container configured by a local config file. End users should not need Bun/Node/npm.

## What gets installed

- Wrapper binary: `pi-agent-sandbox` (host executable)
- App bundle: a directory containing `container/` (Dockerfiles) and the build context used to build the agent container image
- Per-user sandbox config (auto-created on first run if missing): `agent-sandbox.json`

## Requirements

- A container runtime
  - macOS: Colima + Docker CLI (the wrapper can prompt to install via Homebrew)
  - Linux: Docker or Podman
  - Windows: run the wrapper inside WSL2 for sandboxing (Linux containers)

## Install from GitHub Releases

Replace `<owner>/<repo>` with your repository (example: `acme/hardshell`).

### macOS / Linux

```sh
curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/install.sh | sh -s -- --repo <owner>/<repo>
```

Optional flags:

```sh
# Install a specific version tag
... | sh -s -- --repo <owner>/<repo> --version v0.1.0

# Install to custom locations
... | sh -s -- --repo <owner>/<repo> --bin-dir "$HOME/.local/bin" --app-dir "$HOME/.local/share/hardshell-nodejs/app"
```

By default this installs:
- binary: `~/.local/bin/pi-agent-sandbox`
- app bundle: macOS `~/Library/Application Support/hardshell-nodejs/app`, Linux `${XDG_DATA_HOME:-~/.local/share}/hardshell-nodejs/app`

Make sure `~/.local/bin` is on your `PATH`.

### Windows

Run in PowerShell:

```powershell
# Download and run the installer script
Invoke-WebRequest -Uri https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/install.ps1 -OutFile install.ps1
.\install.ps1 -Repo <owner>/<repo>
```

Notes:
- The sandboxed container workflow requires WSL2. The wrapper will tell you if you’re not in WSL.

## Run

After install:

```sh
pi-agent-sandbox
```

First run behavior:
- Prompts to install container prerequisites if missing
- Creates a default per-user sandbox config if none exists
- Builds the container image if missing
- Runs the agent container; when the wrapper exits, the container is removed

## Configuration

The wrapper loads a sandbox config file and uses it to:
- choose the image name
- decide whether/how to build the image
- configure mounts, env vars, network mode, and resource limits

Config search order:
- `--config <path>` if provided
- otherwise local `./agent-sandbox.json`
- otherwise per-user config directory

Per-user config directory is OS-specific; the wrapper will print the path when it creates it.

### App bundle location

The wrapper must be able to find the app bundle (the `container/` directory).

It searches in this order:
- `HARDSHELL_APP_DIR` (if set)
- current working directory (if it contains `container/Dockerfile`)
- the default per-user app directory

If you used the installer scripts, the bundle is installed to the default per-user app directory, so you typically don’t need to set `HARDSHELL_APP_DIR`.

## Uninstall

- Remove the wrapper binary (default): `rm ~/.local/bin/pi-agent-sandbox`
- Remove the app bundle directory (default):
  - macOS: `rm -rf "~/Library/Application Support/hardshell-nodejs/app"`
  - Linux: `rm -rf "${XDG_DATA_HOME:-~/.local/share}/hardshell-nodejs/app"`
- Remove per-user sandbox config directory (optional): the wrapper stores it under your OS config path for `hardshell`.

## Troubleshooting

- "No container runtime detected": run `pi-agent-sandbox install` (or just re-run `pi-agent-sandbox` and accept the install prompt on macOS).
- "Run this launcher inside WSL2": you’re on Windows native; install WSL2 and run inside it.
- Docker build warnings about legacy builder: install Docker buildx (on macOS the wrapper can prompt via Homebrew).
