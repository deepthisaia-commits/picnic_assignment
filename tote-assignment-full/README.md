
# Picnic Tote Assignment - Angular (Material)

This repository is a minimal, production-minded solution scaffold for the "Get Tote Contents" assignment.

## What is included
- Angular app scaffold (src/)
- Angular Material for UI
- Core ToteService to GET tote contents from `/api/totes/:id`
- ToteListComponent that shows items, loading state, and error handling
- Mock API with `json-server` via `db.json`
- Proxy config to route `/api` to `json-server`
- Basic unit test for the service (example)
- Instructions to run locally and deploy

## Run locally
1. Install dependencies:
   ```
   npm ci
   ```

2. Start mock API (in separate terminal):
   ```
   npx json-server --watch db.json --port 3000
   ```

3. Start the Angular dev server:
   ```
   npm start
   ```

4. Open http://localhost:4200 — the app will call `/api/totes/demo-tote-1` via the proxy.

## StackBlitz / Online Testing
- To run this on StackBlitz, push the repository to GitHub and then use StackBlitz "Import from GitHub".
- Alternatively, open StackBlitz and copy files manually into a new Angular project.

## Deploy
- Push to GitHub and connect to Netlify/Vercel. Build command: `npm run build` and publish `dist/tote-app`.

## Notes
This is a scaffold focusing on the assignment feature. Expand with tests, CI, and styling as needed.


## CI
A GitHub Actions workflow is included under `.github/workflows/ci.yml`. It runs:
- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

## Tests
- Unit tests: `npm run test`
- E2E (Cypress): `npm run e2e` (ensure the app and mock API are running)

## Husky & lint-staged
- Git hooks are configured to run `lint-staged` on pre-commit.
