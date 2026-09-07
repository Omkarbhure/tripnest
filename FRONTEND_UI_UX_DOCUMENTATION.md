# TripNest — Frontend, UI & UX Documentation

> **Project**: TripNest Travel Planning & Trip Management Platform  
> **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Axios  
> **Theme**: Modern Travel Platform with Ambient Glassmorphism, Dynamic Micro-Animations & Curated Iconography  
> **Last Updated**: September 2026  

---

## Table of Contents
1. [Design Philosophy & Visual Theme](#1-design-philosophy--visual-theme)
2. [Color Palette & Design Tokens](#2-color-palette--design-tokens)
3. [Complete Iconography System (`lucide-react`)](#3-complete-iconography-system-lucide-react)
4. [Component Architecture & UI Breakdown](#4-component-architecture--ui-breakdown)
5. [Route-by-Route Page Guide](#5-route-by-route-page-guide)
6. [Interactive UX Flows & Micro-Interactions](#6-interactive-ux-flows--micro-interactions)
7. [Responsive Grid & Accessibility Standards](#7-responsive-grid--accessibility-standards)

---

## 1. Design Philosophy & Visual Theme

TripNest's frontend is designed to deliver a **luxury travel portal experience** comparable to modern platforms like MakeMyTrip, Agoda, and Airbnb.

### Core Principles
* **Atmospheric Glassmorphism**: Translucent card layers with `backdrop-blur-xl`, subtle border gradients (`border-white/10` to `border-white/20`), and glowing ambient orbs (`orange`, `violet`, `cyan`) in the background.
* **Semantic Hierarchy**: Bold typography (Geist / Inter), crisp contrast against dark navy canvas (`#0a0f1d` / `#0f172a`), and warm sunset orange-to-rose accent gradients.
* **Micro-Animations with Framer Motion**: Smooth entry transitions (`FadeIn`), orchestrated list staggering (`StaggerList`), button scale feedbacks, and animated status badges.
* **Real SVG Vector Icons**: Standardized icons across all interactions via `lucide-react`, ensuring razor-sharp rendering on all screen densities.

---

## 2. Color Palette & Design Tokens

### Primary Brand Accents
| Token | Hex / Gradient | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#0a0f1d` / `#0f172a` | Deep navy base for maximum contrast |
| **Sunset Glow (Primary)** | `from-orange-500 via-orange-500 to-rose-500` | Primary buttons, active tabs, brand logo |
| **Amber Accent** | `#fbbf24` (`text-amber-400`) | Highlights, live stats, destination ratings |
| **Emerald Success** | `#34d399` (`text-emerald-400`) | On-track budgets, completed trips, confirmed members |
| **Rose / Danger** | `#f43f5e` (`text-rose-400`) | Over-budget alerts, cancellations, delete actions |
| **Sky / Info** | `#38bdf8` (`text-sky-400`) | Weather details, traveler tags, active requests |
| **Purple / RBAC** | `#a855f7` (`text-purple-400`) | Administrator privileges, security roles |

### Trip Status Pills
* **`PLANNED`**: Soft blue badge (`bg-blue-50/70 ring-1 ring-blue-300/50 text-blue-700`)
* **`ONGOING`**: Radiant emerald badge (`bg-emerald-50/70 ring-1 ring-emerald-300/50 text-emerald-700`)
* **`COMPLETED`**: Warm amber badge (`bg-amber-50/70 ring-1 ring-amber-300/50 text-amber-700`)
* **`CANCELLED`**: Crimson rose badge (`bg-rose-50/70 ring-1 ring-rose-300/50 text-rose-700`)

---

## 3. Complete Iconography System (`lucide-react`)

All raw emoji placeholders have been replaced with real vector icons from `lucide-react`.

### Icon Mapping by Functional Domain

#### A. Brand & Global Navigation
* **`Plane`**: Brand logo (rotated `-45deg`), Flight planner badge, Itinerary updates.
* **`Shield`**: Administrator dashboard badge, role privileges.
* **`Compass`**: Explore destinations, trip discovery, general navigation.
* **`ArrowLeft`**: Contextual back button in navigation bar.
* **`LogOut`**: User sign-out action.
* **`User`**: Profile avatar fallback and user management.

#### B. Notifications & System Alerts (`NotificationBell`)
* **`Bell`**: Notification bell trigger icon (with live unread badge).
* **`Mail`**: Trip member invitations (`INVITATION`).
* **`Users`**: Role change notifications (`ROLE_CHANGE`).
* **`CheckCircle2`**: Join request approved (`REQUEST_APPROVED`).
* **`XCircle`**: Join request rejected (`REQUEST_REJECTED`).
* **`Clock`**: Trip & activity reminders (`REMINDER`).
* **`AlertTriangle`**: Budget threshold warnings (80% & 100% alerts) (`BUDGET_ALERT`).
* **`RefreshCw`**: Manual synchronization trigger.
* **`Inbox`**: Empty notification inbox placeholder.

#### C. Itinerary Activities (`ActivitySection`)
* **`Landmark`**: Sightseeing / Monument activities (`SIGHTSEEING`).
* **`Train`**: Transit & transportation legs (`TRANSPORTATION`).
* **`Hotel`**: Lodging & accommodation bookings (`ACCOMMODATION`).
* **`Utensils`**: Dining, food & café visits (`DINING`).
* **`Mountain`**: Adventure sports & trekking (`ADVENTURE`).
* **`ShoppingBag`**: Shopping & local markets (`SHOPPING`).
* **`MapPin`**: Activity venue location marker (`OTHER` fallback).
* **`Plus`**: Add new activity button.
* **`Pencil`**: Edit activity details.
* **`Trash2`**: Delete activity action.

#### D. Budget & Expense Tracking (`BudgetExpenseSection`)
* **`Wallet`**: Total budget card and budget planning.
* **`Receipt`**: Individual logged expense items.
* **`PieChart`**: Expense category breakdown visualization.
* **`AlertTriangle`**: Over-budget financial health warning.
* **`Car`**: Transportation expenses.
* **`Ticket`**: Entertainment expenses.
* **`Package`**: Miscellaneous expenses.
* **`Tag`**: Generic category tag fallback.

#### E. Collaborative Members (`TripMembersSection`)
* **`Crown`**: Trip Creator & Owner indicator.
* **`Shield`**: Group Administrator badge.
* **`User`**: Standard Traveler member.
* **`UserPlus`**: Invite traveler by email.
* **`Check`**: Approve join request.
* **`X`**: Reject join request / close modal.

#### F. Destinations & OpenWeather
* **`Search`**: Search input icon for geocoding & place discovery.
* **`Thermometer`**: Current live temperature.
* **`CloudSun`**: "Feels Like" temperature index.
* **`Droplets`**: Relative humidity percentage.
* **`Wind`**: Live wind speed (m/s).
* **`Globe`**: Curated world destinations header & fallback.
* **`Sparkles`**: Popular / Top-rated destinations badge.
* **`Heart`**: Saved favorite destination spotlight.

---

## 4. Component Architecture & UI Breakdown

```
frontend/
├── components/
│   ├── Navbar.tsx             # Global sticky navigation with role badge & notifications
│   ├── NotificationBell.tsx   # Real-time dropdown notification drawer with unread counter
│   ├── ActivitySection.tsx    # Daywise activity scheduler with category icon tags & modals
│   ├── BudgetExpenseSection.tsx # Budget burn-rate meter, expense logger & breakdown
│   ├── TripMembersSection.tsx # Collaborative member list, role modifiers & join request approvals
│   ├── AdminPanel.tsx         # Administrator analytics, RBAC manager & catalogue editor
│   ├── ProtectedRoute.tsx     # Client-side JWT auth guard & redirector
│   └── ui/
│       ├── FadeIn.tsx         # Framer Motion entrance animation wrapper
│       ├── StaggerList.tsx    # Orchestrated multi-card stagger animator
│       └── Toast.tsx          # Floating toast notification stack
```

### Component Details

### `Navbar.tsx`
* **Sticky Glass Container**: `backdrop-blur-xl bg-[#0a0f1d]/80 border-b border-white/10`.
* **Dynamic Back Navigation**: Shows contextual `<ArrowLeft />` button when `backHref` is provided.
* **Role Recognition**: Automatically renders `<Shield /> Administrator` pill for admin users.
* **Interactive Profile Pill**: Displays user name and initials avatar linking to `/profile`.

### `NotificationBell.tsx`
* **Unread Counter Badge**: Animated pulse counter for unread alerts.
* **Category Icon Highlighting**: Colors and icons tailored to notification types (Budget, Trip, Reminder, Role).
* **Mark as Read / Dismiss**: One-click actions with live state updates.

### `ActivitySection.tsx`
* **Type Pills**: Color-coded badges with Lucide icons (`Landmark`, `Utensils`, `Mountain`, etc.).
* **Timeline Scheduling**: Start and end time formatters with inline edit and delete controls.

### `BudgetExpenseSection.tsx`
* **Financial Health Meter**: Dynamic progress bar that transitions from emerald gradient to rose gradient upon exceeding 100% budget.
* **Category Progress Bars**: Proportional spending distribution with percentage labels.

### `TripMembersSection.tsx`
* **Role Modifiers**: Group admins can elevate travelers to `GROUP_ADMIN` or demote them.
* **Join Requests Sub-Panel**: Pending request cards with direct Approve (`Check`) and Reject (`X`) triggers.

---

## 5. Route-by-Route Page Guide

### 1. Commercial Landing Page (`/app/page.tsx`)
* **Hero Visual**: Vibrant 3D showcase with glowing flight planner visual.
* **Trust Metrics**: Live OpenWeather integration, 25+ top destinations, real-time collaboration counters.
* **Feature Grid**: 4 glass feature cards highlighting Itinerary Builder, Live Weather, Smart Budget, and Group Collaboration.

### 2. Authentication Suite (`/app/(auth)/`)
* **Login (`/login`)**: Email/Password login with remember state, JWT session storage, and toast notifications.
* **Register (`/register`)**: Account creation with instant password confirmation checks.
* **Forgot Password (`/forgot-password`)**: Clean token request interface.
* **Reset Password (`/reset-password`)**: Secure token-verified credential reset.

### 3. Unified Dashboard (`/app/dashboard/page.tsx`)
* **Dual Persona Rendering**:
  * **Traveler View**: Upcoming trip countdown ticker, 4 quick stat cards (`Total Trips`, `Planned`, `Ongoing`, `Budget`), Combined Financial Health meter, Category Breakdown, Favorite Spot spotlight, and Recent Itineraries.
  * **Administrator View (`AdminPanel`)**: Platform-wide user management, role modification, destination catalogue, and system integration specs.

### 4. Destinations Catalogue (`/app/destinations/page.tsx` & `[id]/page.tsx`)
* **Live Search**: OpenStreetMap / Nominatim search bar with instant weather fetching for any global city/coordinate.
* **Curated Spots**: Image-backed destination cards with smooth image fade-in and hover lift.
* **Detail Page (`[id]`)**: Full-width destination banner, live 4-point OpenWeather widget (`Temp`, `Feels Like`, `Humidity`, `Wind Speed`), and one-click "Create Trip for Destination" button.

### 5. Trips Management & Detail (`/app/trips/page.tsx` & `[id]/page.tsx`)
* **3-Tab Navigation**:
  1. **My Trips**: Grid of owned and collaborative trips with status indicators, dates, and budget.
  2. **Find & Join Trips**: Search public group trips by keyword and trigger join requests with optional notes.
  3. **My Requests**: Outgoing join request tracker with live status badges (`PENDING`, `ACCEPTED`, `REJECTED`).
* **Detail View (`/trips/[id]`)**: Comprehensive hub containing Trip Overview, Members Section, Budget & Expense Tracker, and Daywise Itinerary Timeline.

### 6. User Profile & Settings (`/app/profile/page.tsx`)
* **Profile Photo**: Custom file upload with instant preview and server persistence.
* **Favorite Destination Selector**: Select and pin a favorite spot from the curated database.
* **Travel History**: Chronological log of all trips taken.
* **Password Reset**: Direct in-app password update with validation.

---

## 6. Interactive UX Flows & Micro-Interactions

### A. Itinerary Day Planning
1. User clicks **"+ Add Day"** in trip details.
2. An animated form smoothly expands (`AnimatePresence`) with automatic date pre-filling (day after last scheduled date).
3. Upon submission, day filter pills automatically update and focus on the newly created day.

### B. Budget Threshold Feedback
* When expenses reach **80% of total budget**, a warning notification is created and delivered to the notification drawer.
* When expenses cross **100% of total budget**, the financial health indicator switches to `⚠️ Over Budget` with an animated pulse and red gradient meter.

### C. Collaborative Join Requests
* Travelers search for a trip in "Find & Join Trips".
* Clicking "Request to Join" opens a glass modal to submit an introductory message.
* Trip owners and group admins receive an instant bell alert with options to Approve or Reject directly from the Members panel.

---

## 7. Responsive Grid & Accessibility Standards

* **Breakpoints**:
  * Mobile (`<640px`): Single column stacked layout, horizontal scroll filter pills, compact touch targets (`min-h-[44px]`).
  * Tablet (`640px - 1024px`): 2-column statistical cards and split trip grids.
  * Desktop (`>1024px`): 3-column / 4-column feature grids with persistent ambient glow orbs.
* **Accessibility**:
  * Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`).
  * Explicit `aria-label` attributes on icon-only triggers.
  * Contrast-compliant color pairings across all text states.
