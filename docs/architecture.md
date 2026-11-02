# Architecture

The App Router provides pages and future API routes. TypeScript enforces contracts; Tailwind 4 processes styling; Motion handles animation; Zod validates requests. Vitest tests pure rules and Playwright tests user journeys. Recharts is deferred until the visualization milestone needs it.

| Directory            | Responsibility                                         |
| -------------------- | ------------------------------------------------------ |
| src/app              | Routes, metadata, global styles                        |
| src/components       | Future shared UI; extract when reused                  |
| src/features/wrapped | Landing form and labelled sample experience            |
| src/lib/validation   | Pure schemas reusable on the server                    |
| src/lib/github       | Future server-only GraphQL transport and normalization |
| src/lib/analytics    | Future pure statistical calculations                   |
| src/themes           | Typed theme token registry                             |
| src/types            | Future normalized report contracts                     |
| tests                | Unit and browser tests                                 |

## Refinements to the proposal

Normalized metrics should carry provenance (`github` or `calculated`), coverage dates, retrieval time and reasons for incomplete coverage. Never turn unavailable values into zero. All-time means available history, not guaranteed complete lifetime activity. Owned-repository languages and contribution languages are different measurements.

GitHub transport must use `server-only`, bounded pagination, timeouts, budgets, rate-limit responses and scoped caches. Public lookups must not expose the server token owner's private activity. Private counts need explicit user authorization and separate privacy-aware cache scopes. Never expose a token through NEXT_PUBLIC variables.

Daily calendars cannot establish a Night Owl personality. Document thresholds, precedence and tie-breaking using only supported data. Keep analytics, slide content and theme tokens independent. Add localization message keys when content stabilizes.

Phase 1 has no GitHub calls, persistence or authentication. The form validates and explains availability. Every statistic is illustrative. The theme registry is an introductory token system; complete presentation plugins and theme validation arrive later.
