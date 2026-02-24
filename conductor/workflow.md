# Workflow

## Development Methodology

The project follows an iterative development approach with visual-first changes reviewed via live preview. Logic changes are verified through the Vitest test suite.

## Git Workflow

**Branch strategy:** All work is committed directly to `main`. The project is a single-developer application and uses Vercel's auto-deploy on push for continuous deployment.

**Commit conventions:** Commits use descriptive messages with prefixes when applicable:
- `Fix:` for bug fixes
- `Add` for new features or assets
- Standard descriptive messages for visual/design changes

## Build and Deploy

The deployment pipeline is fully automated:

1. Developer pushes to `main` on GitHub
2. Vercel detects the push and triggers a build
3. Vercel runs `pnpm build` (which executes `vite build`)
4. Built static files from `dist/public/` are deployed to Vercel's edge network
5. The site is live at `ordertakerweb.vercel.app`

Build command: `pnpm build`  
Output directory: `dist/public`  
Framework preset: Vite

## Testing

The project has a Vitest test suite located in `server/`. Test files follow the pattern `server/*.test.ts`. Tests cover core logic, settings, import/export, reports, validation, and bug fixes across 9 batch files.

Run tests: `npx vitest run`

## Code Quality

**Type checking:** TypeScript strict mode is enforced across both client and server code. The `vite build` command performs type checking as part of the build process.

**Linting:** ESLint is configured via the Vite plugin for development-time feedback.

**Design system compliance:** All UI changes must follow the "Warm Craft" design system documented in `DESIGN.md`. Key rules include consistent use of `rounded-2xl` for cards, `shadow-warm-*` tokens for shadows, and the warm amber color palette.

## File Organization

```
OrderTakerWeb2/
├── client/                  # Frontend (React + Vite)
│   ├── public/              # Static assets (icons, manifest, hero image)
│   ├── src/
│   │   ├── components/      # Reusable components (MainLayout, UI primitives)
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   ├── hooks/           # Custom hooks (useOrders, useMenu, useSettings)
│   │   ├── lib/             # Utilities (firebase, types, trpc, utils)
│   │   ├── pages/           # Page components (Login, NewOrder, Pipeline, etc.)
│   │   ├── App.tsx          # Root component with routing
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles and design tokens
│   └── index.html           # HTML template
├── server/                  # Backend (tRPC, minimal)
│   ├── *.test.ts            # Test files
│   ├── routers.ts           # tRPC router definitions
│   ├── storage.ts           # Storage helpers (Manus scaffold)
│   └── index.ts             # Server entry point
├── shared/                  # Shared types and constants
├── conductor/               # Project context documentation
├── C4-Documentation/        # Architecture documentation
├── DESIGN.md                # Visual design system
├── README.md                # Setup and usage guide
└── package.json             # Dependencies and scripts
```

## Environment Setup

1. Clone the repository
2. Run `pnpm install`
3. Create a `.env` file with Firebase credentials (see `conductor/tech-stack.md`)
4. Run `pnpm dev` to start the development server
5. Open `http://localhost:5173`
