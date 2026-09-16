# gvnr ↔ dpty wire protocol

Canonical home: **byteowlz/gvnr**. Version `0.1.0` (draft). The byteowlz `schemas`
index is the publisher; gvnr is the source of truth for this contract (it owns
the server; dpty is the client).

## Transport
- **HTTPS + Bearer token over the Tailscale/overlay mesh (`100.64.0.x`)**.
- **No SSH on the registry bus.** gvnr never executes remotely → no remote shell.
  SSH is ops-only (bootstrap/install/diagnose) and direct consumer↔dpty after
  establishment.
- Auth: `Authorization: Bearer <token>`. The token is a separate layer from
  reachability; reachability ≠ authority. Capability/auth is enforced
  runner-side, gvnr-side, and by the consumer.

## Endpoints
| method | path | direction | purpose |
|---|---|---|---|
| POST | `/register` | dpty → gvnr | establish runner + capability snapshot; `list_runners` filtering basis |
| POST | `/heartbeat` | dpty → gvnr | liveness + free-vram/free-disk + asset freshness |
| GET | `/list_runners?cap=` | consumer → gvnr | ranked capable runners |
| GET | `/resolve/{id}` | consumer → gvnr | resolve a runner/agent address |
| POST | `/events` | any → gvnr | best-effort audit log |

## Roles (do not regress)
- **gvnr** resolves + lists ONLY. It never schedules, dispatches, proxies,
  executes, or owns work queues. Network reachability, discovery, authorization,
  credentials, and runner-side enforcement are separate layers.
- **dpty** originates/executes work, owns outcomes, and communicates directly
  with consumers after establishment.
- **Event-log entries never create operational truth** — they're an audit trail.

## Message envelope
Every wire document conforms to `gvnr-dpty-wire.schema.json`:
`proto="gvnr-dpty"`, `version="0.1.0"`, `kind` discriminates the payload, and
`causation` carries best-effort provenance. Addresses in `causation` and
`ResolveResp` are **routing hints, never authorization**.

## Facts vs signals
- Liveness + heartbeat and capability snapshots are REGISTRY FACTS (declared
  by authenticated runner heartbeats + manifests). They're the only facts.
- Everything else (events, causality) is signal.
