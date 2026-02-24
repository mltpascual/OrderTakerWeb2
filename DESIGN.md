# Design System: Order Taker

**Tech Stack:** React 19 + Vite 6 + Tailwind CSS v4 + shadcn/ui  
**CSS Approach:** Tailwind utility-first with CSS custom properties via `@theme` directives in `index.css`  
**Design Language:** Warm Craft — Premium Food-Tech Aesthetic  
**Last Updated:** February 23, 2026

---

## 1. Visual Theme & Atmosphere

Order Taker's visual identity is called **"Warm Craft"** — a design language that blends the warmth and approachability of a neighborhood bakery with the precision and clarity of a modern productivity tool. The atmosphere is **warm, inviting, and professional** without being sterile. It feels like a tool made with care, not generated from a template.

The overall density is **spacious on desktop, compact on mobile**. Cards breathe with generous padding (`px-5 pt-5 pb-5`), and the floating sidebar on desktop creates an inset, premium feel. On mobile, the bottom navigation bar uses backdrop blur for a native-app quality.

The design style is best described as **soft modernism with warm undertones** — rounded corners everywhere (`rounded-2xl`), amber-tinted shadows that give depth without harshness, and a cream-toned background that avoids the clinical feel of pure white.

**Light/dark mode** is fully supported. Light mode uses warm off-white backgrounds with amber accents. Dark mode uses warm charcoal backgrounds (not cold gray) with slightly brighter amber accents to maintain contrast. The toggle is in Settings, and the system applies the `.dark` class to the root element.

---

## 2. Color Palette & Roles

### Core Colors — Light Mode

| Role | Descriptive Name | Value | CSS Variable | Usage |
|---|---|---|---|---|
| Primary | Warm Amber-Orange | `oklch(0.62 0.17 52)` | `--primary` | Action buttons, active nav items, accent elements, links |
| Primary Foreground | Near-White | `oklch(0.99 0 0)` | `--primary-foreground` | Text on primary-colored backgrounds |
| Background | Warm Off-White Cream | `oklch(0.98 0.005 75)` | `--background` | Page background, main canvas |
| Foreground | Deep Warm Charcoal | `oklch(0.16 0.015 50)` | `--foreground` | Primary text, headings |
| Card | Pure White | `oklch(1 0 0)` | `--card` | Card surfaces, elevated containers |
| Secondary | Light Warm Cream | `oklch(0.96 0.008 75)` | `--secondary` | Secondary buttons, category pills, subtle backgrounds |
| Muted | Soft Warm Gray | `oklch(0.94 0.008 75)` | `--muted` | Disabled backgrounds, skeleton loaders |
| Muted Foreground | Medium Warm Gray | `oklch(0.48 0.015 50)` | `--muted-foreground` | Placeholder text, secondary labels, timestamps |
| Destructive | Alert Crimson | `oklch(0.58 0.22 25)` | `--destructive` | Delete buttons, error messages, destructive actions |
| Border | Subtle Warm Edge | `oklch(0.91 0.008 75)` | `--border` | Card borders, dividers, input outlines |
| Ring | Amber Focus Ring | `oklch(0.62 0.17 52)` | `--ring` | Focus indicators, active outlines |

### Core Colors — Dark Mode

| Role | Descriptive Name | Value | CSS Variable | Usage |
|---|---|---|---|---|
| Primary | Bright Warm Amber | `oklch(0.72 0.16 52)` | `--primary` | Same roles as light, slightly brighter for contrast |
| Background | Deep Warm Charcoal | `oklch(0.14 0.012 50)` | `--background` | Page background with warm undertone |
| Card | Elevated Charcoal | `oklch(0.19 0.012 50)` | `--card` | Card surfaces, slightly lighter than background |
| Border | Warm Dark Edge | `oklch(0.28 0.012 50)` | `--border` | Subtle separation in dark mode |
| Muted Foreground | Warm Mid-Gray | `oklch(0.62 0.01 50)` | `--muted-foreground` | Secondary text in dark mode |

### Chart Colors

| Chart | Value | Purpose |
|---|---|---|
| Chart 1 | `oklch(0.68 0.15 52)` | Primary data series (lighter amber) |
| Chart 2 | `oklch(0.55 0.17 52)` | Secondary data series (deeper amber) |
| Chart 3 | `oklch(0.48 0.14 52)` | Tertiary data series (dark amber) |
| Chart 4 | `oklch(0.65 0.10 145)` | Accent series (muted green) |
| Chart 5 | `oklch(0.58 0.12 280)` | Accent series (muted purple) |

### Design Note on OKLCH

All colors use the **OKLCH** color space for perceptual uniformity. The hue angle `52` (amber) is the signature hue throughout the primary palette, while `75` (warm gray) is used for all neutral tones. This ensures the entire UI has a cohesive warm undertone rather than the cold blue-gray common in default Tailwind setups.

---

## 3. Typography System

### Font Stack

The application uses a single font family for both headings and body text:

| Role | Font | Fallback | Source |
|---|---|---|---|
| Headings | Plus Jakarta Sans | system-ui, sans-serif | Google Fonts CDN |
| Body / UI | Plus Jakarta Sans | system-ui, sans-serif | Google Fonts CDN |

**Plus Jakarta Sans** was chosen for its geometric warmth — it has the clarity of a geometric sans-serif with slightly rounded terminals that feel approachable rather than cold. The single-font approach creates visual unity while reducing font loading overhead.

### Type Scale

| Level | Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|
| Page Title (H1) | `text-2xl` (1.5rem) | Bold (700) | `-0.02em` (tight) | Page headers ("New Order", "Order Pipeline") |
| Section Title | `text-lg` (1.125rem) | Semibold (600) | `-0.02em` | Card titles, section headers |
| Card Title | `text-base` (1rem) | Semibold (600) | Default | Settings card titles, dialog titles |
| Body | `text-sm` (0.875rem) | Regular (400) | Default | General content, form labels |
| Body Large | `text-[0.9375rem]` (15px) | Regular (400) | Default | Login inputs, hero description |
| Caption | `text-xs` (0.75rem) | Medium (500) | Default | Timestamps, secondary labels, badge text |
| Micro | `text-[0.625rem]` (10px) | Semibold (600) | Default | Color preset names, very small labels |

### Typographic Treatments

All headings use `letter-spacing: -0.02em` for a tighter, more modern feel. This is applied globally via the `h1–h6` base styles in `index.css`. Body text uses default letter spacing for readability.

---

## 4. Spacing & Layout

### Spacing Scale

The project uses Tailwind's default spacing scale (4px base unit) with these commonly applied values:

| Token | Value | Common Usage |
|---|---|---|
| `gap-1.5` | 6px | Icon-to-text gaps in badges |
| `gap-2` | 8px | Button icon gaps, tight element spacing |
| `gap-2.5` | 10px | Card title icon gaps |
| `gap-3` | 12px | Form field spacing, badge lists |
| `p-4` / `px-4` | 16px | Standard card padding, input padding |
| `p-5` / `px-5` | 20px | Elevated card padding (Settings, Reports) |
| `space-y-5` | 20px | Vertical card stacking |
| `space-y-6` | 24px | Section-level vertical rhythm |
| `p-6` | 24px | Page-level padding on mobile |
| `p-8` / `pt-8` | 32px | Login card top padding |
| `p-12` | 48px | Desktop login hero padding |

### Grid & Container

The layout uses a **max-width container** system:

| Breakpoint | Container Max Width | Padding |
|---|---|---|
| Mobile (< 640px) | 100% | `px-4` (16px) |
| Tablet (640px+) | 100% | `px-6` (24px) |
| Desktop (1024px+) | 1280px | `px-8` (32px) |

The main content area uses a **sidebar + content** layout on desktop (sidebar is 256px wide, inset with 12px margin) and a **full-width + bottom bar** layout on mobile.

### Breakpoints

| Name | Value | Layout Behavior |
|---|---|---|
| `sm` | 640px | Container padding increases |
| `md` | 768px | Two-column grids activate, some elements show/hide |
| `lg` | 1024px | Sidebar appears, login hero shows, container max-width applies |

---

## 5. Component Stylings

### Buttons

Buttons use `rounded-xl` (12px radius) consistently throughout the app.

| Variant | Background | Text | Border | Hover | Usage |
|---|---|---|---|---|---|
| Primary | `bg-primary` (amber) | White | None | `shadow-warm` appears | Place Order, Sign In, Save |
| Outline | Transparent | Foreground | `border-border` | `bg-secondary/60` | Cancel, Export, Import |
| Ghost | Transparent | Muted foreground | None | `bg-secondary/60` | Reset accent, minor actions |
| Destructive | `bg-destructive` | White | None | Darker shade | Delete confirmation |

All buttons have `transition-all duration-200` for smooth state changes.

### Cards & Containers

Cards are the primary content container throughout the app.

| Property | Value | Description |
|---|---|---|
| Border Radius | `rounded-2xl` (16px) | Generously rounded, soft feel |
| Border | `border-border/50` | Half-opacity border for subtlety |
| Shadow | `shadow-warm-sm` | Warm amber-tinted shadow at rest |
| Hover Shadow | `shadow-warm` | Elevated warm shadow on interaction |
| Background | `bg-card` (white / dark charcoal) | Solid card surface |
| Padding | `px-5 pt-5 pb-5` | Consistent internal spacing |

### Inputs & Forms

| Property | Value | Description |
|---|---|---|
| Height | `h-12` (48px) on login, default elsewhere | Tall touch targets on key forms |
| Border Radius | `rounded-xl` (12px) | Matches button radius |
| Font Size | `text-[0.9375rem]` on login | Slightly larger for readability |
| Focus Ring | `ring-primary` (amber) | Amber focus indicator |
| Error State | `bg-destructive/10 border-destructive/20` | Soft red background with border |

### Navigation

**Desktop Sidebar:**
- Floating design: `m-3 rounded-2xl` (inset from edges with rounded corners)
- Width: `w-64` (256px)
- Shadow: `shadow-warm-lg` for elevated feel
- Active item: `bg-primary/10 text-primary` with amber accent
- Inactive item: `text-muted-foreground` with hover `bg-secondary/80`
- Icon pattern: Icons inside `w-7 h-7 rounded-lg bg-primary/10` containers

**Mobile Bottom Bar:**
- Fixed at bottom: `fixed bottom-0 left-0 right-0`
- Height: `h-16` (64px)
- Backdrop blur: `backdrop-blur-xl bg-card/90`
- Shadow: `shadow-warm-lg` (upward shadow)
- Active tab: `text-primary` with `bg-primary/10` circle behind icon

### Modals & Dialogs

| Property | Desktop | Mobile |
|---|---|---|
| Component | `Dialog` (centered overlay) | `Sheet` (bottom drawer) |
| Border Radius | `rounded-2xl` | Default sheet radius |
| Title Alignment | Left-aligned | **Center-aligned** |
| Overlay | Default shadcn overlay | Default sheet overlay |
| Max Width | `sm:max-w-md` | Full width |

### Data Display

**Order Cards (Pipeline):**
- `rounded-2xl border-border/50 shadow-warm-sm`
- Hover: `hover:shadow-warm transition-shadow duration-200`
- Status badges: `rounded-full` pill shape with color-coded backgrounds

**Menu Item Cards:**
- Hover lift: `hover:-translate-y-0.5 hover:shadow-warm`
- Category badges: `rounded-full` pills in secondary colors

**Metric Cards (Reports):**
- Icon-in-circle pattern: `w-10 h-10 rounded-xl bg-primary/10` with icon inside
- Value: `text-2xl font-bold`
- Label: `text-xs text-muted-foreground`

---

## 6. Depth & Elevation

The shadow system uses **warm amber-tinted shadows** instead of default gray shadows. This is the signature visual treatment that gives the UI its distinctive warm feel.

| Level | Token | Box Shadow | Usage |
|---|---|---|---|
| Level 0 | (none) | No shadow | Flat elements, badges |
| Level 1 | `shadow-warm-sm` | `0 1px 3px rgba(120,80,40,0.06)` | Cards at rest, inputs |
| Level 2 | `shadow-warm` | `0 4px 12px rgba(120,80,40,0.08)` | Hovered cards, buttons on hover |
| Level 3 | `shadow-warm-md` | `0 6px 20px rgba(120,80,40,0.10)` | Elevated containers, popovers |
| Level 4 | `shadow-warm-lg` | `0 12px 32px rgba(120,80,40,0.12)` | Sidebar, mobile bottom bar |
| Level 5 | `shadow-warm-xl` | `0 20px 48px rgba(120,80,40,0.14)` | Login card, hero image |

The warm tint comes from `rgba(120, 80, 40, ...)` — a muted brown-amber that blends naturally with the cream backgrounds.

---

## 7. Motion & Animation

All animations respect `prefers-reduced-motion`. When motion is allowed:

| Animation | Duration | Easing | Effect | Usage |
|---|---|---|---|---|
| `animate-fade-in` | 300ms | ease-out | Opacity 0 → 1 | Page transitions |
| `animate-slide-up` | 350ms | ease-out | Opacity 0 → 1, translateY 8px → 0 | Content entrance |
| Hover transitions | 200ms | default | Various (shadow, translate, color) | Interactive elements |
| Shadow transitions | 200ms | default | Shadow level change | Card hover states |
| Scale on hover | 200ms | default | `scale-110` | Color swatches in Settings |

### Hover Micro-interactions

Menu item cards use `hover:-translate-y-0.5` (a subtle 2px lift) combined with `hover:shadow-warm` for a tactile, responsive feel. This is applied via `transition-all duration-200`.

---

## 8. Iconography & Assets

### Icon Library

The project uses **Lucide React** exclusively for all icons. No custom SVGs or icon fonts are used.

| Context | Icon Size | Style |
|---|---|---|
| Navigation (sidebar) | `w-5 h-5` | Inside `w-7 h-7 rounded-lg bg-primary/10` container |
| Navigation (mobile) | `w-5 h-5` | Standalone |
| Card title icons | `w-3.5 h-3.5` | Inside `w-7 h-7 rounded-lg bg-primary/10` container |
| Metric card icons | `w-5 h-5` | Inside `w-10 h-10 rounded-xl bg-primary/10` container |
| Button icons | `w-4 h-4` | Inline with text |
| Badge/action icons | `w-3 h-3` | Inline, minimal |

### Static Assets

| Asset | Format | Size | Location | Purpose |
|---|---|---|---|---|
| Login hero | WebP | 152 KB | `client/public/login-hero.webp` | Desktop login illustration |
| Favicon | ICO | Multi-size | `client/public/favicon.ico` | Browser tab icon |
| PWA Icon 192 | PNG | 192×192 | `client/public/icon-192.png` | Android home screen |
| PWA Icon 512 | PNG | 512×512 | `client/public/icon-512.png` | PWA splash screen |
| Apple Touch Icon | PNG | 180×180 | `client/public/apple-touch-icon.png` | iOS home screen |

The icon design is a **crossed fork and knife** on a warm amber gradient background with iOS-style rounded corners.

---

## 9. Accessibility Notes

### Color Contrast

The amber primary (`oklch(0.62 0.17 52)`) on white backgrounds meets WCAG AA for large text and UI components. For small body text, the foreground color (`oklch(0.16 0.015 50)`) provides strong contrast against the cream background.

### Focus Indicators

All interactive elements use `outline-ring/50` as the default focus style, with `--ring` set to the amber primary. This provides a visible amber focus ring on keyboard navigation.

### Motion

All animations are wrapped in `@media (prefers-reduced-motion: no-preference)`, ensuring users who prefer reduced motion see no animations.

### Touch Targets

Login inputs use `h-12` (48px) height, meeting the recommended 44px minimum touch target. Mobile bottom navigation items have generous tap areas within the `h-16` bar.

### Scrollbar

Custom scrollbar styling is provided for both Webkit browsers (`-webkit-scrollbar`) and Firefox (`scrollbar-width: thin; scrollbar-color`), ensuring a consistent slim scrollbar across all browsers.

### Known Limitations

Some micro labels use `text-[0.625rem]` (10px), which is below the WCAG-recommended minimum of 12px. These are used for color preset names and very small badges where space is constrained.

---

## 10. Design Conventions & Rules

### Naming Conventions

All custom CSS utilities follow the `shadow-warm-{size}` pattern. Animation utilities use `animate-{name}`. No BEM or CSS module naming is used — everything is Tailwind utility classes.

### Component Composition Patterns

**Icon-in-Circle Pattern:** Used consistently for section headers in Settings, metric cards in Reports, and navigation items. The pattern is: `div.w-{size} h-{size} rounded-{radius} bg-primary/10 > Icon.w-{icon-size} h-{icon-size} text-primary`.

**Card Pattern:** Every content card follows: `Card.rounded-2xl border-border/50 shadow-warm-sm > CardHeader.px-5 pt-5 pb-3 > CardContent.px-5 pb-5`.

**Responsive Dialog/Sheet Pattern:** Desktop uses `Dialog` (centered modal), mobile uses `Sheet` (bottom drawer). The switch is handled by the `useIsMobile()` hook at the 768px breakpoint.

### Color Application Rules

1. Never use raw hex colors — always use CSS variables (`text-primary`, `bg-background`, etc.)
2. For semi-transparent variants, use Tailwind opacity modifiers (`bg-primary/10`, `border-border/50`)
3. The warm amber hue (`52` in OKLCH) must be the only saturated hue in the primary palette
4. Neutral tones must use hue `75` (warm gray) to maintain the warm undertone

### Responsive Strategy

The app is **mobile-first** with progressive enhancement for larger screens. Key breakpoints:
- Below `md` (768px): Bottom navigation, sheets instead of dialogs, single-column layouts
- Above `lg` (1024px): Floating sidebar, dialogs, multi-column grids, login hero image visible
