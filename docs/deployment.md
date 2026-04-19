# Deployment Readiness Guide

## Branch
Use branch: `ujjwal-1`

## Backend Deployment (Render)

### Option A: Blueprint (`render.yaml`)
1. Push repository with `render.yaml` at repo root.
2. In Render, choose "New Blueprint" and import repo.
3. Select service `bookish-backend`.
4. Confirm root directory is `backend`.
5. Add required environment variables:
   - `MONGODB_URI`
   - `REDIS_URL`
   - `SESSION_SECRET`
   - `FRONTEND_URL`
   - `BACKEND_URL`
   - Stripe keys if subscription/payment routes are used.
6. Deploy.

### Option B: Manual Web Service
- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Environment: Node 20

### Verify backend after deploy
- Health: `/api/health`
- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/openapi.json`

## Frontend Deployment (Vercel)
1. Import repo to Vercel.
2. Set project root to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add frontend env var pointing to backend base URL (e.g. `VITE_API_URL`).
6. Deploy.

## Environment Variables Checklist
Backend (`backend/.env` style):
- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `BACKEND_URL`
- `MONGODB_URI`
- `REDIS_URL`
- `SESSION_SECRET`
- Stripe keys (if enabled)

No credentials are hardcoded in code.
