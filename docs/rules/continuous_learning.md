# Continuous Learning & Automated Rule Ingestion

> **Core Mandate:** Automatically capture development defects, analyze root causes, and directly update domain rules or skills to permanently prevent recurrence without intermediate bloat.

---

## 1. The Direct Rule Ingestion Loop

Whenever an error, test failure, build friction, or architectural anti-pattern occurs during development, immediately execute the 4-step loop:

```
1. Capture Defect ──► 2. Root Cause Analysis ──► 3. Synthesize Invariant ──► 4. Update Rule / Skill
```

1. **Capture Defect**: Record the failure symptoms, stack trace, and failing test case.
2. **Root Cause Analysis**: Identify the fundamental architectural or operational gap (not just the surface symptom).
3. **Synthesize Invariant**: Formulate a concrete, positive architectural invariant and code example showing the correct implementation.
4. **Update Rule / Skill**:
   - Update the governing domain rule in `docs/rules/<domain>.md` or specialized skill in `.agents/skills/` directly.
   - If the lesson introduces an architectural trade-off or paradigm shift, record a lightweight ADR in [`memory.md`](../../memory.md).
   - If it unlocks a new domain, author a new atomic rule file and index it in [`AGENTS.md`](../../AGENTS.md).
   - Run verification (`npm test && npm run validate`) to ensure 100% integrity.

---

## 2. Institutional Memory Maintenance

- **Lightweight ADR Ledger**: Major technical decisions and invariant shifts are logged in [`memory.md`](../../memory.md) linking directly to the governing rule or skill.
- **System Knowledge Graph**: Keep [`docs/knowledge/knowledge_graph.md`](../knowledge/knowledge_graph.md) synchronized with new services, ports, or adapters to avoid repetitive token-expensive codebase discovery in future sessions.
- **Living Glossary**: Keep [`docs/knowledge/ubiquitous_language.md`](../knowledge/ubiquitous_language.md) updated with canonical domain terminology and forbidden synonyms.
