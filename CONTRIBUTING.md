# Contributing Guidelines

Thank you for your interest in contributing!

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-budget-alerts` |
| Bug Fix | `fix/description` | `fix/async-sort-bug` |
| Documentation | `docs/description` | `docs/update-readme` |

## Commit Convention

Follow conventional commits:
```
type(scope): short description

feat(charts): add monthly trend line chart
fix(app): resolve sym undefined ReferenceError
docs(readme): update installation instructions
test(pwa): add service worker cypress tests
```

## Pull Request Process

1. Fork the repository and create a branch
2. Implement your changes with tests
3. Ensure all existing tests still pass: `npm test && npx cypress run`
4. Update documentation if you changed functionality
5. Submit a PR with a clear description of the change

## Code Style

- Use `const` and `let` (no `var`)
- Use `async/await` over raw Promises
- Add JSDoc comments to exported functions
- Keep functions focused and short (<40 lines preferred)

## Testing Requirements

All new features must include:
- Unit tests (Jest) for business logic
- Integration tests (Cypress) for UI behavior
