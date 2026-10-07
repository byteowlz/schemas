# AGENT_CTX Environment Contract (v2)

> Maintenance moved on 2026-10-07 to the standalone `wismut/agent-ctx` repository:
> `ssh://git@forgejo/wismut/agent-ctx.git` (local checkout: `../agent-ctx`).
> See its `PROPOSAL.md` for draft v3, independent execution facts and unknown defaults,
> and `docs/status.md` for terminal/headless status integration. This v2 document and
> schema URL remain a frozen compatibility reference; v3 is not a deployed migration.

Status: Draft v2 (implementation reference)
Scope: Cross-tool runtime context via environment variables

## Purpose

`AGENT_CTX_*` provides optional runtime metadata to improve linking, search, observability, and defaults across tools (e.g. trx, mmry, hstry, skdlr, roster).

- Missing variables MUST NOT break tool behavior.
- Env context is metadata, not security authority.
- Flags/explicit args override env values.

## Layering principle: producer map, not required nesting

AGENT_CTX is a **flat set of optional attributes produced by independent layers**. Each layer injects *the bag it knows about*; a consumer reads whatever is present. No setup is required to have all layers, and no bag is required just because another exists.

```
PLATFORM (oqto / any product)
  → MULTIPLEXER (herdr / any multiplexer hosting concurrent agents)
    → HARNESS (pi / any runtime)
      → host machine
```

- A layer that is absent is simply not represented in the snapshot.
- Consumers must tolerate snapshots with any combination of layers (bare harness, harness+host, platform+harness, full, etc.).
- Ownership rules (below) state *which layer* injects *which attributes*; they do **not** create a requirement that a layer exist.

## Versioning

Two versions are used:

- `AGENT_CTX_VERSION`: version of this env contract/schema (currently `2`)
- `AGENT_CTX_PLATFORM_VERSION`: version of the platform/build injecting context (e.g. `0.17.3`, `git:abc1234`)

## Variable Reference

Legend: **Floor** = required in every snapshot when AGENT_CTX is enabled. **Bag** = required only when its producer layer is present. **Opt** = optional.

| Variable | Kind | Owner / Injector | Mutable | Description | Example |
|---|---:|---|---|---|---|
| `AGENT_CTX_VERSION` | Floor | Runner | No | Contract version | `2` |
| `AGENT_CTX_HARNESS` | Floor | Runner (baseline), harness may refine | Rarely | Active harness/runtime | `pi` |
| `AGENT_CTX_RUN_MODE` | Floor | Runner | No | Runtime mode | `runner` |
| `AGENT_CTX_PLATFORM_NAME` | Bag | Runner / platform | No | Platform name | `oqto` |
| `AGENT_CTX_PLATFORM_VERSION` | Bag | Runner / platform | No (per process) | Platform build/version | `0.17.3` |
| `AGENT_CTX_PLATFORM_SESSION_ID` | Bag | Runner / platform | No | Platform session id | `sess_8f...` |
| `AGENT_CTX_WORKSPACE_ID` | Bag | Runner / platform | On workspace switch | Stable workspace id/hash | `ws_a13f...` |
| `AGENT_CTX_WORKSPACE_PATH` | Bag | Runner / sandbox wrapper | On cwd/workspace switch | Absolute workspace path | `/home/wismut/byteowlz/oqto_refactor` |
| `AGENT_CTX_USER_ID` | Bag | Runner / platform | No | Platform user id | `u_123` |
| `AGENT_CTX_MULTIPLEXER` | Bag | Middle layer (multiplexer) | No | Multiplexer hosting/routing the agent | `herdr` |
| `AGENT_CTX_AGENT_ID` | Bag | Middle layer | No | Stable identity of the agent, persists across runs | `agent_9e2f` |
| `AGENT_CTX_AGENT_ADDRESS` | Opt | Middle layer | Yes | Id others reach/message this agent by (a tab id, handle, endpoint) | `tab_7c2f` |
| `AGENT_CTX_AGENT_LABEL` | Opt | Middle layer | Yes | Human-readable name | `nightly-train-prep` |
| `AGENT_CTX_HARNESS_SESSION_ID` | Opt | Harness extension (e.g. pi-env-ctx) | Usually no | Harness-native session id | `pi_abc...` |
| `AGENT_CTX_SESSION_NAME` | Opt | Harness extension or platform | Yes | Human-readable title/label | `Retry debugging` |
| `AGENT_CTX_READABLE_ID` | Opt | Runner | No | Short friendly id for logs/UI | `ws7-s42` |
| `AGENT_CTX_MODEL` | Opt | Harness extension | Yes | Active model id | `anthropic/claude-sonnet-4` |
| `AGENT_CTX_REQUEST_ID` | Opt | Runner | Yes (per action) | Per prompt/action id | `req_01...` |
| `AGENT_CTX_CORRELATION_ID` | Opt | Runner/Backend | Yes | Cross-service trace id | `corr_01...` |
| `AGENT_CTX_SANDBOX_PROFILE` | Opt | Sandbox wrapper / Runner | Rarely | Active sandbox profile (observability hint) | `development` |
| `AGENT_CTX_MACHINE_ID` | Opt | Host / Runner | No | Stable logical node id (placement) | `node-rtx6000` |
| `AGENT_CTX_NODE_HOSTNAME` | Opt | Host / Runner | No | Hostname / mesh name | `en-n-0093` |
| `AGENT_CTX_OS_ARCH` | Opt | Host / Runner | No | os + arch for recipe constraints | `linux/amd64` |

### Semantics of the three kinds
- **Floor**: always present when AGENT_CTX is enabled. The universal floor is `VERSION + HARNESS + RUN_MODE`, plus at least one locator (`PLATFORM_SESSION_ID`, `HARNESS_SESSION_ID`, or `MACHINE_ID`).
- **Bag**: present only when its producing layer is present. When a bag's primary attribute is present, its co-required companions must also be present (see schema `allOf` rules).
- **Opt**: entirely optional, additive hints.

## Ownership Rules

- **Runner/platform own** the platform + workspace + authorship bag (`*_PLATFORM_*`, `MULTIPLEXER`-independent `WORKSPACE_*`, `USER_ID`, `RUN_MODE`).
- **Middle layer (multiplexer, e.g. herdr) owns** `MULTIPLEXER`, `AGENT_ID`, `AGENT_ADDRESS`, `AGENT_LABEL`.
- **Host/runner own** `MACHINE_ID`, `NODE_HOSTNAME`, `OS_ARCH`.
- **Harness/extension owns** harness-native facts (`HARNESS_SESSION_ID`, `MODEL`, optionally `SESSION_NAME`).
- **Runner/Backend own** request tracing (`REQUEST_ID`, `CORRELATION_ID`).

## Conditional Bags (v2)

A bag is required **only when its producing layer is present**:

- **Platform bag present** → `PLATFORM_VERSION`, `PLATFORM_SESSION_ID`, `WORKSPACE_ID`, `WORKSPACE_PATH`, `USER_ID` are required (internally consistent).
- **Multiplexer present** → `AGENT_ID` is required (`AGENT_ADDRESS`/`AGENT_LABEL` optional).
- **Host bag** → entirely optional even when present (a `MACHINE_ID` alone is valid).

## Behavioral Contract (for consumers)

1. `CLI args > env vars > internal defaults`
2. If a variable is missing: continue with normal behavior.
3. If malformed: ignore value, optionally debug-log; do not hard-fail.
4. Use stable ids for joins/indexing:
   - `AGENT_CTX_PLATFORM_SESSION_ID`
   - `AGENT_CTX_HARNESS_SESSION_ID` (if present)
   - `AGENT_CTX_AGENT_ID` (if present)
   - `AGENT_CTX_WORKSPACE_ID`
   - `AGENT_CTX_MACHINE_ID` (host-level)
   - `AGENT_CTX_REQUEST_ID` (for per-action correlation)
5. Treat `AGENT_CTX_SESSION_NAME` and `AGENT_CTX_AGENT_LABEL` as display-only (mutable, not durable keys).
6. Do not use env values as security policy source of truth.
7. Do not assume a bag is present just because another is (different setups inject different bags).

## Security Boundary

`AGENT_CTX_*` is informational metadata only.

- Access control and filesystem/network restrictions MUST be enforced by sandbox/runner policy.
- Tools may use env context for defaults, linking, and search scoping.

## Minimal Starter Set (v2)

The floor (required in every enabled snapshot):

- `AGENT_CTX_VERSION` (`2`)
- `AGENT_CTX_HARNESS`
- `AGENT_CTX_RUN_MODE`
- at least one locator: `AGENT_CTX_PLATFORM_SESSION_ID` / `AGENT_CTX_HARNESS_SESSION_ID` / `AGENT_CTX_MACHINE_ID`

Then inject bags only where the layer exists:
- oqto present → platform bag (`PLATFORM_NAME`, `PLATFORM_VERSION`, `PLATFORM_SESSION_ID`, `WORKSPACE_ID`, `WORKSPACE_PATH`, `USER_ID`)
- herdr present → multiplexer bag (`MULTIPLEXER`, `AGENT_ID`, `AGENT_ADDRESS`, `AGENT_LABEL`)
- host env always → machine bag (`MACHINE_ID`, `NODE_HOSTNAME`, `OS_ARCH`)

## Setup Profiles (v2)

Different deployments inject different combinations; all are valid snapshots.

**Full (oqto + herdr + pi + host):**
```bash
AGENT_CTX_VERSION=2
AGENT_CTX_PLATFORM_NAME=oqto
AGENT_CTX_PLATFORM_VERSION=0.17.3
AGENT_CTX_HARNESS=pi
AGENT_CTX_RUN_MODE=runner
AGENT_CTX_PLATFORM_SESSION_ID=sess_8f23...
AGENT_CTX_WORKSPACE_ID=ws_a13f...
AGENT_CTX_WORKSPACE_PATH=/home/wismut/byteowlz/oqto_refactor
AGENT_CTX_USER_ID=u_123
AGENT_CTX_MULTIPLEXER=herdr
AGENT_CTX_AGENT_ID=agent_9e2f
AGENT_CTX_AGENT_ADDRESS=tab_7c2f
AGENT_CTX_AGENT_LABEL="nightly-train-prep"
AGENT_CTX_HARNESS_SESSION_ID=pi_d91c...
AGENT_CTX_MODEL=anthropic/claude-sonnet-4
AGENT_CTX_MACHINE_ID=node-rtx6000
AGENT_CTX_NODE_HOSTNAME=en-n-0093
AGENT_CTX_OS_ARCH=linux/amd64
AGENT_CTX_REQUEST_ID=req_01JV...
AGENT_CTX_CORRELATION_ID=corr_01JV...
```

**herdr + pi + host (no platform):**
```bash
AGENT_CTX_VERSION=2
AGENT_CTX_HARNESS=pi
AGENT_CTX_RUN_MODE=local
AGENT_CTX_MULTIPLEXER=herdr
AGENT_CTX_AGENT_ID=agent_9e2f
AGENT_CTX_AGENT_ADDRESS=tab_7c2f
AGENT_CTX_HARNESS_SESSION_ID=pi_d91c...
AGENT_CTX_MODEL=anthropic/claude-sonnet-4
AGENT_CTX_MACHINE_ID=node-studio
AGENT_CTX_OS_ARCH=darwin/arm64
```

**oqto + pi + host (no multiplexer):**
```bash
AGENT_CTX_VERSION=2
AGENT_CTX_PLATFORM_NAME=oqto
AGENT_CTX_PLATFORM_VERSION=0.17.3
AGENT_CTX_PLATFORM_SESSION_ID=sess_8f23...
AGENT_CTX_WORKSPACE_ID=ws_a13f...
AGENT_CTX_WORKSPACE_PATH=/home/wismut/byteowlz/oqto_refactor
AGENT_CTX_USER_ID=u_123
AGENT_CTX_HARNESS=pi
AGENT_CTX_RUN_MODE=runner
AGENT_CTX_MACHINE_ID=node-oqto-box
```

**Bare pi + host (standalone, no platform, no multiplexer):**
```bash
AGENT_CTX_VERSION=2
AGENT_CTX_HARNESS=pi
AGENT_CTX_RUN_MODE=local
AGENT_CTX_HARNESS_SESSION_ID=pi_d91c...
AGENT_CTX_MODEL=deepseek-ai/DeepSeek-V4-Flash-0731
AGENT_CTX_MACHINE_ID=$(hostname)
AGENT_CTX_OS_ARCH=linux/amd64
```

## Example Snapshot (v2, full)

```bash
AGENT_CTX_VERSION=2
AGENT_CTX_PLATFORM_NAME=oqto
AGENT_CTX_PLATFORM_VERSION=0.17.3
AGENT_CTX_HARNESS=pi
AGENT_CTX_RUN_MODE=runner
AGENT_CTX_PLATFORM_SESSION_ID=sess_8f23...
AGENT_CTX_HARNESS_SESSION_ID=pi_d91c...
AGENT_CTX_MULTIPLEXER=herdr
AGENT_CTX_AGENT_ID=agent_9e2f
AGENT_CTX_AGENT_ADDRESS=tab_7c2f
AGENT_CTX_WORKSPACE_ID=ws_a13f...
AGENT_CTX_WORKSPACE_PATH=/home/wismut/byteowlz/oqto_refactor
AGENT_CTX_USER_ID=u_123
AGENT_CTX_MODEL=anthropic/claude-sonnet-4
AGENT_CTX_MACHINE_ID=node-rtx6000
AGENT_CTX_NODE_HOSTNAME=en-n-0093
AGENT_CTX_OS_ARCH=linux/amd64
AGENT_CTX_REQUEST_ID=req_01JV...
AGENT_CTX_CORRELATION_ID=corr_01JV...
```

## Implementation Checklist (per tool)

- Read vars defensively (`Option`-style).
- Never require AGENT_CTX for core functionality.
- Persist context as structured metadata on writes (where relevant).
- Index/filter by stable IDs for better search/linking.
- Add a debug command/flag to print effective context.
- Use the **producer-map** rule: reflect whatever bags are present, never assume a specific setup.
- When stamping authorship/defaults (e.g. a Work Request), resolve provenance by walking present bags (platform → multiplexer → host → local user) rather than requiring one layer.
