# Cloud-Native 12-Factor Standards (2026 Edition)

> **Core Mandate:** Enforce stateless isolates, OpenTelemetry (OTel) observability, API-first design, fast startup, and graceful disposal on SIGTERM.

---

## 1. Stateless Isolates & Shared-Nothing

- Application processes must be strictly stateless and share nothing.
- Any persistent state must reside in managed backing services (PostgreSQL, Redis, S3).
- Session state must never be held in Node process memory.

---

## 2. OpenTelemetry (OTel) Standardization

- Standardize exclusively on open-source **OpenTelemetry** (`@opentelemetry/api`, `@opentelemetry/sdk-node`).
- Export traces, metrics, and logs in OTLP format to vendor-neutral collectors (e.g. Jaeger, Prometheus, OpenSearch).

---

## 3. Disposability & Graceful Shutdown

- Listen for `SIGTERM` and `SIGINT` signals.
- Stop accepting new HTTP requests, drain in-flight connections within 10 seconds, close database pools cleanly, and exit with code 0:

```typescript
process.on('SIGTERM', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
});
```
