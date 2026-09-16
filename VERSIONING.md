# byteowlz Schema Versioning

Versioning convention for JSON schemas in this index and the canonical repos
they're published from.

## Goal

Make schema evolution explicit and machine-checkable: every schema carries a
version and a stability class, and the root manifest is the single source of
truth for "which version, who owns it, who consumes it."

## Per-schema metadata

Every schema object MUST include two top-level metadata keywords (draft 2020-12
allows arbitrary annotations):

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.byteowlz.dev/<name>/<name>.schema.json",
  "title": "...",
  "version": "2.0.0",          // SemVer
  "stability": "stable",        // draft | accepted | stable
  "description": "..."
}
```

- `$id` is **stable and version-independent** (a mutable alias to current). Version
  lives as metadata, not in the URL.
- Consumers that must pin read the version from the manifest and/or the field.

## Stability classes

| class | meaning | change rules |
|---|---|---|
| `draft` | exploratory, may move | free to change; no semver obligation (still bump) |
| `accepted` | shape is agreed, not yet widely consumed | additive changes OK; breaking needs MAJOR |
| `stable` | widely consumed | **breaking change requires a new MAJOR + a changelog/ADR note** |

## SemVer policy

- **MAJOR** — breaking change: an existing valid document/snapshot may no longer
  validate, or a consumer must change code. Requires a release note; on a
  `stable` schema, also an ADR note.
- **MINOR** — additive: new optional field/subschema; nothing existing breaks.
- **PATCH** — clarifying: tightens constraints without invalidating valid docs,
  or fixes a bug in the schema text.

## Root manifest (`schemas.json`)

One machine-readable index. Owned repo publishes *to* it; CI regenerates it from
canonical repos pinned by tag; consumers read it to resolve current names.

```json
{
  "agent-context-env": {
    "version": "2.0.0",
    "stability": "accepted",
    "canonical_repo": "byteowlz/schemas",
    "path": "agent-context-env/agent-context-env.schema.json",
    "consumers": ["trx", "mmry", "hstry", "skdlr", "dpty", "agntz"]
  },
  "dpty-recipe": { "...": "..." }
}
```

Register every schema here with the same three fields it carries (version,
stability) plus its canonical home and consumers.

## Enforcement (pre-push guard)

The shared `byteowlz/githooks` pre-push hook checks, for any changed schema:
1. JSON is well-formed (`jq`/`python`).
2. `version` + `stability` present.
3. A change to a `stable` schema that is breaking must carry a **MAJOR** bump and
   a matching note in the changelog (see `githooks` docs).
4. Schema `version` matches the entry in this `schemas.json`.

CI additionally regenerates the index from canonical repos on tag.

## Canonical home rule

The schema's **source of truth is the repo that owns the behavior** (the
consumer/executor that enforces it), not the index:
- `dpty-recipe`   → `byteowlz/dpty` (dpty verifies + runs recipes)
- `dpty-capability` → `byteowlz/dpty` (dpty emits capabilities)
- `gvnr-dpty-wire`  → `byteowlz/gvnr` (gvnr owns the server contract)
- `agent-context-env` → `byteowlz/schemas` (cross-tool, schema-source here)

`schemas/` is the publisher of the index, **not** the source of truth for
owner-owned contracts. `wismut/dpty-recipes` holds only recipe *documents*;
its lint validates against dpty's `dpty-recipe` schema.
