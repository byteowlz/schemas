# dpty Recipe manifest

Canonical home: **byteowlz/dpty**. Version `0.1.0` (draft).

The recipe is the **how-to-run** manifest dpty verifies and executes. Its source
of truth is this schema, owned by dpty (the consumer/executor); `wismut/dpty-recipes`
holds only recipe *documents*, validated against it. The `dpty-recipe` schema is
published to the byteowlz `schemas` index (see `schemas/VERSIONING.md`).

## Identity
- `definition.id` — `family/name`, globally unique.
- `definition.rev` — monotonically increasing per recipe document.
- `definition.status` — `prototype` → `validated` → `graduated` lifecycle.

## Matching
`requirements.accel` is **backend-agnostic** (ADR-0007): an array of accepted
backends, a uniform `min_mem_gb` (dedicated VRAM *or* Apple unified memory), and
optional per-backend `arch` pins. A recipe with `arch: ["sm_120a"]` matches ONLY
a CUDA/Blackwell box. dpty matches recipes against the **observed** half of the
machine capability manifest and surfaces any `[declared]` vs `[observed]` drift
before placement.

## Reproducibility
`source.artifact` is a typed descriptor:
- `kind=git` → `url` + pinned `ref`
- `kind=binary` → `url` + `sha256`
- `kind=image` → `url`
- `kind=local` → already present on the machine

Model recipes additionally pin `model`, `quant`, `total_params`, `context_max`.

## Runtime
`runtime.engine` names the executor; `api` the serving surface
(`openai-compatible`, `comfyui`, `none`); `health` the readiness probe. `env`
and `args` are substitution-safe strings (no `$()`/backticks).

## Guardrails
- Recipe documents MUST validate against this schema (lint in `dpty-recipes`
  references it). A malformed manifest is rejected by dpty at load.
- Recipes match `observed` capability, never `declared` alone.
- Engine-specific pins (CUDA/sm/FP4) live *inside* the recipe as constraints —
  they make the recipe genuinely bound, not hints.
