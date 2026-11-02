# Verification

## Phase 2 — API-first README cards

Verified on Windows with Node 24 on 2026-11-02:

- Production webpack build: passed; `/api/card` and `/api/wrapped` are dynamic routes.
- TypeScript: passed.
- Unit suite: 65 tests passed, including GitHub transport mocks, scope verification, normalization, cache reuse and deduplication, error recovery, request validation and SVG hardening.
- Browser suite: 8 tests passed across desktop and mobile Chromium, including real token-free API error responses, embed Markdown, SVG XML validity, all themes and long-name canvas bounds.
- Rendered SVG screenshots reviewed; original landing sample data remains explicitly illustrative.
- Production live-data smoke test returned the expected 503 CONFIGURATION_ERROR for the currently configured unsupported token type. A successful authenticated GitHub fetch remains unverified; set an expiring classic token with public_repo only and repeat the documented smoke test.

Public HTTPS deployment and actual README rendering through GitHub's image proxy remain pending. Local browser tests cannot verify Camo's cache behavior. No token values were displayed or committed.

## Card grades and profile flip

Added an F–S activity grade with threshold and incomplete-coverage tests, removed the slogan from SVG card footers, and added a website-only 3D profile flip with avatar, bio, keyboard/touch controls, Escape focus restoration, reduced motion, and profile retry states. Browser tests use port 3100 and `.next-test` to avoid the user's development server. Unit suite: 81 passed. Desktop/mobile browser suite: 12 passed. SVG front and profile-back screenshots reviewed in both viewport sizes. Live GitHub behavior still depends on the deployment token configuration described above.

## Foundation checks

Verified on Windows with Node 24 on 2026-11-02:

- `npm run typecheck`: passed.
- `npm test`: 19 tests passed.
- `npm run build`: passed using webpack; the landing page is statically prerendered.
- `npm run test:e2e`: 4 tests passed across desktop Chromium and mobile Chromium emulation.
- Dependency installation audit: no reported vulnerabilities.

Sandbox restrictions required executing tests and the build with access to process creation and temporary files. Chromium installation required network access. Turbopack's CSS worker failed even outside the sandbox; webpack passed and is configured for both development and builds.

Browser tests verify validation, yearly/all-time controls, honest live-report messaging, sample navigation, theme selection and Escape dismissal. They do not constitute a complete visual or accessibility audit. Public GitHub publication, remote labels, Discussions and Vercel deployment remain unconfigured.
