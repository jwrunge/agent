# Secure Agent: Implementation Checklist

This checklist is a practical, least-privilege path to shipping a sandboxed agent (compiled binary, e.g. Bun `--compile`) with user-configurable permissions.

## 0) Define scope (do this first)

- [ ] **Threat model**: attacker is untrusted inputs (prompt injection, malicious repos/files, tool output), not a malicious local root user.
- [ ] **Primary goals**:
  - [ ] Prevent unintended file reads (secrets) and writes (clobbering).
  - [ ] Restrict network egress to explicit endpoints.
  - [ ] Contain process abuse (fork bombs, disk fill, runaway CPU).
- [ ] **Non-goals** (document explicitly):
  - [ ] Stopping a user from granting permissions.
  - [ ] Protecting against a fully compromised host OS.

## 1) Architecture: “Launcher + sandboxed inner agent”

- [ ] Split into two modes:
  - [ ] **Launcher mode** (host): reads config, validates, constructs runtime policy, starts the sandbox.
  - [ ] **Inner agent mode** (sandbox): runs the actual agent logic; must not be able to elevate privileges.
- [ ] Add an explicit guard so the launcher does not recursively re-launch itself:
  - [ ] Example: env var `AGENT_IN_SANDBOX=1` or CLI arg `--in-sandbox`.

## 2) Policy model: defaults, user override, and merge rules

### 2.1 Defaults

- [ ] Ship a **deny-by-default** base policy.
- [ ] Default allowlists should be minimal:
  - [ ] Read: only the intended workspace root (canonical path).
  - [ ] Write: only `./output` and a dedicated cache dir.
  - [ ] Deny: user home secrets (`$HOME/.ssh`, `$HOME/.gnupg`, `$HOME/.config`, `$HOME/Library/Keychains`, `.env*`, etc.).
  - [ ] Network: explicit endpoints only (default-off).

### 2.2 Treat user config as untrusted input

- [ ] Load `agent-permissions.json` with:
  - [ ] **Size limit** (e.g., max 64KB).
  - [ ] **JSON schema validation** (reject unknown keys; reject non-string paths).
  - [ ] **Normalization/canonicalization** for paths.
- [ ] Decide one of these merge strategies (recommended default below):
  - [ ] **Restrict-only**: user config can only *remove* permissions, not add.
  - [ ] **Allow expansion with explicit opt-in**: require `--allow-user-expansion` (or signed config) to let user add permissions.

### 2.3 Path canonicalization rules (must-have)

- [ ] Convert to absolute paths based on a single root (e.g., workspace root).
- [ ] Resolve symlinks when possible (`realpath`) to reduce path trickery.
- [ ] Reject any path that escapes the workspace root (unless explicitly intended).
- [ ] Normalize casing carefully on macOS (case-insensitive FS surprises).

## 3) Cross-platform container sandbox (recommended)

Goal: get one consistent Linux security model across macOS/Windows/Linux with minimal per-OS policy differences.

### 3.1 Baseline approach (one policy, quick restart)

- [ ] Run the **inner agent** inside an OCI container.
- [ ] Keep the container **deny-by-default for host files** by mounting nothing except explicit, user-approved paths.
- [ ] Implement “mount/unmount” by **restarting** the container with an updated bind-mount list (fast in practice).
  - [ ] Persist caches in a named volume (or an explicitly mounted cache dir) so restarts don’t lose state.
- [ ] Prefer:
  - [ ] `--read-only` for the container root filesystem.
  - [ ] Bind mounts with explicit mode: `:ro` vs `:rw`.
  - [ ] A dedicated writable output directory only.

### 3.2 Platform requirements (free / minimal dependencies)

- [ ] Linux: rootless Podman (recommended) or Docker Engine.
- [ ] Windows: require **WSL2**; run the container runtime inside WSL2.
- [ ] macOS: require a lightweight Linux VM layer.
  - [ ] Recommended default (free): **Colima** (Lima-based).
  - [ ] Alternative (free, heavier): Rancher Desktop.

### 3.3 Container hardening flags (high value)

- [ ] Drop privileges and reduce attack surface:
  - [ ] Drop Linux capabilities (e.g., `--cap-drop=ALL`).
  - [ ] Set `--security-opt=no-new-privileges`.
  - [ ] Use a non-root user in the image.
- [ ] Resource limits:
  - [ ] `--pids-limit`, memory limit, CPU limit.
- [ ] Environment hygiene:
  - [ ] Clear proxy env vars by default.
  - [ ] Set `HOME` to a sandbox home inside the container.

### 3.4 Dynamic access without restart (optional “file broker”)

If you truly need grant/revoke while the agent is running, bind mounts alone won’t do it.

- [ ] Run a small **host-side file broker** that:
  - [ ] Serves only approved files/dirs to the container over a Unix socket/HTTP.
  - [ ] Enforces read/write/execute policies centrally.
  - [ ] Logs every access for audit.
- [ ] Mount only the broker socket into the container; the container never sees arbitrary host paths.

### 3.5 Network allowlists (pragmatic options)

- [ ] Simple default: `--network=none` unless enabled.
- [ ] If you need a “domains allowlist” consistently:
  - [ ] Force all egress through an **egress proxy** (sidecar container) and only allow proxy access from the agent container.
  - [ ] Enforce the domain allowlist at the proxy layer.

## 4) Filesystem controls

- [ ] Explicitly enumerate what the agent needs:
  - [ ] Workspace root (read), and a small set of output/cache directories (write).
  - [ ] Optional: whitelisted tools (`git`, `ssh` only if explicitly enabled).
- [ ] Deny lists are a safety belt, not the primary control.
- [ ] Consider **read-only** mounts wherever possible.
- [ ] Make temp directories private:
  - [ ] `TMPDIR` inside sandbox should be a dedicated, empty dir.

## 5) Network controls

- [ ] Decide what “allowedDomains” means operationally (if you implement it):
  - [ ] DNS-name only? Resolved IP pinning? Both?
- [ ] Harden against common pitfalls:
  - [ ] Block IP literals unless explicitly allowed.
  - [ ] Block proxy env vars by default (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`).
  - [ ] Consider allowing only `443` unless you need others.
- [ ] Add an “offline mode” switch for high-security environments.

## 6) Resource limits and process controls (high value)

Even if filesystem/network are locked down, resource abuse can still hurt.

- [ ] Apply limits (container flags and/or cgroups):
  - [ ] Max wall time per task/run.
  - [ ] CPU and memory ceilings.
  - [ ] Max processes / threads.
  - [ ] Disk quota (or at least an output dir size cap).
- [ ] Ensure child processes inherit restrictions.

## 7) “Soft sandbox” fallback (when container runtime isn’t available)

This does **not** provide the same security as kernel enforcement, but reduces accidental damage.

- [ ] Add a runtime layer that:
  - [ ] Forces all tool actions through a single “capability gate” module.
  - [ ] Disables dangerous tools by default (shell execution, arbitrary network, recursive delete).
  - [ ] Uses an allowlist-based file API wrapper (only within workspace root).
- [ ] Make it loud in logs/UX: `SOFT_SANDBOX=true`.

## 8) Supply chain and TCB (what you must trust)

- [ ] Pin versions of:
  - [ ] Container runtime (Podman/Docker) and VM layer where relevant.
  - [ ] Bun runtime.
  - [ ] Any privileged helper binaries.
- [ ] Verify downloads (hashes / signatures) in CI or install scripts.
- [ ] Keep the trusted computing base small:
  - [ ] Prefer a few stable tools over arbitrary user shell.

## 9) Observability and audit

- [ ] Log (outside sandbox):
  - [ ] Effective policy (redact secrets), backend used, OS info.
  - [ ] Every permission denial summary (path/domain + operation).
- [ ] Provide a `--dry-run-policy` that prints the final merged policy without executing.

## 10) Developer workflow

- [ ] Add a “dev mode” that is still sandboxed but less restrictive:
  - [ ] Example: allow read access to toolchain paths needed for debugging.
- [ ] Document how to diagnose container permission issues on macOS/WSL2.

## 11) Distribution

- [ ] Build a single binary with `bun build --compile`.
- [ ] Distribute:
  - [ ] The agent binary.
  - [ ] `agent-permissions.json` template.
  - [ ] Clear README: how to tighten permissions; how to enable network.
- [ ] On first run, print:
  - [ ] Backend selected (container/soft).
  - [ ] Whether user config expanded or only restricted.

## 12) Minimum acceptance tests (security regressions)

- [ ] Confirm the agent cannot read known secret paths.
- [ ] Confirm the agent cannot write outside the output/cache directories.
- [ ] Confirm network calls fail except to explicitly allowed endpoints.
- [ ] Confirm shell/tool execution is blocked unless whitelisted.

---

## Recommended defaults (opinionated)

- **Merge rule**: restrict-only by default; allow expansion only via `--allow-user-expansion`.
- **Network**: default-deny; enable only for known API domains.
- **Cross-platform sandbox**: OCI container everywhere; WSL2 on Windows; Colima on macOS.
- **Mounts**: mount nothing by default; restart container to change mounts; persist caches in a volume.
- **Hardening**: read-only rootfs, non-root user, drop caps, no-new-privileges, resource limits.
