# Testing Guide

This document describes the test strategy, how to run the suites, what is covered, and how to add new tests for the Expense Tracker App.

## Overview

The app uses a **two-layer test strategy**:

| Layer | Framework | Location | Purpose |
|-------|-----------|----------|---------|
| Unit | Jest 30 | `tests/` | Verify business logic in isolation |
| End-to-end | Cypress 15 | `cypress/e2e/` | Verify user-facing behavior in a real browser |

Run both suites before submitting a pull request. See [CONTRIBUTING.md](./CONTRIBUTING.md) for PR requirements.

There is **no CI/CD pipeline** — all tests run locally.

## Prerequisites

Before running tests, ensure the following are in place:

| Requirement | Detail |
|-------------|--------|
| Node dependencies | Run `npm install` from the project root |
| Firebase config | Create `scripts/firebaseConfig.js` (gitignored). Export your Firebase SDK credentials — see [README.md](./README.md) for setup steps. The file must live in `scripts/`, not the project root |
| Test user account | A Firebase Auth user must exist: `maggie@gmail.com` / `password123` |
| Dev server (E2E only) | Cypress expects the app at `http://127.0.0.1:8080` (configured in `cypress.config.js`) |

## Running Tests

### Unit tests (Jest)

```shell
npm test
```

- Uses Jest 30 with default configuration (no `jest.config.js`)
- ES module imports are transpiled via [babel.config.json](./babel.config.json)

### End-to-end tests (Cypress)

Cypress requires the app to be served on port 8080.

```shell
# Terminal 1 — start the dev server
npx live-server --port=8080 --no-browser

# Terminal 2 — run headless
npx cypress run

# Optional — open the interactive test runner
npx cypress open
```

### Full pre-PR check

```shell
npm test && npx cypress run
```

> **Note:** `package.json` defines `"test": "jest"` only. Cypress is invoked via `npx cypress run`.

## Test Structure

```
tests/                          # Jest unit tests
  currencyService.test.js
  recurringEngine.test.js
  isDue.test.js
  filterEngine.test.js
  categoryEngine.test.js
  chartEngine.test.js

cypress/
  e2e/                          # E2E specs (one file per feature area)
    auth.cy.js
    transaction.cy.js
    currency.cy.js
    recurring.cy.js
    charts.cy.js
    pwa.cy.js
  support/
    commands.js                 # cy.login() custom command
    e2e.js
  fixtures/
    example.json                # Default Cypress fixture (unused)
```

## Unit Test Inventory (Jest)

| Test file | Source module | Approach | What it covers |
|-----------|---------------|----------|----------------|
| [currencyService.test.js](./tests/currencyService.test.js) | [scripts/currencyService.js](./scripts/currencyService.js) | Direct import + mocked `fetch` / `localStorage` | `toBaseINR`, `fromBaseINR` (USD, MYR, INR) |
| [recurringEngine.test.js](./tests/recurringEngine.test.js) | [scripts/recurringEngine.js](./scripts/recurringEngine.js) | Direct import + mocked `localStorage` | `saveRecurring`, `deleteRecurring`, `getAllRecurring` |
| [isDue.test.js](./tests/isDue.test.js) | [scripts/recurringEngine.js](./scripts/recurringEngine.js) | Direct import | New item due immediately; daily due after one day |
| [filterEngine.test.js](./tests/filterEngine.test.js) | [scripts/filterEngine.js](./scripts/filterEngine.js) | Replicated pure logic | Keyword, category, price range, date range filtering; recurring tag normalization |
| [categoryEngine.test.js](./tests/categoryEngine.test.js) | [scripts/categoryEngine.js](./scripts/categoryEngine.js) | Replicated pure logic | Tag normalization, progress percentage, 85% red threshold color |
| [chartEngine.test.js](./tests/chartEngine.test.js) | [scripts/chartEngine.js](./scripts/chartEngine.js) | Replicated pure logic | Category doughnut data, 6-month trend data, tag cleanup |

### Why some tests replicate logic

Three test files ([filterEngine.test.js](./tests/filterEngine.test.js), [categoryEngine.test.js](./tests/categoryEngine.test.js), [chartEngine.test.js](./tests/chartEngine.test.js)) copy helper functions rather than importing from the source module:

- [filterEngine.js](./scripts/filterEngine.js) reads DOM elements and fetches from Firestore
- [categoryEngine.js](./scripts/categoryEngine.js) and [chartEngine.js](./scripts/chartEngine.js) tie into DOM rendering and Chart.js

The tests isolate the algorithmic core by replicating pure functions. This is a known trade-off — it validates logic but can drift from the source if helpers change without updating the test copies. Refactoring source modules to export testable pure functions is the recommended long-term improvement.

### Mocking patterns

**localStorage mock** (used by `currencyService` and `recurringEngine` tests):

```javascript
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; },
  };
})();
global.localStorage = mockStorage;
```

**fetch mock** (used by `currencyService` for the Frankfurter exchange-rate API):

```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ rates: { USD: 1, INR: 80, MYR: 4 } }),
  })
);
```

## E2E Test Inventory (Cypress)

| Spec file | Auth required? | What it covers |
|-----------|----------------|----------------|
| [auth.cy.js](./cypress/e2e/auth.cy.js) | Yes | Filter keyword input, expense name input, category budget tab toggle |
| [transaction.cy.js](./cypress/e2e/transaction.cy.js) | Yes (`cy.login()`) | Add USD transaction end-to-end |
| [currency.cy.js](./cypress/e2e/currency.cy.js) | Yes | Display currency selector loads |
| [recurring.cy.js](./cypress/e2e/recurring.cy.js) | Yes | Create monthly recurring expense |
| [charts.cy.js](./cypress/e2e/charts.cy.js) | No | Analytics DOM structure, Chart.js CDN, canvas ARIA labels |
| [pwa.cy.js](./cypress/e2e/pwa.cy.js) | No | Manifest, meta tags, service worker registration, app title |

### Custom command: `cy.login()`

Defined in [cypress/support/commands.js](./cypress/support/commands.js):

1. Visits `/` (resolved against `baseUrl` in `cypress.config.js`)
2. Fills `#authEmail` and `#authPassword` with the test account credentials
3. Clicks `#emailAuthSubmitBtn`
4. Waits for `#authScreen` to become hidden (20 s timeout)

Prefer `cy.login()` over duplicating auth boilerplate in new specs. Some existing specs still inline the login flow — new tests should use the command.

## Coverage Gaps

The following modules and features do **not** have automated test coverage:

| Area | Notes |
|------|-------|
| [scripts/app.js](./scripts/app.js) | Main UI orchestration (~1050 lines) |
| [scripts/firebaseStore.js](./scripts/firebaseStore.js) | Auth and Firestore CRUD |
| [scripts/authController.js](./scripts/authController.js) | Login/register UI flow |
| `getRates()` in currencyService | Rate fetching and caching |
| `processDue()` in recurringEngine | Automatic recurring transaction processing |
| Edit/delete transactions | Minimal E2E coverage |
| Google OAuth | No test coverage |
| Service worker caching | Only registration is tested, not cache behavior |
| Chart rendering with live data | Cypress validates DOM structure only; populated charts require manual verification |

## Writing New Tests

All new features must include both a Jest unit test and a Cypress spec. See [CONTRIBUTING.md](./CONTRIBUTING.md).

**Unit tests:**

- Prefer **direct imports** when the function is pure and has no DOM or Firebase dependencies
- When logic is DOM-coupled, replicate pure helpers (current pattern) or refactor the source to export testable functions
- Name files `{module}.test.js` and place them in `tests/`

**E2E tests:**

- Use `cy.login()` for authenticated flows
- Name files `{feature}.cy.js` and place them in `cypress/e2e/`
- Keep specs focused on one feature area per file

**Commit convention:**

```
test(scope): short description
```

Examples: `test(pwa): add service worker cypress tests`, `test(charts): add monthly trend unit tests`

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Cypress `cy.visit` fails | Dev server not running on port 8080 | Start `npx live-server --port=8080 --no-browser` |
| Auth timeout (20 s) | Test user missing or invalid Firebase config | Verify `scripts/firebaseConfig.js` and that the test account exists |
| Jest import / syntax errors | Missing Babel preset or dependencies | Run `npm install` |
| Cypress screenshots or videos appear after failures | Normal Cypress behavior on test failure | Artifacts are gitignored in [`.gitignore`](./.gitignore) |
