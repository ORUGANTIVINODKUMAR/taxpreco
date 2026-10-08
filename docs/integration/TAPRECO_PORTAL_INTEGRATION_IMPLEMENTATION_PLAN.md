# Tapreco Portal Integration Implementation Plan

Date: 8 October 2026

## Scope and phase order

Implement Mutual Fund first using apps/mutual-fund-web, services/tools-api, and the shared PostgreSQL database. Core Tapreco is Maigha's running portal, and Taxpro is already working. Tapreco supplies login and launches all four Upsilon tools. No replacement portal is required.

This document describes the implementation sequence. Approved Phases 0-5 have now been completed; later phases remain pending. Read the [analysis](TAPRECO_PORTAL_INTEGRATION_ANALYSIS.md) and [handoff contract](../PORTAL_MULTI_APP_HANDOFF_INTEGRATION_PLAN.md) first.

| Phase | Deliverable | Dependency |
| --- | --- | --- |
| 0 | Confirm local inputs and baseline | Existing Mutual Fund configuration |
| 1 | Receive handoff and exchange token | Phase 0 and Maigha browser CORS |
| 2 | Persistent Firebase session | Phase 1 |
| 3 | Common users and explicit provisioning | Approved Firebase UID seed data |
| 4 | Backend Firebase verification and user resolution | Phase 3 and server setup |
| 5 | Protected workspace and owned save/load | Phases 2 and 4 |
| 6 | Full local validation and logout | Phases 1-5 |
| 7 | Other three apps | Mutual Fund acceptance |
| 8 | Hosting and public portal URLs | Deferred |

Phase 3 can proceed alongside frontend phases when its inputs are ready. Phases 1-2 prove authentication receive; they do not permit access to real saved data before provisioning and ownership work is complete.

## Phase approval status

The user requires explicit approval before each next phase. Phase 0 discovery is complete. Phase 1's real-user exchange was confirmed by the user. Phase 2 was approved and implemented; automated and SDK browser checks passed, while real-user Firebase sign-in/refresh verification is pending. Phase 3 was approved using the supplied Maigha CSV: all 40 users are provisioned, repeat import and database tests passed, and the 5 legacy saved rows remain unchanged. Read [Phase 0 results](TAPRECO_PORTAL_INTEGRATION_PHASE_0_CHECK.md), [Phase 1 results](TAPRECO_PORTAL_INTEGRATION_PHASE_1_RESULTS.md), [Phase 2 results](TAPRECO_PORTAL_INTEGRATION_PHASE_2_RESULTS.md), and [Phase 3 results](TAPRECO_PORTAL_INTEGRATION_PHASE_3_RESULTS.md). Maigha LAN API CORS passes for http://192.168.0.175:5175. Legacy ownership mapping remains unconfirmed. Phase 4 was approved, implemented and activated on port 4000; eight authentication test groups and live negative-token/CORS checks passed. Real-user positive backend acceptance was confirmed by the user: /api/me returned HTTP 200 with code ok. See [Phase 4 results](TAPRECO_PORTAL_INTEGRATION_PHASE_4_RESULTS.md). Phase 5 was approved, implemented and activated: owner-scoped persistence, frontend provisioning gate, 27 automated test groups and controlled browser checks passed. See [Phase 5 results](TAPRECO_PORTAL_INTEGRATION_PHASE_5_RESULTS.md). The user reports Phase 6 manual testing complete. See [Phase 6 review](TAPRECO_PORTAL_INTEGRATION_PHASE_6_RESULTS.md). Missing client/year behavior remains an unresolved persistence decision after the UI controls were removed. Phase 7 has not started and requires separate approval.

## Phase 0 Confirm local inputs

1. Check applicable repository instructions and preserve unrelated changes.
2. Validate existing Mutual Fund .env names without printing values. Confirm Firebase project maigha-taxpro and distinguish VITE_APP_API_URL from VITE_TOOLS_API_URL.
3. Run Mutual Fund on its configured port 5175 and tools-api on 4000. Root npm run dev still targets the older Entity Comparison stack.
4. Use upsilon-handoff-stubs in this workspace as the existing send/exchange reference. Its ports 3011-3014 are temporary destinations, not our app ports. When the Mutual Fund receive/session flow is ready for integration testing, coordinate changing Maigha's VITE_MUTUAL_FUND_URL from http://localhost:3011 to the actual Mutual Fund origin (normally http://localhost:5175), restart/rebuild the portal as appropriate, and add that origin to Maigha API CORS. The other three tools can continue pointing at stubs until ready. These portal changes belong to Maigha; this phase does not alter their source.
5. Obtain/confirm backend Firebase verification setup and approved seed/export records containing exact Firebase UIDs.
6. Inspect current Mutual Fund database rows and identify a safe ownership migration; do not alter records during inspection.

Exit: required inputs and local dependencies are identified. Missing seed records or verification credentials are **Needs confirmation**, not replaced by sample identities.

## Phase 1 Receive the Mutual Fund handoff

Primary area: apps/mutual-fund-web/src/main.tsx and App.tsx, plus focused receive and exchange modules as needed. A new routing framework is optional, not required solely for one receive path.

1. Recognize exact pathname /auth/portal before rendering the normal workspace.
2. Capture token and next from the hash once, immediately clear the hash with history.replaceState, and retain permitted non-token query context.
3. Keep the handoff token in memory only. Ensure React StrictMode does not lose it or trigger duplicate exchange requests.
4. Validate next against the contract and resolved same-origin rules; reject //, ://, backslash/control-character bypasses, and recursive receive destinations. Use the actual app home as fallback.
5. POST to VITE_APP_API_URL + /v1/auth/portal-token with Authorization: Bearer <captured-token> and no body.
6. Validate response status and a nonempty customToken. Handle JSON message errors, malformed responses, network failures, and CORS failures.
7. Show receiving/error states and a Tapreco login link. Missing token on the receive path is a clear error.
8. A new handoff supersedes any existing session. Hide old-user data during the exchange and do not silently fall back to the previous user on failure.

Validation: valid exchange, missing/invalid token, malformed response, unsafe next, network/CORS failure, and StrictMode replay. Confirm hash removal happens before the exchange completes and tokens do not appear in logs.

Exit: the app receives Maigha's exact contract and obtains a custom token. The workspace remains gated pending session and provisioning checks.

## Phase 2 Establish a persistent Firebase session

1. Add the Firebase web SDK; initialize a single app/auth instance from the existing VITE_APP_FIREBASE_* settings.
2. Set Firebase browser local persistence explicitly before signInWithCustomToken. Do not manually store JWTs in localStorage.
3. Sign in with the returned custom token and discard temporary exchange tokens.
4. Model initial restoration, receiving, provision checking, signed-out, ready, and error states separately. Subscribe to Firebase auth changes and clean up subscriptions.
5. On refresh without a hash, wait for session restoration before redirecting. A restored session does not require a new handoff.
6. Obtain a current ID token from the Firebase user when calling tools-api; do not keep a fixed copy of the initial token as the permanent credential.
7. Clear previous-user workspace data on sign-out or account change.
8. Ordinary signed-out access redirects to VITE_PORTAL_URL + /login?app=mutual-fund. Keep receive failures on an error screen with an explicit login link.

Validation: sign-in, refresh, current token retrieval, identity replacement, sign-out, and persistence failures. Session persistence does not imply persistence of unsaved form inputs.

Exit: correct Firebase identity survives refresh. Backend user resolution is still needed before ready state. [Firebase persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)

## Phase 3 Provision common PostgreSQL users

Primary area: services/tools-api database modules, with a versioned migration and a separate seed/import command.

1. Finalize one common users table: stable local id, unique required firebase_uid, optional email/display_name, and timestamps. Choose final ID type deliberately.
2. Use approved Tapreco export/seed records with exact Firebase UIDs. Do not create new Firebase accounts or map ownership by email alone.
3. Implement a repeatable administrative seed/import that validates rows, rejects conflicting mappings, and preserves stable local IDs when re-run.
4. Never invoke seeding from login, normal requests, or routine server startup. Keep passwords, tokens, and signing credentials out of seed records.
5. Plan the relation between saved work and users.id. Existing nullable TEXT mutual_fund_sessions.user_id values must be inspected and explicitly mapped; they are not automatically local IDs.
6. Preserve existing data. Review/back up real records before migration; unresolved legacy ownership stays inaccessible rather than being assigned to the next signed-in user.
7. Document the explicit command and seed input format. Do not promise ongoing automatic Maigha synchronization.

Validation: repeat seed creates no duplicates, invalid/conflicting UID rows fail clearly, existing local IDs remain stable, and legacy data remains protected.

Exit: approved test users are explicitly provisioned and the ownership migration is defined. Exact seed format and initial records remain **Needs confirmation** until supplied.

## Phase 4 Verify Firebase tokens in the backend

Primary files: services/tools-api/package.json, src/middleware/auth.js, src/middleware/context.js, and src/routes/context.js. Add server Firebase initialization and local-user lookup modules as appropriate.

1. Configure Firebase Admin verification for maigha-taxpro using approved private backend setup. Frontend Firebase configuration is not an Admin credential.
2. Replace the shared-secret JWT verifier for this flow with Firebase ID token verification. Do not silently allow JWT_SECRET tokens as an alternate authentication path.
3. Derive UID from verified identity and resolve the common local user. Never trust a request-supplied owner/user ID.
4. Keep verified firebase_uid and resolved local user id distinct in request context.
5. Adapt existing GET /api/me to return a verified, provisioned local user instead of adding an unnecessary duplicate identity endpoint.
6. Return 401 for missing/invalid identity. Proposed contract: 403 with code user_not_provisioned for a valid Firebase identity absent from Postgres. Separate database outages from missing-user results.
7. Keep all data routes behind verification and provisioned-user resolution. Public liveness endpoints may stay public.
8. Allow the actual Mutual Fund origin in tools-api CORS, with Authorization/Content-Type and required methods. Maigha exchange CORS is a separate configuration.

Validation: missing/invalid/expired token, wrong project, custom token misused as API credential, provisioned user, unprovisioned user, and database outage. Assert that authentication never inserts users.

Exit: data APIs trust only verified Firebase identity linked to an explicitly provisioned local user. [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

## Phase 5 Connect protected Mutual Fund save and load

Primary files: Mutual Fund App.tsx, api.ts, launchContext.ts, and tools-api/src/routes/mutualFund.js.

1. After sign-in/restoration, call /api/me. Enter ready state only after successful provisioning validation.
2. On user_not_provisioned, show contact-admin guidance and sign out without redirect loops. Offer retry for transient API failures without incorrectly reporting missing provisioning.
3. Replace the manual JWT textarea flow with current Firebase ID tokens. Preserve the calculator layout and avoid unrelated calculation redesign.
4. Keep clientId and taxYear as app-local context. Validate them and retain them through app navigation; do not require portal authentication claims for these fields.
5. Derive write ownership from the backend's resolved local user; ignore/reject attempts to set a different owner through the body.
6. Filter reads by local user id plus clientId and taxYear. Any record-level operation must check ownership too.
7. Display owned saved sessions and deliberately restore the selected session into form state. Do not overwrite unsaved inputs silently.
8. Preserve insert-per-save behavior unless a separate product decision requests updates/upserts. Validate submitted data and give useful save/load errors.
9. Include app IDs if genuinely shared work/activity tables are added. A dedicated Mutual Fund table does not require a generic activity subsystem for this milestone.

Validation: user A cannot read user B's records even with identical client/year; forged owner fields cannot change ownership; chosen load restores correct values; invalid context fails clearly; account switching clears previous-user results.

Exit: seeded users can use protected, owned save/load without manually pasting tokens.

## Phase 6 Verify the full local flow and logout

Run relevant frontend build/lint checks and backend integration tests. After isolated tests pass, verify a real Maigha portal handoff with seeded users. A mocked exchange alone does not prove integration.

| Scenario | Acceptance result |
| --- | --- |
| Portal Open | Handoff received, hash cleared, Firebase session established, local user resolved |
| Refresh without hash | Session restored and provisioning rechecked |
| Direct app visit without session | Redirect to Tapreco login with app=mutual-fund |
| Missing/invalid handoff | Clear error/login link and no workspace access |
| Unsafe next | Safe app home destination |
| Unprovisioned Firebase user | Contact-admin message, sign-out, no user insertion |
| Same client/year across two users | Owner isolation maintained |
| New user handoff over old session | New identity wins; no old-user data exposed |
| Local logout | Firebase signOut and displayed/cached data cleared |
| Backend failure | Accurate error; no insecure auth fallback |

Implement local Firebase signOut and a Return to Tapreco action using VITE_PORTAL_URL. Do not claim local sign-out also signs out Maigha's portal or other origins. Global logout and extended return-URL allowlists require a separate Maigha agreement.

Exit: critical cases pass using real handoff and provisioned identities. Hosting remains deferred.

## Phase 7 Apply the pattern to the other apps

After Mutual Fund acceptance, proposed sequence is Estimated Tax, Audit Risk Analyzer, then Entity Comparison. This ordering is a planning choice and can change with user priority.

Use the exact portal mappings in the analysis. Reuse common users and backend verification rather than duplicating per-app users. Validate each tool's Firebase web configuration; do not assume Mutual Fund's Firebase app ID is correct for every app.

Keep Entity Comparison's existing hash navigation separate from receive-hash parsing. Explicitly map audit-risk-analyzer to current internal audit-risk where necessary. Authentication completion does not mean placeholder calculators or absent persistence features are complete.

Exit: each integrated tool launches from Tapreco, restores its own session, resolves the same common local user, and protects its implemented APIs.

## Portal URL replacement after each app is ready

The existing Tapreco portal will replace its stub destinations with the real app origins. Do not implement forwarding inside the stubs. During local validation, switch the relevant portal variable to the real Vite origin; after hosting is requested, replace it with the hosted HTTPS origin.

| Portal variable | Temporary stub | Replacement destination |
| --- | --- | --- |
| VITE_MUTUAL_FUND_URL | localhost:3011 | Mutual Fund origin; local configured port 5175 |
| VITE_ESTIMATED_TAX_URL | localhost:3012 | Estimated Tax origin; local configured port 5176 |
| VITE_AUDIT_RISK_ANALYZER_URL | localhost:3013 | Audit Risk Analyzer origin; local configured port 5177 |
| VITE_ENTITY_COMPARISON_URL | localhost:3014 | Entity Comparison origin; local configured port 5173 |

Provide origins without /auth/portal appended; Maigha's sender adds that path and the handoff fragment. Update exchange CORS for each real frontend origin. Do not change VITE_APP_API_URL or VITE_TOOLS_API_URL merely because the portal launch destination changes: those variables identify different backend services.

Acceptance: clicking Open in Tapreco reaches the real app receiver directly, completes Firebase sign-in and provisioning checks, and no longer shows the stub page. A stub customToken success message alone does not satisfy this criterion.

## Phase 8 Hosting later

Hosting is deferred until requested. Later use four Static Sites, one shared tools-api Web Service, and one common PostgreSQL database. Each site must load /auth/portal directly; Maigha then sets exact portal origin variables and frontend CORS/return allowlists.

Public deployment does not block local preparation, but a real browser test still depends on Maigha local launch configuration and CORS.

## First milestone definition

Mutual Fund receives Tapreco's real handoff, restores Firebase login after refresh, resolves a seeded common local user, and saves/loads only that user's work. Missing provisioning rejects access without creating users. Local logout clears auth and user data. The remaining three apps and hosting are later phases.
