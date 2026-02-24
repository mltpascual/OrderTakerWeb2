# C4 Architecture Documentation — Order Taker

This directory contains the C4 model architecture documentation for Order Taker, following Simon Brown's C4 model methodology.

## Diagrams

| Level | Document | Scope |
|---|---|---|
| **L1 — System Context** | [C4-L1-SystemContext.md](./C4-L1-SystemContext.md) | How Order Taker fits into the broader ecosystem (users, Firebase, Vercel, Google Fonts) |
| **L2 — Container** | [C4-L2-Container.md](./C4-L2-Container.md) | The major deployable units: React SPA, Firebase Auth, Cloud Firestore, Service Worker |
| **L3 — Component** | [C4-L3-Component.md](./C4-L3-Component.md) | Internal structure of the React SPA: pages, hooks, contexts, UI layer, and data flow |

## Architecture Summary

Order Taker is a **client-heavy, serverless** application. The React SPA handles all UI rendering, routing, and business logic. Firebase provides authentication and real-time data persistence. Vercel serves the static build. There is no custom backend server for data operations — the Firebase client SDK communicates directly with Firestore from the browser.

## Last Updated

February 23, 2026
