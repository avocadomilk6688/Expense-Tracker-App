# Changelog

## Unreleased / Current Main

### Added
- Added Firebase Authentication and Cloud Firestore support, replacing the previous local storage data model.
- Added transaction history search and filtering.
- Added expense name support.
- Added monthly spending limits and progress bars for each category.
- Added dynamic default categories with budget structure.
- Added multicurrency display and expanded currency support.
- Added recurring expenses with frequency display and editable frequency settings.
- Added Chart.js-based expense visualizations.
- Added Progressive Web App support, including manifest, service worker, and app icons.
- Added Cypress end-to-end tests for authentication, currency, recurring expenses, transactions, charts, and PWA behavior.
- Added Jest unit tests for category logic, filters, currency service, recurring schedules, and chart engine.
- Added project documentation files including `CONTRIBUTING.md`, `LICENSE`, and changelog content.

### Changed
- Updated README content and preview assets.
- Improved transaction history layout and UI alignment.
- Improved mobile and responsive layout behavior.
- Improved edit flow for expenses and recurring transactions.
- Updated username display to derive from the user email.
- Improved expense pie chart update behavior.
- Updated Cypress custom login command and test setup.

### Fixed
- Fixed mobile layout issues and responsive overlap problems.
- Fixed currency conversion behavior.
- Restored edit and delete functionality in transaction history.
- Fixed minor UI layout and application logic issues.
- Fixed history list alignment and display issues.
- Added close functionality to the edit expense interface.

## Earlier History

### Initial App
- Added the original expense tracker app files.
- Included HTML, CSS, JavaScript application logic, and local storage support.
- Added README documentation and desktop/mobile preview assets.