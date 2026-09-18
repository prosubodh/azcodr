# Container Infrastructure & Local Parity

> **Core Mandate:** Enforce production parity through containerized reverse proxy routing, explicit OCI service healthchecks, non-root security boundaries, and minimal distroless base images.

---

## 1. Gateway Routing & Local Parity

- **Unified Gateway Routing**: Route all local development and production services through an edge reverse proxy gateway (such as **Envoy** or **Nginx**) on standard HTTP ports to eliminate CORS discrepancies and simulate production multi-service topologies uniformly.
- **Internal Network Isolation**: Isolate internal services and datastores on a private bridge or overlay network, exposing only the hardened gateway entrypoint to public interfaces.

---

## 2. OCI Healthchecks & Deterministic Dependency Ordering

- **Explicit Service Healthchecks**: Every database, cache, message broker, and application service in container configurations (`docker-compose.yml` or Kubernetes manifests) must define an explicit healthcheck command and interval.
- **Strict Dependency Ordering**: Dependent application services must wait for upstream database and cache readiness, never launching before health verification:
  ```yaml
  depends_on:
    database:
      condition: service_healthy
    cache:
      condition: service_healthy
  ```

---

## 3. Container Security & Build Performance

- **Non-Root Execution**: Run all application containers strictly as unprivileged users (UID >= 10001) with read-only root filesystems and dropped Linux capabilities (`cap_drop: ALL`).
- **Minimal OCI Base Images**: Standardize on **Distroless** (Google Container Tools) or **Scratch** base images across all polyglot microservices, eliminating package managers, debug shells, and OS vulnerabilities.
- **Multi-Stage Build Optimization**: Utilize multi-stage OCI builds with cache mounts across dependency steps to minimize image sizes and maximize layer cache reuse.
