# Study Material Platform

Stage 1 focus: **dual-panel document preview**, **upload materials**, and **share** with classmates.

## Quick Start

```bash
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8080 |

**Dev admin (seed data):** login details are in `PRIVATE_NOTES.md` (kept private, not uploaded).

## User flow

1. **Sign in** → lands on **My Courses**
2. **Add course** → pick programme → **Add & open workspace**
3. **Workspace** → left/right panels preview PDFs side by side
4. **Upload** documents and **Create link** to share with others
5. Recipients open the share URL → read-only dual-panel preview

## Scope at this stage

| In scope | Out of scope (UI hidden) |
|----------|--------------------------|
| Dual-panel preview | Admin dashboard |
| Upload materials | Profile settings |
| Share links | Course search homepage |
| My Courses list | Archive / visibility toggles |
| — | **AI features** |
| — | **Interactive simulators** |

Backend admin APIs remain for seeding official content; the student app is workspace-first. AI and simulators are explicitly out of scope for Stage 1 — no endpoints or UI for them.

## Tests

```bash
cd backend && ./gradlew test
cd frontend && npm run build
```
