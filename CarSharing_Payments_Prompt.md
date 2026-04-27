# CarSharing — Payment System Prompt

> You are adding the payment surface to the existing CarSharing codebase (React + Vite + TS + Tailwind, flat .NET 8 API, PostgreSQL, MailKit + Mailhog, Cloudinary, SignalR). Do not touch unrelated surfaces — host onboarding, messaging, search, admin. This prompt covers everything that happens after a guest clicks **Book** on a car detail page: a dedicated checkout page, three payment methods (account balance + cards + "coming soon" tabs for Payme and Click), Twilio SMS verification when adding a card, an account-balance top-up flow, and an emailed PDF receipt on success. **No real money moves.** This is a faithful simulation that swaps to a real provider in one file later. Slow is fine. Wrong is not. Three clean acceptance runs before declaring done.

---

## 0. Ground Rules (Non-Negotiable)

1. **Zero real money.** Every "charge" is a stubbed `FakePaymentService` call. Every "SMS" goes through Twilio's real API but in a sandbox/trial number. Every "card" stored is a fake `pm_xxx` reference. Add a small banner at the top of the checkout page in dev: *"Demo mode — no real charge will be made."* In production builds, the banner reads *"Beta — payments are simulated."*
2. **No sensitive data ever stored or logged.** Full PAN never touches the server (we tokenize client-side into a fake token, then send only the token). CVV never persisted, never logged. Last 4, brand, and expiry month/year are the only card details ever stored.
3. **No emoji anywhere.** Lucide icons only.
4. **English only.** No i18n.
5. **TypeScript strict.** Nullable reference types on in C#.
6. **Money is `decimal(18,2)` UZS** in the DB. On the wire, UZS as integer minor units (so'm × 100). On the UI, format as `2 400 000 so'm` with `Intl.NumberFormat('uz-UZ')`.
7. **Server is the source of truth for every amount.** Client never computes a price or a fee — it only displays what the server returns from `POST /api/bookings/quote`.
8. **The 6-digit SMS code is treated exactly like the email-verification code from the previous phase**: hashed with SHA-256, never logged, scrubbed from log output via the existing Serilog filter, timing-safe comparison on verify.
9. **No `console.log`, no `TODO`, no commented-out code in the final commit.**
10. **Test before commit.** `docker compose down -v && docker compose up --build` produces a flawless first run every time.

---

## 1. Mental Model — How the Money Moves (or Pretends To)

Three things happen during checkout:

1. **Authorization** — we "hold" the booking total against the chosen payment method. For card, we tokenize and call `FakePaymentService.AuthorizeAsync`. For balance, we lock the funds inside a transaction.
2. **Confirmation** — when the host approves the booking (or instantly if `IsInstantBook`), we "capture" the held amount. Funds move from the guest's payment instrument to the platform's escrow.
3. **Payout** — when the trip completes, the platform pays the host minus the 15% service fee. Already stubbed in earlier phases. Out of scope for this prompt.

Refunds (cancellation): we "release" the held amount according to the existing refund tier logic (>7 days = full, 1–7 days = 50%, <24h = 0%).

The **AccountBalance** is a real ledger on our side. Every credit and debit is a journal entry. Top-up is a "card → balance" transfer. Spending the balance is a "balance → escrow" transfer. We never lose track of where money is — even though no real money exists.

---

## 2. Domain Model

Add these tables via migration. All amounts are `decimal(18,2)` UZS.

### 2.1 `AccountBalance` (one row per user, lazy-created on first use)
Id                Guid
UserId            Guid (unique, FK → ApplicationUser)
AvailableUzs      decimal(18,2)   // free to spend
LockedUzs         decimal(18,2)   // held for in-flight bookings
Version           uint            // optimistic concurrency token
UpdatedAt         DateTimeOffset

`Total = Available + Locked`. The UI shows `Available` as the headline number and reveals `Locked` in a tooltip/expandable row.

### 2.2 `LedgerEntry` (immutable journal — append-only)
Id                Guid
UserId            Guid
Direction         enum: Credit | Debit
Type              enum: TopUp | BookingHold | BookingHoldRelease | BookingCapture
| RefundCredit | PayoutDebit | AdjustmentCredit | AdjustmentDebit
AmountUzs         decimal(18,2)   // always positive; Direction tells the sign
BalanceAfterUzs   decimal(18,2)   // available balance after this entry
RelatedBookingId  Guid?
RelatedPaymentId  Guid?
Description       string (max 200)
CreatedAt         DateTimeOffset
CreatedByUserId   Guid?           // for admin adjustments

**Never update or delete a `LedgerEntry`.** Reversals are new entries with the inverse type. The current `AccountBalance` is the running sum. A nightly Hangfire job (`LedgerReconcileJob`) recomputes balance from the ledger and alerts admins on any mismatch — defense in depth against bugs.

### 2.3 `PaymentMethod` (already exists from host phase; extend if needed)
Id                  Guid
UserId              Guid
Type                enum: VisaMasterCard | UzcardCard | HumoCard | Payme | Click | BankAccount
Brand               string          // "Visa", "Mastercard", "Uzcard", "Humo"
Last4               string
ExpMonth            int             // 1–12
ExpYear             int             // 4-digit
CardholderName      string          // uppercase Latin
ProviderToken       string          // encrypted via IDataProtector — fake token "pm_fake_xxx"
PhoneVerifiedAt     DateTimeOffset? // when the SMS verification succeeded
IsDefault           bool
CreatedAt           DateTimeOffset
DeletedAt           DateTimeOffset? // soft delete

Constraint: a user can have at most **5 active card payment methods**. Hard 409 on attempting to add a 6th.

### 2.4 `Payment`
Id                Guid
BookingId         Guid (unique)
UserId            Guid
Method            enum: AccountBalance | Card     // never Payme/Click in this phase
PaymentMethodId   Guid?                            // null when Method == AccountBalance
AmountUzs         decimal(18,2)
Status            enum: Pending | Authorized | Captured | Failed | Refunded | PartiallyRefunded
ProviderRef       string?                          // "pi_fake_xxx" when Card
FailureReason     string?
AuthorizedAt      DateTimeOffset?
CapturedAt        DateTimeOffset?
RefundedAt        DateTimeOffset?
RefundedAmountUzs decimal(18,2)
CreatedAt         DateTimeOffset
UpdatedAt         DateTimeOffset

### 2.5 `PaymentSmsChallenge` (mirror of EmailVerificationCode)
Id              Guid
UserId          Guid
PurposeKey      string          // "add-card:{paymentMethodPendingId}" or "topup:{intentId}"
CodeHash        string          // SHA-256
ExpiresAt       DateTimeOffset
ConsumedAt      DateTimeOffset?
AttemptCount    int
IpAddress       string?
UserAgent       string?
CreatedAt       DateTimeOffset

Same lifecycle rules as the email code: 6 digits, 5-minute expiry, max 5 wrong attempts per code, max 1 send per 60 seconds, max 5 sends per 24 hours per user, max 30 sends per IP per hour. Timing-safe hash compare. No plaintext anywhere.

### 2.6 `Receipt`
Id              Guid
BookingId       Guid (unique)
PaymentId       Guid
ReceiptNumber   string          // "CS-2026-000142" — incrementing per year
PdfUrl          string          // signed Cloudinary URL, 1-hour expiry on retrieval
EmailedAt       DateTimeOffset?
TotalUzs        decimal(18,2)
GeneratedAt     DateTimeOffset

---

## 3. Backend Endpoints

All under `/api/v1`. All require auth except where noted. RFC 7807 ProblemDetails on errors. Existing rate-limit policies extended.

### 3.1 Balance

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/balance` | Returns `{availableUzs, lockedUzs, version}` |
| GET | `/api/balance/ledger?page=1&pageSize=20` | Paginated ledger entries, newest first |
| POST | `/api/balance/topup/intent` | Body: `{amountUzs, paymentMethodId}`. Returns `{intentId, smsRequired, expiresAt}`. Caps: min 50,000 UZS, max 50,000,000 UZS per top-up; max 5 top-ups per user per day. |
| POST | `/api/balance/topup/confirm` | Body: `{intentId, smsCode}`. On success, credits balance and writes `TopUp` ledger entry. |

### 3.2 Payment methods

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/payment-methods` | List user's active methods |
| POST | `/api/payment-methods/intent` | Body: `{type, cardNumber, expMonth, expYear, cvv, cardholderName}`. Tokenizes (in `FakePaymentService`), stores a *pending* method, issues SMS code, returns `{pendingId, smsExpiresAt, last4, brand}`. |
| POST | `/api/payment-methods/confirm` | Body: `{pendingId, smsCode}`. Promotes pending method → active, sets `PhoneVerifiedAt`. |
| POST | `/api/payment-methods/resend-sms` | Body: `{pendingId}`. Reissues the SMS code with the standard cooldown. |
| POST | `/api/payment-methods/{id}/default` | Marks default. |
| DELETE | `/api/payment-methods/{id}` | Soft-delete. Refuses if any in-flight payment references it. |

**Critical**: full card number, CVV, and `cardholderName` exist in memory only long enough to call `FakePaymentService.TokenizeAsync`. Then the variables are zeroed. None of these are ever passed to the DB layer or any logger.

### 3.3 Booking checkout

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/bookings/{id}/checkout` | Returns `{booking, priceBreakdown, balance, paymentMethods, recommendedMethodId, lockExpiresAt}`. The lock is a 10-minute hold on the dates so two guests can't race the same car. |
| POST | `/api/bookings/{id}/pay` | Body: `{method: "AccountBalance" \| "Card", paymentMethodId?: Guid}`. Creates a `Payment` row, calls `FakePaymentService.AuthorizeAsync`, locks the funds (balance) or creates a card hold. Returns `{paymentId, status, bookingStatus}`. |

The `pay` endpoint is the **single transactional boundary**: either everything succeeds (Payment row + LedgerEntry + Booking moves to `PendingApproval` or `Confirmed` for instant book) or nothing changes. Wrap in `IDbContextTransaction`.

### 3.4 Receipts

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/receipts/{id}` | Returns receipt metadata + signed PDF URL (1-hour expiry) |
| POST | `/api/receipts/{id}/email` | Re-emails the receipt. Rate-limited 3/day/user. |

### 3.5 Refunds (called by existing cancellation logic)

`IPaymentService.RefundAsync(paymentId, amountUzs)` runs inside the cancellation transaction. Writes `RefundCredit` ledger entry if the user paid via balance, otherwise calls `FakePaymentService.RefundAsync` and updates the `Payment` row. Cancellation flow already exists — this prompt just wires the refund path correctly.

---

## 4. Twilio SMS Integration

### 4.1 Configuration

Add to `.env.example`:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_PHONE=        # e.g. "+998..." or a Twilio test number
TWILIO_ENABLED=true       # set false in CI; the service then writes "would have sent: {code}" to a dev-only file

### 4.2 `ITwilioSmsService`

```csharp
public interface ITwilioSmsService
{
    Task<SmsResult> SendVerificationCodeAsync(string phoneE164, string code, CancellationToken ct);
}
```

Implementation uses the official `Twilio` NuGet package. Message body: `"Your CarSharing verification code is {code}. Valid for 5 minutes. Don't share it with anyone."`.

When `TWILIO_ENABLED=false` (CI, local dev without a Twilio account), a `LocalSmsService` writes the line `[DEV SMS] to {phone}: {code}` to a file at `/app/dev-sms.log` mounted from the host as `./logs/dev-sms.log`. **This file is gitignored.** This lets you develop and test the full flow without spending Twilio credits or exposing real phone numbers.

### 4.3 Phone format

Phones are stored on `ApplicationUser` in **E.164** format (`+998901234567`). The `react-phone-number-input` already in the codebase produces this format. The SMS service rejects any non-E.164 input.

### 4.4 Logging

Twilio responses log only `{messageSid, status}`. The phone number is partially masked in logs as `+998 **** **567` (mask middle digits). The code is never logged anywhere — same Serilog scrubber from the email-verification phase masks any 6-digit sequence in any log property.

### 4.5 Error mapping

Twilio errors map to user-friendly messages:

- `21211` (invalid phone) → "Your phone number on file looks invalid. Please update your profile."
- `21610` (number opted out) → "This number stopped receiving messages from us. Contact support."
- `21408` (permission denied / unverified trial number) → in dev only, this is expected; show "SMS sending is not configured. Check the dev-sms.log file."
- `4xx/5xx generic` → "We couldn't send the code right now. Please try again."

---

## 5. Frontend — Checkout Page (`/bookings/:bookingId/checkout`)

Single page, two columns on desktop, stacked on mobile. The user lands here when they click **Book** on a car detail page (or **Reserve** anywhere else). The booking is already created server-side in `Pending` state with a 10-minute hold.

### 5.1 Layout
┌─────────────────────────────────────┬─────────────────────────────┐
│ LEFT: payment selection (60%)      │ RIGHT: order summary (40%)  │
│                                     │ sticky on desktop           │
│  - Demo banner                      │  - Trip card                │
│  - Payment method tabs              │  - Price breakdown          │
│    - Account balance                │  - Total                    │
│    - Cards                          │  - "Pay 2 400 000 so'm"     │
│    - Payme   [Coming soon]          │    primary button           │
│    - Click   [Coming soon]          │  - Lock expires in 9:42     │
│  - Selected method's panel          │                             │
│  - Cancellation policy              │                             │
└─────────────────────────────────────┴─────────────────────────────┘

Mobile: right column slides under as a sticky bottom sheet showing total + button. Tapping the sheet expands the price breakdown.

### 5.2 The header

- Breadcrumb: `Cars / {make} {model} / Checkout`.
- H1: `Confirm and pay` at `text-2xl font-medium`.
- Subtle line under: `Booking #{shortId} · Lock expires in 9:42` — countdown updates every second. At 0:00, the page shows a modal "Your hold has expired. Please start over." with a button back to the car page.

### 5.3 Demo banner

Top of the left column, above the tabs:
┌──────────────────────────────────────────────────────────────┐
│  Demo mode — no real charge will be made.                    │
│  This is a working simulation. Cards entered are not saved   │
│  with any real card network.                                 │
└──────────────────────────────────────────────────────────────┘

Style: `bg-surface-muted border border-border rounded-lg px-4 py-3 text-sm text-ink-muted`. Lucide `Info` icon at left. **Do not** make this an alarming yellow banner — it's calm, neutral, professional. Remove it entirely in production builds via env flag.

### 5.4 Payment method tabs

Horizontal tab strip, 4 tabs. Tabs that are not yet wired show a small `Coming soon` chip.

**Tab 1 — Account balance**

Inside the tab panel:

- Big balance display: `Available: 1 250 000 so'm` with the locked amount expandable below in a collapsible row (`+ 350 000 so'm held for 2 trips`).
- If `available >= total`: shows "You have enough to cover this booking." with a green check icon and proceeds to enable the pay button.
- If `available < total`: shows "You're 1 150 000 so'm short." with a primary outline button **Top up balance** that opens the top-up modal (§6). The pay button stays disabled with a tooltip explaining why.
- Below: a thin **transactions** disclosure that on click expands the user's last 5 ledger entries inline. Each row: icon based on Type, description, amount in red (debit) or green (credit), date.

**Tab 2 — Cards**

If user has no cards: empty state with `<CreditCard size={32} />`, heading "No cards yet", subtext "Add one to pay instantly", primary button **Add a card** that opens the add-card modal (§7).

If user has cards: list of card rows. Each row:

- Brand logo (16:10, 32×20 SVG — Visa, Mastercard, Uzcard, Humo committed to `/public/payment-brands/`)
- Cardholder name
- `•••• •••• •••• {last4}`
- Expiry `MM/YY`
- A small overflow menu: Set as default · Remove
- A radio control on the left selects the active card

Below the list: a ghost button **Add another card** (disabled with tooltip if user already has 5 cards).

**Tab 3 — Payme** and **Tab 4 — Click**

When clicked, the panel shows a centered card with the brand logo, a heading "Coming soon", and a one-line: "Pay directly from Payme/Click later this year. For now, please use a card or your account balance."

The pay button is disabled while these tabs are active with a clear inline reason on the right column: "Choose Account balance or Card to continue."

### 5.5 Cancellation policy block

Below the tabs, always visible:

- Bold one-liner: `Free cancellation until 8 May, 18:00`.
- Three-line breakdown of the existing tiered refund policy: full refund > 7 days, 50% within 1–7 days, no refund < 24h.
- Linked text: "Read the full policy".

### 5.6 Order summary (right column)

Sticky on desktop. Contains:

- **Trip card**: small car cover photo (40×28), `{year} {make} {model}`, dates row `{start} → {end} (3 days)`, pickup city.
- **Price breakdown** (mirrors server `priceBreakdown` exactly):
450 000 so'm × 3 days     1 350 000
Weekly discount               −0
Cleaning fee              50 000
Service fee (15%)        202 500
Taxes (8%)               112 200
─────────────────────────────────
Total                  1 714 700 so'm
  Use `JetBrains Mono` for numbers. Right-aligned. Last row is bold.
- Below the breakdown: a small line `You'll be charged 1 714 700 so'm`.
- **Pay button**: full width, primary style. Label `Pay 1 714 700 so'm`. Disabled when method invalid. Loading state replaces label with a spinner inside a fixed-width container so the button doesn't jump.
- Below the button: a small line with two icons — `Lock` (security) and `Mail` (receipt) — and text `Encrypted in transit. Receipt sent to {obfuscatedEmail}.`

### 5.7 Pay button click — exact flow

1. Disable the button, show spinner.
2. `POST /api/bookings/{id}/pay` with `{method, paymentMethodId?}`.
3. On 200: navigate to `/bookings/{id}/success?paymentId={id}` (success page in §8).
4. On 400/402/409 (insufficient funds, card declined, lock expired): keep the user on the page, show the error inline at the top of the right column in a calm danger-tinted card (no toast — too easy to miss):
   - Insufficient balance: "Your balance dropped below the booking total. Top up or choose a card."
   - Card declined (simulated): "Your card was declined. Try another method."
   - Lock expired: full-screen modal forcing a restart.
5. On network failure: toast `Connection error. Please try again.` and re-enable the button. The endpoint is **idempotent** (uses an `Idempotency-Key` header derived from `bookingId`), so retries don't double-charge.

### 5.8 Idempotency

Every `POST /api/bookings/{id}/pay` includes an `Idempotency-Key` header equal to `${bookingId}:${userId}:${methodKey}`. The server stores the first response keyed by this header for 24 hours and replays it on duplicate calls. This protects against double-clicks and network retries.

---

## 6. Top-Up Modal

Opens from the Account balance tab when the user clicks **Top up balance** or from the Profile → Balance page.

### 6.1 Step 1 — Amount + method

Modal layout:

- Header: `Add money to your balance`
- Quick-select chips: `100 000`, `250 000`, `500 000`, `1 000 000`, `2 000 000` so'm. Tapping a chip fills the amount input.
- Custom amount input (UZS, formatted on blur as `100 000 so'm`). Min 50 000, max 50 000 000 per top-up.
- Method selector: same card list component used on checkout. Account balance is not a top-up source (you can't top up balance from balance).
- New balance preview line: `Your balance after top-up: 1 250 000 so'm`.
- Bottom bar: **Cancel** ghost · **Continue** primary.

On Continue: `POST /api/balance/topup/intent`. Response indicates whether SMS is required (always true for cards). Move to step 2.

### 6.2 Step 2 — SMS confirmation

Same `<OtpInput />` component built in the email-verification phase. Identical UX:

- Heading: `Verify it's you`
- Subtext: `We sent a 6-digit code to your phone {obfuscatedPhone}. Enter it to add 250 000 so'm to your balance.`
- OTP boxes, auto-submit on the 6th digit.
- Resend logic with 60s cooldown using the `nextResendAllowedAt` value from the intent response. Up to 5 resends per 24 hours.
- Wrong-code error copy mirrors the email step ("That code isn't right. You have N attempts left.").

On 204 from `/api/balance/topup/confirm`:

- Modal shows a 600ms success state: green check inside neutral circle, heading `Balance topped up`, subtext `250 000 so'м added to your account`.
- Closes automatically.
- Account balance number on the page animates from old → new value over 800ms (count-up animation, ease-out, **only** animation allowed in this flow).
- Toast top-right: `+250 000 so'm`.

On failure: standard error states, modal stays open.

---

## 7. Add-Card Modal

Opens from the Cards tab (or Profile → Payment methods).

### 7.1 Step 1 — Card details

Modal layout — same proportions as the existing top-up modal:

- Heading: `Add a payment card`
- Subtext under: `We'll send a 6-digit code to your phone to confirm it's yours.`
- Type segmented control at top: `Visa / Mastercard` · `Uzcard` · `Humo` (all functional in the simulation).
- Live card preview on the right (or above on mobile) — same component as the host onboarding payment-method form. Updates live as user types.
- Form fields:
  - Cardholder name (uppercase Latin only, 2–50)
  - Card number (Luhn-valid, formatted as `0000 0000 0000 0000`, brand auto-detected from BIN)
  - Expiry MM/YY (must be future)
  - CVV (3 digits — masked input, `inputMode="numeric"`)
- Inline disclaimer below the form: `Demo mode — no real card network is contacted.`
- Bottom bar: **Cancel** · **Continue** primary, disabled until Zod schema passes.

On Continue: `POST /api/payment-methods/intent`. Server tokenizes via `FakePaymentService`, stores a *pending* PaymentMethod (active=false), and triggers Twilio SMS to the user's phone. Modal advances.

### 7.2 Step 2 — SMS confirmation

Same `<OtpInput />` UX as the email and top-up flows. On success:

- Server marks the pending method as active, sets `PhoneVerifiedAt`.
- Modal shows success: `Card added`, subtext `Visa ending in 4242 is ready to use.`, closes after 600ms.
- Card list refreshes via TanStack Query invalidation — new row appears at the top.
- Toast: `Card added`.

On failure (wrong code 5x, expired): the *pending* PaymentMethod is deleted server-side after 30 minutes via Hangfire `ExpirePendingPaymentMethodsJob`. User sees: "We couldn't verify the card. Please try again." with **Retry** button that reopens step 1 with the form pre-filled (except CVV).

### 7.3 What the user does NOT see

- The full PAN they typed leaves their browser only over HTTPS, hits one server endpoint, gets tokenized into `pm_fake_xxx`, and **never** appears in any DB row, log line, or response body.
- The CVV is dropped immediately after tokenization.
- We display only the last 4 from this point forward.

---

## 8. Success Page (`/bookings/:id/success`)

After a successful pay, navigate here. Layout:

- Center column, max-w-560px, vertically centered.
- Lucide `CircleCheck` 56px in a neutral surface-muted circle.
- H1: `Booking confirmed` (or `Request sent` if not instant book) at `text-2xl font-medium`.
- One-liner: `{Make Model Year} from {host.firstName} · {start} → {end}`.
- Card with the receipt summary: receipt number, total, payment method, status pill.
- Two buttons in a row: **View booking** primary → `/bookings/{id}`, **Download receipt** outline → opens the signed PDF URL in a new tab.
- Below, muted line: `A receipt has been sent to {obfuscatedEmail}. It may take a minute.`

The page also fires a SignalR notification to the host (already exists) so they see the new request in their dashboard immediately.

---

## 9. PDF Receipt

### 9.1 Generation

Use **QuestPDF** (already in the host phase plan, MIT-licensed) for server-side generation. Triggered as a Hangfire job `GenerateReceiptJob` enqueued the moment payment captures successfully.

Layout (one A4 page):

- Header: CarSharing wordmark (no emoji), receipt number top-right.
- Subheader: `Receipt` in `font-medium 24pt`.
- Two-column meta block:
  - Left: Booking ID, Trip dates, Pickup location.
  - Right: Receipt number, Issued date, Payment status.
- Trip details card: car make/model/year, host name, days count.
- **Itemized line items** (matches the on-screen breakdown exactly):
Description                             Amount
────────────────────────────────────────────────
450 000 so'm × 3 days                1 350 000
Cleaning fee                            50 000
Service fee (15%)                      202 500
Taxes (8%)                             112 200
────────────────────────────────────────────────
Total                                1 714 700 so'm
- Payment block: method (with last 4 if card), transaction reference, date.
- Footer: legal entity name, address (placeholder ok), support email, "This is a digital receipt" line.
- Page number `1 / 1`.

Typography: `Inter` body, `Inter Tight` headings, `JetBrains Mono` for numbers and the receipt number. Print at 11pt body.

The PDF is uploaded to Cloudinary in a private folder `receipts/{userId}/{receiptId}.pdf`. Public URLs are signed with a 1-hour expiry whenever fetched.

### 9.2 Email delivery

The same `IEmailService` used for verification sends the receipt. Template `receipt-issued.cshtml`:

- Subject: `Your CarSharing receipt — {receiptNumber}`
- Body: short summary (booking, dates, total) + a clear "Download receipt" button linking to the signed URL + a paragraph explaining how to find it later in `/profile/receipts`.
- The PDF is **also attached** as `receipt-{receiptNumber}.pdf` so users have it without clicking through.

Plaintext fallback included.

### 9.3 Re-emailing

User can re-send the receipt email from `/bookings/{id}` ("Resend receipt" button) and `/profile/receipts`. Rate-limited 3/day/user via Redis.

---

## 10. Profile — Wallet & Payment Methods Pages

Two new routes under `/profile`:

### 10.1 `/profile/wallet`

- Big balance card at top: `Available: 1 250 000 so'm`. Locked row below (collapsible). **Top up** primary button.
- **Transaction history** table below: paginated ledger entries with date, type icon, description, amount (red/green), running balance. Filter by type and date range. Export CSV (pulls last 12 months).

### 10.2 `/profile/payment-methods`

- Default payment method card at top.
- Other cards listed below.
- Each card row has Set as default · Remove · View details (opens a drawer with date added, last used, last verified).
- **Add a card** primary button.
- Below: read-only "Coming soon" cards for Payme and Click with their logos.

---

## 11. Admin — New Surfaces

Add to the existing admin panel:

- `/admin/payments` — table of all `Payment` rows with filters (status, date, amount range). Row click opens a drawer showing the full payment lifecycle, related booking, and ledger entries. **Refund** button (admin-initiated) requires a reason and triggers `IPaymentService.RefundAsync` with a forced full or partial amount.
- `/admin/balance/adjustments` — admin can credit or debit a user's balance with a reason (audit-logged). Use case: customer support comp'ing a bad experience.
- `/admin/receipts` — search receipts by number or user.

Every admin action writes to the existing `AuditLog`.

---

## 12. Security Checklist (Verify Each Box)

- [ ] Full PAN never reaches the database. Grep proves it.
- [ ] CVV is dropped after tokenization in memory. The variable is overwritten with random bytes via `CryptographicOperations.ZeroMemory` on the equivalent string-as-byte-array.
- [ ] Card number, CVV, full SMS code never appear in any log at any level. Verified by running the full flow and grepping `/var/log` and Serilog sinks for `\d{3,16}` patterns within payment context.
- [ ] `IDataProtector` encrypts `ProviderToken`, billing-address JSON, and any document numbers. Existing keys ring is reused.
- [ ] All payment endpoints require `[Authorize]` and verify `JWT.sub == userId`. Cross-user payment access returns 403.
- [ ] Idempotency keys used on every mutating payment endpoint. Replay returns the original response.
- [ ] Optimistic concurrency: every `AccountBalance` write checks `Version` and increments it. Conflicts return 409 with a "Please refresh and try again" message.
- [ ] Twilio responses log only `messageSid + status`. Phone number partially masked.
- [ ] Rate limits in §3 are enforced server-side via Redis sliding windows.
- [ ] Receipts in Cloudinary are in a private folder; URLs are always signed with 1-hour expiry.
- [ ] CSP headers on the checkout page allow only the brand-logo SVGs from our origin (no third-party CDN for card brand logos).
- [ ] Demo banner is visible on every checkout in non-prod builds.

---

## 13. Seed Data

The seeder must produce a demo that's clickable end-to-end:

- The default seeded guest (`guest@carsharing.dev`) starts with **Available 5 000 000 so'm**, **Locked 350 000 so'm**, with 12 historical ledger entries spanning the last 90 days (top-ups, captures, a refund).
- The seeded guest has 2 active cards: a Visa ending `4242` (default) and a Uzcard ending `8888`.
- One seeded user has zero balance and zero cards — to demo the empty states.
- One seeded user has 5 cards — to demo the cap.
- 4 historical receipts exist for completed bookings; their PDFs are pre-generated and uploaded to Cloudinary on seed.
- 2 in-flight payments at `Authorized` status (waiting on host approval) so the admin's `/admin/payments` page has interesting rows.
- Ledger reconciliation passes on first boot (no orphan rows).

---

## 14. Acceptance Checklist — Three Clean Runs Before Done

1. `docker compose down -v && docker compose up --build` boots cleanly. Banner prints seeded balance and card info for the guest account.
2. Log in as guest. Open a car detail page. Click **Book**. Lands on `/bookings/{id}/checkout`. Demo banner visible. Lock countdown ticking.
3. Order summary on the right matches the on-page price breakdown exactly. Refresh the page — values unchanged.
4. **Account balance tab**: shows correct available/locked numbers from the ledger. Pay button enabled. Click it. Loading state. Navigate to success page. Receipt arrives in Mailhog within 60 seconds with a PDF attached. Open the PDF — itemized lines match the breakdown. Receipt number formatted `CS-2026-NNNNNN`.
5. Ledger now has one new `BookingHold` debit and balance reflects the deduction.
6. Cancel the booking (>7 days out). `RefundCredit` ledger entry appears, balance restored.
7. **Cards tab** with a fresh user: empty state. Click **Add a card**. Enter a Visa test number `4242 4242 4242 4242`, expiry, CVV, name. Continue. SMS arrives via Twilio (or `dev-sms.log` if disabled). Enter code. Card appears in list. Last 4 = `4242`. CVV is gone from anywhere checkable.
8. Submit a wrong code 5 times → pending card invalidated, error shown, retry button reopens form.
9. Pay a booking with the new card. Success. Receipt emailed. Check Mailhog: PDF attached, content correct.
10. **Top up** flow: existing user clicks Top up, picks 250 000 quick-select, Continue, SMS, code, success. Balance count animates from old to new. Ledger entry appears.
11. **Payme** and **Click** tabs show "Coming soon" panels and the pay button is disabled with the right reason.
12. Try to pay a booking when balance is 100 less than total: pay button disabled with tooltip; **Top up** CTA visible inline; topping up the missing amount enables the button.
13. Lock expires (force expiry by editing DB or wait 10 min): page shows the modal forcing restart.
14. Click pay twice rapidly: idempotency makes the second click a no-op. Only one Payment row exists.
15. **Admin /admin/payments**: see all the new rows. Refund one with a reason. User's balance is credited and they receive a notification + email.
16. Mobile pass at 375px on every checkout flow: bottom sheet works, OTP inputs sized correctly, modals are full-screen with proper safe-area padding.
17. Dark mode works on the checkout, modals, success page, wallet, and admin payments table.
18. Grep all log files for any 6-digit sequence in the SMS/payment context: zero hits.
19. Grep all log files for any 16-digit sequence: zero hits.
20. `npm run test` and `dotnet test` both green. `npm audit` clean. `dotnet list package --vulnerable` clean.
21. axe-core: zero serious issues on `/bookings/{id}/checkout`, the top-up modal, and the add-card modal.
22. `docker compose down && docker compose up` (no -v): mid-flight payment-method-pending rows are correctly expired by the Hangfire job after 30 minutes.
23. `LedgerReconcileJob` runs nightly and reports no mismatch.

Three clean runs → commit. Capture 8 screenshots (checkout with balance tab, checkout with cards tab, add-card modal step 1, add-card SMS step, top-up modal, success page, receipt PDF preview, wallet page). Save to `/docs/screenshots/payments/`. Write `/docs/PAYMENTS_DONE.md`.

---

## 15. Execution Order

1. Migrations: `AccountBalance`, `LedgerEntry`, `Payment`, `PaymentSmsChallenge`, `Receipt` + indexes. Backfill `AccountBalance` for existing seeded users with realistic ledger history. Commit.
2. Backend: `IPaymentService` interface + `FakePaymentService` (tokenize/authorize/capture/refund) + `IBalanceService` with optimistic concurrency. Unit tests for every refund tier and every concurrency path. Commit.
3. Backend: `ITwilioSmsService` + `TwilioSmsService` + `LocalSmsService` fallback + `PaymentSmsChallenge` lifecycle (hash, expiry, attempt counter, cooldown via Redis). Tests. Commit.
4. Backend: payment-methods endpoints (intent → SMS → confirm), card storage rules, Hangfire `ExpirePendingPaymentMethodsJob`. Tests. Commit.
5. Backend: top-up endpoints with the same intent → SMS → confirm pattern. Tests. Commit.
6. Backend: checkout endpoints (`GET /checkout`, `POST /pay`) with idempotency keys, ledger writes, transactional integrity. Tests proving rollback on every failure path. Commit.
7. Backend: receipts — QuestPDF generator, Hangfire `GenerateReceiptJob`, email template, re-send endpoint. Tests. Commit.
8. Backend: admin endpoints (payments list, refund, balance adjustments, audit). Tests. Commit.
9. Backend: seeder updates from §13. Verify ledger reconciliation passes. Commit.
10. Frontend: `<OtpInput />` is reused. Build the checkout page shell with the demo banner, lock countdown, layout grid. Commit.
11. Frontend: payment method tabs — Account balance panel with ledger preview, Cards panel with list, Payme/Click coming-soon panels. Commit.
12. Frontend: order summary right column, price breakdown component (mirrors server response), pay button with idempotency-key header. Commit.
13. Frontend: add-card modal (form + SMS step + success). Live card preview reused from host onboarding. Commit.
14. Frontend: top-up modal (amount + method + SMS + animated balance update). Commit.
15. Frontend: success page + PDF download. Commit.
16. Frontend: `/profile/wallet` and `/profile/payment-methods` pages. Commit.
17. Frontend: admin `/admin/payments` table + refund drawer + `/admin/balance/adjustments` form. Commit.
18. Polish: empty states, skeleton loaders, dark mode pass, mobile pass at 375px, axe pass. Commit.
19. Run §14 acceptance checklist. Repeat until three clean runs. Capture screenshots. Write `/docs/PAYMENTS_DONE.md`.

Do not skip ahead. Commit after each step. Test before you trust. Three clean runs before you declare done.