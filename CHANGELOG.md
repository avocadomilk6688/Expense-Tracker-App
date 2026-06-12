# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] — 2026-06 — Team Enhancement Release (CSE6364)

This release represents a complete software evolution of the original open-source Expense Tracker App.

### Added — Member C (Chart.js + PWA)

#### Progressive Web App (PWA)
- `manifest.json` — Web App Manifest enabling browser install prompt, standalone window mode, and app metadata
- `sw.js` — Service Worker with Cache-First strategy for the app shell and Network-First for external APIs
- `icons/` — Application icons at 192×192 and 512×512 (regular + maskable)
- PWA meta tags in `index.html` (theme-color, apple-mobile-web-app-capable, apple-touch-icon)
- Service Worker registration script in `index.html`
- Offline fallback: app shell loads from cache without network

#### Chart.js Data Visualization
- `scripts/chartEngine.js` — New dedicated analytics module with:
  - `buildCategoryChartData()` — Aggregates current month spending by category tag
  - `buildMonthlyTrendData()` — Aggregates total spending for last 6 months
  - `renderCategoryDoughnutChart()` — Category breakdown doughnut chart
  - `renderMonthlyTrendChart()` — Monthly trend line chart (smooth curve)
  - `refreshAllCharts()` — Master update function called after every data change
  - `destroyAllCharts()` — Cleans up chart instances on logout
- Analytics section added to `index.html` with accessible ARIA labels
- Chart responsive CSS in `style.css` (stacks to single column on mobile)
- Dynamic chart updates: charts refresh on transaction add, edit, delete, and currency change
- Empty-state handling: friendly messages when no data is available

#### Tests (Member C)
- `tests/chartEngine.test.js` — 11 Jest unit tests for data aggregation logic
- `cypress/e2e/charts.cy.js` — 7 Cypress integration tests for chart rendering
- `cypress/e2e/pwa.cy.js` — 8 Cypress integration tests for PWA validation

#### Documentation (Member C)
- `docs/screenshots/PWA_SCREENSHOT_CHECKLIST.md` — Evidence capture guide for PWA
- `docs/screenshots/CHARTS_SCREENSHOT_CHECKLIST.md` — Evidence capture guide for Charts
- `docs/INSTALLATION.md` — Step-by-step setup guide
- `docs/USER_GUIDE.md` — Feature-by-feature user documentation
- `docs/TESTING.md` — Testing strategy and execution guide
- `CONTRIBUTING.md` — Contribution guidelines
- `LICENSE` — MIT License
- `README.md` — Complete rewrite documenting all enhancements

#### Bug Fixes (Maintenance — Member C)
- Fixed `ReferenceError: sym is not defined` in `triggerDashboardBootstrap()` (`app.js:962`)
- Fixed async sort bug: `sortTrans()` now properly awaits `getAllTrans()` before sorting (`app.js:692`)
- Fixed title typo: "Expence Traker" → "Expense Tracker" (`index.html`)
- Fixed label typo: "Buget Left" → "Budget Left" (`index.html`)

---

### Added — Member A (Firebase Auth + Budgeting + Search)

#### Firebase Authentication
- `scripts/authController.js` — Email/password login and registration UI controller
- `scripts/firebaseStore.js` — Firebase Auth (email/password + Google OAuth) + Firestore data layer
- Login screen overlay with Register toggle
- Google Sign-In button
- Logout button visible after authentication

#### Budgeting Logic
- Category-specific spending limits (`setCategoryLimit`, `getCategoryLimit`)
- Real-time progress bars per category (turn red at ≥85% usage)
- Category Limit tab in the Add Expense panel

#### Search & Filter
- `scripts/filterEngine.js` — Multi-criteria transaction filter:
  - Keyword search (vendor name + tag)
  - Category dropdown filter
  - Min/Max price range filter
  - Date range filter with Today / 7 Days / 30 Days shortcuts

---

### Added — Member B (Multi-Currency + Recurring)

#### Multi-Currency Support
- `scripts/currencyService.js` — 11 supported currencies with live rates from frankfurter.app
- Currency selector on expense add form
- Display currency switcher (top-right dropdown)
- All amounts stored in INR base, converted on display

#### Recurring Expenses
- `scripts/recurringEngine.js` — Daily/weekly/monthly recurring expense templates
- Auto-trigger overdue recurring transactions on app load
- Recurring list panel with edit/delete controls

---

## [1.0.0] — Original Release

**Author:** Manik Maity  
**Repository:** https://github.com/avocadomilk6688/Expense-Tracker-App

### Features
- Expense addition with custom tags (localStorage)
- Budget input and editing
- Expense history with sorting (high-to-low, low-to-high)
- Edit and delete expenses
- Basic pie chart (expense vs. budget remaining)
- Responsive layout (desktop + mobile)
