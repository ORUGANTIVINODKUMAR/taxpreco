# Tapreco: Maigha ↔ Upsilon multi-app handoff plan

**Date:** 2026-10-08  
**Code sync:** Verified against Maigha portal send path + `POST /v1/auth/portal-token` (same day).  
**Audience:** Share with Upsilon. Agents: start at **Pending checklist**, then **Receive contract** (section 4).  
**Goal:** User signs in once on Tapreco → opens an Upsilon tool → that app establishes its own Firebase session (no second login form).

**Scope for Upsilon:** Implement **receive** + user DB in your four apps. You do **not** need Maigha product source. Everything you need is specified in this document.

---

## Pending checklist (read this first)

### Done on Maigha side (informational — no Upsilon work)

- Tapreco portal login (Firebase).
- Portal **send** for any tool whose launch URL env is set: browser goes to  
  `{APP_ORIGIN}/auth/portal#token=<Firebase_ID_token>[&next=…]`.
- Four Upsilon tools listed on the portal (ids / env vars in section 2).
- **Coming soon** when that tool’s URL env is **unset** (no Open, no handoff).
- **Live** when that tool’s URL env **is set** → tool home shows **Open {name}** → handoff send.
- If Open runs with no URL configured → portal shows a clear in-page error (defensive).
- If URL is set but your app is down → normal browser connection / load error.

### Pending — Upsilon (each of the four apps)

| # | Work |
|---|---|
| **U1** | Host the app at a public HTTPS origin; send that origin URL to Maigha |
| **U2** | Add route **`/auth/portal`** that reads the handoff from the URL hash (section 4) |
| **U3** | Call Maigha **`POST /v1/auth/portal-token`** with `Authorization: Bearer <token from hash>` |
| **U4** | Sign in with returned **`customToken`** on Firebase project **`maigha-taxpro`**; strip the hash from the URL |
| **U5** | Unauthenticated users → `{VITE_PORTAL_URL}/login?app=<portal-tool-id>` (ids in section 2) |
| **U6** | Wire logout / return URLs with Maigha (allowlist) |
| **U7** | Shared Postgres: user keyed by Firebase UID; **do not auto-create on login**; explicit provision only |
| **U8** | APIs verify Firebase tokens and enforce data ownership; **no firm RBAC** |

### Pending — Maigha (after Upsilon sends URLs)

| # | Work |
|---|---|
| **M1** | Set each tool’s portal env URL to the real Upsilon origin (rebuild/redeploy portal) |
| **M2** | Add those origins to Maigha API **CORS** (browser calls `portal-token` from your origin; list frontends only — not the API URL) and any return-URL allowlist |
| **M3** | Agree how Upsilon users are provisioned (Firebase UID link) |
| **M4** | Joint test: portal Open → session → refresh → logout |

**Environments (Maigha):**

| Env | Upsilon URL vars | Portal behavior |
|---|---|---|
| Local (optional stubs) | May point at `localhost:3011–3014` (stubs live **outside** Kaygha at `D:\upsilon-handoff-stubs`) | Tools **Live**; Open tests send |
| Staging / hosted | **Unset** until U1 | Tools **Coming soon** |
| After U1 + M1 | Real HTTPS origins | Tools **Live**; real handoff |

---

## 1. Ownership

| | Maigha | Upsilon |
|---|---|---|
| Products | Tapreco portal, token-exchange API, Maigha planning app(s) | Mutual Fund, Estimated Tax, Audit Risk Analyzer, Entity Comparison |
| Source | Maigha repos | **Upsilon repos** (not in Maigha’s monorepo) |
| Handoff **send** (portal → app) | Done | — |
| Handoff **receive** (app accepts token) | — | **Required on each of the four apps** |
| Identity | Firebase project `maigha-taxpro` | Same project (config values from Maigha) |
| App data | Maigha databases | One shared Postgres for all four Upsilon apps |

---

## 2. Portal tools that launch into Upsilon

| Tool | Portal tool id (`?app=` / routes) | Maigha env var for your origin | Until URL is set |
|---|---|---|---|
| Mutual Fund | `mutual-fund` | `VITE_MUTUAL_FUND_URL` | Coming soon (no handoff) |
| Estimated Tax | `estimated-tax` | `VITE_ESTIMATED_TAX_URL` | Coming soon |
| Audit Risk Analyzer | `audit-risk-analyzer` | `VITE_AUDIT_RISK_ANALYZER_URL` | Coming soon |
| Entity Comparison | `entity-comparison` | `VITE_ENTITY_COMPARISON_URL` | Coming soon |

### User flow (matches portal UX)

1. User opens Tapreco home → clicks a tool tile → portal route `/tools/{portal-tool-id}`.
2. If URL env **unset** → **Coming soon** page (no Open).
3. If URL env **set** → tool home with **Open {name}**.
4. Signed-in user clicks Open → portal navigates to:

```text
{YOUR_APP_ORIGIN}/auth/portal#token=<Firebase_ID_token>[&next=/optional/path]
```

5. Not signed in → `/login?app={portal-tool-id}`; after login, if tool is live, portal runs the same handoff send automatically.

Tiles show **Coming soon** when applicable; there is **no** “Open” label on the tile itself (Open is on the tool home page).

```text
      Tapreco portal (login once)
                 |
    +------------+------------+------------+
    |            |            |            |
    v            v            v            v
 Mutual Fund  Estimated   Audit Risk   Entity
 (Upsilon)    Tax         Analyzer     Comparison
    |            |            |            |
    +------------+------------+------------+
                 v
      Firebase project maigha-taxpro
      (session after customToken)
```

---

## 3. Config to exchange

### Upsilon → Maigha (per app, when hosted)

```env
# Public origins only (scheme + host[+port], no path). One variable per app.
VITE_MUTUAL_FUND_URL=https://...
VITE_ESTIMATED_TAX_URL=https://...
VITE_AUDIT_RISK_ANALYZER_URL=https://...
VITE_ENTITY_COMPARISON_URL=https://...
```

Maigha wires these into the **portal** build. Empty / unset → Coming soon.

### Maigha → Upsilon (put in each Upsilon app)

```env
VITE_PORTAL_URL=https://kaygha.maighainc.workers.dev
VITE_APP_API_URL=https://kaygha.onrender.com

VITE_APP_FIREBASE_API_KEY=<from Maigha>
VITE_APP_FIREBASE_AUTH_DOMAIN=<from Maigha>
VITE_APP_FIREBASE_PROJECT_ID=maigha-taxpro
VITE_APP_FIREBASE_APP_ID=<web app id Maigha registers for your app>
# Optional if you use them:
# VITE_APP_FIREBASE_STORAGE_BUCKET=
# VITE_APP_FIREBASE_MESSAGING_SENDER_ID=
# VITE_APP_FIREBASE_MEASUREMENT_ID=
```

Staging API/portal values above are current Maigha hosted defaults; confirm before production cutover.

---

## 4. Receive contract (Upsilon) — implement this; do not look for Maigha UI source

This section is the full spec for your agent/implementer. Verified against Maigha’s live token-exchange API behavior.

### 4.1 Entry URL (what the portal sends)

| Piece | Value |
|---|---|
| Path | `/auth/portal` (exact) |
| Token location | **URL hash** (`#…`), **not** query string |
| Params | `token` (required), `next` (optional relative path, e.g. `/dashboard`) |
| Token meaning | Firebase **ID token** for the user already signed in on Tapreco |

Example:

```text
https://your-app.example/auth/portal#token=eyJhbGciOi...&next=%2Fhome
```

### 4.2 Steps on that page

1. Parse `token` and `next` from `window.location.hash` (`URLSearchParams` after stripping leading `#`).
2. Immediately clear the hash (`history.replaceState`) so the token is not left in history/shareable URL.
3. If `token` is missing → show error + link to `{VITE_PORTAL_URL}/login`.
4. Exchange the token with Maigha (no request body required):

```http
POST {VITE_APP_API_URL}/v1/auth/portal-token
Authorization: Bearer <token from hash>
```

Header must be exactly `Bearer <token>` (space after Bearer).

5. **Success** (HTTP 200) JSON:

```json
{
  "customToken": "<Firebase custom token string>"
}
```

6. **Failure** examples:
   - Missing/invalid Authorization → HTTP 401, JSON includes a `message` (e.g. please authenticate).
   - Other errors → non-2xx; prefer showing `message` from JSON body when present.
7. On success: Firebase client SDK `signInWithCustomToken(customToken)` using the **Maigha** Firebase web config (section 3).
8. Navigate to sanitized `next` (same-app relative path starting with `/`, not `//`, no `://`) or your default home route.
9. On any failure: show a clear error and a link back to Tapreco login.

### 4.3 CORS (required for browser exchange)

`portal-token` is called from **your app’s origin** in the browser. Maigha must add your origin to API `CORS_ORIGINS` (**M2**). Until then, the exchange fails with a CORS error even if the route exists.

### 4.4 After session exists

- Call your own backend with the user’s Firebase ID token as usual.
- **Do not** create a database user automatically because handoff succeeded.
- If your user row is missing for that Firebase UID → show a clear “not provisioned” / contact-admin message and end the session (do not silently create).

### 4.5 Unauthenticated deep links

If someone opens your app without a session → redirect to:

```text
{VITE_PORTAL_URL}/login?app=<portal-tool-id>
```

Use the exact ids from section 2 (`mutual-fund`, `estimated-tax`, `audit-risk-analyzer`, `entity-comparison`).

Optional: include a `next` return URL only after Maigha allowlists your origin (**M2** / **U6**).

---

## 5. Users and activity (Upsilon shared Postgres)

| Requirement | Rule |
|---|---|
| Shared users | One user per Firebase UID across all four apps |
| Provisioning | Explicit create/link agreed with Maigha; handoff never creates users |
| Backend | Verify Firebase ID tokens; resolve local user from verified UID; never trust a client-supplied user id |
| Saved work / activity | Link to local user id; enforce ownership; include app id when tables are shared |
| Access model | Authentication + ownership only — **no firm RBAC** |

---

## 6. Agent summary (Upsilon)

| Question | Answer |
|---|---|
| Do we need Maigha UI / portal source code? | **No** — this doc is the contract |
| What must we build first? | **U2–U4**: `/auth/portal` + `portal-token` + `signInWithCustomToken` |
| What does the portal send us? | Navigation to `/auth/portal#token=…` (optional `&next=`) |
| What API do we call? | `POST {VITE_APP_API_URL}/v1/auth/portal-token` with `Authorization: Bearer <token>` (no body) |
| Success body? | `{ "customToken": "…" }` |
| CORS? | Your origin must be allowed on Maigha API (**M2**) |
| May we auto-create DB users on login? | **No** |
| When are we “done” for one app? | Hosted URL to Maigha + receive works + provisioned user can use APIs |
| What does Maigha do after we send the URL? | Wire env (M1), CORS/allowlist (M2), joint verify (M4) |

---

## 7. Code sync notes (Maigha maintainers)

Keep this section accurate when portal/API handoff behavior changes:

| Behavior | Implementation |
|---|---|
| Tool ids + live/soon from URL env | Portal `apps.js` + `handoff.js` `APP_URL_ENV` / `getAppOrigin` |
| Send URL shape | `openInApp({ appId })` → `{origin}/auth/portal#token&next` |
| Tile → home → Open | Landing/Choose → `/tools/:id` → `Soon.jsx` Open when `tool.live` |
| Token exchange | API `POST /v1/auth/portal-token` → `{ customToken }` (Firebase custom token for same UID) |
| Local stub receivers (optional) | Outside Kaygha: `D:\upsilon-handoff-stubs` → `npm start` (ports 3011–3014); not Upsilon product |
