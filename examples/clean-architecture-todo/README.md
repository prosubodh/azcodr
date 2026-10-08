# Clean Architecture Todo Example

This directory demonstrates a complete, production-grade **Clean / Hexagonal Architecture** project governed by `azcodr`.

---

## 🏛️ Architecture & Layering

```
src/
├── domain/                  # PURE ENTERPRISE BUSINESS RULES
│   ├── todo.ts              # Entity with invariants (zero external imports)
│   └── ports.ts             # Primary & secondary port interfaces (TodoRepositoryPort)
├── use-cases/               # APPLICATION BUSINESS RULES
│   ├── create-todo.ts       # Orchestrates domain creation and persistence
│   └── list-todos.ts        # Query use case
├── adapters/                # INTERFACE ADAPTERS
│   └── in-memory-repo.ts    # Outgoing repository adapter conforming to port
└── index.ts                 # Composition root
```

---

## 🛡️ How Azcodr Enforces Architecture Here

1. **Layer Boundary Defense:**
   - The domain core (`src/domain/`) never imports infrastructure, database drivers, or web frameworks.
   - Azcodr's zero-dependency boundary engine (`azcodr check`) verifies that imports flow strictly inwards toward the domain.

2. **Refactor-Before-Add (File Size Caps):**
   - Every module stays lean ($\le 300$ lines).
   - If an AI agent attempts to append logic to any file over 300 lines, Azcodr's PreToolUse runtime hook immediately blocks the tool call before changes reach disk.

3. **Zero Third-Party Dependencies:**
   - The entire domain and application layer runs on native Node.js builtins (`node:*`).

---

## 🧪 Verification

### 1. Run Unit & Use Case Tests
```bash
npm test
```

### 2. Verify Architecture Boundaries
From the repository root:
```bash
npx azcodr check examples/clean-architecture-todo
```
