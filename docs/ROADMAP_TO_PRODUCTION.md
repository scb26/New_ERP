# 🗺️ Unidex ERP — Autonomous Roadmap to Production

This document establishes the definitive **Multi-Sprint Autonomous Development Highway** to transition Unidex ERP from a single-store POS prototype into a **production-grade commercial ERP** that real businesses can run daily.

---

## 🚦 Production Readiness Maturity Stages

```
   [ Sprint 1.0 & 1.1 ] ➔ [ Sprint 2.0: Core Foundation ] ➔ [ Sprint 3.0: Commercial Ops ] ➔ [ Sprint 4.0: Production Gold ]
   ✅ Persistence & GST     🔒 Auth, RBAC & SQLite ACID     👥 Khata/Ledgers & Bulk CSV       🚀 Backup, Roles & Final Polish
```

---

## 🏃 Sprint Roadmap Breakdown

### ✅ Phase 1: Completed Sprints
- **Sprint 1.0 (`v1.2.0`)**: File persistence (`data/store.json`), granular GST slabs (0%, 5%, 12%, 18%, 28%), 80mm/58mm thermal receipts, 1-click WhatsApp billing.
- **Sprint 1.1 (`v1.2.1`)**: Mandatory compliance (Section 170 round-off, CGST Rule 46 sequential invoice numbering, MCA immutable audit trail), POS keyboard shortcuts (`F2`, `Esc`, `Enter`), local zero-trust UPI QR, atomic writes.

---

### 🟡 Sprint 2.0: Secure Storage & Multi-User RBAC (Current Target)
**Theme:** *Security, Data Protection & Real User Roles*
- **Objective:** Enable multi-user operation where Cashiers cannot see profit margins or edit settings, and data is protected by real authentication.
- **Key Deliverables:**
  1. **JWT Authentication & Role-Based Access Control (RBAC):**
     - Roles: `ADMIN` (Store Owner) vs `CASHIER` (Billing Operator) vs `ACCOUNTANT`.
     - Secure password hashing (bcrypt) and login/logout modal.
     - Cashier view restrictions: Hide supplier cost prices, gross profit margins, and `/api/settings`.
  2. **SQLite Database Engine (Prisma / Drizzle ORM):**
     - Replace flat `data/store.json` with an ACID-compliant embedded SQLite database (`data/unidex.db`).
     - Real relational tables (`products`, `parties`, `invoices`, `invoice_items`, `audit_logs`).
     - Eliminates race conditions with row-level transactional locking.
  3. **User-Bound Audit Trail:**
     - Bind real username/operator ID (`req.user.username`) into `data/audit_trail.log` for statutory compliance.

---

### 🔜 Sprint 3.0: Financial Ledgers (*Khata*) & Bulk Onboarding
**Theme:** *Real-World Trading & Fast Store Setup*
- **Objective:** Give merchants the tools to track customer debt (*Udhar*), record supplier bills, and upload 2,000 products in 30 seconds.
- **Key Deliverables:**
  1. **Customer & Vendor Ledger / Udhar Khata:**
     - Detailed running balance history (Debits vs Credits).
     - Aging reports (0–30, 31–60, 90+ days overdue).
     - Customer payment collection vouchers & WhatsApp payment reminder links.
  2. **Bulk Excel/CSV Import & Export:**
     - 1-click Excel import template for Products, Opening Stock, and Parties.
     - 1-click Sales & Purchase Register export for Chartered Accountant (CA) audits.
  3. **Inventory Batch & Expiry Tracking:**
     - Expiry date warnings for FMCG/grocery/pharma products.

---

### 🔜 Sprint 4.0: Commercial Polish & Autonomous Backup
**Theme:** *Production Hardening & Launch Readiness*
- **Objective:** Bulletproof reliability for real-world store deployment.
- **Key Deliverables:**
  1. **Automated Database Backup & Restore:**
     - 1-click encrypted database backup download (`.backup`) and automated daily snapshotting.
  2. **Soundbox / UPI Audio Confirmation:**
     - Synthetic audio confirmation (*"Received ₹500 via UPI"*) to prevent cashier screen fraud.
  3. **Production Deployment Packaging:**
     - Standalone executable / Docker container for one-click store server launching.

---

## 🔄 The Autonomous Execution Loop

```
   1. Lead PM drafts PRD & Acceptance Criteria
          │
          ▼
   2. Architect designs Schema & API Contracts
          │
          ▼
   3. Senior Developer writes Production Code
          │
          ▼
   4. Security Engineer & QA Engineer audit & test
          │
          ▼
   5. Release Manager cuts version & updates Ledger
          │
          ▼
   (Repeat autonomously for next sprint until Gold Master)
```
