# Continuous Learning & Automated Rule Ingestion

> **Core Mandate:** Automatically log development defects, post-mortems, and lessons learned into workspace memory, dynamically updating or generating atomic rules to permanently prevent recurrence.

---

## 1. The Automated Rule Ingestion Loop

Whenever an error, test failure, build friction, or architectural anti-pattern occurs during development, immediately execute the 5-step loop:

```
1. Capture Defect ──► 2. Root Cause Analysis ──► 3. Log Post-Mortem ──► 4. Synthesize Rule ──► 5. Update Rulebase
```

1. **Capture Defect**: Record the failure symptoms and stack trace.
2. **Root Cause Analysis**: Identify the fundamental architectural or operational gap (not just the surface symptom).
3. **Log Post-Mortem**: Append an entry to [`docs/knowledge/issue_log.md`](../knowledge/issue_log.md) documenting Symptom, Root Cause, Anti-Pattern, and Resolution.
4. **Synthesize Rule**: Formulate the preventative DO and DONT directives and add them to [`docs/knowledge/dos_and_donts.md`](../knowledge/dos_and_donts.md).
5. **Update Rulebase**:
   - If the issue falls under an existing domain rule in `docs/rules/<domain>.md`, update that rule immediately.
   - If it represents a new domain, author a new atomic rule file and index it in [`AGENTS.md`](../../AGENTS.md).
   - Run the configuration validation script to ensure integrity.

---

## 2. Institutional Memory Maintenance

- **ADR Synchronization**: Major technical decisions must be logged in [`memory.md`](../../memory.md) before or immediately upon implementation.
- **Knowledge Graph Updates**: Keep [`docs/knowledge/knowledge_graph.md`](../knowledge/knowledge_graph.md) synchronized with new services, database models, or adapters to avoid repetitive token-expensive codebase discovery in future sessions.
