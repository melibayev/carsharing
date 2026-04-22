# CarSharing — Email Verification on Registration (Standalone Prompt)

> You are adding an email verification step to the existing registration wizard in the CarSharing codebase (React + Vite + TS + Tailwind, flat .NET 8 API, PostgreSQL, MailKit, Mailhog in dev, Serilog). Do not touch unrelated surfaces — host onboarding, messaging, booking, admin. This prompt inserts one new screen between Step 1 ("Create your account") and Step 2 ("Personal details"): a page where the user enters a 6-digit code sent to their email. Slow is fine. Wrong is not. Three clean acceptance runs before declaring done.

---

## 0. Ground Rules

1. Zero emoji anywhere in the UI. Lucide icons only.
2. English only.
3. TypeScript strict. Nullable reference types on in C#.
4. The 6-digit code is **never** returned in any API response body, **never** logged (even at debug level), **never** written to localStorage or Zustand. It leaves the server exactly once — inside the email body. Period.
5. No `console.log` in the final commit. Serilog on the server, proper `logger` util on the client.
6. Test before commit. `docker compose down -v && docker compose up --build` must produce a flawless first run every time.
7. The existing design tokens (near-black primary, muted grays, `font-medium` headings at weight 500, 14px body, `rounded-lg` inputs) are preserved. Do not invent new styling for this page — reuse what exists.

---

## 1. Where This Fits in the Flow

The existing wizard has 5 visible steps. Insert a new second step so the flow becomes **6 steps**:

1. Account basics (the current `/register` screenshot)
2. **Verify email** (this prompt adds it)
3. Personal details
4. License verification
5. Identity verification
6. Payment setup

Renumber every visible mention of "Step N of 5" to "Step N of 6" in the wizard layout, progress bar, stepper, and any inline copy. The progress bar now advances in sixths.

Update the `ProfileCompletionStatus` enum on `ApplicationUser`:

```csharp
public enum ProfileCompletionStatus
{
    Step1Done,       // account created, email NOT yet confirmed
    EmailVerified,   // NEW — inserted between Step1Done and Step2Done
    Step2Done,
    Step3Done,
    Step4Done,
    Complete
}
```

Migration rule for existing seeded users: anyone at `Step2Done` or later is backfilled to have `EmailConfirmed = true`. Their status is preserved; the new enum value just slots in between.

---

## 2. User Flow — Exactly What Happens

### 2.1 Click "Create account"

Current behavior creates the account and auto-logs the user into Step 2. Change this:

1. Validate the form client-side (Zod schema unchanged).
2. `POST /api/auth/register` as before. Server creates the user with `EmailConfirmed = false` and `ProfileCompletionStatus = Step1Done`. Server returns `{accessToken, user}` and sets the refresh cookie as before — **the user is still logged in**. We need the access token so the subsequent verification calls are authenticated.
3. **Inside the same request pipeline**, the server generates and emails the 6-digit code (see §3). Do not rely on the client to trigger the send.
4. Frontend stores the access token in memory, sets `lastCompletedStep = 1` in the Zustand onboarding store, and navigates to `/onboarding/verify-email`.

### 2.2 On `/onboarding/verify-email`

- Show the verification screen (design in §4).
- User receives the email, types the 6 digits, submits.
- On success, frontend flips `lastCompletedStep = 2` and navigates to `/onboarding?step=3` (which is the old Step 2, now renumbered).
- On failure, show an inline error and let them try again.

### 2.3 Guard rails

- Direct visits to `/onboarding?step=3` or beyond with `EmailConfirmed = false` silently redirect to `/onboarding/verify-email`.
- Direct visits to `/onboarding/verify-email` by an already-verified user silently redirect to their next incomplete step.
- Logging out on this screen clears the wizard state and returns to `/login`.
- A user who closes the tab and reopens the site later **while still having a valid refresh cookie** lands on `/onboarding/verify-email` automatically if their email is still unconfirmed.

---

## 3. Backend — Code Lifecycle

### 3.1 New entity

Add `EmailVerificationCode` (migration required):

```csharp
public class EmailVerificationCode
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string CodeHash { get; set; } = null!;   // SHA-256 of the 6-digit code
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public int AttemptCount { get; set; }            // wrong submissions against THIS code
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
```

Index on `(UserId, ConsumedAt)` for fast lookup of the live code.

### 3.2 Generation rules

- **Length**: 6 digits, numeric only. Leading zeros allowed (`042193` is valid). Always format as `D6`.
- **Randomness**: `RandomNumberGenerator.GetInt32(0, 1_000_000)` from `System.Security.Cryptography`. Never `System.Random`.
- **Storage**: only the **SHA-256 hash** of the code is stored. On verification, hash the submitted code and compare hashes. Plaintext exists only in memory long enough to send the email.
- **Lifetime**: 10 minutes from `CreatedAt`.
- **Uniqueness per user**: when a new code is issued, any previously-issued unconsumed codes for that user are marked consumed (`ConsumedAt = UtcNow`). Exactly one live code per user at any time.
- **One-time use**: on successful verification, set `ConsumedAt = UtcNow`. A consumed code cannot be reused, even if still within its lifetime.

### 3.3 Rate limits (all enforced server-side)

| Action | Limit | Response on breach |
|---|---|---|
| Resend code (per user) | 1 per 60 seconds | 429 with a `Retry-After` header in seconds |
| Resend code (per user) | 5 per 24 hours | 429 with explanatory message |
| Resend code (per IP) | 30 per hour | 429 |
| Verify code attempts against **a single live code** | 5 wrong attempts | That code is invalidated (`ConsumedAt = UtcNow`), user must request a new one |
| Verify code attempts (per user, rolling) | 15 per hour | 429 |
| Verify code attempts (per IP) | 60 per hour | 429 |

The per-user resend cooldown uses Redis with key `email_verify_resend:{userId}` and a 60-second TTL. The rolling per-hour counters use Redis with sliding windows.

### 3.4 Endpoints

All endpoints require the JWT access token (the user is already logged in after step 1). No admin override.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/email/send-code` | Generates a new code, invalidates previous, sends email, returns `{expiresInSeconds: 600}`. The code itself is **never** in the response. |
| POST | `/api/auth/email/verify-code` | Body: `{code: string}`. Returns `204 No Content` on success, `400` on wrong/expired code with structured error. |
| GET | `/api/auth/email/status` | Returns `{emailConfirmed: boolean, lastCodeSentAt: ISO-8601 \| null, nextResendAllowedAt: ISO-8601 \| null}`. Used by the frontend to render the resend timer on page load. |

On successful verification:

1. Set `user.EmailConfirmed = true`.
2. Set `user.ProfileCompletionStatus = EmailVerified` (if currently `Step1Done`).
3. Mark the `EmailVerificationCode` row as consumed.
4. Write an audit log entry (`EmailVerified`).
5. Return 204.

Registration itself (§2.1) calls `IEmailVerificationService.IssueAndSendAsync(user)` internally so the user receives the first code without a separate client call.

### 3.5 Email content

Plaintext + HTML multipart. Template lives at `Services/Email/Templates/email-verification.cshtml` (or `.liquid` — match whatever the existing email templates use).

**Subject line**: `Your CarSharing verification code: 428193` — yes, the code in the subject is intentional. This is industry standard (Stripe, GitHub, Airbnb all do it) because it lets users copy the code from the notification banner on their phone without opening the email, which improves conversion dramatically.

**Body layout** (reuse existing email template shell — header logo, footer):

- Heading: `Verify your email`
- Paragraph: `Hi {firstName}, enter this code to finish creating your CarSharing account.`
- **Large code block**: centered, the six digits each in its own rounded square, 32px font size, monospace, generous letter-spacing. Render this as an inline-styled `<table>` since CSS support in email clients is limited.
- Paragraph: `This code expires in 10 minutes. If you didn't request it, you can ignore this email.`
- Footer: standard sign-off, help link, legal line.

Plaintext fallback:
Hi {firstName},
Enter this code to finish creating your CarSharing account:
4 2 8 1 9 3
This code expires in 10 minutes.
If you didn't request it, you can ignore this email.
— The CarSharing team

In dev, emails land in Mailhog at `http://localhost:8025`. In prod, they go through the configured SMTP provider.

### 3.6 Logging rules

- Log that a code was issued, to whom, and the expiry — **never log the code itself**.
- Log every failed verification attempt with `{userId, attemptNumber, ipAddress, reason}` where reason is `WrongCode | Expired | Consumed | RateLimited`. Do not log the submitted wrong code either — an attacker with log access shouldn't get a smaller haystack to guess into.
- Serilog sink should pass messages through a scrubber filter that masks any 6-digit sequence in any log property as `******` as a defense in depth.

---

## 4. Frontend — The `/onboarding/verify-email` Screen

### 4.1 Layout

Same wizard chrome as the rest of the flow — left rail with stepper (showing "2. Verify email" as the active node), top bar with the CarSharing logo and a "Save & exit" ghost link, sticky bottom bar with a **Back** ghost button and a primary **Continue** button.

The center panel, max-width 480px, vertically centered, contains:

- Icon at top: `<MailCheck size={40} />` inside a neutral circle (`bg-surface-muted`, 64px). Flat. No glow.
- H1: `Check your email` at `text-2xl font-medium`.
- Subtext: `We sent a 6-digit code to {obfuscatedEmail}. Enter it below to continue.` at `text-sm text-ink-muted`. The email is obfuscated like `j***@gmail.com` — preserve first char of local-part, replace the rest of the local-part with `***`, keep domain intact.
- **OTP input** (see §4.2).
- Inline error text below the input when applicable.
- Resend row (see §4.3).
- Small line: `Wrong email? Go back and edit it` — the "Go back" text is a button that navigates to `/onboarding?step=1` in edit mode with email pre-filled. Updating the email on return triggers a fresh code send.

Bottom bar:

- **Back** ghost button → `/onboarding?step=1` with a confirmation modal: *"Go back and edit your email? Any unused code will be invalidated."* Cancel / Continue.
- **Continue** primary button → disabled until all 6 digits are entered. On click, submits. Shows a spinner in place of the label while pending (label width held stable with a fixed `min-w-[120px]`).

### 4.2 OTP input component

Build a dedicated `<OtpInput />` component at `src/components/shared/OtpInput.tsx`. Props: `{length: 6, value: string, onChange: (v: string) => void, disabled?: boolean, error?: boolean, autoFocus?: boolean}`.

Behavior (this is the critical UX — get it right):

- Renders 6 separate `<input>` boxes, each 48×56px on desktop, 44×52px on mobile, `rounded-lg border`, centered text at `text-xl font-medium`, `font-mono` for monospace.
- Each box has `inputMode="numeric"` + `autoComplete="one-time-code"` + `pattern="[0-9]*"`. The `one-time-code` autocomplete is what lets iOS Safari autofill codes from SMS/Mail notifications and modern Chrome surface the WebOTP prompt.
- Typing a digit advances focus to the next box. Typing in the last box keeps focus there.
- `Backspace` in an empty box moves focus to the previous box and clears it. `Backspace` in a non-empty box clears the current digit without moving focus.
- Left/Right arrow keys move focus between boxes.
- **Paste handling is critical**: pasting a 6-digit string into any box distributes the digits across all six boxes and focuses the last. Pasting a string with non-digits strips them first, then distributes.
- When all 6 digits are filled, call `onChange` with the full string. The parent then calls the verify endpoint (optional auto-submit — see §4.4).
- `error={true}` adds a red border and a subtle shake animation (`translateX` -4, 4, -2, 2, 0 over 240ms — and nothing else shakes on the page ever).
- Disabled state greys everything out.
- Dark mode has correct contrast: border `border-border`, focused border `border-ink-strong`, error border `border-danger`.

Accessibility:

- Each input has `aria-label="Digit {n} of 6"`.
- The whole group is wrapped in `<div role="group" aria-labelledby="otp-label">`.
- When an error occurs, `aria-describedby` points to the error text and `aria-invalid="true"` is set on all 6 inputs.
- Screen readers announce "Enter the 6-digit code sent to your email" on mount.

### 4.3 Resend logic

Below the OTP input:

- Line: `Didn't get the code?` followed by either a **Resend** link button (if cooldown has passed) or disabled text `Resend in 42s` counting down in real time.
- Cooldown logic: on page load, call `GET /api/auth/email/status` to get `nextResendAllowedAt`. Compute remaining seconds. Start a `setInterval` that updates every second. When it hits 0, enable the Resend button.
- On Resend click: `POST /api/auth/email/send-code`, show a success toast (`Code sent`), reset the cooldown to 60s. If the server returns 429 (per-user 24h limit reached), show a muted inline error: *"You've requested too many codes today. Please try again tomorrow or contact support."* and hide the Resend button.
- After 5 resends within 24h, the Resend button stays hidden with that message.

### 4.4 Auto-submit vs explicit submit

Default behavior: **auto-submit when all 6 digits are entered**. This is what Stripe, GitHub, and Google Auth all do, and it removes the redundant click. The **Continue** button in the bottom bar still exists as a fallback for users who didn't see auto-submit happen (accessibility, keyboard users).

When auto-submit fires, show a subtle inline spinner next to the OTP input rather than replacing the whole page — the user just typed something and shouldn't see the UI disappear.

### 4.5 Error handling (copy these exact strings)

- Wrong code: `That code isn't right. You have {remaining} attempts left.` where `remaining = 5 - attemptCount`.
- Expired code: `That code expired. Request a new one.`
- Too many wrong attempts on a single code: `For your security, this code has been invalidated. Please request a new one.` — the Resend button appears enabled immediately in this case (bypass the 60s cooldown because the user isn't actually abusing resend).
- Per-hour rate limit hit: `Too many attempts. Please wait a moment and try again.`

None of these use red backgrounds on the whole panel. Errors are inline text in `text-sm text-danger` under the input, with the input border turning red.

### 4.6 Success

On 204 from the verify endpoint:

- Tiny success toast at top-right: `Email verified`.
- 600ms delay (just enough to feel confirmed, not enough to feel slow).
- Navigate to `/onboarding?step=3` (personal details, the old step 2 renumbered).
- Zustand store: `lastCompletedStep = 2`.

---

## 5. Security & Abuse Prevention

Beyond the rate limits in §3.3:

- **Email enumeration protection**: the `/api/auth/register` endpoint already returns 201 for new users. If the email is already taken, it returns a generic "that email cannot be used" message *without* confirming whether an account exists. This is the existing behavior — do not regress it.
- **Timing-safe comparison**: use `CryptographicOperations.FixedTimeEquals(submittedHash, storedHash)` when comparing code hashes. Never a plain string `==`.
- **CSRF**: these endpoints are JWT-authenticated with bearer tokens in the Authorization header, so CSRF doesn't apply. Do not move them to cookie-only auth.
- **Replay**: consumed codes can never be reused. A second verification attempt with the same (now-consumed) code returns the same "that code isn't right" error — don't leak that the code was previously valid.
- **Clock skew**: `ExpiresAt` comparison happens server-side against `DateTimeOffset.UtcNow`. Client-side countdown timers are display-only.
- **Logs**: the scrubber filter mentioned in §3.6 is mandatory. After implementing it, grep the dev logs after a full verification flow — zero 6-digit sequences should appear.

---

## 6. Seed Data

Update the seeder to produce users in every email-verification state so the demo is reviewable end-to-end:

- 1 seeded user stuck at `ProfileCompletionStatus = Step1Done` with `EmailConfirmed = false` and a **live** unconsumed code in `EmailVerificationCodes` (so an admin can see what this looks like in the DB; not needed for UI demo since code is hashed). First name "Unverified User", email `unverified@carsharing.dev`.
- 1 seeded user at `Step1Done` with a **consumed** code but still `EmailConfirmed = false` (simulates a user who exhausted attempts and needs to resend).
- All other seeded users have `EmailConfirmed = true` and status `Step2Done` or later (unchanged from the current seeder, just ensure the migration backfills correctly).
- Print the demo account's verification flow in the startup banner: *"Try verification flow: register at /register, then check Mailhog at http://localhost:8025 for the code."*

---

## 7. Acceptance Checklist — Three Clean Runs Before Done

1. `docker compose down -v && docker compose up --build` boots. Banner prints the updated instructions.
2. Open `/register`. Fill the form. Click **Create account**. Page navigates to `/onboarding/verify-email`.
3. Open Mailhog at `http://localhost:8025`. Exactly one email is present, subject contains the 6-digit code, body renders the code in monospace with spacing.
4. Copy the code from the email. Type it into the first OTP box — it distributes across all 6 boxes and auto-submits. Page advances to `/onboarding?step=3` with a toast `Email verified`.
5. New incognito window. Register a fresh account. On the verify page, type `000000` — wrong code error appears with "You have 4 attempts left".
6. Type 4 more wrong codes — the live code is invalidated, message changes to "this code has been invalidated", Resend becomes available immediately.
7. Click Resend. Cooldown timer shows `Resend in 60s` and counts down. Rapid clicks on Resend during cooldown do nothing.
8. Mailhog now shows 2 emails. The first code is no longer valid (server returns the expired/consumed error). The second code works.
9. Register 6 times quickly from the same IP to trigger the per-IP resend limit — the 7th registration returns 429 at the resend layer.
10. With a seeded verified user, attempt to visit `/onboarding/verify-email` directly — redirects to their next incomplete step.
11. With an unverified user, attempt to visit `/onboarding?step=3` directly — redirects to `/onboarding/verify-email`.
12. Paste a 6-digit number from clipboard into any OTP box — distributes correctly. Paste a string with dashes like `428-193` — dashes are stripped, digits distribute.
13. Keyboard-only pass: tab into the first OTP box, type 6 digits, auto-submit works. Shift+Tab reverses. Backspace moves to previous box.
14. Screen reader pass: NVDA or VoiceOver announces "Enter the 6-digit code sent to your email", then "Digit 1 of 6" on focus.
15. Mobile pass at 375px: OTP boxes sized correctly, iOS autofill from Messages works (verify by triggering the real SMS code flow is out of scope, but the `autocomplete="one-time-code"` attribute is present and inspectable in devtools).
16. Dark mode: OTP boxes have correct contrast, error borders are visible, success toast is readable.
17. Grep the log output for any 6-digit sequence. Zero hits.
18. `npm run test` and `dotnet test` both green. `npm audit` clean. `dotnet list package --vulnerable` clean.
19. `docker compose down && docker compose up` (no -v): a user mid-verification is still mid-verification on reload.
20. axe-core zero serious issues on `/onboarding/verify-email`.

Three clean runs → commit. Capture 4 screenshots (verify page empty, verify page with code entered, error state, email in Mailhog). Save to `/docs/screenshots/email-verify/`. Write `/docs/EMAIL_VERIFY_DONE.md`.

---

## 8. Execution Order

1. Migration: `EmailVerificationCode` entity + index + `ProfileCompletionStatus.EmailVerified` enum addition + backfill SQL for existing verified users. Commit.
2. Backend: `IEmailVerificationService` + `EmailVerificationService` implementation (generate, hash, expire, verify, rate-limit via Redis). Unit tests covering every rate-limit boundary and timing-safe comparison. Commit.
3. Backend: email template `email-verification.cshtml` (HTML + plaintext multipart). Commit.
4. Backend: modify `AuthController.Register` to call `IssueAndSendAsync` inside the same transaction. Add `/api/auth/email/send-code`, `/api/auth/email/verify-code`, `/api/auth/email/status` endpoints. Integration tests against Mailhog via Testcontainers. Commit.
5. Backend: Serilog scrubber filter that masks 6-digit sequences in log properties. Commit.
6. Backend: seeder updates (unverified user + consumed-code user). Startup banner update. Commit.
7. Frontend: `<OtpInput />` component in `src/components/shared/OtpInput.tsx`. Cover paste, keyboard nav, auto-submit callback, shake-on-error. Unit tests with React Testing Library. Commit.
8. Frontend: `/onboarding/verify-email` page using the shared wizard chrome. Email obfuscation util. Resend countdown logic. Error copy per §4.5. Commit.
9. Frontend: wire `Create account` on step 1 to navigate to the verify page instead of directly to step 2. Add guards so verified users skip it and unverified users can't skip past it. Update the stepper to 6 steps. Commit.
10. Frontend: renumber every visible "Step N of 5" label to "Step N of 6" in the wizard shell and progress bar. Commit.
11. Mobile pass at 375px. Dark mode pass. axe-core pass. Commit.
12. Run §7 acceptance checklist. Repeat until three clean runs. Write `/docs/EMAIL_VERIFY_DONE.md`. Ship.

Do not skip ahead. Commit after each step. Test before you trust. Three clean runs before you declare done.