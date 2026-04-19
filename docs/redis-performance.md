# Redis Caching + Performance Report

## Scope
Implemented reusable Upstash Redis caching using cache-aside pattern for important APIs:
- Get user by ID flows (`user:{id}`)
- List users (`list:users`)
- List products/books default browse (`list:books`)

## Files Added
- `backend/utils/redisClient.js`
- `backend/utils/cacheService.js`

## Cache API
- `get(key)`
- `set(key, value, ttl)`
- `del(key)`

## Applied Endpoints
- `GET /api/admin/users` (cache key: `list:users` for unfiltered query)
- `GET /api/buyer/profile` and `GET /api/auth/check` (cache key: `user:{id}`)
- `GET /api/books/browse` default query (cache key: `list:books`)

## Invalidation Implemented
- User updates/deletes:
  - `PUT /api/admin/users/:id/role`
  - `PUT /api/admin/users/:id/status`
  - `DELETE /api/admin/users/:id`
  - `PUT /api/buyer/profile`
  - Moderator verify user APIs
- Product updates/deletes:
  - Seller create/update/delete book
  - Admin approve/reject book
  - Employee review-book action

## Timing Instrumentation
Added timing logs using `console.time()` + `console.timeEnd()`:
- `[PERF] ... total`
- `[PERF] ... db`
- `[CACHE HIT] ...`
- `[CACHE SET] ...`

## How to Measure
1. Set `REDIS_URL` (Upstash) in environment.
2. Call endpoint first time (cache miss -> DB).
3. Call same endpoint second time (cache hit -> Redis).
4. Compare logged timings.

## Timing Table (Fill from your run logs)

| Endpoint | Without Redis (DB miss) | With Redis (cache hit) | Improvement |
|---|---:|---:|---:|
| GET /api/admin/users | ___ ms | ___ ms | ___ % |
| GET /api/buyer/profile | ___ ms | ___ ms | ___ % |
| GET /api/books/browse (default) | ___ ms | ___ ms | ___ % |

Improvement formula:

`((withoutRedis - withRedis) / withoutRedis) * 100`

Example:
- Without Redis: 180ms
- With Redis: 24ms
- Improvement: `((180 - 24) / 180) * 100 = 86.67%`
