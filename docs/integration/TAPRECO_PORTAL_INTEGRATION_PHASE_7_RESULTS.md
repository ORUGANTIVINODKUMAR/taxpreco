# Phase 7: Tapreco integration for the other three tools

Date: 2026-10-08

Status: **Implementation complete; real Tapreco acceptance testing Needs confirmation.**

The user approved Phase 7 and explicitly approved reusing the existing Mutual Fund Firebase web-app registration. Phase 8 hosting has not started.

## What changed

Estimated Tax, Audit Risk Analyzer, and Entity Comparison now follow the working Mutual Fund authentication pattern:

1. Receive the portal handoff at `/auth/portal#token=...`.
2. Capture the handoff token once and immediately remove the fragment before React renders or a network request starts.
3. Exchange it with Maigha's `/v1/auth/portal-token` endpoint using the `Authorization` header and no request body.
4. Sign in using the returned Firebase custom token and the real Firebase web SDK.
5. Restore the Firebase session after refresh, using SDK persistence and token refresh.
6. Send a Firebase **ID token** to the shared tools-api `/api/me` endpoint. The custom token is only for Firebase sign-in.
7. Enable the workspace only after the backend verifies the token and finds the already-provisioned common user.

The original calculator screens remain visible during sign-in and account checks, with a small loading message and inert controls. There is no extra login form, JWT input, logout panel, or successful-login dialog. Errors have a clear message; temporary account-check failures have a retry button.

Each tool has `Home / Tools / Tool name` breadcrumbs in its existing header. Home points to the configured Tapreco portal origin; Tools points to `/choose`.

Existing calculator styles, fonts, and calculation logic were retained. Entity Comparison's scenario editing, reports, and hash navigation remain available. Its normal portal handoff opens `/#entity-comparison`; an explicit safe `next` value is respected. Its old unauthenticated `/api/me` call and legacy Vite API proxy were replaced with the shared authenticated API path.

## App names, routes, and portal destinations

| Frontend | Portal app ID | Maigha portal variable | Configured LAN origin | Internal tools-api status route |
| --- | --- | --- | --- | --- |
| Entity Comparison | `entity-comparison` | `VITE_ENTITY_COMPARISON_URL` | `http://192.168.0.175:5173` | `/api/tools/entity-comparison/status` |
| Mutual Fund (previous phases) | `mutual-fund` | `VITE_MUTUAL_FUND_URL` | `http://192.168.0.175:5175` | `/api/tools/mutual-fund/status` |
| Estimated Tax | `estimated-tax` | `VITE_ESTIMATED_TAX_URL` | `http://192.168.0.175:5176` | `/api/tools/estimated-tax/status` |
| Audit Risk Analyzer | `audit-risk-analyzer` | `VITE_AUDIT_RISK_ANALYZER_URL` | `http://192.168.0.175:5177` | `/api/tools/audit-risk/status` |

The audit portal ID and existing backend route ID are intentionally different. The frontend helper explicitly uses `audit-risk` for the protected backend status route.

Maigha should set the portal variables to the **origins above**, without adding `/auth/portal`. The existing portal sender adds the receive path and handoff fragment. The stubs do not need a forwarding implementation. Actual changes in Maigha's running portal are **Needs confirmation**.

These are configured addresses, not a claim that the three new development servers are currently running. Automated browser tests used temporary ports 5197-5199 and stopped those servers afterward.

## Environment configuration

The three new frontend `.env` files now contain the approved public Firebase settings copied from Mutual Fund. Backend Admin credentials were not copied. Each frontend initializes its own named Firebase app/session while using the same approved Firebase registration and project, `maigha-taxpro`.

| Frontend variable | Local role |
| --- | --- |
| `VITE_PORTAL_URL` | Tapreco portal: `http://192.168.0.74:3005` |
| `VITE_APP_API_URL` | Maigha handoff exchange API: `http://192.168.0.74:3000` |
| `VITE_TOOLS_API_URL` | Shared tools-api: `http://192.168.0.175:4000` in the newly prepared templates/configuration |
| `VITE_APP_FIREBASE_API_KEY` | Approved Firebase web configuration |
| `VITE_APP_FIREBASE_AUTH_DOMAIN` | Approved Firebase web configuration |
| `VITE_APP_FIREBASE_PROJECT_ID` | `maigha-taxpro` |
| `VITE_APP_FIREBASE_APP_ID` | Existing registration, reused with explicit user approval |

Additional public Firebase fields already present in Mutual Fund were also copied. The SDK authentication initializer requires the four listed Firebase fields. `.env.example` files document the required names with blank registration values rather than committing credentials/configuration from the local `.env` files.

Git ignore checks confirmed all three frontend `.env` files are excluded. Their values were not printed during this work. No handoff token or Firebase token is manually written to browser storage, application logs, or source files; Firebase manages its own session persistence.

The backend `.env`, `.env.example`, and default local CORS configuration now allow the localhost and `192.168.0.175` origins for ports 5173, 5175, 5176, and 5177. Unknown origins remain disallowed. The current backend process must restart to load the changes.

## Common users and database responsibilities

There is still one shared tools-api and one shared PostgreSQL database. No new per-app users table, user seed, migration, or saved-work table was created in Phase 7.

The backend verifies the Firebase ID token, obtains the verified UID, and looks up that UID in the existing common users table. It returns the existing local user ID; it does not create users on login. An unprovisioned user is denied access. A new handoff replaces the previous user session; failed handoffs cannot fall back to the previous user.

Mutual Fund's existing owner-filtered persistence remains unchanged. Phase 7 did not change or delete database rows.

Estimated Tax and Audit Risk still contain their existing placeholder features. These three apps do not currently have implemented PostgreSQL scenario save/load flows. Their login persists after refresh; their existing in-memory calculator edits do not gain database persistence from this authentication work. Sample client/year controls and illustrative data in their existing screens are not identities supplied by portal login.

## Validation

- Production build and lint passed for all three integrated apps.
- Each app's handoff/session suite passed: 17 tests per app, 51 total.
- All 20 browser tests passed. The suite uses the real Firebase web SDK with test-only REST fixtures; no authentication bypass was added to application code.
- Browser checks cover immediate fragment removal, a single exchange under React StrictMode, Bearer ID-token requests, persistent sessions after refresh, account switching, missing tokens, failed replacement handoffs, unprovisioned users, protected status-route mappings, and inert controls during provisioning.
- Entity Comparison's existing calculation, report, navigation, catalog fallback, and responsive layout regression checks passed. Screenshots of all three tools were inspected.
- All nine backend authentication tests passed, including real seeded-user lookup and a new CORS check for all eight configured local origins. These checks did not insert users or modify saved work.

Test fixtures prove application behavior; they do not prove that Maigha's currently running portal/API has the required configuration. Real-user tests for these three apps are **Needs confirmation**.

## Local setup items found

### 1. Port 5176 is occupied by an older Mutual Fund preview

The listener inspection identified a Vite process from `C:\Integration\taxpreco\apps\mutual-fund-web` listening on `::1:5176`. This is a different checkout and is not the new Estimated Tax server. It was left running.

Stop that older preview from its terminal before starting Estimated Tax on its agreed port. Do not change Maigha's portal mapping to an unexpected replacement port. All three new Vite configurations use `host: '0.0.0.0'` and `strictPort: true`.

### 2. The running backend has not loaded the new CORS origins

Token-free preflight checks against the existing process on port 4000 allowed Mutual Fund's LAN origin but returned no allowed-origin header for ports 5173, 5176, or 5177. The updated code/configuration passes isolated CORS tests. Restart the backend from this checkout to apply it.

Resolved during the subsequent account-check investigation: the verified tools-api process was restarted from this checkout. Live preflight checks now return HTTP 204 and the correct allowed-origin header for all four LAN frontend origins. PostgreSQL connected successfully. `/api/me` without a token still returns HTTP 401. Retry the real-user account checks in the three apps; their positive responses remain **Needs confirmation**.

### 3. Maigha's CORS availability remains Needs confirmation

Preflight requests to `http://192.168.0.74:3000/v1/auth/portal-token` for the three new LAN origins could not complete within the timeout. This does not establish whether Maigha's CORS configuration is correct or incorrect. Confirm the API is reachable, then allow the three exact origins and the `Authorization` header for the POST exchange.

### 4. Existing Firebase dependency advisories

`npm audit` reports four high-severity findings in the installed Firebase dependency chain: `firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, and `@grpc/grpc-js`. The application imports Firebase app/auth, but the installed package includes the affected Firestore dependencies. No forced dependency upgrade was applied. Dependency remediation remains a review item before hosting.

## Start and acceptance steps

After stopping the older port-5176 preview and the previous tools-api process, use separate terminals from this repository:

```powershell
# Terminal 1
cd services/tools-api
npm.cmd start
```

```powershell
# Terminal 2
cd apps/estimated-tax-web
npm.cmd run dev
```

```powershell
# Terminal 3
cd apps/audit-risk-web
npm.cmd run dev
```

```powershell
# Terminal 4
cd apps/entity-comparison-web
npm.cmd run dev
```

For each app, Maigha should replace the stub URL, restart/rebuild the portal as appropriate, and confirm exchange API CORS. Then:

1. Log in to the real Tapreco portal and click the tool's Open action.
2. Confirm the real tool opens and the handoff fragment disappears.
3. Confirm `/api/me` succeeds with the same provisioned identity used in Mutual Fund.
4. Refresh and confirm access remains available without another manual login.
5. Check Home and Tools breadcrumbs, existing tool behavior, and switching to another provisioned account.

Do not paste a real token into documentation or screenshots. The earlier Mutual Fund client/year persistence decision remains separate from Phase 7.

**Phase 7 exit:** implementation and automated validation are ready; local process setup and the three real portal acceptance checks remain **Needs confirmation**. Phase 8 requires the user's separate approval.
