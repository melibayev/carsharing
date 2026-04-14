# API Reference

Full interactive API documentation is available at [http://localhost:5080/swagger](http://localhost:5080/swagger) when the stack is running.

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header.

### Flow

1. `POST /api/v1/auth/login` — returns `{ accessToken, user }` and sets an HttpOnly refresh cookie
2. Client stores `accessToken` in memory (never localStorage)
3. On 401, client calls `POST /api/v1/auth/refresh` (cookie-only) to get a new access token
4. `POST /api/v1/auth/logout` revokes the refresh token and clears the cookie

### Token Lifetimes

- Access token: 15 minutes
- Refresh token: 14 days (rotated on every refresh)

## Base URL

```
http://localhost:5080/api/v1
```

## Error Format

All errors follow RFC 7807 ProblemDetails:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred.",
  "errors": { "email": ["Email is required."] }
}
```
