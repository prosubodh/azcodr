# Architecture Decision Records (ADR)

> **Core Mandate:** Log all technical, architectural, and operational trade-offs in `memory.md` using the standardized Lightweight ADR format.

---

## 1. When to Author an ADR

An Architectural Decision Record must be authored whenever a team member or agent:
- Introduces or removes an external dependency or library.
- Modifies database schema architecture, transaction boundaries, or migration strategies.
- Selects an architectural pattern (e.g. Server-Driven UI, Event-Driven Outbox, OpenFeature).
- Defines security boundaries, cryptographic standards, or compliance exceptions.

---

## 2. Lightweight ADR Format

Log decisions in `memory.md` adhering to this structure:

```markdown
### ADR-[Number]: [Concise Title]

- **Date:** [YYYY-MM-DD]
- **Status:** [PROPOSED | ACCEPTED | SUPERSEDED]

#### 1. Context & Problem Statement
What business requirement, technical bottleneck, or security mandate necessitated this architectural decision?

#### 2. Decision Drivers
- [Driver 1: e.g. Zero-downtime database deployment]
- [Driver 2: e.g. SOC 2 Type II tamper-evident logging compliance]

#### 3. Considered Options
- **Option A:** [Description and evaluation]
- **Option B:** [Description and evaluation]

#### 4. Decision Outcome & Consequences
- **Chosen Option:** [Selected approach and core rationale]
- **Positive Consequences:** [What improves]
- **Negative Consequences / Trade-offs:** [What operational or code overhead is accepted]
```
