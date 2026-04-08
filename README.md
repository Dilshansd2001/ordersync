# OrderSync.lk

OrderSync.lk is a full-stack order management platform with:

- a React + Vite frontend
- an Express + MongoDB backend API
- an Electron desktop app
- a local desktop sync/database module

## Project Structure

- `backend/` - Express API, auth, analytics, settings, sync endpoints
- `frontend/` - React web app built with Vite
- `desktop/electron/` - Electron desktop shell
- `desktop/local-db/` - local database and sync helpers for the desktop app
- `build-assets/` - Windows installer and desktop branding assets

## Requirements

- Node.js 20+
- npm
- MongoDB connection string for backend

## Local Development

### 1. Backend

Create `backend/.env` from `backend/.env.example`, then run:

```bash
cd backend
npm install
npm run dev
```

Default backend URL:

```text
http://localhost:5000
```

### 2. Frontend

Create `frontend/.env` from `frontend/.env.example`, then run:

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

### 3. Desktop App

Create `desktop/.env` from `desktop/.env.example` if needed.

From the project root:

```bash
npm install
npm run electron:start
```

## Build

### Frontend build

From project root:

```bash
npm run frontend:build
```

### Desktop installer build

From project root:

```bash
npx electron-builder --win nsis --config.npmRebuild=false
```

Installer output is created in:

```text
release/
```

## GitHub Desktop Workflow

Recommended for this repo:

1. Add the local folder `f:\OderSync.LK\OrderSync` to GitHub Desktop.
2. Review changes before the first commit.
3. Commit source code only.
4. Publish the repository to GitHub.

Do not commit:

- `.env` files
- `node_modules`
- `release/`
- `frontend/dist/`
- uploaded files inside `backend/uploads/`

## Desktop Releases

Keep desktop source code in this repo, but upload built installer files through GitHub Releases instead of committing them into git.

Recommended release asset:

- `release/OrderSync.lk-Setup-<version>.exe`

## Deployment Recommendation

- Frontend: Cloudflare Pages
- Backend: Render
- Database: MongoDB Atlas
- Desktop installer distribution: GitHub Releases

See also:

- `DEPLOYMENT.md`

## Notes

- Backend currently serves `/uploads` locally for development, so production should use external object/file storage where possible.
- `build-assets/icon.ico` is the primary Windows app icon.
