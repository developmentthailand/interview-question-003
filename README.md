# Interview Question 03 — Approval Queue

A document review workspace for IT 03-1, IT 03-2, and IT 03-3. The table shows pending, approved, and rejected records; reviewers can select pending records, enter a reason, and approve or reject them in one action.

## Run locally

Requires .NET 10, Node.js 22.22.3+, and npm 10.9.8+.

```powershell
dotnet run --project backend/Question003.Api/Question003.Api.csproj --launch-profile http
```

In a second terminal:

```powershell
cd frontend
npm ci
npm start
```

Open `http://localhost:4202`. Angular proxies `/api` to the API at `http://localhost:5217`. SQLite creates `backend/Question003.Api/approvals.db` with mock documents the first time the API starts.

## API

- `GET /api/approvals` returns documents and their status.
- `POST /api/approvals/decision` accepts `{ "ids": [1], "status": "Approved", "reason": "..." }`; `status` may be `Approved` or `Rejected`.
- The API requires a nonblank reason of at most 500 characters and accepts only pending records. A stale or repeated decision returns `409 Conflict`.

Batch decisions run in one serializable transaction. A database unique index protects document numbers.

## Verify

```powershell
dotnet test tests/backend/Question003.Api.Tests/Question003.Api.Tests.csproj --configuration Release
dotnet build backend/Question003.Api/Question003.Api.csproj --configuration Release
cd frontend
npm test
npm run build
```

Results: backend **3 passed**, Angular **4 passed**, Release build clean, and production Angular bundle **221.65 kB** initial (estimated transfer **62.00 kB**).

Package identity: `@example-com/interview-question-003`; namespace: `Example.Com.InterviewQuestion003`.
