# Unidex ERP — Release Notes (v1.3.0)

**Release Version:** `v1.3.0`  
**Release Date:** October 05, 2026  
**Sprint:** Sprint 2.0 (ACID Persistence, Enterprise RBAC & Margin Protection)  
**Status:** Approved & Production-Ready (GREEN)  
**Sign-off:** Release Manager, QA Engineer, Principal Security Engineer  

---

## 1. Executive Summary & What's New

The Unidex ERP `v1.3.0` release delivers an enterprise-grade infrastructure transformation: replacing raw JSON file storage with a fully transactional **SQLite ACID persistence engine in WAL mode**, introducing **Multi-User Role-Based Access Control (RBAC)** protected by cryptographic 256-bit session tokens, enforcing **Cashier Margin Protection** via automatic cost price redaction, and binding **MCA Section 134(5) audit trail entries** to authenticated user identities.

### 🌟 Key Enhancements in v1.3.0

### 1. Native SQLite ACID Engine (`data/unidex.db`)
- **Zero-Corruption WAL Mode**:
  - Implemented transactional database persistence via `node:sqlite` (`DatabaseSync`).
  - Configured Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and full foreign-key constraints (`PRAGMA foreign_keys = ON`).
- **Normalized Schema**:
  - Tables for `users`, `sessions`, `products`, `parties`, `transactions`, and `audit_trail`.
- **Zero-Downtime Data Migration**:
  - Automated migration pipeline importing existing records from `data/store.json` on first startup without loss.

### 2. Multi-User RBAC & Cryptographic Sessions
- **Role Hierarchy**:
  - `Admin`: Full organizational control (Inventory, Sales, Purchases, Admin, Settings, Audit Log).
  - `Cashier`: Dedicated POS checkout, sales register view, customer records.
  - `Manager`: Inventory and purchasing oversight.
- **Cryptographic Security**:
  - 256-bit entropy session tokens generated via `crypto.randomBytes(32).toString('hex')`.
  - Passwords hashed with salt via `scryptSync`.
- **Strict Route Guards**:
  - HTTP 401 Unauthorized for missing/expired session tokens.
  - HTTP 403 Forbidden on administrative endpoints (`/api/admin/*`, `/api/audit-trail`, `/api/products` mutating routes for non-admins).

### 3. Cashier Margin Protection
- **POS Endpoint Cost Price Redaction**:
  - Redacts sensitive `costPrice` on `/api/products` for cashiers and unauthenticated POS clients.
  - Prevents counter cashiers or screen-peekers from viewing wholesale costs and markup margins.

### 4. Authenticated MCA Section 134(5) Audit Trail
- **Attributed Immutable Ledger**:
  - Every create, update, and delete action captures `userId`, `username`, and `userRole`.
  - Stored persistently in both `audit_trail` table and append-only `data/audit_trail.log`.

---

## 2. Release Audit & Readiness Checklist

| Audit Item | Status | Verification Result |
|---|:---:|---|
| **TypeScript Health** | PASS | `npm run lint` (`tsc --noEmit`) completed with **0 errors**. |
| **Production Build** | PASS | `vite build` completed successfully (`dist/` generated with clean chunks). |
| **ACID Engine Verification** | PASS | SQLite tables created, WAL enabled, foreign keys enforced. |
| **RBAC & Margin Protection** | PASS | 401/403 guards active, cost prices redacted for cashier roles. |
| **Version Tag** | PASS | `package.json` updated to **`1.3.0`**. |
| **QA Sign-Off** | PASS | 100% Unconditional Pass from QA Engineer. |
| **Security Sign-Off** | PASS | 100% Unconditional Pass from Principal Security Engineer. |

---

## 3. Technical Changes Summary

- **Backend (`server.ts`)**:
  - Embedded `node:sqlite` database engine with automated table migrations and JSON store importer.
  - Added session authentication middleware and RBAC authorization decorators (`requireAuth`, `requireRole`).
  - Added `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` endpoints.
  - Redacted `costPrice` on product lists for Cashier requests.
  - Linked `logAuditEvent` to active request user session.
- **Frontend**:
  - `src/context/AuthContext.tsx`: Client authentication provider managing user session, login modal, and role-based permissions.
  - `src/components/LoginModal.tsx`: Modern high-contrast authentication dialog.
  - `src/App.tsx`: Role-filtered module navigation (restricted admin modules for cashiers).
- **Configuration & Ledger**:
  - `package.json`: Version bumped to `1.3.0`.
  - `docs/SPRINT_ACHIEVEMENTS_LOG.md`: Sprint 2.0 marked as SHIPPED.

---

## 4. Final Sign-Off

> [!IMPORTANT]
> **Release Recommendation: GREEN (READY FOR PRODUCTION DEPLOYMENT)**  
> Sprint 2.0 satisfies all architectural, security, statutory, and functional criteria with zero regressions.
