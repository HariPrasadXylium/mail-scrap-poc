# mail-scrap-poc

Lightweight proof-of-concept to fetch Gmail messages by subject, parse them, save attachments, and persist structured data to MongoDB. The project also supports a Redis/BullMQ-based background processing flow and a cron to enqueue message jobs.

## Quick start (for a new developer)

Prerequisites:
- Node.js (16+ recommended)
- MongoDB (local or remote)
- Redis (default port 6379)

1. Clone the repo:

```bash
git clone https://github.com/HariPrasadXylium/mail-scrap-poc.git
cd mail-scrap-poc
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` in the project root and set required variables (see below). Example:

```
APP_PORT=3002
MONGO_URI=mongodb://localhost:27017/gmail_poc
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=http://localhost:3003/oauthcallback
CRON_SUBJECTS=Invoice,Payment
# Optional
CRON_INTERVAL_MS=300000
UPLOAD_DIR=./uploads
TOKEN_ADMIN_KEY=some-secret-key
```

4. Start services (Mongo & Redis). For local testing you can use Docker for Redis:

```bash
# run Redis (if you don't have one)
docker run -p 6379:6379 -d redis

# run Mongo (if needed)
docker run -p 27017:27017 -d mongo
```

5. Start the app (this also initializes the BullMQ workers):

```bash
node src/index.js
```

6. Authorize Gmail access (one-time):

- Visit: `http://localhost:<APP_PORT || 3003>/auth` and follow Google consent. After successful consent the tokens are saved to the database.

---

## Important environment variables

| Variable | Required | Purpose |
|---|:---:|---|
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth client secret |
| `REDIRECT_URI` | Yes | OAuth redirect URI (must match Google Console) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `APP_PORT` | No (3002) | App port |
| `REDIS_HOST` / `REDIS_PORT` | No (127.0.0.1:6379) | Redis connection for BullMQ |
| `CRON_SUBJECTS` | No | Comma-separated subjects for cron (e.g. `Invoice,Payment`) - if set, cron starts automatically |
| `CRON_INTERVAL_MS` | No (300000) | Cron interval in milliseconds |
| `UPLOAD_DIR` | No (`./uploads`) | Where attachments are stored |
| `TOKEN_ADMIN_KEY` | No | Optional admin key for token delete endpoint |

> Note: Tokens are persisted in MongoDB (not in `tokens.json` by default). If you previously used a file, it is ignored and you should remove it.

---

## Key endpoints (HTTP)

- `GET /auth` → Redirects to Google consent screen.
- `GET /oauthcallback?code=...` → OAuth callback that exchanges code and saves tokens.
- `GET /fetch/emails?subject=<term>` → Immediate fetch for the given subject (existing behavior preserved).
- `GET /fetch/threads/:messageId` → Returns saved messages for the thread that contains `messageId`.
- `GET /api/tokens/status` → Returns whether tokens are present (no raw tokens returned).
- `POST /api/tokens/delete` → Deletes tokens (requires `x-admin-key` header if `TOKEN_ADMIN_KEY` set).

---

## Cron & workers (background processing)

- The cron enqueues message jobs for each subject configured in `CRON_SUBJECTS`.
- BullMQ (Redis) is used for queueing. Two queues are created:
  - `messageQueue`: processes single Gmail messages (downloads attachments, persists Email documents).
  - `threadQueue`: processes Gmail threads and enqueues per-message jobs.
- Workers are automatically started when the app boots (the server loads `src/workers/*`).

To manually run a single cron scan (useful for testing):

```bash
node -e "require('./src/cron/fetchCron').runCronOnce().catch(console.error)"
```

---

## Testing tips (prototype)

- To test auth: visit `/auth` and verify tokens saved (`GET /api/tokens/status`).
- To test fetch: call `/fetch/emails?subject=Invoice` or set `CRON_SUBJECTS` and run the cron manually. Use `GET /fetch/threads/:messageId` to inspect thread-saved messages.
- Background processing uses Redis; you can watch queue lengths with tools like `bull-board` or `redis-cli`.

---

## Security & best practices

- **Never** commit secrets (`.env`, client secrets, or `tokens.json`) to the repository. `.gitignore` contains `.env` and `tokens.json`.
- If a secret is ever committed, **rotate/revoke it immediately**, then remove it from git history using tools like `git-filter-repo` or `BFG` (coordinate with the team as this rewrites history).
- Keep OAuth scopes minimal (we currently use Gmail readonly) and store tokens securely.

---

## Project layout (high-level)

```
src/
  controllers/        # HTTP controllers
  services/           # business logic (gmail, tokens, processing)
  workers/            # bullmq workers (message, thread)
  queues/             # queue initialization and schedulers
  cron/               # cron runner to enqueue jobs
  routes/             # express routes
  models/             # mongoose schemas
  utils/              # helpers (body extraction, parsing)
```

---