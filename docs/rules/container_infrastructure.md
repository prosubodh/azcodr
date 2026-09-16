# Container Infrastructure & Local Parity

> **Core Mandate:** Enforce production parity through containerized Nginx reverse proxy routing, explicit Docker Compose service healthchecks, non-root security boundaries, and layer cache optimization.

---

## 1. Gateway Routing & Local Parity

- **Unified Gateway Routing**: Route all local development services through an Nginx reverse proxy gateway on port 80 to eliminate CORS discrepancies and simulate production multi-service topologies locally.
- **Service Isolation**: Run internal microservices and datastores on a private bridge network, exposing only the Nginx entrypoint to the host machine.

---

## 2. Docker Healthchecks & Dependency Ordering

- **Service Healthchecks**: Every database, cache, and application service in `docker-compose.yml` must define an explicit healthcheck.
- **Strict Dependency Ordering**: Dependent services must wait for upstream health, not merely container process startup:
  ```yaml
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  ```

---

## 3. Container Security & Build Performance

- **Non-Root Execution**: Run all application containers as unprivileged users (`USER node` in Alpine images) to enforce container security boundaries.
- **Multi-Stage Build Optimization**: Leverage multi-stage Dockerfiles with cache-mounted package managers (`RUN --mount=type=cache,target=/root/.npm`) and shared base layers across services to minimize build times.
