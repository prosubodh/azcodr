# Clean Code & Pragmatic Programming Directives

> **Core Mandate:** Enforce intention-revealing naming, small focused functions, Command-Query Separation (CQS), Single Level of Abstraction (SLAP), and DRY pragmatic architecture.

---

## 1. Clean Code Standards (Robert C. Martin)

- **Intention-Revealing Naming**: Names of variables, functions, and classes must describe why they exist, what they do, and how they are used. Avoid abbreviations, single-letter variables, and type-encoding prefixes.
- **Function Guidelines**:
  - **Small and Focused**: Functions should do one thing, do it well, and do only that (Single Responsibility Principle). Max 20–30 lines per function.
  - **Single Level of Abstraction (SLAP)**: Statements within a function must belong to the exact same level of abstraction.
  - **Command-Query Separation (CQS)**: A function must either perform an action (mutate state) or return a value (query state), never both.
  - **Argument Limit**: Limit function arguments to 3 or fewer. Bundle additional parameters into typed configuration DTOs.
- **Eliminate Side-Effects**: Functions must not have unexpected side effects (e.g. modifying passed arguments or global state) without explicit naming.
- **Dead Code**: Never leave commented-out code; rely entirely on git history.

---

## 2. The Pragmatic Programmer Directives (Hunt & Thomas)

- **DRY (Don't Repeat Yourself)**: Every piece of knowledge must have a single, unambiguous, authoritative representation within the system. DRY applies to business domain knowledge, not superficial syntax duplication.
- **Orthogonality**: Eliminate coupling between unrelated modules. Changing one component must not cascade unexpected side effects into another.
- **Broken Windows Theory**: Never leave bad code, failing lint checks, or out-of-date documentation unfixed. Fix defects immediately before entropy normalizes.
- **Design by Contract (DbC)**: Define explicit preconditions (Zod runtime validation), postconditions (guaranteed response envelopes), and domain invariants.
