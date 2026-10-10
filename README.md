# Seekora

Seekora's landing page and React application use the Java servlet backend and
MySQL database in the sibling `seekora-backend` project. Supabase is no longer
required. The backend keeps database credentials and the Gemini API key server-side.

General search, chat, and research questions use Gemini with Google Search
grounding. The API returns citations only when Gemini supplies grounded source
annotations. A server-side `GEMINI_API_KEY` is required for live answers;
without it, the API reports that AI answers are not configured rather than
returning a saved demo response.

## Database and backend setup

Follow the backend README for MySQL installation, database credentials, schema
and seed setup, Tomcat 9 configuration, and the `GEMINI_API_KEY` environment
variable:

[`../Seekora.AI/seekora-backend/README.md`](../Seekora.AI/seekora-backend/README.md)

For a new database, run `database/schema.sql` and `database/seed.sql` in the
backend project. If upgrading an existing Seekora MySQL database, run
`database/migrations/20261009_react_app_conversations.sql` to add saved
conversations and messages without dropping existing data.

## Local frontend development

Copy `.env.example` to `.env.local` if you need to override the API location.
`VITE_API_BASE_URL` must include the API prefix (for example,
`http://localhost:8080/seekora/api`). Do not put AI or database credentials in
frontend environment variables; Vite variables are included in browser code.
With the variable unset, the app uses `/api` on the current origin.

Start MySQL and the backend first, deployed at the `/seekora` context path, then
run the frontend:

```powershell
npm ci
npm run dev
```

Vite serves the landing page at `http://localhost:5173/`, the React app at
`http://localhost:5173/app/`, and proxies `/api` requests to
`http://localhost:8080/seekora/api`. The app uses cookie-based sessions.

The API surface used by the frontend includes:

| Purpose | API |
|---------|-----|
| Sign-up, sign-in, session, sign-out | `/api/auth/*` |
| AI answers and saved conversations | `/api/ai`, `/api/conversations/*` |
| Landing-page search and live statistics | `/api/search`, `/api/content/stats` |
| Newsletter, contact, and plan selection | `/api/newsletter`, `/api/contact`, `/api/subscriptions` |

Plan selection records a plan choice; it does not process a payment. Live AI
answers require the backend's server-side `GEMINI_API_KEY`; without it, the
backend reports that AI is unavailable.

## Build and deploy the website to Tomcat

Install the frontend dependencies and package both the landing page and React
app into the backend WAR. The landing-page search, authentication, newsletter,
chat widget, and plan selection use the Tomcat API. PowerShell:

```powershell
npm ci
npm run build:tomcat -- -BackendPath 'C:\path\to\seekora-backend'
```

This builds the React entry and copies it to the backend web app's `app`
directory; it also updates the root landing page before packaging the WAR.
Deploy `target\seekora.war` to Tomcat 9. With the default `/seekora` context,
the landing page is at
`http://localhost:8080/seekora/` and the React application is at
`http://localhost:8080/seekora/app/`.

The React app and `/api/*` routes use the same Tomcat origin and the
`JSESSIONID` cookie for sign-in. During local Vite development, run the backend
at `http://localhost:8080/seekora`; Vite proxies `/api` requests to it.

## Deploy to Render without Tomcat

The Render deployment uses the existing Java servlet WAR on Jetty 9, so you do
not need to install or manage Tomcat. The frontend and API are separate Render
services because they are maintained in separate GitHub repositories.

1. Create a managed MySQL database with a provider that supports external
   connections. Render does not provide managed MySQL. Run the backend's
   `database/schema.sql` and `database/seed.sql` against the new database.
2. In Render, create a Blueprint from `Aditya1532007/Seekora.AI` and set the
   Blueprint path to `seekora-backend/render.yaml`. Configure the prompted
   `SEEKORA_DB_URL`, `SEEKORA_DB_USER`, `SEEKORA_DB_PASSWORD`,
   `SEEKORA_ALLOWED_ORIGINS`, and `GEMINI_API_KEY` values. Set the allowed
   origin to `https://seekora-frontend.onrender.com` (or the actual frontend
   URL if you rename that service). `GEMINI_API_KEY` is required for AI answers.
3. Create a Blueprint from this repository using its root `render.yaml`. It
   builds the static site and points `VITE_API_BASE_URL` at
   `https://seekora-api.onrender.com/api`. If Render assigns the API a different
   URL, update that variable to the API's URL plus `/api` and redeploy the
   frontend.
4. Verify the API health check at `https://seekora-api.onrender.com/api/health`
   and open the frontend URL. The health check reports unavailable until valid
   database settings are configured.

The backend Blueprint builds and tests the Java WAR, then runs it on Jetty.
The browser API client includes credentials for the cross-origin session cookie;
the backend CORS allowlist must exactly match the deployed frontend origin.

Type-check and lint the frontend with:

```powershell
npm run typecheck
npm run lint
npm run build
```

`mvn test` runs the backend Gemini request/response and provider-error tests.
There are not yet database-backed API integration tests or frontend automated
tests.
