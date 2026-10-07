# Living Ubiquitous Language Glossary Template

> **Source of Truth:** Authoritative terminology dictionary binding domain concepts, business definitions, and exact code identifiers. Customize this glossary per project.

---

## Canonical Domain Vocabulary Matrix

| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Code & Database Identifiers |
|---|---|---|---|---|
| *(No domain terms defined yet)* | *Define business meaning during Phase 1 Domain Discovery.* | *e.g. Core Domain* | *Synonyms strictly forbidden across code & UI.* | *Exact type, class, or table name.* |

<!--
  azcodr:glossary-waived

  This repository is the TEMPLATE, not a product domain. Its glossary ships
  downstream as an empty matrix on purpose: commit 8b5e0ae purged pre-filled
  vocabulary precisely because template vocabulary bleeds into scaffolded
  projects and becomes their false starting authority.

  Downstream projects must NOT copy this waiver. The validator only honours it
  for a scaffolded project that has defined no ADRs of its own, so removing the
  waiver marker is what re-arms the check.
-->

---

## Linguistic Invariants & Rules
1. **The Single Name Rule:** Every domain concept has exactly one authoritative name. Synonyms are strictly forbidden across code, schemas, and UI.
2. **Contextual Boundaries:** If a word has multiple meanings across business departments, isolate the terms within dedicated Bounded Contexts.
3. **Continuous Updating:** When domain experts establish or rename a term, update this glossary immediately, record an ADR in `memory.md`, and refactor all occurrences.
