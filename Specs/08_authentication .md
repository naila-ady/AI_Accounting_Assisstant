# Feature Spec: Authentication

## Description
Single-tenant, single-role auth (admin/office user). Purpose is to gate access to the app, not to
support multi-role permissions (see 00-overview.md non-goals).

## Endpoints
- `POST /api/auth/signup` — body: `{ name: str, email: EmailStr, password: str }` → creates user,
  returns JWT.
- `POST /api/auth/login` — body: `{ email: EmailStr, password: str }` → returns JWT.
- `GET /api/auth/me` — returns current user from token (used by frontend on load to check session).
- `POST /api/auth/logout` — stateless (JWT-based), frontend just discards token. Endpoint exists
  for symmetry/future token-blacklisting but does no server-side work now.

## Table: users
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(100) | |
| email | VARCHAR(255) | unique, required |
| password_hash | VARCHAR(255) | bcrypt hash, never store plaintext |
| created_at | TIMESTAMP | default now() |

## Pydantic schemas
```python
class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: UUID
    name: str
    email: EmailStr
```

## Auth mechanism
- JWT (HS256), signed with a server-side secret from env var `JWT_SECRET`.
- Token expiry: 7 days (single-user tool, no refresh-token complexity needed).
- Password hashing: `passlib[bcrypt]`.
- All `/api/entries`, `/api/reports/*`, `/api/chat` endpoints require a valid `Authorization:
  Bearer <token>` header — enforced via a FastAPI dependency (`get_current_user`).

## Frontend behavior
- `middleware.ts` protects all routes except `/login` and `/signup`.
- Token stored client-side (localStorage or cookie) and attached to every API call via `lib/api.ts`.
- On 401 response from any API call, frontend clears token and redirects to `/login`.

## Edge cases
- Duplicate email on signup → 409 Conflict, `{ "detail": "Email already registered" }`.
- Wrong password on login → 401, generic `{ "detail": "Invalid email or password" }` (do not
  reveal whether email exists, standard security practice).
- Expired/invalid token on protected route → 401, frontend redirects to login.

## Acceptance criteria
- [ ] Cannot access /dashboard, /expenses, /chat etc. without a valid token (manually test by
      clearing token and hitting a protected route).
- [ ] Passwords are never returned in any API response, never logged.
- [ ] Signup → immediately logged in (token returned), no separate login step required.