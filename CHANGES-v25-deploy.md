# CitySync v25 – deploy fixes

- Root `package.json` and all docs pointed to a folder `F11/` that does not exist (the folder is `Frontend/`): `npm run setup`, `dev:web`, `test` and `setup:env` (which creates the frontend `.env`) would fail. All references now say `Frontend`.
- Added root scripts `build`, `start`, `lint`.
- Added single-page-app fallbacks so deep links (`/citizen/...`) work on static hosts: `Frontend/public/_redirects` (Netlify / Cloudflare Pages) and `Frontend/vercel.json`.
- Added `Frontend/.env.production.example` and a deployment checklist in `README.md`.

Checked here (no network, no database): syntax of every backend file, every frontend .js/.jsx parsed with esbuild, every relative import and every `/images`, `/roles`, `/progress` asset reference resolves, 35 of 36 frontend tests pass (the 36th only needs `npm install` for TensorFlow).
Not run here: `npm install`, `npm run build`, the API test suite (needs PostgreSQL). Run `npm run setup && npm run db:up && npm run db:init && npm test` once on your machine.
