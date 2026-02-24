# C4 Level 3 — Component Diagram

## Overview

This document zooms into the React SPA container and describes its internal components, their responsibilities, and how they interact.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          React SPA                                  │
│                                                                     │
│  ┌──────────────────── App.tsx (Router) ────────────────────────┐   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │                  AuthProvider                            │  │   │
│  │  │  Wraps entire app, provides user state + login/logout   │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌──────────────────────────────────────────────────┐   │  │   │
│  │  │  │              ThemeProvider                        │   │  │   │
│  │  │  │  Manages dark/light mode + accent color          │   │  │   │
│  │  │  │                                                  │   │  │   │
│  │  │  │  ┌────────────────────────────────────────────┐  │   │  │   │
│  │  │  │  │            MainLayout                      │  │   │  │   │
│  │  │  │  │  Sidebar (desktop) + Bottom bar (mobile)   │  │   │  │   │
│  │  │  │  │                                            │  │   │  │   │
│  │  │  │  │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │  │   │  │   │
│  │  │  │  │  │ NewOrder  │ │ Pipeline │ │  Reports  │  │  │   │  │   │
│  │  │  │  │  │          │ │          │ │           │  │  │   │  │   │
│  │  │  │  │  │useMenu() │ │useOrders │ │useOrders()│  │  │   │  │   │
│  │  │  │  │  │useOrders │ │()        │ │useSettings│  │  │   │  │   │
│  │  │  │  │  │useSettngs│ │          │ │()         │  │  │   │  │   │
│  │  │  │  │  └──────────┘ └──────────┘ └───────────┘  │  │   │  │   │
│  │  │  │  │                                            │  │   │  │   │
│  │  │  │  │  ┌──────────┐ ┌──────────┐                │  │   │  │   │
│  │  │  │  │  │ MenuMgmt │ │ Settings │                │  │   │  │   │
│  │  │  │  │  │          │ │          │                │  │   │  │   │
│  │  │  │  │  │useMenu() │ │useSettngs│                │  │   │  │   │
│  │  │  │  │  │          │ │()        │                │  │   │  │   │
│  │  │  │  │  └──────────┘ └──────────┘                │  │   │  │   │
│  │  │  │  └────────────────────────────────────────────┘  │   │  │   │
│  │  │  └──────────────────────────────────────────────────┘   │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Data Layer (Hooks)                        │    │
│  │                                                             │    │
│  │  useOrders() ──── Firestore: users/{uid}/orders             │    │
│  │  useMenu()   ──── Firestore: users/{uid}/menu               │    │
│  │  useSettings()─── Firestore: users/{uid}/settings/config    │    │
│  │  useAuth()   ──── Firebase Auth (via AuthContext)            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    UI Layer (shadcn/ui)                      │    │
│  │                                                             │    │
│  │  Button, Card, Dialog, Sheet, Input, Select, Tabs,          │    │
│  │  Badge, Separator, AlertDialog, Sonner (toasts), etc.       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### Context Providers

| Component | File | Responsibility |
|---|---|---|
| **AuthProvider** | `contexts/AuthContext.tsx` | Subscribes to Firebase Auth state changes via `onAuthStateChanged`. Provides `user`, `loading`, `login()`, and `logout()` to all children. |
| **ThemeProvider** | `contexts/ThemeContext.tsx` | Manages dark/light mode toggle and accent color preference. Applies `.dark` class to root element and sets CSS custom properties for accent color. |

### Page Components

| Page | File | Responsibility | Data Hooks |
|---|---|---|---|
| **Login** | `pages/Login.tsx` | Email/password sign-in form with hero image | `useAuth()` |
| **NewOrder** | `pages/NewOrder.tsx` | Create new orders: select menu items, set customer/pickup details, place order | `useMenu()`, `useOrders()`, `useSettings()` |
| **Pipeline** | `pages/Pipeline.tsx` | View and manage orders across Today/Pending/Complete tabs. Edit, complete, delete orders. | `useOrders()`, `useSettings()` |
| **MenuManagement** | `pages/MenuManagement.tsx` | CRUD for menu items: add, edit, delete, toggle availability, filter by category | `useMenu()` |
| **Reports** | `pages/Reports.tsx` | Revenue metrics, order counts, top items, source breakdown, daily/weekly/monthly charts | `useOrders()`, `useMenu()`, `useSettings()` |
| **SettingsPage** | `pages/SettingsPage.tsx` | Configure sources, accent color, currency, dark mode. CSV export/import. | `useSettings()`, `useOrders()`, `useMenu()` |

### Data Hooks

| Hook | File | Firestore Path | Operations |
|---|---|---|---|
| **useOrders()** | `hooks/useOrders.ts` | `users/{uid}/orders` | Real-time subscribe, add, update, delete orders |
| **useMenu()** | `hooks/useMenu.ts` | `users/{uid}/menu` | Real-time subscribe, add, update, delete menu items |
| **useSettings()** | `hooks/useSettings.ts` | `users/{uid}/settings/config` | Real-time subscribe, update settings document |

All hooks use Firestore's `onSnapshot` for real-time data synchronization. When data changes in Firestore (from any device), the UI updates automatically without polling.

### Layout Components

| Component | File | Responsibility |
|---|---|---|
| **MainLayout** | `components/MainLayout.tsx` | Floating sidebar on desktop (w-64, inset with rounded corners), bottom navigation bar on mobile (fixed, backdrop blur). Contains navigation links and logout button. |

### UI Primitives

The app uses **shadcn/ui** components from `components/ui/`. These are pre-built, accessible React components based on Radix UI primitives, styled with Tailwind CSS. Key components used: Button, Card, Dialog, Sheet, Input, Select, Tabs, Badge, AlertDialog, Separator, and Sonner (toast notifications).

## Data Flow

The data flow follows a unidirectional pattern:

1. **User action** (e.g., clicks "Place Order") triggers a handler in a page component
2. **Page component** calls a mutation function from a data hook (e.g., `addOrder()`)
3. **Data hook** writes to Firestore via the Firebase SDK
4. **Firestore** persists the data and broadcasts the change
5. **`onSnapshot` listener** in the hook receives the update
6. **React state** updates, causing the component to re-render with fresh data

This means there is no local state management library (no Redux, Zustand, or Jotai). All persistent state lives in Firestore and is accessed via real-time subscriptions.
