# Workspace Isolation & Zero Global Context Interference

> **Core Mandate:** Enforce strict workspace containment within the workspace root (`./`), strictly prohibiting any leakage, interference, or unverified assumptions from global configurations, external directories, or sibling projects.

---

## 1. Principle of Workspace Sovereignty

- **Ground Truth Boundary**: Only files, dependencies, configuration files (`package.json`, `tsconfig.json`, `docker-compose.yml`), and verified command executions within the local workspace (`./`) constitute project truth.
- **Zero Global Contamination**: Never import, execute, or assume tools, environment variables, or conventions from global system directories (e.g. `~/.config`, `/tmp`, `~/.gemini/antigravity-cli`, or parent directories) unless explicitly defined within local workspace configuration.
- **Sibling Project Isolation**: Strictly ignore all external or legacy projects. Do not read from or write to directories outside the local repository (`./`).

---

## 2. Dependency & Tooling Isolation

- **Local Package Manager**: Standardize strictly on local workspace dependencies managed via `npm` within this workspace. Never rely on global npm packages (`npm install -g`).
- **Container Network Containment**: All Docker containers and bridge networks must be named and scoped specifically to this project (e.g. `azcodr_network`, `azcodr_postgres`) to prevent port collisions or cross-project data leakage.

---

## 3. Subagent & Execution Context Sandboxing

- When spawning subagents or executing commands, ensure the working directory (`Cwd`) is anchored strictly to the workspace root (`./`).
- Subagents must never carry over assumptions from other workspaces or global memory pools.
