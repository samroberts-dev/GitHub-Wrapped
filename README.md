# ↗ GitHub Wrapped

**Your code. Your journey. Your year.**

An independent, MIT-licensed GitHub retrospective. Not affiliated with GitHub or Spotify.

## Phase 1

Responsive landing page, yearly/all-time controls, username validation, three labelled sample slides and three theme previews. Live reports are not implemented. Generate validates input and explains availability; statistics are illustrative.

## Run and test

Use Node.js 22.12+ (24 recommended) and npm. No token is required.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000.

```powershell
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm start` serves the production build. Browser tests cover desktop and mobile. CI runs checks on pushes and pull requests.

The scripts use Next.js's supported webpack compiler because Turbopack failed to launch its CSS worker on the initial Windows environment. Use `npm run format` to format source files.

## Equivalent initialization commands

These files already implement the foundation; do not scaffold over them. In a fresh directory:

```powershell
npx create-next-app@latest github-wrapped --typescript --tailwind --app --src-dir --import-alias "@/*" --use-npm
cd github-wrapped
npm install motion zod
npm install -D vitest @playwright/test
```

The lockfile pins resolved versions. Recharts will be installed when charts are implemented.

## Architecture and next steps

See [architecture](docs/architecture.md) for module boundaries, historical limitations, provenance and security. See [roadmap](docs/roadmap.md) for phased work. GitHub transport, calculations, presentation and themes stay separate.

## Public repository setup

After checks pass, create an empty public GitHub repository under your account, then run:

```powershell
git init
git add .
git commit -m "Build GitHub Wrapped foundation"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/github-wrapped.git
git push -u origin main
```

Replace the discovery URL in `src/features/wrapped/landing.tsx` with the real project URL. Add a private conduct-reporting contact, enable Discussions, import `.github/labels.json`, and protect main with required CI checks. Label definitions do not create remote labels automatically.

For Vercel, import the public repository using the Next.js preset. Phase 1 requires no secrets. Repository publication and deployment are account operations and are not completed by this source setup.

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Themes, analytics, translations, documentation and beginner fixes are welcome. New analytics require tests; themes require responsive and accessibility validation. [MIT license](LICENSE).
