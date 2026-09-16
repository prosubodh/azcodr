# Caching Strategies & Event-Driven Invalidation

> **Core Mandate:** Enforce Redis Cache-Aside with namespaced keys and jittered TTLs, event-driven cache invalidation, and HTTP conditional caching (ETags / 304).

---

## 1. Redis Cache-Aside Pattern

```typescript
export async function getCachedOrFetch<T>(
  redis: RedisClient,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetcher();
  // Add 10% random jitter to prevent cache stampedes
  const jitter = Math.floor(Math.random() * (ttlSeconds * 0.1));
  await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds + jitter);
  return fresh;
}
```

---

## 2. Key Namespacing & Event-Driven Invalidation

- **Key Format**: `tenant:{tenantId}:{entity}:{entityId}` (e.g. `tenant:123:user:456`).
- **Event-Driven Invalidation**: Invalidate cache keys immediately upon entity mutation events via domain events or pub/sub rather than waiting for TTL expiration.

---

## 3. HTTP Conditional Caching (ETags)

- Generate cryptographic `ETag` headers for cacheable GET responses.
- Return **`304 Not Modified`** without payload when client sends matching `If-None-Match`.
