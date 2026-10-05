# 🏆 Unidex ERP — Sprint Achievements & Milestone Ledger

This living ledger documents the formal achievements, sprint goals, completed deliverables, verification audits, and release tags across all engineering sprints. Maintained by the **Product Management** and **Release Management** office.

---

## 📋 Sprint Index & Status Overview

| Sprint # | Version Tag | Primary Goal / Theme | Date Completed | Status | QA Sign-off |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Sprint 1.0** | `v1.2.0` | Core Persistence, Granular GST Slabs & Thermal Billing | Oct 5, 2026 | ✅ SHIPPED | ✅ PASS |
| **Sprint 1.1** | `v1.2.1` | Statutory Compliance & Counter POS Ergonomics | Oct 5, 2026 | ✅ SHIPPED | ✅ PASS (QA & Sec) |
| **Sprint 2.0** | `v1.3.0` | ACID Persistence, Enterprise RBAC & Margin Protection | Oct 5, 2026 | ✅ SHIPPED | ✅ PASS (QA & Sec) |
| **Sprint 3.0** | `v1.4.0` | Dual-Entry Khata, AR Aging, Bulk CSV & UPI Reminders | Oct 5, 2026 | ✅ SHIPPED | ✅ PASS (QA & Sec) |

---

## 📦 Detailed Sprint Records

### 🚀 Sprint 1.0 — Core Persistence, Granular GST & Thermal Billing
* **Sprint Version:** `v1.2.0`
* **Kickoff Date:** October 5, 2026
* **Completion Date:** October 5, 2026
* **Sprint Goal:** Transform Unidex ERP from a transient in-memory demo into a persisting, GST-compliant POS billing engine with instant thermal printing and WhatsApp customer delivery.
* **PRD Reference:** [`docs/PRD_Sprint_1.md`](PRD_Sprint_1.md)

#### 🎯 Key Achievements & Delivered Tasks:
1. **💾 Persistent Storage Layer (`server.ts`):**
   - Implemented synchronous file-backed persistence engine at `data/store.json`.
   - Automated `data/` directory creation with seed data fallback.
   - Guaranteed persistence for Products, Parties, Invoices, Purchases, and Business Settings across server restarts.
2. **🏷️ Granular GST Tax Slabs (0%, 5%, 12%, 18%, 28%) & HSN/SAC Codes:**
   - Added `hsnCode` and `gstRate` fields to product schema and modal in `Inventory.tsx`.
   - Added dedicated HSN and GST Slab columns to the stock table.
   - Replaced flat hardcoded 18% tax in `QuickBill.tsx` and `Sales.tsx` with dynamic per-item tax math.
3. **🖨️ 80mm & 58mm Thermal Receipt Printing:**
   - Created `ThermalReceiptModal.tsx` replicating authentic ESC/POS counter slips.
   - Configured `@media print` CSS in `index.css` hiding application UI and isolating only the receipt slip.
   - Added paper width toggle between 80mm (standard) and 58mm (compact).
4. **📲 1-Click WhatsApp Invoice Dispatch:**
   - Implemented pre-formatted WhatsApp text dispatch (`wa.me/?text=...`) with itemized totals and tax summaries.
   - Added one-click copy-to-clipboard functionality with visual feedback.

#### 🛡️ Quality & Verification Sign-Off:
- **TypeScript Health:** `tsc --noEmit` passed with 0 errors.
- **Production Build:** `vite build` completed in 11.51 seconds.
- **Release Sign-Off:** Issued by Release Manager Rex ([`RELEASE_NOTES_v1.2.0.md`](C:/Users/Lenovo/.gemini/antigravity/brain/2a0d0888-9bd7-466d-867d-b1b5fc5a473e/RELEASE_NOTES_v1.2.0.md)).

---

### 🚀 Sprint 1.1 — Statutory Compliance & Counter POS Ergonomics
* **Sprint Version:** `v1.2.1`
* **Kickoff Date:** October 5, 2026
* **Completion Date:** October 5, 2026
* **Sprint Goal:** Resolve critical audit findings by enforcing mandatory Indian statutory rules (Section 170 round-off, CGST Rule 46 sequential invoice numbers, MCA immutable audit trail) and upgrading counter POS ergonomics (hardware barcode interception, keyboard hotkeys, local zero-trust QR).
* **PRD Reference:** [`docs/PRD_Sprint_1_1_Compliance_Ergonomics.md`](PRD_Sprint_1_1_Compliance_Ergonomics.md)

#### 🎯 Key Achievements & Completed Deliverables:
1. **⚖️ Section 170 CGST Round-Off Engine:**
   - Nearest-rupee rounding rule (+/- paise delta) with dedicated `roundOff` ledger tracking in QuickBill, Sales, and thermal receipts.
2. **🔢 CGST Rule 46 Sequential Invoice Numbering:**
   - Replaced Unix timestamps with consecutive Financial Year sequences (e.g. `INV/26-27/00001`) with automatic padding and year-rollover support.
3. **📜 MCA Immutable Audit Trail (Companies Act Sec 134(5)):**
   - Append-only audit logger (`data/audit_trail.log`) recording entity changes, timestamps, and action types for all mutations.
4. **🛡️ Local Zero-Trust UPI QR Engine:**
   - Eliminated third-party `api.qrserver.com` leak; replaced with local client-side SVG QR rendering for zero data exfiltration.
5. **⚡ Counter Ergonomics & POS Upgrades (`QuickBill.tsx`):**
   - Hardware barcode scanner auto-interception (rapid keystroke buffer ending in `Enter`).
   - Cashier keyboard hotkeys (`F2` search, `Esc` clear, `Enter` checkout).
   - Direct inline quantity typing in the cart with auto-selection.
   - Comprehensive Light/Dark mode tokenization for sharp contrast under retail lighting.
6. **🔄 Customer Credit Balance Sync:**
   - Automatic receivables adjustment in Party ledgers when invoices are completed with unpaid or partial balances.
7. **🔒 Crash-Safe Atomic File Writes (`server.ts`):**
   - Write-to-temp (`store.json.tmp`) + rename atomic file operation preventing `store.json` corruption on power loss.

#### 🛡️ Quality & Verification Sign-Off:
- **TypeScript Health:** `tsc --noEmit` passed with 0 errors.
- **Production Build:** `vite build` completed cleanly with minified assets.
- **QA Sign-Off:** Formally approved by QA Engineer (all test cases verified).
- **Security Sign-Off:** Approved by Principal Security Engineer (zero external API leakage, atomic disk writes, immutable MCA audit log).
- **Release Sign-Off:** Issued by Release Manager Rex ([`RELEASE_NOTES_v1.2.1.md`](C:/Users/Lenovo/.gemini/antigravity/brain/2a0d0888-9bd7-466d-867d-b1b5fc5a473e/RELEASE_NOTES_v1.2.1.md)).

---

### 🚀 Sprint 2.0 — ACID Persistence, Enterprise RBAC & Margin Protection
* **Sprint Version:** `v1.3.0`
* **Kickoff Date:** October 5, 2026
* **Completion Date:** October 5, 2026
* **Sprint Goal:** Elevate Unidex ERP to an enterprise foundation: embed native SQLite ACID engine in WAL mode (`data/unidex.db`), implement Multi-User Role-Based Access Control (Admin, Cashier, Manager) with cryptographic session tokens, protect wholesale margins via cashier cost price redaction, and attribute MCA Section 134(5) audit logs to authenticated user identities.
* **PRD Reference:** [`docs/PRD_Sprint_2_Enterprise_Hardening.md`](PRD_Sprint_2_Enterprise_Hardening.md)

#### 🎯 Key Achievements & Completed Deliverables:
1. **💾 Native SQLite ACID Persistence (`data/unidex.db`):**
   - Implemented WAL mode database using `node:sqlite` (`DatabaseSync`).
   - Relational schemas with foreign keys: `users`, `sessions`, `products`, `parties`, `transactions`, `audit_trail`.
   - Automated seamless migration from `data/store.json` without data loss or downtime.
2. **🔐 Multi-User RBAC & Cryptographic Sessions:**
   - 256-bit cryptographically random tokens (`crypto.randomBytes(32)`) for session verification.
   - Salted `scryptSync` password hashing.
   - Strict HTTP 401/403 authorization decorators on administrative and mutating routes.
   - Role boundaries enforced across UI and API: Admin, Cashier, Manager.
3. **🛡️ Cashier Margin Protection:**
   - Wholesale `costPrice` automatically redacted on POS product endpoints for Cashiers.
   - Prevents operational margin and discount leakage on counter display screens.
4. **📜 Authenticated MCA Section 134(5) Audit Trail:**
   - Enriched audit log entries attributing every mutation to `userId`, `username`, and `userRole`.
   - Dual persistence in indexed database table and append-only `data/audit_trail.log`.
5. **🎨 Frontend Authentication & Session Management:**
   - Added global `AuthContext` with login modal, role-gated navigation, and session recovery.

#### 🛡️ Quality & Verification Sign-Off:
- **TypeScript Health:** `tsc --noEmit` passed with 0 errors.
- **Production Build:** `vite build` completed cleanly in 17.92s.
- **QA Sign-Off:** 100% Unconditional PASS from QA Engineer.
- **Security Sign-Off:** 100% Unconditional PASS from Principal Security Engineer.
- **Release Sign-Off:** Issued by Release Manager Rex ([`docs/RELEASE_NOTES_v1.3.0.md`](RELEASE_NOTES_v1.3.0.md)).

---

### 🚀 Sprint 3.0 — Dual-Entry Khata, AR Aging, Bulk CSV & UPI Reminders
* **Sprint Version:** `v1.4.0`
* **Kickoff Date:** October 5, 2026
* **Completion Date:** October 5, 2026
* **Sprint Goal:** Build commercial-grade receivables and catalog management: introduce dual-entry Khata ledger engine with running balances, ACID-wrapped debt settlements, AR credit aging analysis (0-30, 31-60, 60+ days), 1-click WhatsApp payment reminders with dynamic UPI links, bulk CSV catalog import with validation preview, and CSV export with formula injection defense and cashier margin redaction.
* **PRD Reference:** [`docs/PRD_Sprint_3_Khata_BulkOperations.md`](PRD_Sprint_3_Khata_BulkOperations.md)

#### 🎯 Key Achievements & Completed Deliverables:
1. **📒 Dual-Entry Khata Ledger Engine (`ledger_entries`):**
   - Implemented SQLite `ledger_entries` table with foreign keys, compound indexes, and ACID transaction wrapping.
   - Maintained running balances (`runningBalance`) across debits (sales invoices) and credits (settlements).
   - Atomic settlement payment recording (`/api/parties/:id/settle`) supporting Cash, UPI, and Bank modes.
2. **⏳ Accounts Receivable (AR) Aging Engine:**
   - Real-time aging bucket computation: Current (0–30 days), Due (31–60 days), Overdue (60+ days).
   - Integrated into dedicated Admin Khata Tab and individual passbooks.
3. **📲 1-Click WhatsApp Collection Reminders with Dynamic UPI Links:**
   - Pre-formatted payment reminder templates dispatched to customer WhatsApp.
   - Dynamic NPCI UPI intent deep link (`upi://pay?pa=...&pn=...&am=...&cu=INR`) for instant 1-click customer payment.
4. **📖 Interactive Khata Passbook Modal (`KhataPassbookModal.tsx`):**
   - Clean banking passbook UI displaying chronologically sorted ledger statements, settlement triggers, and print receipts.
5. **📥 Bulk CSV Catalog Import (`CSVImportModal.tsx`):**
   - Multi-column CSV file parser with pre-commit validation preview table.
   - Atomic batch insert via `/api/products/bulk` in a single SQLite transaction.
6. **📤 Catalog CSV Export with Formula Injection & Margin Defense:**
   - Formula sanitization escaping leading `=`, `+`, `-`, `@`, `\t`, `\r` to prevent spreadsheet RCE.
   - Automated suppression of wholesale `costPrice` when exported by cashiers.

#### 🛡️ Quality & Verification Sign-Off:
- **TypeScript Health:** `tsc --noEmit` passed with 0 errors.
- **Production Build:** `vite build` completed cleanly in 7.44s.
- **QA Sign-Off:** 100% Unconditional PASS from QA Engineer.
- **Security Sign-Off:** 100% Unconditional PASS from Principal Security Engineer.
- **Release Sign-Off:** Issued by Release Manager Rex ([`docs/RELEASE_NOTES_v1.4.0.md`](RELEASE_NOTES_v1.4.0.md)).

---

*This document is updated automatically at the completion of each sprint.*
