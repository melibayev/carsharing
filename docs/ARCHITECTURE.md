# Architecture

## System Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Nginx (web) │────▶│  .NET 8 API  │
│  React SPA   │     │  :3000       │     │  :5080       │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                        ┌──────────┐     ┌──────────┐     ┌──────────┐
                        │ Postgres │     │  Redis   │     │ Mailhog  │
                        │ + PostGIS│     │  Cache   │     │  SMTP    │
                        │  :5432   │     │  :6379   │     │  :8025   │
                        └──────────┘     └──────────┘     └──────────┘
```

## Request Flow

1. Browser makes requests to Nginx (port 3000)
2. Nginx serves static React bundle for page routes
3. Nginx proxies `/api/*` and `/hubs/*` to the .NET API (port 5080)
4. API authenticates via JWT Bearer token
5. API queries PostgreSQL via Entity Framework Core
6. API uses Redis for rate limiting and caching
7. Real-time updates flow via SignalR WebSocket hubs
8. Background jobs run via Hangfire (Postgres storage)

## Key Patterns

- **CQRS-lite** via MediatR for service organization
- **Server-authoritative pricing** — all price calculations in `PricingService`
- **JWT + Refresh Token** — access token in memory, refresh in HttpOnly cookie
- **Repository pattern** via EF Core DbContext directly (no extra abstraction)
- **RFC 7807 ProblemDetails** for all error responses
