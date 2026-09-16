# dpty Machine Capability manifest

Canonical home: **byteowlz/dpty**. Version `0.1.0` (draft). See ADR-0007 (govnr).

Auto-acquired at `dpty install` via introspection adapters (read-only; dpty does
NOT provision base deps — that's Ansible). Cross-platform, first-class: Linux
x86_64/arm64, macOS 14+ (Apple Silicon/Intel), Windows 11.

## Normalization
- **`devices[]`** — ONE uniform shape across every backend (`cuda`, `rocm`,
  `level-zero`, `metal-mps`, `vulkan`, `opencl`, `directml`).
  - `mem_gb` is uniform: dedicated VRAM **and** Apple unified memory both report
    as accel memory (no fake discrete GPU on Apple).
  - `arch` uses per-backend nomenclature (`sm_120a` / `gfx90a` / `m3`).
- **No NVIDIA/CUDA hardcoding** — adapters probe per platform/backend.

## declared vs observed
- `declared` — provisioning intent from Ansible/install (e.g. "CUDA 13.3").
- `observed` — what introspection finds at runtime (e.g. CUDA 12.9).
- **Drift** = declared ≠ observed; surfaced before any placement. A drift that
  would prevent the target recipe's constraints from being met blocks placement.

## Matching
Recipes match the **observed** half, never `declared` alone. `assets` folds the
dynamic cache (models + workflows at pinned rev) into placement: static
capability ∪ dynamic asset cache.

## Publishing
The capability snapshot is reported to gvnr on `register`/`heartbeat` so
`list_runners?cap=` can filter capable machines.
