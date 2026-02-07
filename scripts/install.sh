#!/usr/bin/env sh
set -eu

# hardshell GitHub Releases installer
# - Installs the wrapper binary (pi-agent-sandbox) to ~/.local/bin (default)
# - Installs the app bundle (Dockerfile + build context) to the per-user data dir
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/install.sh | sh -s -- --repo <owner>/<repo>
#
# Options:
#   --repo owner/repo      (required)
#   --version vX.Y.Z       (optional; default: latest)
#   --bin-dir PATH         (optional; default: ~/.local/bin)
#   --app-dir PATH         (optional; default: OS-specific user data dir)

REPO=""
VERSION=""
BIN_DIR="${HOME}/.local/bin"
APP_DIR=""

fail() { echo "error: $*" 1>&2; exit 1; }

need_cmd() { command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"; }

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --repo)
        shift || true
        REPO="${1:-}";
        ;;
      --version)
        shift || true
        VERSION="${1:-}";
        ;;
      --bin-dir)
        shift || true
        BIN_DIR="${1:-}";
        ;;
      --app-dir)
        shift || true
        APP_DIR="${1:-}";
        ;;
      --help|-h)
        cat <<EOF
install.sh --repo <owner>/<repo> [--version vX.Y.Z] [--bin-dir PATH] [--app-dir PATH]
EOF
        exit 0
        ;;
      *)
        fail "unknown arg: $1"
        ;;
    esac
    shift || true
  done
}

os_arch() {
  OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"

  case "$OS" in
    darwin) OS="darwin";;
    linux) OS="linux";;
    *) fail "unsupported OS: $OS";;
  esac

  case "$ARCH" in
    x86_64|amd64) ARCH="x64";;
    arm64|aarch64) ARCH="arm64";;
    *) fail "unsupported arch: $ARCH";;
  esac

  echo "${OS}-${ARCH}"
}

default_app_dir() {
  # Mirrors env-paths behavior well enough for install-time defaults.
  # The wrapper can also be pointed at a custom dir via HARDSHELL_APP_DIR.
  OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  if [ "$OS" = "darwin" ]; then
    echo "${HOME}/Library/Application Support/hardshell/app"
  else
    echo "${XDG_DATA_HOME:-${HOME}/.local/share}/hardshell/app"
  fi
}

http_get() {
  url="$1"
  out="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$out"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$out" "$url"
  else
    fail "need curl or wget"
  fi
}

main() {
  parse_args "$@"
  [ -n "$REPO" ] || fail "--repo is required (owner/repo)"

  need_cmd tar

  PLATFORM="$(os_arch)"
  if [ -z "$APP_DIR" ]; then
    APP_DIR="$(default_app_dir)"
  fi

  mkdir -p "$BIN_DIR" "$APP_DIR"

  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT

  if [ -z "$VERSION" ]; then
    VERSION="latest"
  fi

  BIN_NAME="pi-agent-sandbox-${PLATFORM}"
  BUNDLE_NAME="hardshell-app-bundle.tar.gz"

  if [ "$VERSION" = "latest" ]; then
    BASE="https://github.com/${REPO}/releases/latest/download"
  else
    BASE="https://github.com/${REPO}/releases/download/${VERSION}"
  fi

  echo "Downloading ${BIN_NAME}..."
  http_get "${BASE}/${BIN_NAME}" "${TMP}/${BIN_NAME}"

  echo "Downloading ${BUNDLE_NAME}..."
  http_get "${BASE}/${BUNDLE_NAME}" "${TMP}/${BUNDLE_NAME}"

  chmod +x "${TMP}/${BIN_NAME}"
  install -m 0755 "${TMP}/${BIN_NAME}" "${BIN_DIR}/pi-agent-sandbox"

  # Install/update bundle
  echo "Installing app bundle to: ${APP_DIR}"
  tar -xzf "${TMP}/${BUNDLE_NAME}" -C "${APP_DIR}" --strip-components=1

  cat <<EOF

Installed:
- wrapper: ${BIN_DIR}/pi-agent-sandbox
- app bundle: ${APP_DIR}

Next:
- Ensure ${BIN_DIR} is on your PATH
- Run: HARDSHELL_APP_DIR="${APP_DIR}" pi-agent-sandbox

EOF
}

main "$@"
