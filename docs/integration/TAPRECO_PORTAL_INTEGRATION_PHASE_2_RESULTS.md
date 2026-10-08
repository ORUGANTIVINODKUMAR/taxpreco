# Tapreco Portal Integration Phase 2 Results

Date: 8 October 2026

Status: Phase 2 implemented and verified with tests and controlled browser responses. Real-user Phase 2 sign-in/refresh verification: **Needs confirmation**. Phase 3 has not started.

## Phase 1 confirmation

The user confirmed that the real-user Phase 1 exchange looked good. This supersedes the previous pending real-token exchange status. The local app is http://192.168.0.175:5175, portal is http://192.168.0.74:3005, and Maigha API is http://192.168.0.74:3000.

## What changed

- Added Firebase web SDK and updated the app dependency lockfile.
- Initialized a single named Firebase app/auth instance using existing VITE_APP_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID and APP_ID. Missing settings or a project other than maigha-taxpro fail closed.
- Connected the exchanged custom token directly to signInWithCustomToken. Tokens are not displayed, logged or manually stored.
- Explicitly set browserLocalPersistence before sign-in and during restoration. Firebase manages credential persistence and refresh.
- Added separate receiving, restoring, signed-out, provisioning-pending and error states. Ready state remains unavailable until backend provisioning checks are implemented.
- A new handoff clears the old Firebase identity before signing in. Failures cannot expose the old session; auth changes replace the displayed identity state.
- A refresh without a token waits for Firebase restoration. It does not exchange a token again. Ordinary signed-out access redirects to the Tapreco login URL with app=mutual-fund; handoff failures stay on an error screen.
- Successful handoff replaces the URL with sanitized next or / and preserves clientId/taxYear query context. No calculator or database controls are rendered yet.
- Added getCurrentIdToken for future API integration. It calls the current Firebase user's getIdToken each time rather than caching an initial JWT. Existing save/load API calls are not connected to this helper until Phase 5.
- Added local sign-out to validate auth-state clearing. This does not sign out the separate Tapreco portal session.
- Added configuration names to .env.example without copying credentials.

Core files: src/firebaseAuth.ts, src/session.ts, src/SessionGate.tsx, src/main.tsx, src/portalHandoff.ts, tests/session.test.mjs, package.json and package-lock.json under apps/mutual-fund-web.

The existing calculator source is preserved, but its entry is now gated. No backend source, database schema/records, seeds, other tools or portal source was changed.

## Validation

| Check | Result |
| --- | --- |
| Existing handoff tests | 9 passed |
| New session tests | 6 passed |
| ESLint | Passed |
| TypeScript and Vite production build | Passed |
| Real Firebase SDK with intercepted fake API responses in Edge | Passed |
| Browser refresh without new handoff | Session restored; no additional exchange or custom sign-in |
| Browser current-token helper | Returned current SDK token without printing it |
| New account handoff | Replaced user A with user B |
| Local logout and direct signed-out visit | Redirected to configured portal login |
| Missing-token fragment | Error displayed, fragment removed |
| Workspace isolation | No database save controls rendered |

Browser tests used an isolated browser context and fake tokens, intercepting Maigha and Firebase endpoints. They prove app/SDK behavior, not live Firebase acceptance. Unit tests cover persistence failure, sign-in failure, failed exchange with an old session, auth changes, subscription cleanup and single-start behavior.

PowerShell blocks npm.ps1 on this machine; npm.cmd was used for checks without changing execution policy.

## Dependency audit

npm audit reports four high-severity entries arising from the Firebase package's unused Firestore dependency chain to @grpc/grpc-js (certificate authorization advisory GHSA-m9gg-hp2v-232j and error-disclosure advisory GHSA-f596-whhp-79r4). This app imports only firebase/app and firebase/auth; it does not use Firestore or start a gRPC server. The advertised automatic fix would downgrade Firebase to an older major version, so it was not applied. Dependency remediation remains an item for review before hosting or any Firestore use. This is separate from live sign-in verification.

## Real-user acceptance steps

1. From a logged-in Tapreco portal session, open Mutual Fund again.
2. Confirm the token fragment disappears and the app shows "Signed in to Mutual Fund".
3. Confirm the message says database provisioning/access checks are pending. This is expected; it does not mean the user is missing from an existing table, because provisioning lookup is not implemented yet.
4. Refresh. The signed-in screen should return without opening portal login or requiring another handoff.
5. Click "Sign out of Mutual Fund". Tapreco login should open. Its own portal session may still be active.

Persistence applies to the Firebase session on this browser origin, not unsaved calculator inputs. Switching between localhost and the LAN IP uses different browser origins and does not share the same persisted app session.

## Phase 3 seed request for Maigha

Recommended input: UTF-8 CSV with these exact headers:

```csv
firebase_uid,email,display_name
```

- firebase_uid: required exact Firebase Authentication UID from project maigha-taxpro. It must not be inferred from email or replaced with a portal database ID.
- email: optional profile field.
- display_name: optional profile field.
- One row per approved user; all four Upsilon tools will share this user entry.
- Do not include passwords, ID/custom/refresh tokens, password hashes or service-account keys.

Request one or two approved test users first if the full export is not ready. The importer/schema will be implemented in Phase 3 after approval. No user is created automatically at login. Existing saved-row ownership requires separate explicit mapping; this export alone does not reassign legacy work.

## Next checkpoint

Phase 2 does not require a seed. Phase 3 requires separate approval and approved UID records. Backend Firebase verification (Phase 4) and protected owner-scoped save/load (Phase 5) remain unimplemented.

References: [Firebase persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [Firebase custom-token sign-in](https://firebase.google.com/docs/auth/web/custom-auth).
