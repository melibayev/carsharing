# CarSharing

A peer-to-peer car rental platform — car owners list their vehicles, guests search and book them by the day. Built as a graduation project.

## Running locally

Only prerequisite is Docker.

```bash
git clone <repo-url>
cd CarSharing
docker compose up --build
```

First boot takes about 90 seconds (migrations + seeding). After that:

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API / Swagger | http://localhost:5080/swagger |
| Hangfire dashboard | http://localhost:5080/hangfire |
| Mailhog (dev emails) | http://localhost:8025 |

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@CarSharing.dev | Admin123! |
| Host | host@CarSharing.dev | Host1234! |
| Guest | guest@CarSharing.dev | Guest123! |

The login page has one-click quick-login buttons for all three.

## What it does

- Guests search cars by city, date range, body type, price, and a handful of other filters. Search uses PostGIS for radius-based geo queries.
- Hosts list their car with photos, pricing rules (daily rate, weekly/monthly discounts, cleaning fee), and availability blocks.
- Booking flow: request → host approves → payment captured → check-in → check-out → reviews. Instant Book is also supported for hosts who want it.
- In-app wallet for guests to top up and pay; hosts get credited on approval.
- Real-time chat per booking via SignalR. Notifications for every step.
- Admin panel for KYC review, car listing approval, disputes, and user management.

## Stack

| Layer | Tools |
|-------|-------|
| Backend | .NET 8, ASP.NET Core, EF Core, PostgreSQL + PostGIS, Redis, SignalR, Hangfire |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Recharts |
| Auth | JWT (15-min access + 14-day refresh), ASP.NET Core Identity |
| Infra | Docker Compose, Nginx, Cloudinary (photos), Twilio (SMS) |

## Background jobs

Three Hangfire jobs run automatically:

- **BookingExpiryJob** (every minute) — cancels pending bookings that the host ignored for 24 hours
- **PayoutJob** (daily) — processes host payouts for completed trips
- **ReviewReminderJob** (daily) — nudges guests to leave a review; auto-publishes after 14 days
