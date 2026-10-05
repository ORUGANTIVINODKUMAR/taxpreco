# Tapreco Advisory Workspace

React, TypeScript, and Vite frontend based on the approved Entity Savings design. Every workspace destination is connected to a working local workflow. Data is saved in the browser; no account, server, tax engine, or external AI service is configured.

## Run

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. If another local project already occupies the default port, Vite prints a different port: use that URL to view this repository.

```sh
npm run build
npm run lint
npm run test:e2e
npm run preview
```

The browser suite starts its own Vite server on port 5199 and refuses to reuse another server. Windows tests use the installed Google Chrome browser. On Linux/macOS, install Chromium first with `npx playwright install chromium`.

## Working workflows

- All sidebar destinations, the logo, mobile navigation, and browser Back/Forward navigation work.
- Overview shows the current business profit, scenario count, and largest estimated annual benefit, with direct links to each workflow.
- Client creation starts a blank financial workspace. Client and tax-year selectors maintain independent inputs, scenarios, notes, financial reviews, and structures.
- Entity Savings supports all four basic entity treatments, editable assumptions, adding/removing scenarios, and advisor-entered combined tax estimates. Select any alternative for comparison.
- Annual tax differences and net benefits update from the entered tax estimates and costs. First-year benefits also subtract transition costs. Income, salary, retirement, and distribution edits do not calculate tax liability.
- AI Review provides a deterministic assumption review derived from the selected scenario. Its insight selections and CPA observations are included in the report when selected; no generative AI service is connected.
- Income Tax Planner reconciles an entered annual estimate against withholding and payments. Its four-part allocation is a cash budget, not a statutory payment schedule.
- Client files reads CSV, Excel `.xlsx`, and text-based PDF files on the device. Select and correct revenue/expense totals before applying them to the shared inputs. Original files are not retained; extracted rows and status are saved.
- Structure Advisor supports six templates, ownership diagrams, editable entity names, adding/removing entities, notes, and directed intercompany payments. Internal payments are recorded once as paid and received; they do not create a combined tax benefit.
- Export report offers a live content preview and generates a real PDF containing the selected scenarios, sections, charts, notes, insights, and optional ownership structure.
- Settings supports firm branding, comfortable/compact worksheets, JSON backups, validated restoration, and a confirmed local reset.
- Dialogs support Escape, visible focus, focus wrapping, and return focus to the opening control. Layouts support desktop and mobile, with the table scrolling inside its container.

## Calculation boundary

The original 2026 client contains illustrative tax estimates. New clients and years have no tax estimates. Enter tax figures from a separate professional analysis; this workspace performs comparison arithmetic only:

- Tax difference = baseline combined tax estimate minus alternative combined tax estimate.
- Annual benefit = tax difference minus alternative administration costs above baseline.
- First-year benefit = annual benefit minus alternative one-time transition costs.

State taxes are not calculated separately. No automatic QSBS eligibility, tax exclusion, entity-election recommendation, owner take-home calculation, or exit-tax calculation is claimed.

## Storage and imports

Data persists under `tapreco-workspace-v1` in localStorage. It is specific to the browser and origin (including the port). Changing ports shows a separate workspace; use Settings backups to transfer work. If browser storage fails or fills, a visible error prompts you to download a backup. Browser storage is not a multi-user database or an access-controlled client portal.

Financial imports accept files up to 15 MB and up to 1,000 extracted amounts. PDFs must contain selectable text; scanned PDFs require OCR outside this app. Excel imports support `.xlsx`, not legacy `.xls`. Extraction is a review aid: multiple periods, numbers in labels, subtotals, and expense sign conventions need review. No amount is automatically applied. Expenses and revenue are entered as positive totals; business profit may be negative.

Report text uses built-in PDF fonts intended for English and common Western text. PDF layout is paginated automatically; no screenshot-based report or fake download is used.

## Organization

- `src/components/entity-comparison`: scenarios, comparison, review, report preview, estimate editing, and dialogs.
- `src/components/workspace`: overview, planner, client creation, financial-file review, structure planning, and settings.
- `src/components/layout`: responsive navigation and save status.
- `src/hooks/useWorkspace.ts`: per-client/per-year state and browser persistence.
- `src/data`: original sample figures, navigation, and structure templates.
- `src/types`: business, scenario, financial review, structure, and workspace contracts.
- `src/utils`: comparison arithmetic, import parsing, backup validation, downloads, and PDF generation.
- `tests/workspace.spec.ts`: browser regression tests covering real user workflows and all four required viewport sizes.

A production tax application still needs a validated jurisdiction-specific tax engine, authenticated backend, secure shared storage, and any external AI integration. Those services are not simulated by the frontend.
