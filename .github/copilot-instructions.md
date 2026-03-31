# Copilot Instructions for Transformer Manufacturing PMS

## Project Overview
This is a **Transformer Manufacturing Project Management System** (Express.js + Vanilla JS) that tracks engineering workflows through manufacturing stages with enforced sequential completion. It uses file-based JSON storage with role-based access control.

**Key architectural patterns:**
- **Express backend** with modular routes (one file per entity: transformers, checklists, documents, BOMs, calculations, designs, audit logs, stage control)
- **File-based persistence** (`/data/*.json`) instead of database—each entity has dedicated JSON file
- **Role hierarchy**: admin (3) > quality (2) > production (1) > customer (0)
- **Stage locking system** (`stageControl.js`): Enforces WINDING → VPD → CORECOIL → TANKING → TANKFILLING sequence. Sub-stages for winding (winding1-5). Stages must be 100% complete before advancing.
- **Audit logging**: All data mutations logged to `auditLogs.json` via `logAudit()` function
- **Vanilla frontend**: No framework; uses fetch API with `user-id` header authentication

## Critical Developer Workflows

### Running the Application
```bash
npm install    # Install dependencies (express, cors, bcrypt, uuid, multer)
npm start      # or: node server.js (runs on port 3000)
```

**Default test accounts:**
- `admin` / `admin123` (role: admin)
- `quality` / `qc123` (role: quality)
- `production` / `prod123` (role: production)
- `customer1` / `cust123` (role: customer, customerId: CUST001)

### Development Setup
- No build process or tests yet (plain Node.js)
- Logs include role/user context (e.g., `👤 User: admin (admin)`)
- Set `NODE_ENV=development` to include stack traces in error responses

## Project-Specific Conventions

### 1. **File Organization Pattern**
- **Routes**: `/routes/*.routes.js` — one route file per entity (transformers, checklists, etc.)
- **Utilities**: `/utils/` — shared functions (init, audit, file upload, response helpers)
- **Middleware**: `/middlewares/` — auth, error handling, validation
- **Data**: `/data/*.json` — persistent JSON files (NOT in git; gitignore applies)
- **Frontend**: `/public/js/*.js` — separate modules (ui.js, api.js, auth.js, etc.)

### 2. **Data Files**
All data lives in `/data/` as JSON:
- `transformers.json` — Main entity; includes W.O. number, customer, stage, status
- `checklists.json` — Stage-specific checklists with completion tracking
- `documents.json` — Scanned/uploaded files metadata
- `boms.json` — Bill of Materials linked to transformers
- `users.json` — Login credentials (passwords hashed with bcrypt)
- `auditLogs.json` — Immutable audit trail (append-only)
- `stageStatus.json` — Stage locking and completion tracking per work order
- `designs.json` — Design specifications and calculations (NEW)

### 3. **Response Format**
All API responses follow this structure:
```javascript
// Success
{ success: true, message: "...", data: {...} }

// Error
{ success: false, error: "...", details: "..." }  // details only in dev
```

Use helpers from `utils/response.js`:
```javascript
res.json(successResponse(data, "Custom message"));
res.status(500).json(errorResponse(error));
```

### 4. **Authentication & Permission Model**
- **Auth middleware** (`auth.js`):
  - `attachUser(req, res, next)` — Extract user from `user-id` header; attach to `req.user`
  - `checkPermission(requiredRole)` — Compare role hierarchy (role values: 'admin', 'quality', 'production', 'customer')
  - `requireRole(allowedRoles)` — Exact role matching for specific endpoints

- **Typical protection pattern:**
  ```javascript
  router.post('/', checkPermission('quality'), (req, res) => {
      // Quality level (2) or higher can access
  });
  ```

- **Customer filtering**: Routes check `req.user?.role === 'customer'` to return only their data

### 5. **Audit Logging**
Every data mutation (CREATE, UPDATE, DELETE) must call:
```javascript
const { logAudit } = require('../utils/audit');
logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'transformer', itemId, newData);
```

Parameters: `(userId, username, role, action, entity, entityId, payload)`

Audit logs are write-only (appended to `auditLogs.json`). Essential for compliance tracking.

### 6. **Validation Pattern**
Use `express-validator` in route definitions:
```javascript
router.post('/', [
    body('wo').trim().notEmpty().isLength({ min: 3, max: 50 }),
    body('rating').optional().isNumeric(),
], handleValidationErrors, (req, res) => {
    // Safe to use req.body; errors already caught
});
```

The `handleValidationErrors` middleware from `/middlewares/validation.js` catches and returns structured error responses.

### 7. **Frontend API Communication**
- All requests use `apiCall()` helper (`public/js/api.js`) which:
  - Attaches `user-id` header from `window.currentUserId`
  - Validates JSON responses; throws if backend returns HTML error page
  - Logs errors to browser console

- File uploads use `uploadFile()` helper (multipart/form-data)

### 8. **Stage Locking & Manufacturing Workflow**
The stage control system (`stageControl.js`) enforces strict sequential completion:
- **Main stages** (must be completed in order): winding, vpd, coreCoil, tanking, tankFilling
- **Winding sub-stages**: winding1, winding2, winding3, winding4, winding5 (each must be 100% complete)
- **Transition rules**: A stage cannot be entered/advanced until the previous stage reaches 100% completion
- **Data location**: Stage status tracked in `stageStatus.json` keyed by work order (W.O.) number
- **API endpoint**: `/stage/` routes handle `getStatus()`, `completeStage()`, `advanceStage()` operations
- **Checklist integration**: Manufacturing checklists enforce item-level completion before stage advancement

### 9. **Data Initialization**
On server startup (`server.js`):
1. `initUsersFile()` — Creates default users with hashed passwords if missing
2. `initDataFiles()` — Creates empty JSON files for transformers, checklists, etc.
3. `initAuditFile()` — Creates empty audit log
4. `initStageStatusFile()` — Creates empty stage status file

This ensures app works immediately without database setup.

## Integration Points & Cross-Component Communication

| Component | Depends On | Key Exports |
|-----------|-----------|-------------|
| Routes | Middleware, Utils | Express router |
| Auth middleware | Users file | `checkPermission()`, `requireRole()`, `attachUser()` |
| Stage control | Transformers, stageStatus | `getStageStatus()`, `completeStage()`, `advanceStage()`, `STAGE_ORDER` |
| Audit logging | Transformers/Checklists/etc | `logAudit()` function |
| Frontend JS | API, Auth | `apiCall()`, `uploadFile()`, session storage |
| Error handler | Global middleware | JSON error responses |

## Common Modification Patterns

**Adding a new entity (e.g., "Inventory"):**
1. Create `/routes/inventory.routes.js` — copy transformer.routes.js as template
2. Create `/data/inventory.json` in init.js
3. Mount route in `server.js`: `app.use('/inventory', inventoryRoutes)`
4. Add audit logging to CREATE/UPDATE/DELETE handlers
5. Frontend: Add UI module in `/public/js/inventory.js`; call via `apiCall()`

**Changing permission levels:**
- Modify `roleHierarchy` in `auth.js` (currently: admin=3, quality=2, production=1, customer=0)
- Update `checkPermission()` calls in affected routes

**Changing data schema:**
- Add new fields to example in `/data/*.json`
- Update validation rules in corresponding route file
- Frontend will auto-bind if using form fields with matching names

## Notes for AI Agents

- **No database migrations**: All schema changes are file edits + version bumps in JSON
- **Customer data isolation**: Always filter by `customerId` for customer-role requests
- **Immutable audit trail**: Never modify `auditLogs.json`; only append via `logAudit()`
- **File sync**: No concurrency lock; assume single-process execution (scale carefully)
- **Frontend state**: Uses browser session storage for auth token; no persistence
- **Stage dependencies**: Before allowing stage transitions, validate completion status in `stageStatus.json`
- **Winding sub-stages**: Winding1-5 must each reach 100% before winding stage is considered complete
- **Error messages**: Match existing console output style (`✅`, `❌`, `👤` emojis)
