# Agent notes

UI and design rules live in [`.cursor/rules/`](.cursor/rules/). Read them before changing storefront or product UI.

## Rule hierarchy

| Rule | When to read |
|------|----------------|
| [`design-system.mdc`](.cursor/rules/design-system.mdc) | **Always** — master design system (brand, breakpoints, motion, HIG review lens) |
| [`site-header.mdc`](.cursor/rules/site-header.mdc) | Header scroll pill, nav, `MobileMenuDrawer`, `--nav-scroll` |
| [`mobile-floating-circle-buttons.mdc`](.cursor/rules/mobile-floating-circle-buttons.mdc) | Product gallery circle controls, placements, pitfalls |

Brand constraints in `design-system.mdc` override any Apple HIG recommendation.

## Other docs

| Doc | Purpose |
|-----|---------|
| [`AGENT_GUIDE.md`](AGENT_GUIDE.md) | Backend onboarding, env vars, run commands, safe workflow |
| [`NAMING_CONVENTIONS.md`](NAMING_CONVENTIONS.md) | File and code naming |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture, routes, data flows |
