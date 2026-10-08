# Tapreco Portal Integration Analysis

Date: 8 October 2026

## 1 Purpose and agreed scope

Core Tapreco is Maigha's existing, running web portal. Taxpro is already working in that ecosystem, as confirmed by the user. The taxpreco repository contains the four Upsilon tools; the repository name does not identify the core portal.

Tapreco owns login and launching the four apps. Begin with Mutual Fund in apps/mutual-fund-web and services/tools-api. Integrate the other apps after Mutual Fund is verified. Hosting and staging are deferred.

This analysis and the companion implementation plan are documentation only. No application, environment, database, or deployment changes are made by these documents.

Reference: [Maigha handoff contract](../PORTAL_MULTI_APP_HANDOFF_INTEGRATION_PLAN.md). Implementation: [Phased implementation plan](TAPRECO_PORTAL_INTEGRATION_IMPLEMENTATION_PLAN.md).

## 2 Confirmed decisions

| Topic | Decision |
| --- | --- |
| Ownership | Maigha owns and runs Tapreco; Upsilon owns these four tools. |
| First app | Mutual Fund first. |
| Naming | Follow the handoff document exactly. |
| Token receive | Accept the Firebase ID token in the hash at /auth/portal; immediately remove the hash. |
| Configuration | Use the existing Mutual Fund .env Firebase and portal settings. |
| Common users | One shared PostgreSQL user record per Maigha Firebase UID across all four apps. |
| Provisioning | Explicit seed/import of Tapreco users; never automatic creation during login. Seeding is the proposed initial mechanism. |
| Client context | clientId and taxYear belong to Mutual Fund, not portal authentication. |
| Persistence | Firebase login survives refresh. |
| Access | Authentication and ownership only; no firm RBAC. |
| Deployment | Hosting and staging work deferred. |

These decisions resolve the earlier naming and fragment-handoff questions. Seed inputs and backend verification setup remain dependencies; do not reopen the resolved decisions as blockers.

## Existing portal and temporary handoff stubs

The local handoff stubs are present at upsilon-handoff-stubs in this repository. They are temporary Maigha test receivers, not the real Upsilon tools and not a replacement Tapreco portal. The supplied portal screenshot shows Tapreco at localhost:3005 with Tax Pro and the four Upsilon tool tiles. This is a screenshot observation, not a live service verification.

| Tool | Current stub origin | Portal variable to switch | Actual app configured local origin |
| --- | --- | --- | --- |
| Mutual Fund | http://localhost:3011 | VITE_MUTUAL_FUND_URL | http://localhost:5175 |
| Estimated Tax | http://localhost:3012 | VITE_ESTIMATED_TAX_URL | http://localhost:5176 |
| Audit Risk Analyzer | http://localhost:3013 | VITE_AUDIT_RISK_ANALYZER_URL | http://localhost:5177 |
| Entity Comparison | http://localhost:3014 | VITE_ENTITY_COMPARISON_URL | http://localhost:5173 |

The stub server defaults its Maigha API destination to localhost:3000 and portal destination to localhost:3005; these defaults can be overridden through its process environment. Its code starts four separate listeners, captures the hash token, clears the hash, and checks POST /v1/auth/portal-token. It reports whether a custom token was returned, but explicitly does not sign into Firebase. It has no PostgreSQL provisioning or tool-data integration. A successful stub exchange therefore proves only that part of the handoff.

Replacement means changing each launch URL in Maigha's portal configuration from the stub origin to the real tool origin. The portal then navigates directly to the real app /auth/portal receiver; the stub is not a proxy or redirect layer. Maigha must also allow the actual frontend origin in its exchange API CORS. Switch Mutual Fund first while the other tools may remain pointed at their stubs.

The stub README and code comments still mention D:\upsilon-handoff-stubs as an older location. The inspected local copy is upsilon-handoff-stubs under the taxpreco workspace. No stub code or portal configuration is changed by this clarification.

## 3 Authentication and data flow

    Maigha Tapreco login and tool launch
                  |
                  v
    Mutual Fund /auth/portal#token=...
      Capture token and next; immediately clear hash
                  |
                  v
    POST Maigha /v1/auth/portal-token
      Authorization: Bearer <portal Firebase ID token>
                  |
                  v
    Response customToken -> Firebase signInWithCustomToken
      Persistent session in project maigha-taxpro
                  |
                  v
    Current session Firebase ID token -> tools-api
      Verify identity -> resolve provisioned local user
                  |
                  v
    Shared PostgreSQL: common users and owned tool data

The custom token is for Firebase sign-in. Subsequent data API calls use the current Firebase user's ID token, not the custom token or a fixed copy of the handoff token. [Firebase custom authentication](https://firebase.google.com/docs/auth/web/custom-auth)

Each tool establishes a session on its own browser origin. A shared Firebase project does not automatically share browser storage across origins. Firebase-managed local persistence meets the refresh requirement; wait for initial session restoration before redirecting a user. [Firebase persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)

## 4 Exact names and API responsibilities

| Tool | Portal tool ID | Maigha portal launch variable |
| --- | --- | --- |
| Mutual Fund | mutual-fund | VITE_MUTUAL_FUND_URL |
| Estimated Tax | estimated-tax | VITE_ESTIMATED_TAX_URL |
| Audit Risk Analyzer | audit-risk-analyzer | VITE_AUDIT_RISK_ANALYZER_URL |
| Entity Comparison | entity-comparison | VITE_ENTITY_COMPARISON_URL |

The audit folder can remain apps/audit-risk-web. Its existing internal API ID audit-risk will need an explicit mapping to the portal ID audit-risk-analyzer.

| Mutual Fund variable | Purpose |
| --- | --- |
| VITE_PORTAL_URL | Tapreco login and return destination |
| VITE_APP_API_URL | Maigha token-exchange API origin |
| VITE_TOOLS_API_URL | Upsilon shared data API origin |
| VITE_APP_FIREBASE_API_KEY | Firebase web configuration |
| VITE_APP_FIREBASE_AUTH_DOMAIN | Firebase web configuration |
| VITE_APP_FIREBASE_PROJECT_ID | Must target maigha-taxpro |
| VITE_APP_FIREBASE_APP_ID | Maigha-supplied Firebase web app identifier |

Optional contract names: VITE_APP_FIREBASE_STORAGE_BUCKET, VITE_APP_FIREBASE_MESSAGING_SENDER_ID, and VITE_APP_FIREBASE_MEASUREMENT_ID. The existing Mutual Fund .env contains these names; correct values and runtime integration still require validation. Do not copy environment values into docs.

VITE_APP_API_URL and VITE_TOOLS_API_URL are different destinations. Keep DATABASE_URL private on the backend. Frontend Firebase settings do not supply backend Admin credentials. The current JWT_SECRET verifier must be replaced for this Firebase flow.

## 5 Receive and session rules

1. Recognize exact pathname /auth/portal and capture token plus optional next once.
2. Immediately clear the hash with history.replaceState. Keep the captured token only temporarily in memory; never log it or manually persist it.
3. POST to VITE_APP_API_URL + /v1/auth/portal-token with the Bearer header and no body.
4. Validate the successful response contains customToken; sign in with the Firebase client SDK.
5. Verify local provisioning through tools-api before showing the workspace.
6. Navigate to sanitized same-app next or the actual Mutual Fund home route.

Sanitizing next means applying the contract's leading slash, no //, and no :// rules, checking the resolved origin, rejecting backslash/control-character bypasses, and avoiding recursive handoff destinations. Do not assume /dashboard exists.

A fresh handoff takes precedence over an older stored session. Do not display old-user data during replacement sign-in. Ordinary refresh restores the session without repeating token exchange. Handle React StrictMode effect replay without duplicate exchanges or losing the captured token.

A receive URL without a token shows an error and login link. Ordinary signed-out access redirects to VITE_PORTAL_URL + /login?app=mutual-fund. An unprovisioned user sees contact-admin guidance and is signed out without a redirect loop. Transient backend failure must not be mislabeled as missing provisioning.

## 6 Shared users and explicit seeding

Tapreco already has users. Create corresponding local records using their exact Firebase UIDs through an explicit administrative seed/import. Do not create Firebase accounts, use email as the identity key, or insert users during login/API requests.

Proposed common users table: stable local id; unique required firebase_uid; optional email/display_name; created_at and updated_at. Final column types and import format are to be settled during implementation. Saved work references the local id resolved from the verified UID.

Seed runs should validate input, reject conflicting mappings, preserve stable local IDs, and be repeatable without duplicates. Seed records must contain no passwords, tokens, or signing credentials. This scope does not promise ongoing automatic synchronization with Maigha.

The exact Tapreco export, first seed records containing Firebase UIDs, seed format, and backend Firebase verification setup are **Needs confirmation**. A Firebase user without a local row is not provisioned and must not gain access.

## 7 Mutual Fund context and ownership

clientId and taxYear identify Mutual Fund work, not user identity. Mutual Fund owns their selection, validation, and retention. Existing app-local query context can continue; do not require the portal to send these fields as login claims.

Reads must filter by resolved local owner plus clientId and taxYear. Writes derive ownership from backend identity regardless of submitted owner fields. Two users with identical client/year values must not see each other's records. No firm or shared-client access policy is introduced.

Existing mutual_fund_sessions.user_id is nullable TEXT holding old token-derived identities. Inspect and explicitly map old data before moving to local-user ownership. Preserve old rows and keep unresolved ownership inaccessible; never assign legacy records to whoever logs in next.

Login persistence does not imply autosaving unsaved calculator inputs. Load currently logs rows; displaying and restoring chosen owned work belongs to the data integration phase.

## 8 Current implementation gaps

| Area | Current state | Required work |
| --- | --- | --- |
| Mutual Fund login | Manual token textarea; Firebase dependency absent | Receiver, Firebase SDK and session lifecycle |
| /auth/portal | Not implemented | Exact receive contract |
| Refresh | Manual token held in React state | Firebase-managed persistence and restoration |
| Backend auth | jsonwebtoken with JWT_SECRET | Firebase ID token verification |
| Shared users | No users table in inspected initialization | Migration and explicit seed/import |
| Ownership | Reads use client/year only | Scope reads/writes to local user |
| Load | Console logging | Display/restore selected saved records |
| Root scripts | Older Entity Comparison API | Run tools-api explicitly for this integration |

## 9 Dependencies and completion

Local end-to-end verification needs a real Maigha handoff, correct existing web settings, backend Firebase verification setup, seeded UID records, and migration review. Maigha must allow the actual Mutual Fund browser origin on its exchange API; tools-api must separately allow that origin for data calls. Normally Mutual Fund is http://localhost:5175. Hosting is deferred, but local CORS remains necessary.

The first milestone is complete when a seeded Tapreco user opens Mutual Fund without a second login form, refresh restores the Firebase session, the backend resolves the common local user, and owned save/load works. Missing provisioning ends access without creating users. Local logout clears Firebase auth and displayed/cached user data.

Local logout does not automatically log out the portal or other tool origins. Global logout and future return-URL extensions require a separate Maigha contract. Hosting, calculator redesign, and the remaining three apps are later work.
