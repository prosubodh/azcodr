# Relentless Questioning Loop & Dynamic Interrogation Protocol

> **Core Mandate:** Enforce context-aware, adaptive interrogation of requirements, technical constraints, and failure modes before code authoring, dynamically branching questions based on previous answers to eliminate all hidden assumptions.

---

## 1. The Context-Aware Interrogation Lifecycle

Never write speculative code or draft implementation plans based on underspecified user prompts. Every non-trivial feature, database modification, or architectural task must pass through the **4-Stage Relentless Questioning Loop**:

```
1. CLASSIFY (Domain & Constraints) ──► 2. ADAPTIVE BRANCHING (Context Questions) ──► 3. TENSION RECONCILIATION (Rule Conflicts) ──► 4. CONVERGENCE (Signed-Off Spec)
```

1. **Stage 1: Intent & Domain Concern Classification**: Analyze the incoming prompt to identify core technical domain concerns (State Mutations, Multi-Tenancy & Auth, Async Tasks & Events, External Integrations, UI/UX Interaction Flows, or Read Performance & Search). Never classify into abstract "archetypes"; ground inquiries strictly in the project's Stack, Language, Architectural Patterns, and Engineering Methodologies.
2. **Stage 2: Context-Aware Adaptive Branching**: Ask targeted questions in digestible batches (2–4 questions per turn). **Question $N+1$ must directly incorporate the answer to Question $N$**, exploring deep technical trade-offs rather than reciting generic checklists.
3. **Stage 3: Architectural Tension Reconciliation**: If the user's proposed approach violates an existing workspace rule (e.g. dual-writes without an outbox, sparse nullable columns, or missing tenant isolation), immediately highlight the architectural conflict and propose compliant alternatives.
4. **Stage 4: Convergence & Functional Alignment Specification**: Lock down the scope with an unambiguous summary covering Invariants, Negative Scope (Non-Goals), Error Matrix, and Test Verification Strategy.

---

## 2. Adaptive Contextual Decision Branches

Questions must dynamically pivot depending on the technical domain concern and operational constraints:

### Concern A: State Mutations & High-Integrity Transactions
*Trigger:* The feature involves balances, inventory counts, entity transitions, or state mutations.
- *Adaptive Inquiries:* What isolation level is required (`REPEATABLE READ` vs `SERIALIZABLE`)? What is the idempotency key TTL? In the event of a downstream gateway failure, how is the compensating rollback (Saga) triggered? How is concurrent mutation race condition prevented (Optimistic Concurrency Control vs row lock)?

### Concern B: Multi-Tenancy & Data Boundaries
*Trigger:* The feature touches tenant-scoped entities or custom fields.
- *Adaptive Inquiries:* How is the tenant context resolved if accessed via background workers? Which isolation model applies (AST interceptor, database RLS, or schema namespace)? If custom fields are needed, does the tenant's JSON Schema govern validation?

### Concern C: Asynchronous Tasks & Event Streaming
*Trigger:* The feature processes background jobs, emails, webhooks, or messaging.
- *Adaptive Inquiries:* Is message delivery at-least-once or exactly-once? How are dual-writes prevented (Transactional Outbox)? How are poison pills and retries handled (Dead-Letter Queue with exponential backoff)?

### Concern D: External Integrations & 3rd-Party APIs
*Trigger:* The feature interacts with external SaaS, webhooks, or cloud services.
- *Adaptive Inquiries:* What is the project-owned Port/Adapter boundary interface? What are the rate-limiting and circuit-breaking parameters? How are mock test doubles constructed without mocking third-party types directly?

### Concern E: User Interface & Interaction Flows
*Trigger:* The feature introduces or modifies user interfaces, web pages, screen layouts, form mutations, or navigation.
- *Adaptive Inquiries:* Who is the target user persona and what is the required operational density (dense tabular workspace, creative canvas, or streamlined mobile flow)? What layout topography applies (Persistent Shell, Canvas-First, or Sequential Wizard)? What is the URL state synchronization strategy (`useSearchParams` for `?tab=`, `?q=`, `?page=`, `?id=`)? What server-state cache manager synchronizes data? How are validation feedback and errors displayed (RFC 9457 problem details, accessible live regions, zero native `window.alert()`)?

### Concern F: Read Performance, Caching & Search
*Trigger:* The feature involves high-scale read traffic, aggregations, reporting, or dashboards.
- *Adaptive Inquiries:* What is the maximum acceptable staleness window? Is Cache-Aside with jittered TTL and XFetch stampede defense required? Is pagination keyset/cursor-based to prevent deep-offset latency degradation?

---

## 3. Anti-Assumption Guardrails

- **Zero Speculative Archetypes**: Never ask the user to categorize their system into abstract "archetypes". Ground all architectural interviews and system discoveries strictly in 4 concrete pillars: **Stack** (runtimes, databases, frameworks), **Language** (types, toolchain), **Architectural Patterns** (Hexagonal, Event-Driven, Command Pipeline), and **Engineering Methodologies** (TDD, Clean Code, Refactor-Before-Add).
- **Existing Codebase Grounding**: When working on an existing codebase, discover and inspect existing Stack, Language, Patterns, and Methodologies first before questioning new requirements.
- **Strict Non-Negotiable Invariants**: Interrogation must never compromise on TDD nano-cycles, max line limits (300 lines), or Clean Code standards. Legacy technical debt in an existing codebase is never an excuse to bypass rules.
- **Zero Implicit Defaults**: If the user does not specify a behavior (e.g. timeout duration, error status code, rollback behavior), treat it as strictly unknown and ask.
- **Explicit Non-Goals (Negative Scope)**: Every inquiry must establish what the feature will **NOT** do, preventing scope creep and unrequested architectural bloat.
- **Mandatory User Confirmation**: Never transition from interrogation to code generation without an explicit confirmation from the user on the synthesized alignment specification.

---

## 4. Anti-Rubber-Stamp & Passive Assent Protocol ("Don't Be a YES-Man")

Autonomous agents easily fall into the trap of presenting pre-cooked architectural plans where the user becomes a passive rubber stamp (*"ok"*, *"go"*, *"yes please"*), resulting in runaway scope creep and systems whose ultimate purpose becomes obscured from the user.

### Rules of Engagement:
1. **The Circuit Breaker Threshold:** If the user provides $\ge 3$ consecutive passive, unelaborated responses (*"ok"*, *"go"*, *"yes please"*, *"proceed"*), the agent is **STRICTLY FORBIDDEN** from authoring further implementation plans or code.
2. **Force-Field Intent Check:** The agent must halt and actively interrogate:
   - *"We have executed several milestones under automated approval. Stop and clarify: What specific problem does the current iteration solve for an end user today?"*
   - *"Can a human operator or consumer interact with what exists right now, or are we constructing secondary infrastructure prematurely?"*
3. **No Blind Agreement:** The agent must actively challenge requests that add unnecessary layers (e.g. adding Redis or Kafka before a single user exists, or adding DLQs and webhooks before an MVP flow is validated). Never say *"Yes, absolutely!"* to architecture that violates YAGNI or the Second-System Effect.

