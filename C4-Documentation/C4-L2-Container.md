# C4 Level 2 — Container Diagram

## Overview

This document breaks down the Order Taker system into its major containers (deployable units) and shows how they communicate.

## Container Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (User Device)                       │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (PWA)                             │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │   Pages      │  │  Components  │  │   Contexts/Hooks    │  │  │
│  │  │              │  │              │  │                     │  │  │
│  │  │ - Login      │  │ - MainLayout │  │ - AuthContext       │  │  │
│  │  │ - NewOrder   │  │ - shadcn/ui  │  │ - ThemeContext      │  │  │
│  │  │ - Pipeline   │  │ - Sonner     │  │ - useOrders()       │  │  │
│  │  │ - MenuMgmt   │  │              │  │ - useMenu()         │  │  │
│  │  │ - Reports    │  │              │  │ - useSettings()     │  │  │
│  │  │ - Settings   │  │              │  │                     │  │  │
│  │  └──────┬──────┘  └──────────────┘  └──────────┬──────────┘  │  │
│  │         │                                       │             │  │
│  │         └───────────────┬───────────────────────┘             │  │
│  │                         │                                     │  │
│  └─────────────────────────┼─────────────────────────────────────┘  │
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                    Firebase SDK (HTTPS + WebSocket)
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
     │  Firebase     │ │   Cloud     │ │   Service    │
     │  Auth         │ │  Firestore  │ │   Worker     │
     │              │ │             │ │   (sw.js)    │
     │ Email/Pass   │ │ Per-user    │ │              │
     │ login        │ │ collections │ │ Offline      │
     │              │ │ Real-time   │ │ caching      │
     └──────────────┘ └─────────────┘ └──────────────┘
```

## Containers

| Container | Technology | Purpose | Deployment |
|---|---|---|---|
| **React SPA** | React 19, TypeScript, Vite 6, Tailwind CSS v4 | The entire user interface — all pages, components, routing, and state management | Vercel (static files) |
| **Firebase Auth** | Firebase Authentication SDK | Handles user registration, login, and session persistence | Google Cloud (managed) |
| **Cloud Firestore** | Firebase Firestore SDK | Stores orders, menu items, and settings in per-user document collections with real-time sync | Google Cloud (managed) |
| **Service Worker** | sw.js (custom) | Provides offline caching for PWA support | Bundled with SPA |

## Communication Flows

| From | To | Protocol | Data |
|---|---|---|---|
| React SPA | Firebase Auth | HTTPS | Login credentials, auth tokens |
| React SPA | Cloud Firestore | HTTPS + WebSocket | CRUD operations on orders, menu items, settings (real-time `onSnapshot`) |
| React SPA | Google Fonts CDN | HTTPS | Font files (Plus Jakarta Sans) |
| Service Worker | Vercel CDN | HTTPS | Cached static assets for offline use |

## Key Design Decision

The architecture is deliberately **serverless from the app's perspective**. There is a tRPC server in the codebase (from the Manus WebDev scaffold), but it only handles auth logout. All data operations — creating orders, updating menu items, reading settings — happen directly from the browser to Firestore via the Firebase client SDK. This means the app can be deployed as a purely static site on Vercel with zero server infrastructure to manage.
