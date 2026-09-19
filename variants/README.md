# Architectural Variant Profiles (`variants/`)

> **Core Purpose:** Composable, pre-packaged domain profiles and industry archetypes that extend the generic MVP baseline without polluting its 100% domain-agnostic core.

---

## 1. The Variant Architecture Pattern

The `mvp` starter provides an enterprise-grade, domain-agnostic architectural chassis:
- Hexagonal Ports & Adapters
- TDD Double-Loop Lifecycle (London School)
- Universal 100% Open-Source Standards
- Universal Total Audit Accountability
- Dynamic Workflows & Dual-State Machines

While the core runtime and agent rules remain strictly generic, real-world projects diverge into specialized domain verticals. The **Variant Profiles System** encapsulates vertical domain expertise into isolated, modular directories under `variants/<profile_name>/`.

---

## 2. Directory Structure of a Variant Profile

Every profile under `variants/` contains:
```
variants/<profile_name>/
├── profile.json            # Machine-readable profile metadata & scaffolding presets
├── ubiquitous_language.md  # Living Ubiquitous Language dictionary for the domain
└── domain_models.md        # Aggregate roots, value objects, invariants, and lifecycles
```

---

## 3. Available Variant Profiles Catalog

| Variant Name | Directory | Domain Vertical | Description |
|---|---|---|---|
| **Property Management** | [`variants/property-management/`](./property-management/) | Real Estate & Asset Operations | Multi-tenant portfolio, unit inventory, lease contracts, resident onboarding, and rent ledgers. |

---

## 4. Bootstrapping with a Variant Profile

When initializing a project using `/lets-build`:
1. **Dimension 0 Interrogation:** `/lets-build` prompts:
   - *Option A: Generic Clean Baseline* (Start completely domain-agnostic)
   - *Option B: Select an existing Variant Profile* (e.g. `property-management`)
   - *Option C: Define a new custom variant*
2. **Profile Ingestion:** If a variant profile is selected, `/lets-build` automatically copies the profile's `ubiquitous_language.md` into `docs/knowledge/` and initializes domain entities based on `domain_models.md`.
3. **Upstream Synchronization:** Generic improvements in the new workspace can be merged back to `mvp` via `/merge-ai` without domain contamination.
