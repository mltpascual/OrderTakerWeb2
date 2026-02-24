# Product: Order Taker

**One-line description:** A fast, clean order-taking progressive web app built for food and beverage businesses.

## Problem Statement

Small food and beverage businesses (bakeries, cafes, catering services) need a simple, mobile-friendly way to manage incoming orders from multiple channels — walk-ins, phone calls, Facebook messages, and online marketplaces. Existing POS systems are often expensive, overly complex, or not designed for pre-order workflows with scheduled pickups.

## Solution

Order Taker provides a streamlined, single-user order management tool that runs as a PWA on any device. It focuses on the core workflow: take an order, track it through a pipeline, and mark it complete. No unnecessary features, no steep learning curve.

## Target Users

**Primary persona:** A small business owner or staff member who takes food orders throughout the day from multiple sources and needs to track them for fulfillment.

Characteristics:
- Operates a bakery, cafe, or home-based food business
- Receives orders via walk-in, phone, Facebook, or marketplace platforms
- Needs to see today's pending orders at a glance
- Works primarily from a phone or tablet
- Values simplicity over feature richness

## Core Features

| Feature | Status | Description |
|---|---|---|
| **New Order** | Implemented | Create orders with customer name, pickup date/time, source, menu items, quantities, notes |
| **Order Pipeline** | Implemented | Three-tab view: Today (pending), Pending (all), Completed — with sort, search, and edit |
| **Menu Management** | Implemented | CRUD for menu items with name, price, category, and availability toggle |
| **Reports** | Implemented | Revenue summaries, order counts, top items, source breakdown, daily/weekly/monthly charts |
| **Settings** | Implemented | Order sources, accent color, currency (PHP/USD), dark mode, CSV export/import, data migration |
| **PWA Support** | Implemented | Installable on mobile home screen with offline-capable service worker |
| **Authentication** | Implemented | Firebase email/password authentication, per-user data isolation |

## Success Metrics

- Time to create a new order: under 30 seconds
- Zero-training onboarding: new users can take their first order without instructions
- Mobile-first: all features fully usable on a phone screen
- Data safety: all data persisted in real-time to Firestore with per-user isolation

## Product Roadmap

### Completed
- Multi-item orders with quantity and per-item notes
- Order pipeline with Today/Pending/Complete tabs
- Complete confirmation dialog (prevents accidental completions)
- Menu management with categories
- Reports with revenue charts and top items
- CSV export/import for backup
- PWA with installable icons
- "Warm Craft" UI design system
- Currency support (PHP, USD)
- Dark mode

### Future Considerations
- Product images on menu items
- Customer contact information and order history
- Push notifications for upcoming pickups
- Multi-user support with role-based access
- Receipt printing or PDF generation
- Inventory tracking linked to menu items
