# Design Decisions

This document records every non-obvious architectural and implementation choice.

## Backend

### Single flat project (no Clean Architecture layers)
The spec mandates a single `CarSharing.Api` project. Services are organized by feature folder inside `Services/`. This keeps the project simple and avoids premature abstraction.

### EF Core directly (no repository pattern wrapper)
`AppDbContext` is the repository. Adding another abstraction layer adds complexity with no benefit at this scale.

### PricingService as single source of truth
All pricing logic lives in `PricingService`. The frontend never computes prices — it only displays what the server returns. This prevents price discrepancies.

### FakePaymentService
Real Stripe integration is deferred. `IPaymentService` is designed so that swapping in `StripePaymentService` requires only a DI registration change.

### Refresh token rotation with hash chain
Refresh tokens are stored as SHA-256 hashes. On each refresh, the old token is revoked and a new one is issued, creating a chain that can detect token theft.

## Frontend

### Access token in memory only
Tokens are stored in a Zustand store variable, never in localStorage or sessionStorage. This prevents XSS token theft.

### TanStack Query for all server state
No manual `useEffect` + `useState` for API calls. TanStack Query handles caching, deduplication, background refetching, and optimistic updates.

### shadcn/ui copied into src/components/ui
Per spec, these are committed source files, not an npm dependency. This allows full customization.

## Infrastructure

### Migrations on startup
Gated by `RUN_MIGRATIONS_ON_STARTUP=true`. This makes `docker compose up` the only command needed. No manual migration step.

### PostGIS for geospatial queries
Enables efficient radius search with `ST_DWithin` via NetTopologySuite, avoiding manual Haversine calculations.
