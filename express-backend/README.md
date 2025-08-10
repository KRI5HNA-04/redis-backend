# express-backend

Quick start (Windows PowerShell):

```powershell
cd express-backend
npm install
# Option A: development with auto-reload
npm run dev
# Option B: build + run
npm run build; npm start
```

If you see repeated `ECONNREFUSED 127.0.0.1:6379` / `::1:6379` errors, Redis is not running.

Run Redis via Docker (simplest):

```powershell
docker run --name redis-local -p 6379:6379 redis:7-alpine
```

Then re-start the dev server (`Ctrl+C` then `npm run dev`).

Submit test request:

```powershell
curl -X POST http://localhost:3000/submit -H "Content-Type: application/json" -d '{"problemID":1,"userId":"u1","code":"print(1)","language":"python"}'
```

The submission JSON will be pushed to the Redis list `submissions`.

Environment variables:

- `PORT` – override server port.
- `REDIS_URL` (not yet wired) – can be added later to point to remote Redis.

Next improvements (optional):

- Add Docker Compose for app + redis.
- Add health endpoint.
- Wire `REDIS_URL` env var.
