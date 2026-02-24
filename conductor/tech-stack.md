# Tech Stack

## Overview

Order Taker is a full-stack TypeScript application with a Vite-powered React frontend and a lightweight tRPC backend. All persistent data is stored in Firebase (Firestore for data, Firebase Auth for authentication). The app is deployed as a static frontend on Vercel with Firebase handling all backend concerns directly from the client.

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool and dev server |
| Tailwind CSS | 4.x (v4 beta) | Utility-first CSS framework |
| shadcn/ui | Latest | Pre-built accessible UI components |
| Wouter | 3.7.1 | Lightweight client-side routing |
| Recharts | 2.x | Chart library for Reports page |
| Lucide React | Latest | Icon library |
| Sonner | Latest | Toast notifications |
| date-fns | Latest | Date formatting and manipulation |
| PapaParse | Latest | CSV parsing for import/export |

## Backend / Data Layer

| Technology | Purpose |
|---|---|
| Firebase Auth | Email/password authentication |
| Cloud Firestore | Real-time NoSQL database (per-user collections) |
| Firebase SDK (client) | Direct client-to-Firestore reads/writes via `onSnapshot` |
| tRPC | Minimal server router (auth logout only; most data flows are client-side) |

## Infrastructure

| Component | Service |
|---|---|
| Hosting | Vercel (static deployment, auto-deploy from GitHub) |
| Database | Google Cloud Firestore |
| Authentication | Firebase Authentication |
| CDN / Assets | Vercel Edge Network |
| Domain | `ordertakerweb.vercel.app` |

## Development Tools

| Tool | Purpose |
|---|---|
| pnpm | Package manager |
| Vitest | Unit testing framework |
| ESLint | Code linting (via Vite plugin) |
| GitHub | Source control and CI trigger |

## Fonts

The application uses **Plus Jakarta Sans** loaded from Google Fonts CDN. This is the only external asset dependency.

## Environment Variables

All environment variables are prefixed with `VITE_` for Vite client-side injection.

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Data Model

The Firestore data is organized per-user under `users/{uid}/`:

| Collection | Document Shape | Description |
|---|---|---|
| `users/{uid}/orders` | `Order` (id, customerName, items[], notes, pickupDate, pickupTime, source, status, total, timestamp) | All orders for this user |
| `users/{uid}/menu` | `MenuItem` (id, name, basePrice, category, available) | Menu items catalog |
| `users/{uid}/settings/config` | `AppSettings` (sources[], accentColor, currency) | User preferences |

## Key Architectural Decisions

**Client-side Firestore access:** The app reads and writes directly to Firestore from the browser using Firebase SDK's `onSnapshot` for real-time updates. This eliminates the need for a custom API server for CRUD operations. The tRPC server exists primarily for the Manus WebDev scaffold and handles only auth logout.

**Per-user data isolation:** Each user's data lives under `users/{uid}/` in Firestore. Firebase Security Rules enforce that users can only read/write their own data.

**Static deployment on Vercel:** Since all data operations happen client-side via Firebase, the app can be deployed as a static site. Vercel auto-deploys on every push to `main`.

**Tailwind CSS v4:** The project uses the Tailwind v4 beta with the Vite plugin (`@tailwindcss/vite`), which replaces the traditional `tailwind.config.ts` with CSS-based configuration via `@theme` directives in `index.css`.
