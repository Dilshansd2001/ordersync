# Deployment Guide

This project is easiest to deploy with:

- Backend API on Render
- Frontend on Cloudflare Pages
- Database on MongoDB Atlas
- Desktop installers on GitHub Releases

## 1. Backend on Render

The repo includes `render.yaml` for the backend service.

### Steps

1. Sign in to Render
2. Create a new Blueprint deployment or create a Web Service from this repo
3. Point the service to the `backend/` root directory if you set it up manually
4. Set the required environment variables
5. Confirm the health check path is:

```text
/health
```

### Required backend environment variables

Use `backend/.env.example` as the source of truth.

Minimum required production values:

- `NODE_ENV=production`
- `CLIENT_URL=https://your-frontend-domain`
- `FRONTEND_URL=https://your-frontend-domain`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `SUPER_ADMIN_EMAIL=...`
- `SUPER_ADMIN_PASSWORD=...`

Recommended external integrations:

- `CLOUDINARY_*`
- `SMTP_*`
- `GEMINI_API_KEY`
- `WHATSAPP_*`
- `TEXTLK_*`

## 2. MongoDB Atlas

1. Create an Atlas cluster
2. Create a database user
3. Add Render outbound IP access or temporarily allow your required IP range
4. Copy the connection string into `MONGODB_URI`

## 3. Frontend on Cloudflare Pages

### Build settings

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command:

```text
npm install && npm run build
```

- Output directory:

```text
dist
```

### Frontend environment variable

- `VITE_API_URL=https://your-render-backend-domain/api`

Use `frontend/.env.example` as the local reference.

## 4. Desktop App Production Config

For production desktop builds, use:

- `ORDERSYNC_SYNC_API_URL=https://your-render-backend-domain/api`
- `ELECTRON_DISABLE_UPDATES=false`

Local reference file:

- `desktop/.env.example`

## 5. Desktop Release Workflow

1. Build the Windows installer locally
2. Open GitHub Releases
3. Upload the generated installer
4. Publish a tagged release like `v1.0.2`

## 6. Recommended First Production Rollout

1. Deploy backend
2. Verify `/health`
3. Deploy frontend
4. Verify login, uploads, mail, and API access
5. Update desktop API URL
6. Build and publish the next desktop installer

## Notes

- The backend can use local `/uploads` in development, but production should use Cloudinary.
- The frontend default local API URL is `http://localhost:5000/api`.
- The desktop app should point to the production backend before publishing the next installer.
