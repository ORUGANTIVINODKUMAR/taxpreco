# Tapreco Portal Integration Phase 0 Check

Date: 8 October 2026
Branch: feature/tools-integration
Status: Phase 0 discovery completed; Phase 1 awaits explicit user approval.

## Scope and approval checkpoint

This phase validates the Mutual Fund baseline and identifies integration inputs. The user requires approval before advancing to each next phase. No Phase 1 receiver, Firebase session implementation, migration, seed, or hosting work has started.

## Confirmed results

| Check | Result |
| --- | --- |
| Repository instructions | No AGENTS.md found at checked ancestor, app/service package, or docs paths. |
| Existing source baseline | Tracked file content matches Git index after LF normalization; no application files edited in this phase. Git CLI was unavailable, so this is not a complete git status report. |
| Mutual Fund | Existing local server responds HTTP 200 on http://localhost:5175/. |
| Shared tools-api | Existing local server responds HTTP 200 on http://localhost:4000/health with service tools-api. |
| API authentication baseline | GET /api/me without credentials returns HTTP 401, as expected. |
| Frontend configuration | All seven required portal/API/Firebase variable names are present and nonempty; no obvious placeholder values detected. Values were not printed. |
| Firebase project | VITE_APP_FIREBASE_PROJECT_ID matches maigha-taxpro. |
| API separation | VITE_APP_API_URL and VITE_TOOLS_API_URL are distinct, valid origin URLs without URL credentials. |
| Configured destinations | Portal and Maigha API are non-local destinations; tools-api is configured locally. This validates URL shape, not hosted availability or Firebase credentials. |
| Node and installed tools | Node v24.18.0; existing Vite, TypeScript and pg dependencies available. |
| Firebase dependencies | Firebase client SDK and firebase-admin are not installed in the respective inspected app/service node_modules and are not declared in their current packages. |
| Backend environment | PORT, JWT_SECRET and DATABASE_URL are present. No backend Firebase setup variables were observed in its .env. |
| Database connectivity | Successful connection and metadata/count queries inside an explicit read-only transaction, followed by ROLLBACK. |
| Current public database tables | mutual_fund_sessions only; no common users table in public schema. |
| Existing work | 5 Mutual Fund rows, zero missing/empty owner values, one distinct owner value. Individual user/client/form values were not fetched or printed. |
| Ownership schema | user_id is nullable TEXT; no foreign keys on mutual_fund_sessions. Existing owner values are not yet established as local-user IDs or Firebase UIDs. |
| tools-api CORS baseline | Health and identity responses contain Access-Control-Allow-Origin: *. No allowlist implemented yet. |
| Local portal/stub processes | localhost:3005 and localhost:3011 refused connections at check time. This does not establish availability of the separately configured hosted portal. |

Both application servers were already running and were reused. No server was launched or stopped. In particular, the API startup table-creation routine was not invoked by this phase.

## Maigha exchange CORS remains unverified

A token-free OPTIONS preflight was sent to the configured Maigha /v1/auth/portal-token endpoint with Origin http://localhost:5175, requested method POST, and requested header authorization. It timed out once with a 20-second request timeout and again with a 45-second timeout.

No HTTP response or CORS headers were obtained. Do not interpret this as confirmed CORS rejection, confirmed API outage, or an invalid token. Hosted API reachability and allowance of the actual Mutual Fund browser origin are **Needs confirmation**. No bearer token or exchange POST was sent.

Phase 1 can be implemented and validated with controlled exchange responses after approval. A real handoff cannot be accepted as end-to-end working until Maigha exchange availability/CORS and a real portal launch are verified.

## Inputs for subsequent phases

| Input | Needed by | Status |
| --- | --- | --- |
| Approval to implement receive route | Phase 1 | Awaiting user approval. |
| Reachable Maigha exchange and local-origin CORS | Real Phase 1 integration test | Needs confirmation; preflights timed out. |
| Portal launch destination for Mutual Fund | Real handoff test | Coordinate switching from stub port 3011 to the actual app origin when the receiver is ready. No portal edits made here. |
| Initial seed records with exact Firebase UIDs | Phase 3 | Not supplied in this conversation. One approved user is sufficient for initial validation. |
| Explicit seed/import format | Phase 3 | Finalize with the supplied user list. Never auto-create users on login. |
| Ownership mapping for 5 existing rows | Phase 3 | Needs confirmation. Preserve records and do not infer ownership from the one existing distinct owner value. |
| Server Firebase verification setup | Phase 4 | Needs confirmation. Current JWT_SECRET verifier is not the Firebase contract. |

## Readiness and limits

The Mutual Fund source and local server baseline are ready for Phase 1 coding. The receive route and token exchange are not implemented. Firebase web configuration was checked structurally without signing in, so credential validity remains untested. The database is reachable, but common users and ownership migration are future work. No builds or calculator tests were run during this read-only discovery phase.

## Next phase after approval

Implement only Phase 1: /auth/portal receive, immediate hash removal, sanitized next handling, Maigha token exchange, and clear receive/error states. Handle StrictMode replay without duplicate exchanges. Keep the workspace gated for that receive flow. Do not add Phase 2 Firebase session persistence, create users, seed data, migrate tables, or deploy until the relevant next phase is approved.

## Changes made

Added this results document and linked it from the implementation plan. Temporary read-only check scripts/results were removed after verification. Application code, .env files, dependencies, running services, and database records/schema remain unchanged.

## Later Maigha API verification

Maigha supplied http://192.168.0.74:3000 as the API origin. After their CORS change, OPTIONS /v1/auth/portal-token returned HTTP 204 allowing http://localhost:5175, POST, and Authorization. A later deliberately invalid token POST returned HTTP 401 with the matching CORS origin. These checks supersede the earlier hosted-endpoint timeout for the current LAN configuration; successful real-token exchange is still unverified. See [Phase 1 results](TAPRECO_PORTAL_INTEGRATION_PHASE_1_RESULTS.md).
