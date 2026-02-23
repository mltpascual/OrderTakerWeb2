# Vercel Deployment Guide — Order Taker App

This guide covers deploying the Order Taker app to Vercel. The app is a **full-stack** project with:

- **Frontend**: React 19 + Vite + Tailwind CSS 4 (SPA)
- **Backend**: Express + tRPC (serverless function on Vercel)
- **Data**: Firebase Firestore (client-side) + Firebase Auth
- **Database**: MySQL/TiDB via Drizzle ORM (server-side, for user auth only)

---

## Architecture on Vercel

| Layer | How It Runs |
|-------|-------------|
| Frontend (React SPA) | Static files served from Vercel CDN (`dist/public/`) |
| API routes (`/api/*`) | Vercel Serverless Functions (`api/index.ts`) |
| Firebase (Firestore) | Direct client-side connection (no server needed) |
| MySQL (Drizzle ORM) | Server-side via `DATABASE_URL` env var |

---

## Step-by-Step Deployment

### 1. Import from GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select `mltpascual/OrderTakerWeb`
4. Vercel will auto-detect the Vite framework

### 2. Configure Build Settings

Vercel should auto-detect these from `vercel.json`, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `pnpm build` |
| Output Directory | `dist/public` |
| Install Command | `pnpm install` |

### 3. Set Environment Variables

You **must** add these environment variables in Vercel's project settings before deploying:

#### Required — Firebase (Client-Side)

These are embedded in the frontend build via Vite's `import.meta.env`:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g., `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g., `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

#### Required — Database (Server-Side)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL/TiDB connection string (with SSL) |
| `JWT_SECRET` | Secret for signing session cookies |

#### Optional — Manus OAuth (Server-Side)

These are only needed if you want to keep the Manus OAuth flow. If you only use Firebase Auth, you can skip these:

| Variable | Description |
|----------|-------------|
| `VITE_APP_ID` | Manus OAuth app ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth login portal URL |
| `OWNER_OPEN_ID` | Owner's Manus open ID |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API URL |
| `BUILT_IN_FORGE_API_KEY` | Manus built-in API key |

### 4. Deploy

Click **Deploy**. Vercel will:
1. Install dependencies with `pnpm install`
2. Run `pnpm build` (Vite builds the frontend to `dist/public/`, esbuild bundles the server)
3. Serve static files from `dist/public/` via CDN
4. Route `/api/*` requests to the serverless function in `api/index.ts`

---

## Important Notes

### Firebase Auth Domain

After deploying, add your Vercel domain to Firebase's authorized domains:

1. Go to [Firebase Console](https://console.firebase.google.com/) → Authentication → Settings
2. Under **Authorized domains**, add your Vercel domain (e.g., `order-taker-web.vercel.app`)

### Database SSL

If using TiDB or a cloud MySQL provider, ensure your `DATABASE_URL` includes SSL parameters:

```
mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
```

### Client-Side Routing

The `vercel.json` includes rewrites to handle SPA client-side routing. All non-API, non-asset routes fall back to `index.html`.

### Serverless Function Cold Starts

The API runs as a serverless function. First requests after idle periods may take 1-3 seconds (cold start). Subsequent requests are fast.

---

## Files Added for Vercel

| File | Purpose |
|------|---------|
| `vercel.json` | Build config, rewrites, and serverless function settings |
| `api/index.ts` | Express app exported as a Vercel serverless function |
| `VERCEL_DEPLOYMENT.md` | This deployment guide |

---

## Troubleshooting

### Build fails with "Cannot find module"

Make sure all dependencies are in `dependencies` (not just `devDependencies`) in `package.json` if they're used by the server.

### API returns 404

Check that `vercel.json` rewrites are correct and that `api/index.ts` exports the Express app as `default`.

### Firebase auth not working

Add your Vercel domain to Firebase's authorized domains list.

### Database connection fails

Verify `DATABASE_URL` is set correctly in Vercel environment variables and includes SSL parameters if required.
