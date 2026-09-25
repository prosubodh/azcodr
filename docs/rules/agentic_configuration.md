# Agentic Configuration, Skills & Harness Standards

> **Core Mandate:** Maintain lean agent entrypoints via progressive disclosure, modular documentation, strict skill front matter standards, harness symlink parity, and relentless questioning during skill architecture.

---

## 1. The Root AGENTS.md Standard

Root configuration files (`AGENTS.md`) are injected into the agent context on **every single prompt**. To prevent context pollution and token degradation:

### Required Contents (Keep under 100–120 lines)
- **Identity & Mission:** 1–2 sentences defining workspace purpose and core domain.
- **Runtime Environment:** Declared package manager, runtime version, and non-standard scripts.
- **Core Operating Framework:** Foundational principles (Rule Zero, Zero-Assumption, Relentless Questioning, 5-stage lifecycle, action boundaries).
- **Open-Source Mandate:** Strict requirement to standardize on 100% open-source packages and tools.
- **High-Level Layout:** High-level architectural boundaries only (packages, apps).
- **Progressive Disclosure Table:** Clean index linking to specialized domain rules in `docs/rules/*.md`.

### Explicit Prohibitions (What NOT to Include)
- **No Developer Onboarding / Getting Started Guides:** Do not include steps for cloning, environment setup, or basic onboarding meant for human engineers.
- **No Granular File Trees:** Never enumerate individual file paths that change frequently (causes rapid documentation rot).
- **No Monolithic Domain Tutorials:** Never embed full CSS conventions, database migration steps, API specs, or PR delivery checklists directly in the root file.
- **No Preemptive Speculation:** Never add rules for errors the AI has not actually made. Ground rules in verified project mistakes or requirements.

---

## 2. Monorepo & Nested AGENTS.md Files

- In multi-package workspaces or monorepos (e.g. `apps/backend/`, `apps/frontend/`), place package-specific instructions in a nested `AGENTS.md` within that package folder.
- The root `AGENTS.md` remains high-level; the nested `AGENTS.md` provides scoped context only when the agent operates within that subdirectory.

---

## 3. Harness Parity & Symlinks

Different AI agents and IDE harnesses look for different configuration filenames:
- Standard: `AGENTS.md`
- Lowercase: `agents.md`
- Anthropic Claude Code: `CLAUDE.md`

**Standard:** Maintain identical configuration across all harnesses by establishing filesystem symbolic links:
```bash
ln -sf AGENTS.md agents.md
ln -sf AGENTS.md CLAUDE.md
```
Never duplicate content into separate files.

---

## 4. Skills Architecture (`.agents/skills/<skill-name>/`)

Skills provide on-demand capabilities for **specialized, complex, or multi-step workflows** that should not pollute the global context.

### Front Matter Specification (`SKILL.md`)
```yaml
---
name: <skill-name>
description: <Imperative trigger description under 1024 characters. MUST start with 'Use when...'>
---
```
- **Description Requirements:**
  - Focus strictly on **user intent**, not just technology descriptions.
  - Explicitly state when to use: `Use when the user wants to...`
  - Explicitly state when NOT to use: `Do not use for...`
  - Never write generic summaries like `"A library for managing state"`.

### Body Guidelines
- Keep under **500 lines**.
- Ground instructions in real codebase experience, not generic documentation the LLM already knows.
- **Mandatory "Gotchas & What NOT to Do" section:** Explicitly list known AI anti-patterns and pitfalls.
- Include structured response templates and self-validation checklists for deterministic output.

### Progressive Disclosure Subdirectories
- `references/`: Detailed sub-domain markdown files loaded on demand by the skill.
- `scripts/`: Deterministic executable scripts (bash, node, python) for tasks where LLMs produce non-deterministic drift.
- `assets/`: Static data, lookup tables, schemas, or boilerplate templates.

---

## 5. The Architectural Atomicity Mandate for Rules & Skills

Every rule, skill, workflow, and configuration component must adhere to the **Single Responsibility Principle (SRP)**: indivisible, self-contained, orthogonal, and composable.

### Rule Atomicity
- **One Domain Per Rule:** Each rule file in `docs/rules/` must govern exactly one architectural or engineering subdomain.
- **Completeness Without Stubs:** A rule must never be a shallow stub or placeholder; it must codify production-grade invariants, anti-patterns, and concrete code patterns.
- **Zero Cross-Leakage:** Rules must be mutually orthogonal—never duplicate or contradict directives across files.

### Skill Atomicity
- **One Capability Per Skill:** Each skill in `.agents/skills/` must encapsulate one discrete, multi-step workflow.
- **Bounded Negative Triggers:** Must define both what it does (`Use when...`) and explicitly what it does not do (`Do not use for...`).
- **Encapsulated Artifacts:** Scripts, assets, and reference docs must live within the skill's isolated directory tree.
- **Idempotent Execution:** Re-executing a skill against the same inputs must produce identical, deterministic results.

### Many-to-Many Skill Composability Models
Coding tasks and agentic skills exhibit an explicit **Many-to-Many ($M:N$) Relationship**:
1. **Multiple Skills per Coding Task:** Implementing a complex domain feature frequently requires composing several orthogonal skills:
   - `relentless-questioner` (resolves ambiguous invariants and failure edge cases).
   - `product-analyst` (decomposes into INVEST user stories and executable Gherkin criteria).
   - `compliance-audit` (verifies OWASP, SOC 2, and data isolation controls).
   - `clean-code-refactor` (applies GoF patterns, CQS, SLAP, and eliminates code smells during the TDD inner loop).
2. **Single Skill in Multiple Scenarios:** An atomic skill functions as a reusable capability across completely different business problems (e.g. `clean-code-refactor` applies equally to financial ledgers, order lifecycle state machines, and authentication middleware).

#### The 3 Composition Patterns:
- **Pattern 1: Sequential Pipeline Chaining (Workflow Composition):** Skill $A$ produces a structured artifact (e.g. Feature Alignment Spec) that serves as the direct input contract for Skill $B$ (e.g. Gherkin test suite generation).
- **Pattern 2: Dynamic Skill Stacking (Contextual Composition):** An agent activates multiple orthogonal skills simultaneously in its execution context, adhering to Progressive Disclosure without polluting global prompts.
- **Pattern 3: Multi-Agent Subagent Delegation (Division of Labor):** A coordinator agent delegates isolated sub-tasks to specialized subagents equipped with specific skills, synthesizing their outputs into a single atomic change.

#### Invariants for Valid Skill Composition:
- **Standardized Output Contracts:** Skills must emit predictable, structured markdown or JSON envelopes (e.g. FAS, Gherkin blocks, ADR templates).
- **Zero Cross-Contamination:** No skill may write code or modify files outside its declared functional boundary.
- **Pure Function Semantics:** Analysis skills must remain read-only and side-effect free.

---

## 6. The Relentless Skill Architecture Inquiry

Never architect or modify a skill based on assumptions. Before authoring any `SKILL.md`, run the **7 Core Skill Inquiry Branches**:

```
[New Skill / Rule Request]
       │
       ▼
[Branch 1: Placement] ────────── Should this be AGENTS.md, a Rule, or a Skill?
       │
       ▼
[Branch 2: Trigger Boundaries] ── Exact 'Use when...' and explicit 'Do NOT use for...'?
       │
       ▼
[Branch 3: Domain Ground Truth] ─ Have generic textbook tutorials been purged?
       │
       ▼
[Branch 4: Gotchas & Anti-Patterns] What specific AI mistakes MUST be forbidden?
       │
       ▼
[Branch 5: Determinism vs LLM] ── Should deterministic steps be scripts in scripts/?
       │
       ▼
[Branch 6: Progressive Bloat] ─── Is SKILL.md < 500 lines with sub-docs in references/?
       │
       ▼
[Branch 7: Verification Loop] ─── Are there output templates and self-checklists?
       │
       ▼
[Ready to Author / Update Skill]
```

### The 7 Core Inquiry Branches

| # | Inquiry Branch | What to Interrogate | If Unanswered |
|---|---|---|---|
| **1** | **Placement & Scope** | Does this apply to all prompts (Root `AGENTS.md`), one package (Nested `AGENTS.md`), a continuous coding domain (`docs/rules/`), or an on-demand task (`.agents/skills/`)? | Stop and categorize correctly. Never bloat root configs. |
| **2** | **Trigger Intent** | What explicit user intent wakes this skill? What are the negative conditions? | Interrogate the user on exact workflow boundaries. |
| **3** | **Domain Truth** | Is this grounded in this project's architecture, or generic fluff the LLM already knows? | Purge generic definitions (e.g. "What is a PDF/REST API"). |
| **4** | **Gotchas & Anti-Patterns** | What exact mistakes has the AI repeatedly made in this task? | Formulate 3–5 explicit negative "DO NOT" rules. |
| **5** | **Determinism** | Are there brittle CLI sequences that need a bash/Node script instead of stochastic LLM generation? | Create helper scripts in `scripts/`. |
| **6** | **Progressive Bloat** | Does `SKILL.md` exceed 500 lines? | Extract sub-topic guides into `references/`. |
| **7** | **Verification Loop** | How will the agent and user prove the skill succeeded? | Provide structured response templates & validation checklists. |

---

## 7. The Continuous Refinement Loop

When an AI produces suboptimal code or documentation:
1. Preserve the original AI output draft.
2. Make manual corrections to produce the desired gold-standard output.
3. Diff the original draft against the corrected version to identify specific gaps.
4. Update the relevant skill's "What NOT to do" or guideline section to prevent repeating that mistake.
