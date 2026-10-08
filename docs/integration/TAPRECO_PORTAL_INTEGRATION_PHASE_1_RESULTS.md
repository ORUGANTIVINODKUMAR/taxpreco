# Tapreco Portal Integration Phase 1 Results

Later status: The user confirmed a successful real-user Phase 1 exchange. Phase 2 was subsequently approved; see [Phase 2 results](TAPRECO_PORTAL_INTEGRATION_PHASE_2_RESULTS.md) for current behavior.

Date: 8 October 2026
Status: Phase 1 implemented and locally verified. Phase 2 awaits explicit user approval.

## Implemented scope

Mutual Fund now recognizes /auth/portal, captures the hash token once before React mounts, and immediately removes the hash before starting an exchange. It preserves only clientId/taxYear query context and drops other query fields on this receive path. The existing calculator home remains intact; the receive path renders a separate gated status screen.

The receiver sends POST to VITE_APP_API_URL + /v1/auth/portal-token with the Authorization Bearer header and no body. It validates the returned customToken and handles missing token/configuration, server errors, malformed JSON/response, network failure, and a 20-second timeout. Reflected handoff tokens are redacted from displayed server error messages. No tokens are logged or manually persisted.

next is normalized and checked against same-origin app paths, encoded unsafe values, control characters/backslashes, and recursive receive destinations. The resulting safe destination is available to the next integration step, but Phase 1 does not navigate into the workspace.

A successful exchange displays that the handoff was received and sign-in is not enabled yet. The custom token is deliberately discarded in this phase. Phase 2 will connect the validated response directly to Firebase signInWithCustomToken rather than storing it. Refreshing the cleaned receive URL currently shows a missing-token error; refresh persistence belongs to Phase 2.

## Files changed

| File | Change |
| --- | --- |
| apps/mutual-fund-web/src/portalHandoff.ts | Capture/clear, exchange, config validation, safe next and login URL, error handling |
| apps/mutual-fund-web/src/PortalHandoff.tsx | Receiving, error and exchange-success screen; shared promise across StrictMode effects |
| apps/mutual-fund-web/src/PortalHandoff.css | Scoped responsive status-screen styles |
| apps/mutual-fund-web/src/main.tsx | Select receive screen at /auth/portal before React mounts |
| apps/mutual-fund-web/tests/portalHandoff.test.mjs | Nine meaningful contract/failure-path tests using Node test runner |
| apps/mutual-fund-web/package.json | Added test:handoff script; no dependencies added |
| apps/mutual-fund-web/.env | Changed only VITE_APP_API_URL to the supplied LAN origin http://192.168.0.74:3000; file remains local/ignored |

No backend source, database records/schema, stubs, portal source, or other frontend apps were changed. Firebase client SDK installation and session persistence have not started.

## Validation results

| Check | Result |
| --- | --- |
| npm run test:handoff equivalent | 9 tests passed; no failures |
| Frontend ESLint | Passed |
| TypeScript build | Passed |
| Vite production build | Passed |
| Browser success with controlled response | Passed in headless Edge against isolated preview |
| StrictMode browser behavior | Exactly one POST for a handoff |
| Hash clearance | Confirmed before releasing the controlled exchange response |
| Receive workspace isolation | No Save to Database controls rendered during receive or after exchange |
| Browser error and missing token | Clear messages and correctly formed Tapreco login link |
| Existing calculator home | Still renders on / |
| Mobile layout | Checked at 390px width; no horizontal overflow |
| Existing Vite on localhost:5175 | Confirmed updated receiver and LAN API configuration are served |
| Maigha live invalid-token POST | HTTP 401 with Access-Control-Allow-Origin http://localhost:5175 |

Positive exchange/browser tests used controlled responses and fake tokens that were intercepted, not real user credentials. A real successful Tapreco-token exchange is **Needs confirmation** through a portal launch; the invalid-token live check proves reachability/error transport, not successful authentication.

The isolated test preview on port 5195 was owned by this task and stopped after testing. Existing application servers on 5175/4000 were preserved. Temporary screenshots were removed after visual review. Production build output is generated under ignored dist.

## How to verify with Maigha

When Maigha points VITE_MUTUAL_FUND_URL to http://localhost:5175 and sends a real signed-in launch, Mutual Fund should open /auth/portal, clear the fragment, and show the handoff-success screen after exchange. If the portal runs on a different computer, localhost refers to that computer; use a reachable frontend origin and corresponding CORS/Vite host configuration instead. Do not change network exposure automatically.

Opening http://localhost:5175/auth/portal directly without a handoff is expected to show the missing-token message. Do not paste real tokens into chat, logs, or permanent test files.

## Next approval checkpoint

Phase 2 is Firebase client initialization, signInWithCustomToken, Firebase-managed refresh persistence, and auth-state handling. Backend Firebase verification, users seeding, and owner-scoped database access remain later phases. No next phase will begin without user approval.

## LAN recheck — 8 October 2026

The local testing configuration now uses Mutual Fund at http://192.168.0.175:5175, Tapreco portal at http://192.168.0.74:3005, and Maigha API at http://192.168.0.74:3000. Vite's server configuration uses host 0.0.0.0 and strictPort true on port 5175. The computer's LAN IP is not hardcoded in Vite. VITE_PORTAL_URL in the local .env now points to the LAN portal. These settings supersede the localhost launch example above for this LAN test.

- Mutual Fund /auth/portal on the LAN returned HTTP 200.
- Tapreco portal returned HTTP 200.
- Maigha API preflight returned HTTP 204 with Access-Control-Allow-Origin http://192.168.0.175:5175 and permission for POST and Authorization.
- All nine handoff tests, ESLint, TypeScript and Vite production build passed again. npm.cmd was used because PowerShell blocks the npm.ps1 shim.
- Headless Edge against the running LAN app confirmed the missing-token screen and the login link to http://192.168.0.74:3005/login?app=mutual-fund. An intercepted fake-token exchange confirmed the configured API endpoint, immediate hash removal, exactly one request and the handoff-success screen.

The browser success check used a controlled response, not a real user token. A real successful portal-to-API exchange remains **Needs confirmation**. Open Mutual Fund from a signed-in Tapreco portal session to check that it shows "Tapreco handoff received" and removes the token fragment. Firebase sign-in and refresh persistence remain Phase 2 and were not implemented by this recheck.
