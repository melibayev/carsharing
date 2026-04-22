# CarSharing — Messages Redesign Prompt

> You are updating the existing `/messages` page in the CarSharing codebase (React + Vite + TS + Tailwind, flat .NET 8 API, SignalR `ChatHub`). Do not touch auth, booking logic, car listings, or the admin panel. This prompt fixes three specific problems on the messaging surface. Slow is fine. Wrong is not. Three clean acceptance runs before declaring done.

---

## 0. What's Broken Today (From the Screenshot)

1. Every conversation preview uses a **car photo** as the person's avatar — that's wrong. The avatar should be the **person**, and the car lives in a separate row below the name.
2. The overall layout is flat and generic — no hierarchy, weak visual rhythm, the active thread is barely distinguished, the empty right column has no presence, message bubbles feel unbalanced, and the list item padding is inconsistent.
3. When a user books a car, **nothing is sent into the chat automatically**. The guest and host should see a "Booking card" message inline in their conversation summarizing the trip and linking through to the booking detail — just like WhatsApp's shared-location card or Airbnb's trip card.

This prompt fixes all three.

---

## 1. Ground Rules

1. Zero emoji in any UI string. Lucide icons only.
2. No gradients, bouncy springs, pastel blobs, mascots, cringe stickers.
3. English only.
4. Typography and color tokens are exactly the ones locked in Phase 3/5. Do not invent new brand colors here. The accent (burnt sienna `#C2410C`) is used *extremely* sparingly — only on the send button's filled state, unread dots, and the Booking badge's subtle background. Nothing else should be orange.
5. Radii: `rounded-lg` default, `rounded-xl` for cards, `rounded-full` for avatars only.
6. Motion: 120ms fade + 6px slide when a new message arrives. Nothing else animates.
7. Test before commit. `docker compose down -v && docker compose up --build` must produce a flawless first run every time.

---

## 2. Avatar Rule — Person First, Car Second

Replace the car thumbnail everywhere the **counterparty** should be shown.

### 2.1 `<UserAvatar />` component

New component at `src/components/shared/UserAvatar.tsx`. Props: `{ name: string, photoUrl?: string, size?: 32 | 40 | 48 | 56 }`.

Behavior:

- If `photoUrl` is present, render it inside a circular `<img>` with `object-cover`.
- If no `photoUrl`, render a circle with **initials from the first letter of first name + first letter of last name** (e.g. "Jasur Rasulov" → `JR`). If only a single word is available, use the first two letters uppercase.
- Background color is **deterministic from the name hash** — a simple `hashCode(name) % palette.length` picks from a neutral palette of 8 colors (all muted, no neon): slate-600, stone-600, zinc-600, neutral-600, gray-700, sky-800, emerald-800, amber-800. The text on top is always white. This creates a visually varied inbox without looking random or childish.
- Border: `ring-1 ring-border` (so it sits cleanly on any background).
- Never wrap an avatar in `<a>` — let parents handle click.

Replace every place in the codebase that currently uses a car image for a user with `<UserAvatar />`. Grep for `user.photoUrl`, `avatarUrl`, `AvatarImage`, and any car-thumbnail-as-avatar pattern.

### 2.2 Don't delete car thumbnails — relocate them

Cars still appear in the conversation list and chat header, but **as a small secondary row below the name**, not as the avatar. See §3.

---

## 3. Redesigned Messages Page Layout

### 3.1 Grid

Desktop:
┌──────────────────────────────────┬─────────────────────────────────────────────────┐
│  Left sidebar (360px, fixed)    │  Right pane (flex-1)                              │
│  - Inbox header + search        │  - Thread header (car + counterparty + booking)   │
│  - Conversation list            │  - Messages area (scrollable)                     │
│                                 │  - Composer (sticky bottom)                       │
└──────────────────────────────────┴─────────────────────────────────────────────────┘

Mobile (< 768px): single column. The conversation list is the full viewport; tapping a row pushes into the thread view. A back-arrow in the thread header returns.

No vertical scrollbars on the outer page. The page occupies `calc(100vh - navbarHeight)` and each column scrolls independently. Composer is always visible above the keyboard on mobile.

### 3.2 Left sidebar — inbox

**Header section** (`px-6 pt-6 pb-4 border-b border-border`):

- Line 1: `h1` "Messages" at `text-xl font-medium`.
- Line 2: muted count: "4 conversations" at `text-sm text-ink-muted`.
- Line 3: a search input (`<Input leftIcon={<Search size={16} />} placeholder="Search messages" />`). Full width. Filters the list live by counterparty name or car make/model.

**Conversation list** — scrollable `<ul>`. Each `<li>` is:
┌─────────────────────────────────────────────────┐
│  [Avatar 48px]  Jasur                   Mar 5   │
│                 Car 2024 Kia K5        ● unread │
│                 "Mashina bilan zaryadlash k..." │
└─────────────────────────────────────────────────┘

Layout: `flex items-start gap-3 px-4 py-3`. Hover: `bg-surface-muted`. Active (selected) thread: `bg-surface-muted` + a 2px `border-l-ink` left indicator (flat, not glowing).

Within the right side of the row:

- **Line 1** — `{counterpartyFirstName}` at `text-sm font-medium text-ink`. Timestamp right-aligned in `text-xs text-ink-muted`. Timestamp format: "Apr 12" if this year, "9:42 AM" if today, "Mar 5 · 2024" if prior year.
- **Line 2** — a small car chip: `<Car size={12} />` icon + `{year} {make} {model}` at `text-xs text-ink-muted`. Max 1 line, `truncate`.
- **Line 3** — last message preview at `text-sm text-ink-muted truncate`. If the last message is a **BookingCard** (see §4), render the text as `"Sent a booking — {dates}"` with the car icon swapped for a `CalendarCheck` icon.
- **Unread indicator** — if `unreadCount > 0`, replace the timestamp text color with `text-accent` and show a solid **accent-colored dot** (6px) to the far right of line 3. No numeric badge is needed unless the count is > 1 (then a small pill with the count).

No emoji. No car photos in this column.

### 3.3 Right pane — thread

**Thread header** (`px-6 py-4 border-b border-border`):

Three elements in a row:

- **Left**: `<UserAvatar size={40} />` + two lines of text:
  - Line 1: `{counterparty.fullName}` at `text-base font-medium`.
  - Line 2: the car chip — small car thumbnail (40×28, `rounded-md object-cover`) + `{year} {make} {model}` + city. At `text-xs text-ink-muted`.
- **Right**: A **Booking** button (secondary outline button) with `Calendar` icon + text "View booking". This only appears if the conversation is tied to an active booking. Clicking navigates to `/bookings/{bookingId}` (guest view) or `/host/bookings/{bookingId}` (host view) — route by caller role.

Remove the duplicated "2024 Kia K5" card that appears twice in the current screenshot. There should be one thread header, period.

**Messages area** — the big scrollable middle section:

- Padding `px-6 py-6`, `overflow-y-auto`.
- **Day dividers**: a horizontal line with the date centered on it (`"Thursday, March 5"`). Uses the user's locale, date computed from UTC and converted to local tz at render time. Only shown when the day changes between adjacent messages.
- **Message groups**: consecutive messages from the same sender within 5 minutes are visually grouped (single avatar shown next to the first bubble, subsequent bubbles in the group indent to align but show no avatar). Timestamp appears under the *last* bubble in the group, not under every message.
- **Bubbles**:
  - Own messages: align right, `bg-primary text-primary-fg` (near-black bubble), `rounded-2xl rounded-br-md` (tail corner). Max width 520px or `70%` whichever is smaller.
  - Counterparty messages: align left, `bg-surface-muted text-ink`, `rounded-2xl rounded-bl-md`.
  - Padding `px-4 py-2.5`. `text-sm leading-[1.55]`. Preserve line breaks via `whitespace-pre-wrap`.
  - No shadow, no border on bubbles.
- **Read receipts** — tiny `CheckCheck` icon at the bottom-right corner of the last own message in a group. Color `text-ink-muted` when sent, `text-accent` when read by the other side.
- **Timestamp** — `text-xs text-ink-muted` under the last bubble of a group. Format: "12:49 PM" for today, "Mar 5, 12:49 PM" otherwise.
- **Empty state** — when a conversation has zero messages: centered in the pane, a neutral illustration (just a `MessageSquare` icon at 48px inside a gray circle), heading "No messages yet", subtext "Say hi to {firstName} — they usually reply within a few hours."
- **New-message animation** — new bubbles fade in + slide 6px on arrival (Framer Motion `AnimatePresence`). 120ms ease-out. Nothing else animates.

**Composer** — sticky bottom:

- `px-6 py-4 border-t border-border bg-surface`.
- A single-row layout: `<Textarea />` that auto-grows up to 6 lines, then scrolls internally. Placeholder: "Write a message". Below the textarea, a one-line helper in `text-xs text-ink-muted`: "Enter to send · Shift+Enter for a new line". **No orange box around the composer. No neon outline.** Standard border, focus ring is a subtle 2px `ring-ink/20`.
- Right side: a filled **primary send button** — square, 36×36, `rounded-lg`, `<Send size={16} />` icon, disabled state is `bg-surface-muted text-ink-muted`, enabled state is `bg-primary text-primary-fg`.
- Attach button (left of textarea, ghost): `<Paperclip size={16} />`. For now, attach opens a file picker that uploads images only through the existing upload endpoint and inserts an `<img>` attachment message. Don't build a full attachment subsystem — just photos.
- Show a small ink-muted line under the composer when messages are end-to-end server-logged: "Messages are private between you and {firstName}." **Remove the previous "encrypted" line** — it's misleading, we are not doing E2E encryption.

### 3.4 Empty state for the entire page

When the user has zero conversations:

- Full right pane is replaced with a centered card: neutral `MessageSquare` icon, heading "Your inbox is empty", subtext "Message a host by opening a car listing and tapping 'Contact host'."
- The left sidebar shows the header and search, then an empty-state placeholder list.

### 3.5 Design rules you do not violate

- No colored backgrounds on the composer input. The orange outline in the current screenshot is a regression from the design tokens. Remove it.
- No double-nested headers (the screenshot shows two "2024 Kia K5" blocks stacked). There is **one** thread header. Period.
- Message list never shows car thumbnails larger than 40×28px. The person is the hero, the car is context.
- Never use emoji for the "No messages yet" state. Use `MessageSquare` from Lucide.
- On mobile, the composer rises above the on-screen keyboard using `env(keyboard-inset-height)` via CSS `dvh` units — set the outer container to `h-[100dvh]`.

---

## 4. BookingCard Message — The Auto-Sent Booking Summary

When a booking is created, a special message type called **BookingCard** is posted into the conversation between guest and host. This message is never sent by a human — it's a system message created atomically with the booking.

### 4.1 Schema changes

Extend the existing `Message` entity:

```csharp
public enum MessageType { Text, Image, BookingCard }
public MessageType Type { get; set; } = MessageType.Text;
public Guid? BookingId { get; set; } // set when Type == BookingCard
public string? AttachmentUrl { get; set; } // set when Type == Image
```

Migration adds these columns. Existing messages default to `Text`.

### 4.2 Backend behavior

In `BookingService.CreateAsync`, after the `Booking` row is created (inside the same transaction):

1. Find or create the `Conversation` for `(guestId, hostId, carId)` — lookup key is `bookingId` going forward, but conversations persist per (host, guest, car) pair across multiple bookings so history is preserved.
2. Insert a new `Message` with `Type = BookingCard`, `SenderId = SystemUserId` (a seeded system user), `BookingId = booking.Id`, `Body = null`.
3. Broadcast via `ChatHub.Clients.Users([guestId, hostId]).SendAsync("MessageReceived", messageDto)`.
4. Add a notification to both parties' inboxes.

Cancellation, approval, and rejection also insert BookingCard-style system messages — but as a separate type called `BookingUpdate` with a `status` field. Scope for this prompt: implement only `BookingCard` on creation. Status updates come later.

### 4.3 Frontend rendering — the card bubble

Replace the regular bubble for `Type === 'BookingCard'` with a `<BookingMessageCard />` component.

Visual spec (mobile-first, scales up):

- Width: `min(320px, 100%)` on mobile, `min(360px, 70%)` on desktop. **Do not** use fixed `150×300` — that's too narrow; the content requires more horizontal room. 320–360px wide with flexible height is the sweet spot (this is what Airbnb/Turo use for trip cards in chat).
- Container: `rounded-2xl border border-border bg-surface overflow-hidden shadow-sm`. Own-sent vs received variants both use the same light surface — this card is visually **neutral** to signal "this is system-generated content inside the conversation," not a personal message. A small tag on top reads "Booking" in `text-[11px] uppercase tracking-wide text-ink-muted`.
- Top section (car image): aspect `16/10`, `object-cover`, pulls the car's cover photo. If none, the initials-style fallback is a matte surface-muted rectangle with a `Car` icon centered.
- Body section (`px-4 py-3`):
  - Line 1 — car title: `{year} {make} {model}` at `text-sm font-medium text-ink`, `truncate`.
  - Line 2 — metadata row (icons at 14px, `text-xs text-ink-muted`, `flex gap-3`):
    - `<MapPin />` City (e.g. "Samarkand")
    - `<Users />` Seats
    - `<Fuel />` Fuel type
  - Divider `border-t border-border my-3`.
  - Line 3 — dates row: `<Calendar size={14} />` + `"{fmt(startUtc)} → {fmt(endUtc)}"` + `text-xs text-ink-muted` parenthetical for day count: `"(3 days)"`.
  - Line 4 — price: `Total` label on the left in `text-xs text-ink-muted`, amount on the right in `text-sm font-medium text-ink` using `JetBrains Mono` for numbers. Format: `2 400 000 so'm`.
  - Line 5 — status pill on the left: `Pending approval` / `Confirmed` / etc., using the same badge component and color tokens as on the booking detail page.
- Bottom section — a **single primary outline button** spanning full width: `<Button variant="outline" size="md" className="w-full justify-between">`. Text on the left: "View booking", icon on the right: `ArrowRight` 16px. Clicking routes:
  - Guest → `/bookings/{bookingId}`
  - Host → `/host/bookings/{bookingId}`
  - Admin (who can't send/receive these, but for completeness if reading a thread): `/admin/bookings/{bookingId}`.

The card is clickable as a whole — hovering raises it subtly (`hover:border-border-strong transition`). Pressing the button inside stops propagation.

### 4.4 What the preview looks like in the conversation list

When a conversation's last message is a `BookingCard`, the list preview in the left sidebar reads:

- Line 3 preview text: `"Sent a booking · {fmt(startUtc)} – {fmt(endUtc)}"` with a `CalendarCheck` icon prefix (instead of the usual text preview).

### 4.5 Booking-detail linking the other way

On the booking detail page (`/bookings/:id` and `/host/bookings/:id`), add a secondary button **Open conversation** next to "View booking" that deep-links to `/messages?bookingId={id}` and scrolls to the BookingCard message for that booking. This closes the loop: chat → booking, and booking → chat.

### 4.6 System user

Seed a single user row with ID `00000000-0000-0000-0000-000000000001`, email `system@carsharing.internal`, role `System`, cannot log in (password hash invalid), `FirstName = "CarSharing"`, `LastName = "System"`, `IsSystemUser = true` (new bool column, migration).

Messages from the system user are never rendered with an avatar on the left. They're rendered as centered cards (BookingCard). Regular text messages from System would be rendered centered with a subtle surface-muted pill — but we don't send any text messages from System in this prompt.

---

## 5. SignalR `ChatHub` — Small Updates

No breaking changes. The DTO returned on `MessageReceived` now includes:

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "senderName": "Jasur Rasulov",
  "senderPhotoUrl": null,
  "type": "Text" | "Image" | "BookingCard",
  "body": "string | null",
  "attachmentUrl": "string | null",
  "bookingPreview": null | {
    "bookingId": "uuid",
    "carTitle": "2024 Kia K5",
    "carPhotoUrl": "https://...",
    "city": "Samarkand",
    "seats": 5,
    "fuel": "Gasoline",
    "startUtc": "2026-05-01T09:00:00Z",
    "endUtc": "2026-05-04T09:00:00Z",
    "totalUzs": 2400000,
    "status": "PendingApproval"
  },
  "sentAt": "2026-04-21T12:49:33Z",
  "readAt": null
}
```

`bookingPreview` is denormalized server-side on insert so the client doesn't need a second roundtrip to render the card. If the booking is later edited (price changes, dates shift), the card does **not** auto-update — it's a snapshot of the moment the booking was created, like Airbnb's pattern. Later status changes land as new `BookingUpdate` messages (out of scope for this prompt).

---

## 6. Seed Data Additions

To demonstrate the new UX, the seeder must produce:

- At least **5 conversations** per seeded user, across different counterparties. Mix of read/unread.
- At least **3 conversations** that include a `BookingCard` message from the last 30 days so the inbox list shows the new preview style.
- At least **1 conversation** with zero messages so the empty state is visible.
- At least **1 counterparty** without a profile photo so the initial-letter avatar is demonstrated.
- Realistic text messages in Uzbek and English mixed (keep the `Zo'r, kutib turaman!` flavor from the current seed — it's good).

---

## 7. Accessibility & Mobile

- Every message row is keyboard-reachable. The conversation list is a proper `<ul role="list">` with `<li>` + focusable `<a>` or `<button>`.
- Focus ring on the active thread indicator uses a 2px ring, visible in light and dark modes.
- Composer `<textarea>` has `aria-label="Type a message"`.
- BookingCard is a single `<article>` with a heading representing the car and an accessible link "View booking".
- Mobile composer never covers the last message — add `pb-[env(safe-area-inset-bottom)]`.
- Long car titles truncate in the sidebar but show full on hover via `title` attribute.
- Color contrast of own-bubble white text on near-black `#0A0A0A` passes AA at 14px (it does).

---

## 8. Acceptance Checklist — Three Clean Runs Before Done

1. `docker compose down -v && docker compose up --build` boots. Banner prints seeded accounts.
2. Log in as the seeded guest. Go to `/messages`. Sidebar shows conversations with **person avatars** (initials or photo), not car photos. Verify at least one initial-letter avatar appears (no photo user).
3. Click a conversation. Thread header shows person avatar + person name on line 1, car chip on line 2. **No duplicate car block** appears below the header like in the old screenshot.
4. Send a text message. Bubble aligns right, near-black background, read receipt renders as expected.
5. In a second browser, log in as the host of that same conversation. The message arrives in real time (SignalR). Bubble aligns left.
6. Create a new booking as the guest on any car whose host also has a seeded account. Check `/messages`: a new `BookingCard` message appears at the bottom of the conversation between guest and host automatically — no manual step.
7. The BookingCard shows the car photo, title, metadata row (city/seats/fuel), date range with day count, total price in UZS with monospaced digits, status pill, and the full-width **View booking** outline button.
8. Click "View booking" as the guest → lands on `/bookings/{id}`. Click "Open conversation" there → lands back on `/messages?bookingId={id}` with the exact card scrolled into view.
9. Click "View booking" as the host → lands on `/host/bookings/{id}`.
10. Sidebar preview for that conversation now reads `"Sent a booking · May 1 – May 4"` with a calendar icon, not the previous text preview.
11. Composer: Shift+Enter inserts newline, Enter sends. The helper line below reads "Enter to send · Shift+Enter for a new line". No orange outline around the composer.
12. Empty conversation shows the "No messages yet" state with `MessageSquare` icon, no emoji.
13. Responsive pass at 375px: sidebar takes the full viewport, tapping a conversation pushes into the thread, back arrow returns. Composer stays above the virtual keyboard.
14. Dark mode: every component has correct contrast — bubbles, card surfaces, avatar rings, focus rings, BookingCard, empty state illustration.
15. Keyboard pass: Tab moves through sidebar → thread → composer in order. Active thread has a visible 2px ring.
16. axe-core zero serious issues on `/messages`.
17. `npm run test` and `dotnet test` both green.
18. `docker compose down && docker compose up` (no -v): conversations persist, BookingCards still render correctly.

Three clean runs → commit. Capture 5 screenshots (inbox with person avatars, thread with new header, BookingCard in thread, mobile view at 375px, dark mode). Save to `/docs/screenshots/messages/`. Write `/docs/MESSAGES_DONE.md`.

---

## 9. Execution Order

1. Migration: add `MessageType`, `BookingId`, `AttachmentUrl` to `Message`; add `IsSystemUser` to `ApplicationUser`; seed the System user. Commit.
2. Backend: update `BookingService.CreateAsync` to emit a `BookingCard` message in the same transaction. Denormalize `bookingPreview`. Tests. Commit.
3. Backend: extend ChatHub DTO with `type`, `bookingPreview`, `attachmentUrl`. Tests. Commit.
4. Backend: extend seeder with the conversation mix described in §6. Commit.
5. Frontend: `<UserAvatar />` component with initials fallback + deterministic palette. Grep-replace every car-as-avatar usage. Commit.
6. Frontend: rewrite `/messages` page grid (sidebar + thread + composer chrome). Remove the orange composer outline. Commit.
7. Frontend: conversation list item with name on line 1, car chip on line 2, preview on line 3, unread dot logic. Commit.
8. Frontend: thread header (one, not two) + "View booking" button. Commit.
9. Frontend: message bubbles — grouping, tails, read receipts, day dividers, timestamps. Commit.
10. Frontend: `<BookingMessageCard />` component. Wire the `ArrowRight` CTA to guest/host/admin routes based on role. Commit.
11. Frontend: sidebar preview renders `"Sent a booking · {dates}"` for `BookingCard`-type last messages. Commit.
12. Frontend: "Open conversation" button on booking detail pages that deep-links to the card. Commit.
13. Empty state, mobile pass at 375px (including `dvh` composer behavior), dark-mode pass. Commit.
14. Accessibility pass (axe, keyboard). Commit.
15. Run §8 acceptance checklist. Repeat until three clean runs. Write `/docs/MESSAGES_DONE.md`.

Do not skip ahead. Commit after each step. Test before you trust. Three clean runs before you declare done.