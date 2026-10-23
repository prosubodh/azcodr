# Continuous Delivery: Deployment Pipelines, Release Automation & Environment Parity

> **Core Mandate:** Enforce Jez Humble and David Farley's Continuous Delivery canon: every commit creates a release candidate evaluated through an automated deployment pipeline, binaries are built once and deployed unchanged across environments, trunk integration is daily with stop-the-line discipline, and production releases are zero-downtime, auditable, and routine.

---

## 1. Foundational Principles of Continuous Delivery

Continuous Delivery (*Humble & Farley*) treats software delivery not as an episodic event, but as an automated, continuous, low-risk engineering discipline:

1. **The Deployment Pipeline as Single Source of Truth:**
   Every change pushed to version control triggers an automated deployment pipeline. The pipeline is the sole authorized mechanism for building, validating, and deploying software.
2. **The "Build Once" Invariant:**
   Binaries, container images, and deployment packages must be compiled and packaged **exactly once** in the Commit Stage. The identical byte-artifact is deployed through test, staging, UAT, and production. Rebuilding, recompiling, or repackaging per environment is strictly prohibited.
3. **The "Done" Invariant:**
   Software is only "Done" when it is running in production, or proven deployable to production at the push of a button with all automated gates green.
4. **Bring the Pain Forward:**
   If an activity (testing, integration, migration, release) is painful or error-prone, do it more frequently in smaller batches to drive automation and eliminate surprise.
5. **Stop-the-Line Culture (Andon Cord):**
   If any pipeline stage fails, the entire team halts new feature check-ins. Fixing the broken build or pipeline regression takes immediate precedence over starting new work.

---

## 2. The 4-Stage Deployment Pipeline Anatomy

```
[Commit to Trunk]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ 1. Commit Stage (< 5–10 min)                            │
│    • Syntax & Typecheck (`tsc --noEmit`)               │
│    • Linter & Clean Code fitness (`oxlint`)            │
│    • 100% Micro-Unit Tests (in-memory, zero sleep)    │
│    • Compile & Package Binary / OCI Container Image    │
└────────────────────────────────────────────────────────┘
       │ (Artifact Published to Ephemeral Registry)
       ▼
┌────────────────────────────────────────────────────────┐
│ 2. Automated Acceptance Stage (< 15 min)               │
│    • Deploy untouched binary to clean test environment │
│    • Outside-In Business Specifications (Gherkin/E2E)  │
│    • Contract & Boundary Verification                  │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ 3. Capacity & Non-Functional Stage                     │
│    • Performance & P99 Latency Benchmarks              │
│    • Security CVE Scans (Trivy / Syft SBOM)            │
│    • Resilience & Chaos Fault Injection                │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ 4. Production Release Stage                            │
│    • Blue-Green / Canary Traffic Routing               │
│    • Automated Golden Signal Verification              │
│    • One-Click Rollback on Metric Anomaly              │
└────────────────────────────────────────────────────────┘
```

### Invariants:
1. **Commit Stage Fast Feedback:** The Commit Stage must complete in **under 10 minutes** (target $\le 5$ minutes). Tests requiring disk I/O, network calls, or third-party APIs must be quarantined to later stages.
2. **Fail Fast:** If Stage 1 fails, subsequent resource-intensive stages are immediately cancelled.
3. **Artifact Immutability:** Later pipeline stages download the artifact produced by Stage 1; they never check out source code to build their own binaries.

---

## 3. Trunk-Based Integration & Commit Discipline

1. **Daily Integration Invariant:** Every developer and agent must commit and integrate their verified working increments to trunk/main at least once per day.
2. **Short-Lived Feature Branches:** Feature branches must have a lifespan of $\le 24$ hours. Long-lived feature branches, isolated team branches, and merge-hell sprints are prohibited.
3. **Pre-Commit Verification:** Run the local equivalent of the Commit Stage (`npm test`, `npm run lint`, `npm run validate`) before pushing to remote. Never push unverified code.
4. **Never Check In on Broken Builds:** If trunk is failing, no developer or agent may push additional features. The only acceptable commits are those that diagnose or fix the build regression.

---

## 4. Configuration Management & Environment Parity

1. **Version Control Everything:**
   Everything needed to build, configure, test, and deploy the system must be version-controlled:
   - Application source code and build definitions.
   - Automated test suites and test fixtures.
   - Infrastructure-as-Code (Terraform, Dockerfiles, Kubernetes manifests).
   - Database migration scripts and seed data.
2. **Externalize Configuration:**
   Configuration must be decoupled from code. Binaries must read environment-specific parameters (database URLs, API endpoints, log levels, credentials) exclusively through environment variables, configuration files, or secret stores injected at runtime.
3. **Eliminate Snowflake Environments:**
   No environment (local, testing, staging, production) may be configured manually through ad-hoc SSH sessions. All environments must be provisioned deterministically and idempotently from version-controlled automation.
4. **Environment Parity:**
   Development, testing, and production environments must match as closely as possible in operating system, runtime version, database engine, and topology.

---

## 5. Zero-Downtime Deployment & Release Patterns

### 1. Decoupling Deployment from Release
- **Deployment:** Installing the software artifact into an environment and verifying its health.
- **Release:** Making the new feature or capability accessible to end-users.
- Use **Feature Toggles (Flags)** and **Dark Launching** to decouple technical deployments from business releases.

### 2. Blue-Green Deployments
Maintain two identical production environments (Blue = active traffic, Green = idle):
1. Deploy the new artifact version to the idle Green environment.
2. Run automated smoke tests against Green's private endpoints.
3. Switch router/load balancer traffic from Blue to Green instantaneously.
4. Retain Blue for rapid rollback; decommission only after health is confirmed.

### 3. Canary Releases & Progressive Delivery
Gradually route production traffic to the new revision while monitoring health signals:
1. Route a small slice (1–5%) of live production traffic to the canary instance.
2. Monitor OpenTelemetry Golden Signals (HTTP 5xx rate, P99 latency, error logs).
3. If errors spike or latency degrades, automatically terminate the canary and route 100% traffic back to the stable baseline.
4. If healthy over the observation window, graduate traffic (25% $\rightarrow$ 50% $\rightarrow$ 100%).

### 4. Database Migrations: The Expand/Contract Pattern
Database schema mutations must never require application downtime or lock step multi-system deploys:
1. **Expand Phase:** Add new database columns or tables without removing existing ones. Application version $N$ continues reading old columns.
2. **Dual-Write Phase:** Deploy version $N+1$ to write to both old and new columns, reading from old.
3. **Backfill Phase:** Run an asynchronous backfill script migrating existing historical records into the new schema format.
4. **Contract Phase:** Switch version $N+2$ to read exclusively from the new column. Once verified, execute a migration dropping the deprecated old column.

---

## 6. Continuous Delivery Verification Checklist

Before releasing any software increment, verify:
- [ ] **Artifact Built Once:** Single binary/container deployed across test, staging, and production without rebuilding.
- [ ] **Externalized Config:** Zero environment-specific constants hardcoded in source code or built binaries.
- [ ] **Fast Commit Gate:** Commit stage (lint, typecheck, unit tests) executes in $\le 5$ minutes.
- [ ] **Automated Rollback:** Automated health checks and canary monitors configured with automated rollback tripwires.
- [ ] **Zero-Downtime Migrations:** Database schema migrations observe the Expand/Contract parallel-run pattern.
- [ ] **Version-Controlled Infrastructure:** Environment provisioning and container definitions are declarative and tracked in Git.
