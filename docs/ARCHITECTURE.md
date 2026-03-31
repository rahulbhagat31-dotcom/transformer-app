# System Architecture

## Overview

The Transformer Manufacturing System is a full-stack Node.js application for transformer engineering, manufacturing workflow management, checklist control, analytics, document handling, audit logging, and training/exam flows.

The application uses:

- Express for HTTP routing and middleware
- SQLite via `better-sqlite3` for persistent storage
- Socket.IO for real-time updates
- A large vanilla-JavaScript frontend served from `public/`

## Current Stack

### Backend

- Runtime: Node.js
- Framework: Express
- Database: SQLite (`data/transformer.db`)
- Auth: JWT + bcrypt
- Real-time: Socket.IO
- Validation: `express-validator`
- Logging: Morgan + Winston
- Background tasks: `node-cron`

### Frontend

- HTML served as a single main app shell in `public/index.html`
- Vanilla JavaScript split into `core/`, `features/`, `ui/`, and `calculation-engine/`
- CSS split by feature area, with shared design tokens in `public/css/design-tokens.css`
- External browser libraries loaded from CDN for charts and export tooling

## Architecture Pattern

The backend follows a service-oriented Express structure:

```text
Browser
  -> Express routes
  -> Controllers
  -> Services
  -> SQLite database
```

The frontend is a script-driven SPA shell:

```text
index.html
  -> core scripts (auth, api, shared state)
  -> feature scripts (dashboard, checklist, transformer, exam, etc.)
  -> direct DOM updates
```

## Backend Structure

### Entry Point

- `server.js`
  - validates environment
  - sets security and middleware
  - serves static frontend files
  - mounts route modules
  - starts WebSocket support
  - initializes backups, audit files, and seed data

### Route Layer

Route aggregation is handled in `routes/index.js`.

Current top-level route groups include:

- `/auth`
- `/transformers`
- `/calculations`
- `/design`
- `/checklist`
- `/audit`
- `/export`
- `/bom`
- `/document` and `/documents`
- `/analytics`
- `/stage`
- `/customers`
- `/exam`
- `/questions`

### Controller Layer

Controllers live under `controllers/` and primarily:

- parse request data
- enforce request-level checks
- call services
- return standardized JSON responses
- write audit events where required

### Service Layer

Services live under `services/` and encapsulate database access and domain operations.

Examples:

- `transformer.service.js`
- `checklist.service.js`
- `document.service.js`
- `customer.service.js`
- `stage.service.js`

### Persistence Layer

- Database connection is configured in `config/database.js`
- Schema is initialized from `config/schema-production.sql`
- SQLite WAL mode is enabled
- Foreign keys are enabled

The database file is typically:

- `data/transformer.db`

## Frontend Structure

### App Shell

`public/index.html` is the main application shell. It contains:

- login experience
- sidebar navigation
- dashboard and feature sections
- section containers for checklist, calculator, digital twin, documents, exams, and analytics

### Script Organization

- `public/js/core`
  - API layer
  - authentication/session handling
  - shared UI helpers
- `public/js/features`
  - domain-specific features like dashboard, transformer registry, checklist, audit, exam, and digital twin
- `public/js/ui`
  - sidebar, notifications, export helpers
- `public/js/calculation-engine`
  - modular transformer design engine
  - orchestrator + calculation modules + validators

### Styling

Styles are split by feature:

- global/layout styles in `main.css`, `responsive.css`, `animations.css`
- shared tokens in `design-tokens.css`
- section styles such as `dashboard-premium.css`, `login-modern.css`, `checklist-premium.css`, `digital-twin.css`

## Data Flow

### Authentication

1. User submits login form.
2. Frontend calls `POST /auth/login`.
3. Backend validates credentials against stored users.
4. JWT is returned to the browser.
5. Frontend stores the token and uses it for future requests.

### Transformer Management

1. Frontend requests transformer data from `/transformers`.
2. Controllers apply customer scoping when needed.
3. Services query SQLite.
4. Responses are normalized with success/error helpers.

### Checklist and Stage Control

1. Frontend opens a manufacturing stage.
2. Checklist APIs load work-order-specific data.
3. Stage control APIs enforce progression and lock/unlock rules.
4. Audit events are written for critical actions.

### Design Calculation

1. User enters transformer design inputs.
2. Frontend calculation engine validates inputs.
3. Orchestrator runs ordered modules.
4. UI renders outputs, warnings, summaries, and exports.

### Real-Time Updates

1. Server emits events through Socket.IO.
2. Connected clients update dashboards and feature views.

## Key Capabilities

- Transformer registry and customer-linked records
- Manufacturing checklist workflows with stage progression
- BOM and design document uploads
- Audit trail and analytics dashboards
- Transformer calculation engine with modular engineering logic
- Digital twin and WO timeline views
- Role-based access for admin, quality, production, and customer users
- Exam/question management for training workflows

## Security Model

- JWT-based authenticated APIs
- Role checks in middleware
- bcrypt password verification
- Helmet, compression, CORS, and rate limiting at the server layer

Note: the current codebase still uses permissive CORS and a relaxed CSP configuration for compatibility with existing inline scripts and CDN-loaded assets.

## Operations

### Logging

- request logging via Morgan
- application logging via Winston
- audit logging through utility helpers

### Backups

- automated backups initialized from `utils/backup.js`
- manual backup script available in `scripts/tools/manual-backup.js`

### Tests and Verification

The repository currently contains lightweight engineering verification scripts under `tests/unit/` focused on the calculation engine rather than a full framework-based automated test suite.

## Known Architectural Tradeoffs

- The frontend is still heavily global and DOM-coupled.
- `public/index.html` is large and centralizes many sections.
- CSS is feature-rich but not yet fully standardized.
- Some legacy comments and older route naming patterns still exist.

## Near-Term Direction

The current practical priorities are:

1. keep routes and docs aligned
2. reduce brittle global frontend coupling
3. improve test automation around the calculation engine
4. continue consolidating visual tokens and shared UI patterns
