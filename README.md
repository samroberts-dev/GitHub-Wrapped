# ↗ GitHub Wrapped

**Your code. Your journey. Your year.**

An independent, MIT-licensed GitHub retrospective. Not affiliated with GitHub or Spotify.

[Live site](https://git-hub-wrapped-phi.vercel.app/) · [Source repository](https://github.com/samroberts-dev/GitHub-Wrapped)

## README cards + JSON API

Generate an SVG of your public GitHub contributions and embed it in a profile README. Includes yearly and available-history cards, three themes, a Markdown builder, and a JSON endpoint for custom integrations. The decorative landing preview and sample slides remain explicitly illustrative.

Cards include a documented F–S activity grade. On the website, hover or tap to flip the generated card over for the developer's avatar and bio. The README image stays static. See [grade rules and profile preview](docs/api.md#activity-grade).

```markdown
![My GitHub Wrapped](https://git-hub-wrapped-phi.vercel.app/api/card?username=samroberts-dev&year=2026&theme=default)
```

Replace `samroberts-dev` with your username. If self-hosting, replace the domain with your deployment. This belongs in a **profile README**, not GitHub's short bio field. See [API setup and parameters](docs/api.md).

## Run and test

Use Node.js 22.12+ (24 recommended) and npm. The landing page works without a token; live cards require the server configuration below.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Set `GITHUB_TOKEN` in `.env.local` to a classic personal access token with **public_repo only** (a no-scope classic token is also accepted if GitHub permits the requested fields). The server rejects private-access scopes and fine-grained/App tokens. Never put the token in a card URL, Markdown, browser code, or a `NEXT_PUBLIC_` variable. Restart after changing configuration. See [GitHub's GraphQL authentication guide](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql).

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
git remote add origin https://github.com/samroberts-dev/GitHub-Wrapped.git
git push -u origin main
```

Replace the discovery URL in `src/features/wrapped/landing.tsx` with the real project URL. Add a private conduct-reporting contact, enable Discussions, import `.github/labels.json`, and protect main with required CI checks. Label definitions do not create remote labels automatically.

For Vercel, import the public repository using the Next.js preset and set the server-only `GITHUB_TOKEN` environment variable. Redeploy after adding it. Make the card endpoint public so GitHub's image proxy can fetch it. Repository publication and deployment are account operations and are not completed by this source setup.

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Themes, analytics, translations, documentation and beginner fixes are welcome. New analytics require tests; themes require responsive and accessibility validation. [MIT license](LICENSE).
