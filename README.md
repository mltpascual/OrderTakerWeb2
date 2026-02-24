# Order Taker

A fast, clean order-taking progressive web app built for food and beverage businesses. Manage incoming orders from walk-ins, phone calls, Facebook, and online marketplaces — all from your phone or tablet.

**Live:** [ordertakerweb.vercel.app](https://ordertakerweb.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| **New Order** | Create orders with customer name, pickup date/time, source channel, menu items with quantities, and notes |
| **Order Pipeline** | Three-tab view — Today (pending), Pending (all), Completed — with search, sort, edit, complete, and delete |
| **Menu Management** | Add, edit, delete, and toggle availability of menu items organized by category |
| **Reports** | Revenue summaries, order counts, top-selling items, source breakdown, and daily/weekly/monthly charts |
| **Settings** | Configure order sources, accent color, currency (PHP/USD), dark mode, and CSV export/import |
| **PWA** | Installable on mobile home screens with offline caching via service worker |
| **Real-time Sync** | All data syncs in real-time across devices via Firestore's `onSnapshot` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Routing | Wouter |
| Charts | Recharts |
| Icons | Lucide React |
| Authentication | Firebase Auth (email/password) |
| Database | Cloud Firestore (real-time NoSQL) |
| Hosting | Vercel (static deployment) |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm installed
- A Firebase project with Authentication and Firestore enabled

### 1. Clone the Repository

```bash
git clone https://github.com/mltpascual/OrderTakerWeb2.git
cd OrderTakerWeb2
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
pnpm build
```

The output is generated in `dist/public/` — a static build ready for deployment.

---

## Deployment

The app is deployed on **Vercel** with auto-deploy from the `main` branch on GitHub.

### How It Works

1. Push code to `main` on GitHub
2. Vercel detects the push and runs `pnpm build`
3. Static files from `dist/public/` are deployed to Vercel's edge CDN
4. The site is live at [ordertakerweb.vercel.app](https://ordertakerweb.vercel.app)

### Environment Variables on Vercel

All `VITE_FIREBASE_*` environment variables must be configured in the Vercel project settings under **Settings > Environment Variables** for all environments (Production, Preview, Development).

---

## Project Structure

```
OrderTakerWeb2/
├── client/                     # Frontend application
│   ├── public/                 # Static assets (icons, manifest, hero image)
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── MainLayout.tsx  # Sidebar (desktop) + bottom bar (mobile)
│   │   │   └── ui/             # shadcn/ui primitives
│   │   ├── contexts/           # React context providers
│   │   │   ├── AuthContext.tsx  # Firebase auth state
│   │   │   └── ThemeContext.tsx # Dark mode + accent color
│   │   ├── hooks/              # Custom data hooks
│   │   │   ├── useOrders.ts    # Firestore orders CRUD
│   │   │   ├── useMenu.ts      # Firestore menu CRUD
│   │   │   └── useSettings.ts  # Firestore settings CRUD
│   │   ├── lib/                # Utilities
│   │   │   ├── firebase.ts     # Firebase initialization
│   │   │   └── types.ts        # TypeScript type definitions
│   │   ├── pages/              # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── NewOrder.tsx
│   │   │   ├── Pipeline.tsx
│   │   │   ├── MenuManagement.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── App.tsx             # Root component with routing
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles + design tokens
│   └── index.html              # HTML template
├── server/                     # Backend (minimal, scaffold-provided)
│   ├── *.test.ts               # Test files
│   └── routers.ts              # tRPC router (auth logout only)
├── conductor/                  # Project context documentation
├── C4-Documentation/           # Architecture diagrams (C4 model)
├── DESIGN.md                   # Visual design system
├── README.md                   # This file
├── package.json
└── vite.config.ts
```

---

## Data Model

All data is stored in Firestore under per-user collections at `users/{uid}/`:

| Collection | Key Fields | Description |
|---|---|---|
| `orders` | customerName, items[], pickupDate, pickupTime, source, status, total, notes | Customer orders with line items |
| `menu` | name, basePrice, category, available | Menu item catalog |
| `settings/config` | sources[], accentColor, currency | User preferences |

### Order Status Flow

```
pending  ──→  completed
```

Orders are created with `status: "pending"`. When marked complete, the status changes to `"completed"` and a `completedAt` timestamp is added. The Today tab shows only today's pending orders. The Complete tab shows all completed orders sorted by most recent.

---

## Design System

The app uses the **"Warm Craft"** design language — a warm, inviting aesthetic with amber accents, cream backgrounds, and amber-tinted shadows. Key design tokens:

| Token | Value | Purpose |
|---|---|---|
| Primary color | Warm amber (`oklch(0.62 0.17 52)`) | Buttons, active states, accents |
| Background | Warm cream (`oklch(0.98 0.005 75)`) | Page canvas |
| Border radius | `rounded-2xl` (16px) | All cards and containers |
| Shadows | `shadow-warm-sm` through `shadow-warm-xl` | Amber-tinted depth |
| Font | Plus Jakarta Sans | All text |

For the complete design system, see [DESIGN.md](./DESIGN.md).

---

## Documentation

| Document | Purpose |
|---|---|
| [DESIGN.md](./DESIGN.md) | Complete visual design system (colors, typography, shadows, components, accessibility) |
| [conductor/](./conductor/) | Project context: product vision, tech stack, development workflow |
| [C4-Documentation/](./C4-Documentation/) | Architecture documentation using the C4 model (System Context, Container, Component) |

---

## License

Private repository. All rights reserved.
