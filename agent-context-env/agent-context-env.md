# AGENT_CTX Environment Contract (v1)

Status: Draft v1 (implementation reference)
Scope: Cross-tool runtime context via environment variables

## Purpose

`AGENT_CTX_*` provides optional runtime metadata to improve linking, search, observability, and defaults across tools (e.g. trx, mmry, hstry, skdlr).

- Missing variables MUST NOT break tool behavior.
- Env context is metadata, not security authority.
- Flags/explicit args override env values.

## Versioning

Two versions are used:

- `AGENT_CTX_VERSION`: version of this env contract/schema (currently `1`)
- `AGENT_CTX_PLATFORM_VERSION`: version of the platform/build injecting context (e.g. `0.17.3`, `git:abc1234`)

## Variable Reference

| Variable | Required* | Owner / Injector | Mutable | Description | Example |
|---|---:|---|---|---|---|
| `AGENT_CTX_VERSION` | Yes | Runner | No | Contract version | `1` |
| `AGENT_CTX_PLATFORM_NAME` | Yes | Runner | No | Platform name | `oqto` |
| `AGENT_CTX_PLATFORM_VERSION` | Yes | Runner | No (per process) | Platform build/version | `0.17.3` |
| `AGENT_CTX_HARNESS` | Yes | Runner (baseline), harness may refine | Rarely | Active harness/runtime | `pi` |
| `AGENT_CTX_RUN_MODE` | Yes | Runner | No | Runtime mode | `runner` |
| `AGENT_CTX_PLATFORM_SESSION_ID` | Yes | Runner | No | Platform session id | `sess_8f...` |
| `AGENT_CTX_WORKSPACE_ID` | Yes | Runner | On workspace switch | Stable workspace id/hash | `ws_a13f...` |
| `AGENT_CTX_WORKSPACE_PATH` | Yes | Runner / Sandbox wrapper | On cwd/workspace switch | Absolute workspace path | `/home/wismut/byteowlz/oqto_refactor` |
| `AGENT_CTX_USER_ID` | Yes | Runner | No | Platform user id | `u_123` |
| `AGENT_CTX_HARNESS_SESSION_ID` | No | Harness extension (e.g. pi-env-ctx) | Usually no | Harness-native session id | `pi_abc...` |
| `AGENT_CTX_SESSION_NAME` | No | Harness extension or platform | Yes | Human-readable title/label | `Retry debugging` |
| `AGENT_CTX_READABLE_ID` | No | Runner | No | Short friendly id for logs/UI | `ws7-s42` |
| `AGENT_CTX_MODEL` | No | Harness extension | Yes | Active model id | `anthropic/claude-sonnet-4` |
| `AGENT_CTX_REQUEST_ID` | No | Runner | Yes (per action) | Per prompt/action id | `req_01...` |
| `AGENT_CTX_CORRELATION_ID` | No | Runner/Backend | Yes | Cross-service trace id | `corr_01...` |
| `AGENT_CTX_SANDBOX_PROFILE` | No | Sandbox wrapper / Runner | Rarely | Active sandbox profile (observability hint) | `development` |

\* Required means required when AGENT_CTX is enabled for that process. Tools must still tolerate entirely missing context.

## Ownership Rules

- **Runner/Sandbox own platform/workspace/authorship facts** (`*_PLATFORM_*`, `WORKSPACE_*`, `USER_ID`, `RUN_MODE`).
- **Harness/extension owns harness-native facts** (`HARNESS_SESSION_ID`, `MODEL`, optionally `SESSION_NAME`).
- **Runner/Backend own request tracing** (`REQUEST_ID`, `CORRELATION_ID`).

## Behavioral Contract (for consumers)

1. `CLI args > env vars > internal defaults`
2. If a variable is missing: continue with normal behavior.
3. If malformed: ignore value, optionally debug-log; do not hard-fail.
4. Use stable ids for joins/indexing:
   - `AGENT_CTX_PLATFORM_SESSION_ID`
   - `AGENT_CTX_HARNESS_SESSION_ID` (if present)
   - `AGENT_CTX_WORKSPACE_ID`
   - `AGENT_CTX_REQUEST_ID` (for per-action correlation)
5. Treat `AGENT_CTX_SESSION_NAME` as display-only (mutable, not a durable key).
6. Do not use env values as security policy source of truth.

## Security Boundary

`AGENT_CTX_*` is informational metadata only.

- Access control and filesystem/network restrictions MUST be enforced by sandbox/runner policy.
- Tools may use env context for defaults, linking, and search scoping.

## Minimal Starter Set (recommended)

For initial rollout, inject at least:

- `AGENT_CTX_VERSION`
- `AGENT_CTX_PLATFORM_NAME`
- `AGENT_CTX_PLATFORM_VERSION`
- `AGENT_CTX_HARNESS`
- `AGENT_CTX_RUN_MODE`
- `AGENT_CTX_PLATFORM_SESSION_ID`
- `AGENT_CTX_WORKSPACE_ID`
- `AGENT_CTX_WORKSPACE_PATH`
- `AGENT_CTX_USER_ID`

## Example Snapshot

```bash
AGENT_CTX_VERSION=1
AGENT_CTX_PLATFORM_NAME=oqto
AGENT_CTX_PLATFORM_VERSION=0.17.3
AGENT_CTX_HARNESS=pi
AGENT_CTX_RUN_MODE=runner
AGENT_CTX_PLATFORM_SESSION_ID=sess_8f23...
AGENT_CTX_HARNESS_SESSION_ID=pi_d91c...
AGENT_CTX_WORKSPACE_ID=ws_a13f...
AGENT_CTX_WORKSPACE_PATH=/home/wismut/byteowlz/oqto_refactor
AGENT_CTX_USER_ID=u_123
AGENT_CTX_MODEL=anthropic/claude-sonnet-4
AGENT_CTX_REQUEST_ID=req_01JV...
AGENT_CTX_CORRELATION_ID=corr_01JV...
```

## Implementation Checklist (per tool)

- Read vars defensively (`Option`-style).
- Never require AGENT_CTX for core functionality.
- Persist context as structured metadata on writes (where relevant).
- Index/filter by stable IDs for better search/linking.
- Add a debug command/flag to print effective context.
