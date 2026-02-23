# Order Taker — Modern UI Revamp Design System

## Aesthetic Direction: "Warm Craft"
A warm, premium food-tech aesthetic that feels approachable yet sophisticated. Blends soft UI evolution with modern SaaS clarity.

**DFII Score: 12/15**
- Aesthetic Impact: 4 (distinctive warm palette, premium feel)
- Context Fit: 5 (perfect for food/beverage business tool)
- Implementation Feasibility: 4 (Tailwind + shadcn, incremental changes)
- Performance Safety: 4 (CSS-only effects, no heavy JS)
- Consistency Risk: -1 (well-defined token system)

## Typography
- **Heading:** Plus Jakarta Sans (geometric, friendly, modern)
- **Body:** Plus Jakarta Sans (consistent, clean readability)
- Replaces: DM Sans + Inter (generic)

## Color System (OKLCH)

### Light Mode
- Background: warm off-white `oklch(0.98 0.005 75)` — subtle warm tint
- Card: pure white `oklch(1 0 0)` with warm shadow
- Primary: rich amber-orange `oklch(0.62 0.17 52)` — warm, appetizing
- Foreground: warm charcoal `oklch(0.16 0.015 50)`
- Muted: warm gray `oklch(0.94 0.008 75)`
- Muted-foreground: `oklch(0.48 0.015 50)`
- Border: `oklch(0.90 0.008 75)`
- Destructive: `oklch(0.58 0.22 25)`
- Secondary: `oklch(0.96 0.008 75)`

### Dark Mode
- Background: deep warm charcoal `oklch(0.15 0.012 50)`
- Card: `oklch(0.20 0.012 50)`
- Primary: lighter amber `oklch(0.72 0.16 52)`
- Foreground: warm white `oklch(0.92 0.005 75)`

## Key Design Changes

### 1. Sidebar (Desktop)
- Floating sidebar with rounded corners and subtle shadow
- Inset from edges (top-4 left-4 bottom-4)
- Warm background with glass-like translucency
- Active nav items with filled pill background
- Logo area with warm gradient accent

### 2. Mobile Bottom Bar
- Floating bottom bar with rounded corners
- Lifted from edges with shadow
- Active indicator dot below icon

### 3. Cards & Surfaces
- Larger border-radius (12px → 16px)
- Warm-toned shadows (not pure gray)
- Subtle border with warm tint
- Hover: lift + shadow expansion (200ms)

### 4. Menu Item Cards (NewOrder)
- Rounded-2xl with warm shadow
- Hover: translateY(-2px) + shadow-lg
- Active state: warm primary ring
- Price badge with primary background

### 5. Form Elements
- Taller inputs (h-11 → h-12)
- Rounded-xl borders
- Warm focus ring
- Labels with warm muted color

### 6. Buttons
- Primary: warm gradient (primary → slightly lighter)
- Rounded-xl
- Subtle shadow on hover
- Active: scale(0.98) press effect

### 7. Login Page
- Full-bleed warm gradient background
- Centered card with frosted glass effect
- Logo with warm glow

### 8. Motion Philosophy
- Entrance: fade-in + slight translateY (300ms ease-out)
- Hover: 200ms transitions
- Press: 100ms scale
- Respect prefers-reduced-motion
