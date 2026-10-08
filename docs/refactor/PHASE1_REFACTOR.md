# Phase 1 refactor report

The broader advisory workspace has been reduced to a dashboard for **Entity Comparison only**, the preserved tool UI and a small integration API. No branch changes, merge, PR, commit or history rewrite were performed.

## Subsequent structural relocation

Entity Comparison now lives in `apps/entity-comparison-web/`, with its API in `services/entity-comparison-api/`. Root commands forward to independent packages; installation is `npm run setup`. The relocation preserves the Phase 1 UI, logic and test contents, updates static-hosting and test startup paths, and preserves resolved dependency versions. Mutual Fund and other tools are outside this change. See [the current layout and run instructions](../README.md).

The file paths in the historical Phase 1 change lists below describe their locations before this relocation.

## Kept

The existing design tokens, core styles, browser entry, favicon, TypeScript configuration and normal React/Vite tooling are retained. Core comparison components kept: `ScenarioGrid`, `ScenarioTable`, `SharedInputsPanel`, `ComparisonView`, `ComparisonTabs`, `AIReview`, `TaxEstimatesModal`, `NotesPanel`, `NumberInput`, `Modal` and `PageHeader`. Comparison arithmetic and formatting remain in `src/utils/comparison.ts` and `format.ts`.

## Simplified

- `src/App.tsx`: dashboard entry, hash navigation and small in-memory comparison state.
- `Sidebar.tsx` / `Topbar.tsx`: dashboard/tool navigation and honest API/mock status; removed save-status claims.
- `ClientToolbar.tsx`: fixed illustrative clients/years; removed persistent client creation.
- `EntityWorkspace.tsx` moved to `EntityComparison.tsx`: retained tabs/assumptions; replaced persistent workspace types.
- `ReportModal.tsx` / `ReportPreview.tsx`: live selected-content preview; removed PDF generation and structure reports.
- `sampleScenarios.ts` / `entityComparison.ts`: demo factories and small comparison/report contracts.
- `App.css`: kept approved layout; removed planner/import/structure/settings rules; added matching dashboard styles.
- `package.json`, lockfile, Vite, ESLint, Playwright, `.gitignore`, page title and documentation: adjusted to the Phase 1 app and backend.
- The old architecture audit and PNG/SVG diagram now describe Phase 1.

## Deleted

| Path | Reason |
| --- | --- |
| `src/components/workspace/ClientFiles.tsx` | Financial document parsing/mapping deferred. |
| `src/components/workspace/IncomeTaxPlanner.tsx` | Planner deferred. |
| `src/components/workspace/StructureAdvisor.tsx` | Advanced structure and payment modeling deferred. |
| `src/components/workspace/Settings.tsx` | Persistent settings/backup/restore deferred. |
| `src/components/workspace/NewClientModal.tsx` | Persistent client creation deferred. |
| `src/components/workspace/Overview.tsx` | Replaced by the tool dashboard. |
| `src/hooks/useWorkspace.ts` | Full-store persistence removed. |
| `src/data/workspace.ts` | Persistent store and structure templates removed. |
| `src/types/workspace.ts` | Large workspace/document/structure model removed. |
| `src/utils/storage.ts` | Storage/backup validation removed. |
| `src/utils/financialImport.ts` | CSV/XLSX/PDF processing removed. |
| `src/utils/report.ts` | Production PDF generation deferred. |
| `src/utils/download.ts` | No remaining file-download workflow. |
| `tests/workspace.spec.ts` | Obsolete broad workflow tests replaced by Phase 1 tests. |

## Dependencies

Removed **exceljs**, **pdfjs-dist**, **jspdf**, and the ExcelJS-specific `uuid` override. Added **express**, **cors**, **@types/express**, **@types/cors**, and **tsx**. The lockfile was updated by npm. Existing React/React DOM/Vite/TypeScript/React plugin/Playwright resolved versions were preserved.

## Added

- Frontend: `src/api/client.ts`, `src/types/tools.ts`, `src/data/tools.ts`, `src/components/dashboard/Dashboard.tsx`, `ToolCard.tsx`.
- Backend: `server/src/index.ts`, `app.ts`, `config.ts`, `routes/health.ts`, `routes/tools.ts`, `routes/auth.ts`, `middleware/auth.ts`, `server/tsconfig.json`.
- Configuration: root `.env.example` and `server/.env.example`; no real environment files or secrets added.
- Tests: `server/tests/api.test.ts` and `tests/phase1.spec.ts`.

## Endpoints and mocks

`GET /api/health` and `GET /api/tools` are implemented public metadata endpoints. `GET /api/me` passes through the auth boundary. Development mock returns Demo Advisor with `mode: "mock"`; production mock is rejected. JWT mode never accepts an unverified token and remains 401/503 until Alpha's real verification is implemented.

Sample clients, tax figures, rule-based review and report previews are illustrative. The dashboard, navigation, sample catalog and API catalog expose Entity Comparison only, with no additional-tool placeholders. PDF download, real tax modeling, external AI, persistence, document processing and advanced structures are intentionally deferred.

## Run and integration settings

On a fresh checkout, run `npm ci` and `npm run setup` from the repository root. Then run only `npm run dev` to start the frontend and API together. Frontend: the **Local** URL Vite prints, preferring port 5173 and automatically trying the next available port. Backend/API: **http://localhost:3001**. API paths: `/api/health`, `/api/tools`, `/api/me`.

Check with `npm run build`, `npm run build:server`, `npm run lint`, `npm run test:api`, and `npm run test:e2e`. Browser tests use frontend **5199** and backend **3002**.

Alpha must confirm `TAPRECO_JWT_ISSUER`, `TAPRECO_JWT_AUDIENCE`, `TAPRECO_JWKS_URL`, `TAPRECO_ALLOWED_ORIGIN`, the actual public API origin (`VITE_API_BASE_URL` for separate hosting), token delivery and verified-claim/algorithm requirements. See [README](../README.md) for environment and hosting details.

## Verification

Frontend build, backend build, lint, **6 API tests** and **5 browser tests** passed. Browser checks include the live API, offline fallback, report modal behavior and 1440/1024/768/390 px layouts; desktop/mobile screenshots were visually reviewed. The frontend build is approximately 255 kB of minified JavaScript and no longer emits the large PDF/XLSX chunk warning.

Direct development API calls on port 3001 returned health/catalog and the labeled mock identity. Compiled same-origin hosting was checked on temporary port 3003: built frontend and public endpoints responded, `/api/me` returned 401 without a token and 503 with an unverified token. The existing service on 5173 belongs to another project, so this repository's manual demo verification uses 5174 without stopping that service.

## Structural relocation verification

After relocating the frontend and API, the root command forwarders passed both builds, linting, all **6 API tests** and all **5 browser tests**. Development startup was checked with the preserved API default port 3001 and a temporary frontend override of 5174; the configured frontend port remains 5173. Frontend HTML, entry module, favicon and all three proxied API endpoints responded successfully.

Optional static hosting was verified from both API source and compiled output, including built HTML/assets, health, unknown-route handling and the existing 401/503 JWT boundary. All four frontend build artifacts are byte-for-byte identical to the pre-move artifacts. The UI, business logic, tests and environment examples retain their exact original contents; only the API static-hosting source path changed. Child lockfiles retain the original dependency versions and integrity values.

## Development startup fix

The root frontend forwarding command targeted the correct app, but Vite's development `strictPort: true` rejected an occupied 5173. The API also previously required a separate command. Root `npm run dev` now runs `concurrently --kill-others --names API,WEB "npm run dev:server" "npm run dev:frontend"`; existing scripts are preserved and `dev:frontend` is available separately. Only the development Vite strict-port setting changed to false. Preview and isolated Playwright ports remain strict.

Verified the root command on available IPv4 localhost port 5173, automatic selection of 5174 with the existing unrelated IPv6 5173 listener left running, and selection of 5175 with an additional owned test listener occupying 5174. Frontend and proxied health/catalog/identity endpoints responded in all cases. Chrome checked the dashboard, mock identity and Entity Comparison on the automatically selected 5174. Ctrl+C stopped the started services without stopping the original 5173 application. Builds (including frontend/API TypeScript checks), lint, all 6 API tests and all 5 browser tests passed. No standalone typecheck script exists.

Frontend/API source logic, UI, tests, environment examples and child lockfiles were not changed by this startup fix. The root lockfile now contains the development process runner.
