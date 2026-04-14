# CarSharing

> Your next drive, from someone down the street.

**CarSharing** is a full-stack peer-to-peer car rental marketplace — think Airbnb for cars. Hosts list their personal vehicles to earn money while they sit idle; guests browse, book, and rent cars by the day. The platform handles the entire lifecycle: discovery, booking, real-time messaging, check-in/check-out, reviews, payouts, and admin moderation.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Demo Accounts](#demo-accounts)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features Overview](#features-overview)
- [Pages & UI Reference](#pages--ui-reference)
- [API Reference (66 Endpoints)](#api-reference-66-endpoints)
- [Data Models](#data-models)
- [Background Jobs](#background-jobs)
- [Real-Time (SignalR)](#real-time-signalr)
- [Security & Rate Limiting](#security--rate-limiting)
- [Seed Data](#seed-data)
- [Environment Variables](#environment-variables)

---

## Quick Start

```bash
git clone <repo-url> CarSharing
cd CarSharing
docker compose up --build
```

Wait ~90 seconds for migrations and seeding, then open:

| Service | URL |
| ------- | --- |
| Web App | http://localhost:3000 |
| Swagger API Docs | http://localhost:5080/swagger |
| Mailhog (email testing) | http://localhost:8025 |
| Hangfire Dashboard | http://localhost:5080/hangfire |

### Docker Services

| Service | Image | Port |
| ------- | ----- | ---- |
| **postgres** | postgis/postgis:16-3.4 | 5433 |
| **redis** | redis:7-alpine | 6379 |
| **mailhog** | mailhog/mailhog | 1025 (SMTP) / 8025 (UI) |
| **api** | .NET 8 (custom build) | 5080 → 8080 |
| **web** | Nginx (custom build) | 3000 → 80 |

---

## Demo Accounts

| Role | Email | Password |
| ----- | ----- | -------- |
| Admin | `admin@CarSharing.dev` | `Admin123!` |
| Host | `host@CarSharing.dev` | `Host1234!` |
| Guest | `guest@CarSharing.dev` | `Guest123!` |

The login page includes **Quick Login** buttons for all three accounts.

---

## Tech Stack

### Backend
- **.NET 8** Web API
- **Entity Framework Core 8** with Npgsql + PostGIS
- **ASP.NET Core Identity** with JWT (HS256) authentication
- **SignalR** for real-time messaging
- **Hangfire** (Redis-backed) for background job scheduling
- **AutoMapper 12** for DTO mapping
- **FluentValidation** for request validation
- **Serilog** for structured logging
- **JsonStringEnumConverter** for human-readable enum serialization

### Frontend
- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS 3.4** + **shadcn/ui** (19 components)
- **TanStack Query v5** for server state management
- **Zustand 5** for client state management
- **React Hook Form 7** + **Zod 3.24** for form handling/validation
- **React Router 6** for client-side routing
- **Axios** for HTTP with interceptors (auto token refresh)
- **@microsoft/signalr** for real-time updates
- **maplibre-gl** for map rendering
- **recharts** for admin analytics charts

### Infrastructure
- **PostgreSQL 16** with PostGIS for geospatial queries
- **Redis 7** for Hangfire job storage and caching
- **Mailhog** for development email capture
- **Nginx** as frontend reverse proxy
- **Docker Compose** for orchestration

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│   Browser    │────▶│  Nginx (port 3000)                               │
│  React SPA   │     │  ├─ /api/*  → proxy to API (port 5080)          │
│              │     │  ├─ /hubs/* → proxy to SignalR (WebSocket)       │
│              │     │  └─ /*     → serve React static files            │
└─────────────┘     └──────────────────────────────────────────────────┘
                                         │
                                         ▼
                    ┌──────────────────────────────────────────────────┐
                    │  .NET 8 Web API (port 5080)                      │
                    │                                                  │
                    │  Middleware Pipeline:                             │
                    │  SecurityHeaders → ExceptionHandling →           │
                    │  RequestLogging → Swagger → StaticFiles →        │
                    │  CORS → RateLimiter → JWT Auth → Authorization → │
                    │  Hangfire Dashboard → Controllers →              │
                    │  SignalR Hubs → Health Checks                    │
                    │                                                  │
                    │  Controllers (9):                                │
                    │  Auth · Cars · Bookings · Messages ·            │
                    │  Notifications · Reviews · Users · Admin ·      │
                    │  Uploads                                         │
                    │                                                  │
                    │  Background Jobs (Hangfire):                     │
                    │  BookingExpiry · Payout · ReviewReminder         │
                    │                                                  │
                    │  SignalR Hubs:                                   │
                    │  ChatHub (/hubs/chat) · AdminHub (/hubs/admin)  │
                    └────────────┬───────────────────┬─────────────────┘
                                 │                   │
                                 ▼                   ▼
                    ┌────────────────┐     ┌──────────────┐
                    │  PostgreSQL 16  │     │   Redis 7    │
                    │  + PostGIS      │     │  (Hangfire   │
                    │  (port 5433)    │     │   storage)   │
                    └────────────────┘     │  (port 6379) │
                                           └──────────────┘
```

---

## Project Structure

```
├── backend/
│   └── CarSharing.Api/
│       ├── Controllers/         # 9 API controllers (66 endpoints)
│       ├── Models/              # Entity models + enums
│       ├── DTOs/                # Request/response data transfer objects
│       ├── Services/            # Business logic layer (12+ services)
│       ├── Data/                # EF Core DbContext + migrations + seeding
│       ├── Validators/          # FluentValidation request validators
│       ├── Hubs/                # SignalR hubs (Chat, Admin)
│       ├── Jobs/                # Hangfire background jobs
│       ├── Middleware/          # Custom middleware (exception, security)
│       ├── Mappings/            # AutoMapper profiles
│       └── Program.cs           # App startup + middleware pipeline
├── frontend/
│   ├── src/
│   │   ├── pages/              # 12 page components
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, Footer, RootLayout, AuthGuard
│   │   │   ├── cars/           # CarCard
│   │   │   └── ui/             # 19 shadcn/ui components
│   │   ├── hooks/              # TanStack Query hooks (7 hook files)
│   │   ├── stores/             # Zustand stores (auth, search)
│   │   ├── lib/                # Axios instance, utilities
│   │   └── App.tsx             # Route definitions
│   ├── Dockerfile              # Multi-stage build
│   └── nginx.conf              # Reverse proxy config
├── docker-compose.yml          # 5 services
└── README.md                   # This file
```

---

## Features Overview

### 1. User Authentication & Accounts
- **Registration** with first name, last name, email, date of birth, password (min 8 chars with complexity)
- **Login** with email/password → returns JWT access token + refresh token (HttpOnly cookie)
- **Token refresh** — automatic silent refresh when access token expires; axios interceptor handles 401 → retry
- **Logout** — clears token from localStorage and invalidates refresh token server-side
- **Forgot password** — sends reset link via email (Mailhog in dev)
- **Email verification** — sends verification email on registration
- **Persistent sessions** — auth state persisted to localStorage via Zustand `persist` middleware

### 2. Car Listings (Host Features)
- **Create a listing** — 3-section form: vehicle details (make, model, year, body type, transmission, fuel type, seats, doors, color), pricing (daily price, cleaning fee, weekly/monthly discounts, security deposit), and location/rules (city, country, min/max trip days, advance notice hours, description, rules, instant book toggle)
- **Photo management** — upload multiple photos, set cover photo, reorder, delete individual photos
- **Publish / Snooze / Unsnooze** — control listing visibility
- **Availability blocking** — block specific date ranges with reasons (Maintenance, PersonalUse, Other)
- **"My Cars" tab** on dashboard — view all listed cars with trip count, rating, and daily price
- **Edit listing** — update all car details after creation

### 3. Car Discovery (Guest Features)
- **Home page hero search** — search by city name, quick city suggestion buttons
- **Browse by city** — 6 featured city cards (San Francisco, Los Angeles, New York, Miami, Austin, Seattle)
- **Advanced search & filters:**
  - City text search
  - Price range (min/max)
  - Body type (Sedan, SUV, Truck, Coupe, Convertible, Van, Hatchback)
  - Transmission (Automatic, Manual)
  - Fuel type (Gasoline, Diesel, Electric, Hybrid)
  - Instant Book only toggle
  - Sort by: Recommended, Price Low→High, Price High→Low, Top Rated, Newest
- **Paginated results** — server-side pagination with page navigation (Previous/Next + numbered buttons)
- **Car cards** — show photo, instant book badge, title, city, price/day, rating, trip count, spec badges
- **Featured cars** — homepage displays featured car listings

### 4. Car Detail & Booking Flow
- **Photo gallery** — full-width images with prev/next navigation and counter
- **Specs display** — body type, seats, transmission, fuel type in a 4-column grid
- **Description, features, and rules sections**
- **Host profile** — avatar, name, rating, trip count, join date
- **Reviews section** — shows up to 5 reviews with star ratings, author info, dates
- **Live booking quote** — pick-up and return date pickers trigger a real-time quote:
  - Daily rate × number of days
  - Weekly/monthly discount (auto-applied)
  - Cleaning fee
  - Service fee (platform fee)
  - Taxes
  - **Total price**
  - Security deposit (shown separately)
- **Book Instantly** (if instant book enabled) or **Request to Book** (requires host approval)
- **Guest message** — optional message to host with booking request
- **Auth redirect** — unauthenticated users clicking "Book" get redirected to login, then back to the car page

### 5. Booking Management

#### Booking Status Lifecycle

```
                     ┌──────────┐
            ┌───────▶│ Cancelled │
            │        └──────────┘
            │              ▲
            │              │ (cancel)
            │              │
┌─────────┐ │  ┌───────────────────┐    ┌───────────┐    ┌────────────┐    ┌───────────┐
│ Pending  │─┼─▶│ PendingApproval   │───▶│ Confirmed │───▶│ InProgress │───▶│ Completed │
└─────────┘ │  └───────────────────┘    └───────────┘    └────────────┘    └───────────┘
   │        │         │                      │                │                   │
   │        │         │ (reject)             │ (cancel)       │                   │
   │        │         ▼                      ▼                ▼                   ▼
   │        │  ┌──────────┐           ┌──────────┐    ┌────────────┐      ┌───────────┐
   │        └─▶│ Rejected  │           │ Cancelled │    │ Disputed   │      │  Review   │
   │           └──────────┘           └──────────┘    └────────────┘      │  Window   │
   │                                                                       └───────────┘
   │ (auto-expire
   │  after 24h)
   ▼
┌─────────┐
│ Expired  │
└─────────┘
```

**Statuses:** Pending → PendingApproval → Confirmed → InProgress → Completed | Cancelled | Rejected | Expired | Disputed

#### Actions by Role

| Action | Who | Available When | Details |
| ------ | --- | -------------- | ------- |
| **Create booking** | Guest | Car is published | Submits dates, message, gets a quote |
| **Approve** | Host | PendingApproval | Confirms the booking |
| **Reject** | Host | PendingApproval | Rejects with a reason |
| **Cancel** | Guest or Host | Pending or Confirmed | Cancels with a reason |
| **Check In** | Host | Confirmed | Records odometer reading (km) |
| **Check Out** | Host | InProgress | Records return odometer reading (km) |
| **Dispute** | Guest or Host | InProgress | Raises a dispute |
| **Write Review** | Either party | After completion (`canReview = true`) | 1-5 star rating + comment |

#### Booking Detail Page
- Car photo, title, date range, status badge
- Guest and host profiles with avatars
- Full pricing breakdown (daily rate × days, cleaning fee, service fee, taxes, total)
- Host payout amount (visible to host)
- Guest message
- Odometer readings (after check-in/check-out)
- Context-sensitive action buttons with confirmation dialogs
- Direct link to messages

### 6. Real-Time Messaging
- **Two-panel layout** — conversation list (left) + chat area (right)
- **Conversation list** — shows other party avatar/name, car title, last message preview, unread count badge
- **Chat bubbles** — right-aligned (sent, primary color) / left-aligned (received, muted color) with timestamps
- **Auto-scroll** to latest message
- **Real-time delivery** via SignalR — messages appear instantly without polling
- **Mark as read** — messages marked read when conversation is opened
- **Mobile responsive** — sidebar hidden when conversation selected, back arrow to return
- **Conversations auto-created** when a booking is made

### 7. Notifications System
- **Bell icon with unread badge** in navbar (shows count, capped at "9+")
- **Notification list page** — each notification shows: title, body, timestamp, unread indicator (blue dot)
- **Mark individual as read** — checkmark button on each unread notification
- **Mark all as read** — bulk action button
- **Click-to-navigate** — notifications link to relevant booking/conversation
- **13 notification types:** BookingRequest, BookingApproved, BookingRejected, BookingCancelled, BookingExpired, CheckIn, CheckOut, ReviewReceived, ReviewReminder, MessageReceived, DisputeOpened, DisputeResolved, PayoutSent

### 8. Reviews & Ratings
- **Star rating** (1-5) + text comment
- **Dual perspective** — both guest and host can review after trip completion
- **Review author role** tracked (Guest or Host)
- **Auto-publish** — reviews automatically published after 14 days via background job
- **Review reminder** — background job sends notification reminders to write reviews
- **Displayed on:**
  - Car detail page (up to 5 reviews)
  - User profiles
  - Car cards (average rating + trip count)

### 9. User Profiles
- **Public profile view** — avatar, name, ratings, trip count, join date
- **Edit profile** — first name, last name, phone number, bio
- **Profile photo upload**
- **Driver's license upload** (for identity verification)
- **Stats display** — trips as guest, trips as host, guest rating, host rating
- **ID verification badge** — shown when admin verifies user
- **Earnings history** — hosts can view their earnings

### 10. Favorites
- **Add/remove cars from favorites** — toggle favorite on car listings
- **Favorites list** — view all favorited cars on user profile

### 11. Admin Panel
**Access:** Admin-only route (email-based check: `admin@CarSharing.dev`)

#### Admin Dashboard
- **Metrics cards** — Total Users, Total Cars, Total Bookings, Total Revenue
- **Recent Activity feed** — latest 10 actions with type badge, description, timestamp

#### User Management
- **Users list** (paginated table) — name, email, join date, trip count, verified/banned status
- **Verify user** — mark user as ID-verified
- **Ban user** — ban a user from the platform
- **Unban user** — restore a banned user

#### Car Management
- **Pending cars list** — cars awaiting admin approval
- **Approve car** — make listing live
- **Reject car** — reject with reason
- **All cars list** — browse all cars across the platform

#### Booking Management
- **Bookings list** (paginated) — car, guest, dates, total, status

#### Dispute Resolution
- **Disputes list** — open disputes across bookings
- **Resolve dispute** — admin resolution action

### 12. Dashboard
- **Welcome banner** with first name
- **Stats cards** (4) — trips as guest, trips as host, guest rating, listed cars count
- **Three tabs:**
  - **My Trips** — guest bookings with car thumbnail, title, dates, status badge, total cost (links to booking detail)
  - **Host Bookings** — host bookings with guest name and payout amount
  - **My Cars** — listed cars with "List New Car" button, showing thumbnail, year/make/model, city, trips, rating, price

---

## Pages & UI Reference

### Route Map

| Route | Page | Access | Description |
| ----- | ---- | ------ | ----------- |
| `/` | Home | Public | Hero search, city cards, featured cars, CTA |
| `/login` | Login | Public | Email/password form, quick-login buttons |
| `/register` | Register | Public | Registration form (6 fields) |
| `/search` | Search | Public | Filter/sort/paginate car listings |
| `/cars/:id` | Car Detail | Public | Full car info + booking widget |
| `/dashboard` | Dashboard | Auth | User dashboard with trips/bookings/cars tabs |
| `/bookings/:id` | Booking Detail | Auth | Booking info + actions |
| `/messages` | Messages | Auth | Conversation list + chat |
| `/messages/:conversationId` | Messages | Auth | Direct link to a conversation |
| `/notifications` | Notifications | Auth | Notification list with read/unread |
| `/profile` | Profile | Auth | Edit profile + stats |
| `/host/cars/new` | Host New Car | Auth | Multi-section car listing form |
| `/admin` | Admin Panel | Admin | Metrics, users, bookings, disputes |

### Navigation

**Navbar (unauthenticated):** Logo → Home, Browse Cars → Search, Log In, Sign Up

**Navbar (authenticated):** Logo → Home, Browse Cars → Search, List Your Car → Host New Car, Notification Bell (with badge), Avatar Dropdown (Dashboard, Profile, Settings, Admin Panel*, Logout)

*Admin Panel link only visible for admin account

**Footer:** 4-column grid — Brand info, Explore links (Browse Cars, city links), Hosting links (List Your Car, Host Dashboard), Support links

### UI Component Library (shadcn/ui)

19 pre-built components: Alert, Avatar, Badge, Button, Card, Dialog, Dropdown Menu, Form, Input, Label, Pagination, Select, Separator, Sheet, Skeleton, Switch, Tabs, Textarea, Toast

---

## API Reference (66 Endpoints)

### Authentication — `AuthController` (8 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| POST | `/api/auth/register` | No | Register new user (firstName, lastName, email, dateOfBirth, password) |
| POST | `/api/auth/login` | No | Login → returns JWT token + sets refresh token cookie |
| POST | `/api/auth/refresh` | No | Refresh access token using refresh token cookie |
| POST | `/api/auth/logout` | Yes | Invalidate refresh token |
| POST | `/api/auth/forgot-password` | No | Send password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| GET | `/api/auth/verify-email` | No | Verify email with token from link |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Cars — `CarsController` (14 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/cars/search` | No | Search cars with filters (city, price range, body type, transmission, fuel type, sort, pagination) |
| GET | `/api/cars/featured` | No | Get featured car listings for homepage |
| GET | `/api/cars/{id}` | No | Get full car detail (specs, photos, features, host info, reviews) |
| POST | `/api/cars` | Yes | Create new car listing |
| PUT | `/api/cars/{id}` | Yes | Update car listing (owner only) |
| DELETE | `/api/cars/{id}` | Yes | Delete car listing (owner only) |
| POST | `/api/cars/{id}/publish` | Yes | Publish car listing |
| POST | `/api/cars/{id}/snooze` | Yes | Temporarily hide listing |
| POST | `/api/cars/{id}/unsnooze` | Yes | Restore snoozed listing |
| GET | `/api/cars/mine` | Yes | Get current user's car listings |
| POST | `/api/cars/{id}/photos` | Yes | Upload car photos (multipart) |
| PUT | `/api/cars/{id}/photos/{photoId}/cover` | Yes | Set a photo as the cover image |
| DELETE | `/api/cars/{id}/photos/{photoId}` | Yes | Delete a car photo |
| POST | `/api/cars/{id}/availability/block` | Yes | Block dates for a car |
| DELETE | `/api/cars/{id}/availability/unblock` | Yes | Remove date blocks |

### Bookings — `BookingsController` (10 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| POST | `/api/bookings/quote` | No | Get a price quote (daily rate × days, discounts, fees, taxes, total) |
| POST | `/api/bookings` | Yes | Create a booking |
| GET | `/api/bookings/{id}` | Yes | Get booking detail (pricing, participants, status) |
| GET | `/api/bookings/me` | Yes | List my bookings (role=guest\|host, paginated) |
| POST | `/api/bookings/{id}/approve` | Yes | Host approves booking |
| POST | `/api/bookings/{id}/reject` | Yes | Host rejects booking (with reason) |
| POST | `/api/bookings/{id}/cancel` | Yes | Cancel booking (with reason) |
| POST | `/api/bookings/{id}/check-in` | Yes | Host records check-in + odometer |
| POST | `/api/bookings/{id}/check-out` | Yes | Host records check-out + odometer |
| POST | `/api/bookings/{id}/dispute` | Yes | Open a dispute |

### Messages — `MessagesController` (3 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/messages/conversations` | Yes | List all conversations (with last message, unread count) |
| GET | `/api/messages/conversations/{id}` | Yes | Get messages in a conversation |
| POST | `/api/messages/conversations/{id}` | Yes | Send a message |

### Notifications — `NotificationsController` (4 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/notifications` | Yes | List all notifications |
| POST | `/api/notifications/{id}/read` | Yes | Mark one notification as read |
| GET | `/api/notifications/unread-count` | Yes | Get unread notification count |
| POST | `/api/notifications/read-all` | Yes | Mark all notifications as read |

### Reviews — `ReviewsController` (2 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| POST | `/api/reviews` | Yes | Create a review (rating 1-5, comment, bookingId) |
| GET | `/api/reviews` | No | Get reviews (by carId or userId query param) |

### Users — `UsersController` (11 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/users/{id}` | No | Get public user profile |
| PATCH | `/api/users/profile` | Yes | Update own profile (firstName, lastName, phone, bio) |
| POST | `/api/users/profile/photo` | Yes | Upload profile photo |
| POST | `/api/users/profile/license` | Yes | Upload driver's license |
| GET | `/api/users/earnings` | Yes | Get earnings history |
| GET | `/api/users/notifications` | Yes | Get notifications (alt route) |
| POST | `/api/users/notifications/{id}/read` | Yes | Mark notification read (alt route) |
| GET | `/api/users/favorites` | Yes | List favorite cars |
| POST | `/api/users/favorites/{carId}` | Yes | Add car to favorites |
| DELETE | `/api/users/favorites/{carId}` | Yes | Remove car from favorites |
| GET | `/api/users/favorites/{carId}/check` | Yes | Check if car is favorited |

### Admin — `AdminController` (12 endpoints)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/admin/metrics` | Admin | Dashboard metrics (users, cars, bookings, revenue) |
| GET | `/api/admin/cars/pending` | Admin | Cars awaiting approval |
| POST | `/api/admin/cars/{id}/approve` | Admin | Approve a car listing |
| POST | `/api/admin/cars/{id}/reject` | Admin | Reject a car listing with reason |
| GET | `/api/admin/users` | Admin | List all users (paginated) |
| POST | `/api/admin/users/{id}/ban` | Admin | Ban a user |
| POST | `/api/admin/users/{id}/unban` | Admin | Unban a user |
| POST | `/api/admin/users/{id}/verify` | Admin | Verify a user's identity |
| GET | `/api/admin/bookings` | Admin | List all bookings (paginated) |
| GET | `/api/admin/cars` | Admin | List all cars (paginated) |
| GET | `/api/admin/disputes` | Admin | List open disputes |
| POST | `/api/admin/disputes/{id}/resolve` | Admin | Resolve a dispute |

### Uploads — `UploadsController` (1 endpoint)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| POST | `/api/uploads` | Yes | Generic file upload (multipart) |

### Health — (1 endpoint)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/health` | No | Health check |

---

## Data Models

### Core Entities

| Entity | Key Fields | Description |
| ------ | ---------- | ----------- |
| **ApplicationUser** | firstName, lastName, email, dateOfBirth, phone, bio, photoUrl, licenseUrl, isVerified, isBanned | Extended ASP.NET Core Identity user |
| **Car** | make, model, year, bodyType, transmission, fuelType, seats, doors, color, dailyPrice, cleaningFee, weeklyDiscount, monthlyDiscount, securityDeposit, city, country, lat, lng, description, rules, isInstantBook, status, ownerId | Vehicle listing with pricing and location |
| **Booking** | carId, guestId, startDate, endDate, dailyRate, totalDays, discount, cleaningFee, serviceFee, taxes, totalPrice, hostPayout, securityDeposit, status, guestMessage, cancellationReason, checkInOdometer, checkOutOdometer | Rental reservation with full pricing |
| **Review** | bookingId, authorId, targetUserId, carId, rating (1-5), comment, authorRole, isPublished | Post-trip review |
| **Conversation** | carId, participants | Message thread for a car between two users |
| **Message** | conversationId, senderId, content, isRead, sentAt | Individual chat message |
| **Notification** | userId, type, title, body, linkUrl, isRead | User notification |
| **Availability** | carId, startDate, endDate, reason | Blocked dates on a car |
| **CarPhoto** | carId, url, isCover, sortOrder | Car listing photo |
| **Feature** | name, icon | Car feature (e.g., GPS, Bluetooth) |
| **CarFeature** | carId, featureId | Many-to-many join table |
| **FavoriteCar** | userId, carId | User's favorited cars |
| **RefreshToken** | userId, token, expiresAt, isRevoked | JWT refresh token |
| **PayoutRecord** | bookingId, hostId, amount, status, paidAt | Host payout tracking |

### Enums

| Enum | Values |
| ---- | ------ |
| **BodyType** | Sedan, SUV, Truck, Coupe, Convertible, Van, Hatchback, Wagon, Minivan, Other |
| **Transmission** | Automatic, Manual |
| **FuelType** | Gasoline, Diesel, Electric, Hybrid, PlugInHybrid |
| **CarStatus** | Draft, PendingApproval, Published, Snoozed, Rejected |
| **BookingStatus** | Pending, PendingApproval, Confirmed, InProgress, Completed, Cancelled, Rejected, Expired |
| **AvailabilityReason** | Maintenance, PersonalUse, Other |
| **ReviewAuthorRole** | Guest, Host |
| **NotificationType** | BookingRequest, BookingApproved, BookingRejected, BookingCancelled, BookingExpired, CheckIn, CheckOut, ReviewReceived, ReviewReminder, MessageReceived, DisputeOpened, DisputeResolved, PayoutSent |
| **PayoutStatus** | Pending, Processing, Completed, Failed |

---

## Background Jobs

Three Hangfire recurring jobs run automatically:

| Job | Schedule | Description |
| --- | -------- | ----------- |
| **BookingExpiryJob** | Every minute | Auto-cancels bookings in `Pending` status older than 24 hours → sets status to `Expired` |
| **PayoutJob** | Daily | Processes host payouts for completed bookings |
| **ReviewReminderJob** | Daily | Sends notification reminders to write reviews; auto-publishes reviews older than 14 days |

---

## Real-Time (SignalR)

### ChatHub (`/hubs/chat`)

| Method | Direction | Description |
| ------ | --------- | ----------- |
| `JoinConversation(conversationId)` | Client → Server | Join a conversation group to receive messages |
| `LeaveConversation(conversationId)` | Client → Server | Leave a conversation group |
| `SendMessage(conversationId, content)` | Client → Server | Send a message to a conversation |
| `MarkAsRead(conversationId)` | Client → Server | Mark all messages in conversation as read |
| `ReceiveMessage(message)` | Server → Client | New message pushed to all group members |

### AdminHub (`/hubs/admin`)

| Method | Direction | Description |
| ------ | --------- | ----------- |
| Auto-join | On connect | Admin users automatically join the "admin" group |
| Real-time events | Server → Client | Admin receives real-time activity updates |

---

## Security & Rate Limiting

### Authentication
- **JWT Bearer tokens** (HS256) with configurable expiry
- **Refresh tokens** stored in database with revocation support
- **HttpOnly cookies** for refresh token storage (prevents XSS access)
- Axios interceptor auto-refreshes expired tokens transparently

### Rate Limiting (3 tiers)

| Policy | Limit | Applied To |
| ------ | ----- | ---------- |
| `auth` | 5 requests/minute | Authentication endpoints (login, register, forgot-password) |
| `search` | 60 requests/minute | Search and listing endpoints |
| `default` | 120 requests/minute | All other endpoints |

### Security Headers
Custom middleware adds security headers to all responses (X-Content-Type-Options, X-Frame-Options, etc.)

### CORS
Configured for the frontend origin only.

### Authorization
- **Auth required** endpoints validated via JWT middleware
- **Owner checks** — users can only modify their own cars, bookings, profile
- **Admin-only** endpoints require admin role verification

---

## Seed Data

The database is automatically seeded on first run with:

| Data | Count | Details |
| ---- | ----- | ------- |
| **Users** | 23 | 1 admin + 1 host + 1 guest + 20 regular users |
| **Cars** | 40 | Spread across 6 cities (SF, LA, NY, Miami, Austin, Seattle) |
| **Features** | 16 | GPS, Bluetooth, USB, Backup Camera, Heated Seats, Sunroof, etc. |
| **Bookings** | 85+ | Various statuses across all lifecycle stages |
| **Reviews** | Multiple | Ratings and comments for completed bookings |
| **Conversations** | Multiple | Pre-existing message threads |
| **Notifications** | Multiple | Sample notifications for demo accounts |

---

## Environment Variables

Configured via `docker-compose.yml` environment sections:

### API Service

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=postgres;Database=CarSharing;...` |
| `ConnectionStrings__Redis` | Redis connection string | `redis:6379` |
| `Jwt__Key` | JWT signing key (HS256) | (set in compose) |
| `Jwt__Issuer` | JWT issuer | `CarSharing` |
| `Jwt__Audience` | JWT audience | `CarSharing` |
| `Jwt__ExpiryInMinutes` | Access token lifetime | `60` |
| `Email__SmtpHost` | SMTP server host | `mailhog` |
| `Email__SmtpPort` | SMTP server port | `1025` |
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | `Development` |

### PostgreSQL

| Variable | Default |
| -------- | ------- |
| `POSTGRES_DB` | `CarSharing` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |

---

## License

MIT
