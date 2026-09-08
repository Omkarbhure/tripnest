# TripNest - Project Status & Documentation

> **Last Updated**: September 2026  
> **Platform**: Full-Stack Travel Planning & Trip Management Platform

---

## 1. Project Overview & Architecture

TripNest is an interactive, full-stack travel platform for individual travelers and collaborative group trips.

### Technology Stack
* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Axios, Chart.js
* **Backend**: Spring Boot 4 / Java 17/22, Spring Security, JWT, Spring Data JPA, PostgreSQL
* **Database**: PostgreSQL 18 (Local instance `jdbc:postgresql://localhost:5432/tripnest`)
* **Integrations**: OpenWeather API (Live Weather & Forecasts), OpenStreetMap / Nominatim

---

## 2. Active Services & Ports

| Service | Port / URL | Status | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | `http://localhost:3000` | **Running** | Next.js App Router UI with Glassmorphism Theme |
| **Backend** | `http://localhost:8081` | **Running** | Spring Boot REST API |
| **Database** | `localhost:5432/tripnest` | **Running** | PostgreSQL database with auto-seeded schema |

### Default Credentials
* **Administrator**: `admin@tripnest.com` / `Admin@123` (Role: `ADMINISTRATOR`)

---

## 3. Implemented Modules & Features

### A. Authentication & User Management
* **JWT Authentication**: Secure stateless token issuance with expiration & refresh.
* **User Profile**: Personal info, profile photo upload, password reset, favorite destination.
* **Symmetrical Auth Pages**: Centered and aligned layout for Login, Register, Forgot Password, and Reset Password.

### B. Traveler & Admin Aggregated Dashboards
* **Traveler Dashboard (`GET /api/dashboard`)**:
  1. **Upcoming Trips**: Filtered by future start dates, sorted soonest first.
  2. **Budget Overview**: Aggregates total budgeted, total spent, remaining balance, and over-budget status across all user trips.
  3. **Expense Summary**: Combined category breakdown (`HOTEL`, `FOOD`, `TRANSPORTATION`, etc.) across all user trips.
  4. **Favorite / Most-Visited Destinations**: Persisted favorite spot from profile + dynamic most-visited destinations ranked by trip count.
  5. **Basic Travel Stats**: Total trips taken, unique destinations visited, unique countries visited, and total amount spent.
* **Admin Dashboard (`GET /api/admin/dashboard` & `/api/admin/stats`)**:
  1. **User Analytics**: Total registered users and role distribution (`ADMINISTRATOR`, `GROUP_ADMIN`, `TRAVELER`).
  2. **Trip Analytics**: Total trips, active trips (`ONGOING`), completed trips (`COMPLETED`), planned trips (`PLANNED`), and cancelled trips (`CANCELLED`).
  3. **Destination Analytics**: Total destinations and most popular destinations platform-wide ranked by trips created.
  4. **Platform Stats**: Total expenses logged, total expense sum across platform, and total notifications sent.

### C. Public Experience & UI Enhancements
* **Public Commercial Landing Page (`/`)**: Feature grid, hero showcase, live OpenWeather ticker, trust metrics (`25+ Destinations`, `Live Weather`), and contextual authentication buttons.
* **Itinerary Activity Timeline**: Day-by-day chronological timeline with type-specific badges and emojis (`SIGHTSEEING: 🏛️`, `TRANSPORTATION: 🚆`, `DINING: 🍽️`, `ADVENTURE: 🧗`, etc.).

### D. Trip Management & Group Collaboration
* **Trip Lifecycle**: Create, edit, list, and delete trips with destination, start/end dates, budget, and description.
* **Trip Membership Records**: Member roles (`MEMBER`, `GROUP_ADMIN`), role update dropdown, member removal dialog.
* **Trip Join Requests**: Search trips by title with relationship tracking (`OWNER`, `GROUP_ADMIN`, `MEMBER`, `REQUEST_PENDING`, `NONE`), request flow, accept/reject actions.
* **Reusable Access Check**: `TripAccessService` guarding Trip, Itinerary, Activity, Budget, and Expense operations.

### E. Budget & Expense Management
* **Trip Budgeting**: Total budget, spent amount, remaining budget, and over-budget alerts.
* **Category Expenses**: Transportation, Hotel, Food, Shopping, Entertainment, Miscellaneous.
* **Visual Breakdown**: Interactive category expense progress bars, percentage breakdowns, and financial health burn-rate card.

### F. Notifications System & Scheduled Tasks
* **Entity & Storage**: `Notification` entity linked to user, title, message, type (`TRIP_INVITE`, `JOIN_REQUEST`, `JOIN_APPROVED`, `JOIN_REJECTED`, `TRIP_REMINDER`, `ACTIVITY_REMINDER`, `BUDGET_ALERT`, `TRAVEL_UPDATE`, `SYSTEM`), related trip, read flag, and timestamp.
* **Scheduled Trip Reminders**: Once-daily background scheduler (`ReminderSchedulerService.sendTripReminders`) scanning trips starting within configured days (default: 3 days / today) and sending `TRIP_REMINDER` notifications to owners and members with daily deduplication.
* **Scheduled Activity Reminders**: Background scheduler (`ReminderSchedulerService.sendActivityReminders`) scanning activities scheduled for the next day/today and sending `ACTIVITY_REMINDER` notifications to owners and members, avoiding duplicate alerts per activity.
* **Budget Threshold Alerts**: Real-time spending threshold trigger in `ExpenseService` (`createExpense` / `updateExpense`) detecting when spending crosses 80% or 100% of the trip's budget and notifying owner and members without duplicate threshold alerts.
* **Travel Updates**: Real-time notification trigger in `TripService.update` notifying other trip members when core details (travel dates or destination) are modified.
* **Frontend Notification Bell**: Bell icon in Navbar with unread badge counter, live 30s poll, emoji icons for all notification types, popover notification list, and "Mark all as read".


### G. Destinations & Weather
* **Curated Spots**: Seeded top Indian and international travel destinations.
* **Live Weather Integration**: Real-time temperature, humidity, wind, and forecast from OpenWeather API (`6955965b1508c538e2efc62411ca6871`).

---

## 4. Key API Endpoints Reference

### Dashboards & Analytics
* `GET /api/dashboard` &mdash; Aggregated 5-component traveler dashboard
* `GET /api/admin/dashboard` &mdash; Administrator-only 4-component platform dashboard
* `GET /api/admin/stats` &mdash; Global platform stats

### Members & Collaboration
* `POST /api/trips/{tripId}/members` &mdash; Add member by email
* `GET /api/trips/{tripId}/members` &mdash; List trip members
* `DELETE /api/trips/{tripId}/members/{memberId}` &mdash; Remove member
* `PUT /api/trips/{tripId}/members/{memberId}/role` &mdash; Change member role
* `GET /api/trips/search?name={name}` &mdash; Search trips
* `POST /api/trips/{tripId}/join-requests` &mdash; Send join request
* `GET /api/trips/{tripId}/join-requests` &mdash; List trip join requests
* `PUT /api/trips/{tripId}/join-requests/{requestId}/accept` &mdash; Accept join request
* `PUT /api/trips/{tripId}/join-requests/{requestId}/reject` &mdash; Decline join request
* `GET /api/trips/join-requests/my` &mdash; List user's sent requests

### Itinerary & Activities
* `POST /api/trips/{tripId}/itineraries` &mdash; Add day with date & notes
* `GET /api/trips/{tripId}/itineraries` &mdash; List days
* `PUT /api/trips/{tripId}/itineraries/{itineraryId}` &mdash; Update day date & notes
* `DELETE /api/trips/{tripId}/itineraries/{itineraryId}` &mdash; Delete day & activities
* `GET /api/itineraries/{itineraryId}/activities` &mdash; List activities for a day
* `POST /api/itineraries/{itineraryId}/activities` &mdash; Add activity
* `PUT /api/itineraries/{itineraryId}/activities/{activityId}` &mdash; Update activity
* `DELETE /api/itineraries/{itineraryId}/activities/{activityId}` &mdash; Delete activity

### Notifications
* `GET /api/notifications` &mdash; Get current user's notifications
* `GET /api/notifications/unread-count` &mdash; Get unread count
* `PUT /api/notifications/{id}/read` &mdash; Mark notification as read
* `PUT /api/notifications/read-all` &mdash; Mark all as read



