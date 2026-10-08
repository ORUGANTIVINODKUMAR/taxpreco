# Tapreco Portal Integration Phase 4 Results

Later status: Phase 5 replaced the temporary saved-work gate with owner-scoped persistence. See [Phase 5 results](TAPRECO_PORTAL_INTEGRATION_PHASE_5_RESULTS.md) for current behavior.

Date: 8 October 2026

Status: Phase 4 approved, implemented, tested and activated locally on port 4000. Real-user backend acceptance confirmed by the user with HTTP 200 and code ok. Phase 5 has not started.

## Backend identity flow

Mutual Fund Firebase session -> current Firebase ID token in Authorization: Bearer -> Firebase Admin SDK verification -> exact verified UID lookup in public.users -> stable local UUID in request context.

The backend uses project maigha-taxpro. Existing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY settings were found in services/tools-api/.env. The Admin instance initialized successfully without printing credential values. Escaped newline sequences in the private key are converted before initialization. Partial explicit credential settings or the wrong project fail startup. Production verification rejects Firebase Auth emulator configuration.

Basic token verification can also initialize with an explicit project ID without inline service-account fields; default SDK credentials can be used if configured. A private key is not required solely to validate signatures using Google's public certificates. Earlier statements treating private credentials as universally mandatory were too broad. The supplied credentials are used when present.

The SDK verifies signatures, expiry and project claims. The backend accepts Firebase ID tokens, not custom tokens or the earlier JWT_SECRET-signed tokens. JWT_SECRET remains in the local environment but is not used by authentication. No alternate shared-secret verification path exists.

Revocation/disabled-account lookup is not enabled: verifyIdToken is called without checkRevoked. Consequently this phase does not promise immediate rejection of a previously issued token following Firebase account disabling or session revocation; normal expiry/signature checks apply. The seeded database user must also exist on every protected request.

## API behavior

| Condition | Response |
| --- | --- |
| Missing/malformed/invalid/expired token | 401, code unauthenticated |
| Certificate/network verification unavailable | 503, code auth_unavailable |
| Valid identity absent from public.users | 403, code user_not_provisioned |
| User database lookup unavailable | 503, code database_unavailable |
| Valid provisioned identity on GET /api/me | 200, mode firebase and local user profile |
| Provisioned identity on Mutual Fund saved-work routes | 503, code ownership_integration_pending, until Phase 5 |

GET /api/me returns authenticated, mode and user containing id (local UUID), firebaseUid, email and name. These are separate identity values. GET /api/context and protected tool status routes also require a verified and provisioned user. Context is derived from the database/verified UID; request body/query owner IDs and token clientId claims cannot replace it. clientId/taxYear remain Mutual Fund request context for the later ownership phase.

No login request inserts users. Public health routes and the public tool catalog remain public. No firm RBAC is introduced. Errors omit private SDK/database details and token values.

## Saved-work access remains gated

The old Mutual Fund SELECT filters only by client/year. Merely admitting Firebase users to that query would expose insufficiently filtered data, so an explicit server-side gate now stops GET/POST saved-work access after authentication and provisioning. The old query implementation is retained behind the gate for the Phase 5 ownership changes.

The frontend remains on its Phase 2 provisioning-pending screen. This phase does not enable the calculator, connect frontend API calls, alter saved-record owners, or migrate the five legacy rows. Phase 5 must replace the gate with owner-scoped reads/writes before workspace access is enabled.

## Configuration and CORS

Backend settings belong in services/tools-api/.env, never frontend VITE_* variables. Existing frontend Firebase settings remain in apps/mutual-fund-web/.env.

Added local backend CORS_ORIGINS for http://localhost:5175 and http://192.168.0.175:5175. Only configured exact HTTP/HTTPS origins receive browser CORS permission; wildcard/path-containing origins are invalid. Authorization and Content-Type are allowed with required API methods. Requests without an Origin header can still use token-authenticated APIs; CORS is browser permission, not a replacement for authentication.

Maigha exchange CORS is separate and remains Maigha's configuration. .env.example documents backend project, optional inline credential fields, DATABASE_URL and CORS_ORIGINS without real credentials. FIREBASE_DATABASE_URL is not used: our application database is PostgreSQL.

Installed firebase-admin and updated the service dependency lockfile. Backend npm audit reports zero vulnerabilities. No signing credentials were copied into source, reports or tests.

## Files and activation

- src/firebase.js: singleton Admin initialization and token verification.
- src/middleware/auth.js: async Firebase verifier with safe failures.
- src/middleware/context.js: provisioned user SELECT by verified UID.
- src/routes/context.js: updated /api/me and /api/context.
- src/routes/tools.js: injectable router retaining protected status routes.
- src/routes/mutualFund.js: temporary server-side ownership gate.
- src/app.js: app factory and explicit CORS policy.
- src/server.js: config validation and application startup.
- tests/auth.test.js: SDK cryptographic, HTTP and PostgreSQL lookup tests.
- package.json/package-lock.json and .env.example: dependency/configuration updates.

The old process on port 4000 was identified by its command and tools-api health response, stopped, and replaced with the updated API. The new API was left running intentionally. No seed or users migration runs at startup; the existing Mutual Fund table initialization remains unchanged.

## Validation

All eight test groups passed:

1. Missing/malformed Authorization never reaches verification or the database.
2. Real Admin SDK rejects expired tokens, wrong project/issuer, forged RSA signatures, Firebase custom tokens, shared-secret tokens and malformed JWTs.
3. Valid RSA signature resolves only the verified UID; caller-supplied owner fields do not affect identity.
4. Missing provisioned user returns 403 without insertion; database failures return distinct 503 errors.
5. Verification infrastructure failure returns 503 and fails closed.
6. Protected routes require identity/provisioning; legacy save/load remains blocked without querying saved work.
7. Allowed LAN CORS preflight works, unlisted origins get no permission, health stays public.
8. Actual PostgreSQL lookup returns a seeded user's stable local identity; user count is unchanged after provisioned and unprovisioned requests.

Cryptographic success tests use a generated test RSA key and replace only the test Admin instance's public-key fetcher. The real SDK still validates signatures and claims. This test hook is not present in production initialization. No real user token is saved in tests.

Live updated-server checks: health 200, missing token 401, LAN OPTIONS 204 with matching origin, Google's certificate endpoint reachable, and a token deliberately signed with the wrong private key rejected with 401. Existing legacy snapshot verification confirmed all five rows unchanged before activation. The actual user table remains provisioned; test lookup does not insert accounts.

The user subsequently confirmed live positive Firebase verification with a real signed-in user's ID token: GET /api/me returned HTTP 200 with code ok, shown in the supplied browser-console screenshot. This confirms token verification and provisioned-user resolution for that tested account; it does not prove owner-scoped saved-work access. Credential initialization does not prove service-account administrative permissions, which were not exercised by this phase.

## Optional real-user backend check

After opening Mutual Fund from Tapreco and seeing the signed-in screen, its browser developer console can run the following on the same development computer. It obtains the SDK token in memory and prints only status/code, not tokens or user profile values:

```js
const { getCurrentIdToken } = await import('/src/firebaseAuth.ts');
const check = await fetch('http://localhost:4000/api/me', {
  headers: { Authorization: 'Bearer ' + await getCurrentIdToken() },
});
const result = await check.json();
console.log({ status: check.status, code: result.code || 'ok' });
```

Expected for a seeded account: status 200, code ok. This import path is a local Vite development check, not a production API. A browser on another computer must use a reachable tools-api origin instead of localhost. Do not paste tokens or private keys into chat.

## Next checkpoint

Phase 5 requires separate approval. It will connect frontend /api/me checks, show contact-admin handling for unprovisioned users, obtain current ID tokens for each request, and enforce owner-scoped Mutual Fund save/load. Legacy-owner mapping is still **Needs confirmation**; unmapped rows must remain excluded. Hosting remains deferred.

References: [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Firebase session revocation](https://firebase.google.com/docs/auth/admin/manage-sessions).
