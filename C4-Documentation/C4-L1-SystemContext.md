# C4 Level 1 — System Context

## Overview

This document describes the highest-level view of the Order Taker system, showing how it interacts with users and external systems.

## System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Systems                         │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │ Google Fonts  │   │   Firebase   │   │      Vercel        │  │
│  │     CDN       │   │   Platform   │   │   (Hosting/CDN)    │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬───────────┘  │
│         │                  │                     │              │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          │    ┌─────────────┴─────────────┐       │
          │    │                           │       │
          ▼    ▼                           ▼       ▼
     ┌─────────────────────────────────────────────────┐
     │              Order Taker (PWA)                   │
     │                                                  │
     │  A food & beverage order management application  │
     │  that runs in the browser as a Progressive Web   │
     │  App. Manages orders, menu items, and reports.   │
     └──────────────────────┬──────────────────────────┘
                            │
                            │ Uses
                            ▼
                   ┌─────────────────┐
                   │  Business Owner  │
                   │                  │
                   │  Takes orders,   │
                   │  manages menu,   │
                   │  views reports   │
                   └─────────────────┘
```

## Actors

| Actor | Description | Interaction |
|---|---|---|
| **Business Owner** | A small food/beverage business operator (bakery, cafe, catering) | Logs in, creates orders, manages pipeline, edits menu, views reports, configures settings |

## External Systems

| System | Purpose | Protocol |
|---|---|---|
| **Firebase Authentication** | Handles email/password login and session management | HTTPS (Firebase SDK) |
| **Cloud Firestore** | Stores all application data (orders, menu items, settings) per user | HTTPS (Firebase SDK, real-time WebSocket) |
| **Google Fonts CDN** | Serves the Plus Jakarta Sans typeface | HTTPS (static asset) |
| **Vercel** | Hosts the static frontend build and serves it via edge CDN | HTTPS |

## Key Relationships

The Business Owner interacts with Order Taker exclusively through a web browser (desktop or mobile). The application authenticates via Firebase Auth, reads and writes data directly to Cloud Firestore using the client-side Firebase SDK, and loads fonts from Google's CDN. Vercel serves the static application files but has no runtime involvement — all dynamic behavior happens client-side.
