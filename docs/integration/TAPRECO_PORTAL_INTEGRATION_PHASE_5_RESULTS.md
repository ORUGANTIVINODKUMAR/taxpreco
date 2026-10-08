# Tapreco Portal Integration Phase 5 Results

Date: 8 October 2026

Status: Phase 5 approved, implemented, tested and activated locally. Phase 6 has not started. A real-user save/refresh/load acceptance check remains **Needs confirmation**.

## Current user flow

Tapreco login -> Mutual Fund handoff -> persistent Firebase session -> GET /api/me -> verified, provisioned user -> calculator workspace -> current Firebase ID token on each save/load -> backend owner-scoped PostgreSQL query.

The calculator appears only after /api/me confirms the current Firebase identity and local user. A signed-in user absent from public.users receives contact-admin guidance and local sign-out; the error remains on screen without an automatic redirect loop. Transient verification/database/network failures keep the workspace locked with Retry, rather than incorrectly reporting that the user is missing.

The prior manual JWT textarea is removed. Requests obtain a current ID token through the Firebase SDK, do not store a fixed token copy, and reject results if the signed-in identity changes. A UID change remounts the workspace and clears displayed forms/saved sessions. Sign-out also unmounts the workspace.

## Backend ownership

Migration 002_mutual_fund_ownership.sql adds owner_user_id UUID referencing public.users.id and an index for owner/client/year/date. Existing TEXT user_id is retained for legacy review. No old owner value is automatically mapped.

- Every read requires a verified Firebase token and an explicitly provisioned local user.
- SELECT filters by owner_user_id = resolved local UUID AND client_id AND tax_year.
- INSERT takes owner_user_id only from the backend's resolved user context.
- Submitted owner/user fields are rejected as unexpected fields. Query owner fields cannot override the owner filter.
- No per-record mutation/read endpoint was added. Selected restore uses only records returned by the owner-filtered list.
- Responses expose the saved form/context fields, record ID and creation date, not legacy owner fields.
- Each save inserts a new record; it does not silently update a previous save.
- Foreign-key validation prevents orphan local owners.

The temporary Phase 4 saved-work gate is replaced by these protected queries. Ownership follows the local UUID, not an email or a request-supplied identity.

## Context, validation and restore

clientId and taxYear are Mutual Fund context, not Firebase login claims. They initialize from the query string when supplied. Missing context is entered in the app; the old hardcoded client-123/year fallback is removed. Valid context is preserved in the URL on input blur and successful save/load.

Client ID must be a nonempty string of at most 128 characters without surrounding whitespace or control characters. Tax year must be four digits from 1900 through 2100. Invalid context prevents frontend save/load and is independently rejected by the backend. Duplicate/array query context is invalid server input.

Backend submissions reject unexpected fields, invalid or blank fund names, excessive/control-containing text, nonnumeric/nonfinite money, amounts outside the existing NUMERIC(14,2) range, money with more than two decimals, and percentages outside 0-100. Optional resident state can be blank. Negative monetary adjustments are not arbitrarily excluded by this persistence layer.

Load fetches the current user's saved sessions for the selected client/year. It lists fund, amount and timestamp, without silently replacing form inputs. The user selects a session and clicks Restore selected session. If there are unsaved edits, a confirmation protects them. Restore populates resident state, fund name, amount and saved numeric outputs. Changing client/year clears the loaded list and prompts review of current inputs; it does not silently erase those inputs.

This phase connects persistence to the existing single-row calculator. It does not implement the existing placeholder fund lookup, Add row, U.S. Obligations calculator or tax calculation engine. Restoring saved values does not establish the financial correctness of the existing calculator. Unsaved inputs do not persist across refresh; saved records can be deliberately loaded again.

## Legacy data preservation

The five original saved records remain unchanged in all original columns, with owner_user_id NULL. They cannot match the new owner-filtered reads. Their approved owner mapping remains **Needs confirmation**. No records were assigned to the next signed-in user or to a user with a similar email/client/year.

The existing ignored snapshot remains in services/tools-api/private/phase3-legacy-snapshot.json. The review script now compares the original snapshot rows/columns while also requiring their new owner field to remain NULL. It permits subsequent new owned saves without treating them as edits to legacy records.

## Validation results

| Check | Result |
| --- | --- |
| Frontend handoff tests | 9 passed |
| Frontend session tests | 8 passed, including stale-token rejection and provisioning sign-out without redirect loop |
| Backend authentication tests | 8 passed, updated for owner-scoped routes |
| Backend ownership tests | 2 passed |
| Total automated test groups in this phase | 27 passed |
| Frontend lint, TypeScript, production build | Passed |
| Migration application/repeat | 1 applied / 0 applied |
| Legacy snapshot comparison | All 5 original rows preserved and unmapped |
| Local frontend LAN check | HTTP 200 |
| Active saved-work endpoint without token | HTTP 401 |

The PostgreSQL ownership test creates two temporary users and saved sessions inside a transaction, calls the real Express routes, and confirms both users see only their own rows even with identical client/year. It also tests forged body/query owners, context scoping, legacy exclusion, repeat insert-per-save, invalid context and the owner foreign key. All test users/records are rolled back; BIGSERIAL sequences can advance during rollback, so gaps in IDs are normal.

Edge browser checks used the real Firebase SDK with intercepted fake Firebase and tools-api responses. They confirmed provisioning gating, automatic Authorization, removal of the token textarea, save/load feedback, explicit restore and cancellation of unsaved overwrite, refresh/context retention, clearing data on account replacement, retry after a database outage, and unprovisioned sign-out without a redirect loop. These controlled responses do not replace real-user backend save/load acceptance.

The verified tools-api process was restarted on port 4000 to activate the final routes/validation and left running. Frontend Vite continues on LAN port 5175. No changes to Maigha portal, other frontend apps or hosting were made.

## Real-user check to perform next

1. Open Mutual Fund from the signed-in Tapreco portal. The calculator should appear after the account check.
2. Enter or confirm the Client ID and tax year. Do not use real client data solely for a connectivity test.
3. Enter a fund name and amount, then Save to Database. Confirm the saved message.
4. Refresh. Login should restore, while unsaved form inputs start empty.
5. Click Load from Database, select the saved session and Restore selected session. Confirm its values.
6. For full real-user isolation acceptance, repeat with a second approved user using the same client/year; each user should see only their own saves.

Steps 1-6 remain user acceptance checks; no real-user save was performed by the automated tests. Phase 4's real-user /api/me success was already confirmed separately.

## Files changed

Frontend: src/api.ts, src/App.tsx, src/SessionGate.tsx, src/ProvisionedWorkspace.tsx, src/session.ts, src/launchContext.ts and tests/session.test.mjs.

Backend: migrations/002_mutual_fund_ownership.sql, src/mutualFundValidation.js, src/routes/mutualFund.js, src/app.js, scripts/review-legacy.js, tests/ownership.test.js, tests/auth.test.js and package.json test script.

One initial patch was rejected by automatic approval review because it would temporarily delete a route before replacing it. It was replaced with an atomic in-place update; no route deletion remains and there is no outstanding approval-review blocker.

## Subsequent client/year UI removal

The user subsequently requested removal of the client/year disclosure and inputs. They are now removed, including their UI validation message and dedicated styles. Lint and build passed. Backend ownership and existing context validation remain unchanged. Context can currently come only from the launch URL; without valid clientId/taxYear, save/load stays disabled. Whether persistence should instead use only the signed-in user is awaiting clarification; no placeholder context or database changes were introduced for this removal.

## Direct calculator entry during authentication

At the user's request, the normal Connecting to Tapreco, session-restoration and Checking your account cards were replaced with the original calculator shell and a small inline Loading Mutual Fund status. Authenticated controls sit inside a disabled fieldset until both Firebase authentication and provisioned-user lookup finish. The loading shell contains fresh empty form state, never previous-user data, and mounts separately from the verified workspace. Authentication errors and provisioning-outage Retry remain visible failure handling; no second login dialog is introduced.

Lint/build passed. A delayed-exchange and delayed-/api/me browser test confirmed the calculator appears immediately, the hash is cleared, no connecting/checking cards or launch dialogs appear, and controls remain disabled until verification succeeds. This changes presentation only; it does not bypass authentication, provisioning or backend ownership checks. Tapreco login identifies the user but does not itself supply client/year values; the persistence-context question above remains unresolved.

## Next checkpoint

### UI correction requested after Phase 5

Removed the extra signed-in/profile, local logout and Return to Tapreco panel at the user's request. Added Home / Tools / Mutual Fund breadcrumbs above the original header: Home links to the configured portal root, Tools to its verified /choose route, and Mutual Fund marks the current page. The JWT textarea remains removed; authentication/provisioning continue in the background.

Moved required client/year controls into a compact disclosure near save/load rather than a separate card above the calculator. Saved-record selection and restore remain available. No global typography or calculator layout styles were changed: App.css and index.css matched the tracked baseline before this correction. At an identical 1200px viewport, browser comparison against the reference app on port 5176 confirmed matching root font (18px), title (24px Georgia), body font (Arial), card heading (24px), root width (1126px) and header height. Browser zoom in the user's screenshots could not be confirmed.

Lint and build passed, and a controlled browser test confirmed panel removal, correct breadcrumb destinations and authenticated saving. This correction does not start Phase 6 or change backend ownership enforcement. The visible workspace has no separate login/logout/back controls, as requested; error recovery and authentication guards remain in place.

Phase 6 is full local acceptance across portal launch, refresh, real-user ownership, logout and failure scenarios. It requires separate approval. Other tools and hosting remain deferred. Legacy ownership mapping remains an independent unresolved input; unmapped old rows stay inaccessible.
