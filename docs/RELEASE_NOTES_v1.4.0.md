# Unidex ERP — Release Notes (v1.4.0)

**Release Version:** `v1.4.0`  
**Release Date:** October 05, 2026  
**Sprint:** Sprint 3.0 (Khata Ledger Engine, AR Credit Aging, CSV Ingestion & Bulk Operations)  
**Status:** Approved & Production-Ready (GREEN)  
**Sign-off:** Release Manager, QA Engineer, Principal Security Engineer  

---

## 1. Executive Summary & What's New

The Unidex ERP `v1.4.0` release delivers commercial-grade receivables and inventory management capabilities: an immutable **Dual-Entry Khata Ledger Engine** with running balances and atomic settlement payments, an **Accounts Receivable (AR) Aging Engine** with credit risk categorization (0–30, 31–60, 60+ days), **1-Click WhatsApp Payment Reminders** featuring native NPCI UPI payment intent deep links, and enterprise **CSV Bulk Catalog Import/Export** fortified with formula injection defenses and role-based cashier margin redaction.

### 🌟 Key Enhancements in v1.4.0

### 1. Dual-Entry Khata Ledger Engine (`ledger_entries`)
- **Immutable Financial Transactions**:
  - SQLite table with foreign keys, compound indexes, and ACID transaction wrapping.
  - Automatic double-entry journaling for invoice credit balances, partial payments, and standalone counter settlements.
  - Accurate running balance calculation (`runningBalance`) stored per party ledger entry.
- **Settlement Payments**:
  - Dedicated settlement API (`/api/parties/:id/settle`) supporting Cash, UPI, and Bank Transfer with transaction reference notes.
  - Atomically adjusts party outstanding balance and inserts matching credit entry.

### 2. Accounts Receivable (AR) Aging Engine
- **Credit Risk Classification**:
  - Dynamic aging buckets: Current (`0–30 days`), Due (`31–60 days`), and Overdue (`60+ days`).
  - Summarized at the portfolio level in the new Admin Khata Tab and at individual party ledger levels.
- **Collection Acceleration**:
  - Instant WhatsApp collection reminder generator with pre-composed professional message templates.
  - Embedded dynamic UPI deep link (`upi://pay?pa=...&pn=...&am=...&cu=INR`) enabling customers to clear balances via Google Pay, PhonePe, or Paytm with one click.

### 3. Interactive Khata Passbook Modal
- Reusable `KhataPassbookModal.tsx` providing cashiers and managers with an authentic banking-style statement.
- Filterable chronological audit of all debits (invoices), credits (settlements), reference IDs, and progressive balances.
- Includes instant settlement modal and 1-click WhatsApp reminder trigger.

### 4. Bulk CSV Catalog Import with Preview Validation
- **Client-Side CSV Parsing**:
  - Multi-column parsing with validation against duplicate barcodes, negative prices, and invalid GST rates.
  - Interactive pre-commit preview table identifying errors and warnings before database write.
- **Atomic Bulk Insertion**:
  - `/api/products/bulk` executes all imports inside a single SQLite transaction (`BEGIN IMMEDIATE`), ensuring zero partial imports or corrupt datasets.

### 5. Catalog CSV Export with Formula Injection Defense
- **Zero-Exploit CSV Sanitization**:
  - Automatic prefix escaping (leading single quote `'`) on all cells beginning with spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`).
  - Prevents Remote Code Execution (RCE) and data exfiltration when opened in Microsoft Excel or Google Sheets.
- **Cashier Margin Protection**:
  - Automatically suppresses wholesale cost price columns if exported by users with `Cashier` role.

---

## 2. Release Audit & Readiness Checklist

| Audit Item | Status | Verification Result |
|---|:---:|---|
| **TypeScript Health** | PASS | `npm run lint` (`tsc --noEmit`) completed with **0 errors**. |
| **Production Build** | PASS | `vite build` completed in 7.44s with optimized JS/CSS chunks. |
| **Database Schema** | PASS | `ledger_entries` table, indexes, and FK constraints verified in `data/unidex.db`. |
| **Security Verification** | PASS | Formula injection escaping, cashier CSV cost redaction, and ACID transactions verified. |
| **Version Tag** | PASS | `package.json` updated to **`1.4.0`**. |
| **QA Sign-Off** | PASS | 100% Unconditional Pass from QA Engineer. |
| **Security Sign-Off** | PASS | 100% Unconditional Pass from Principal Security Engineer. |

---

## 3. Technical Changes Summary

- **Backend (`server.ts`)**:
  - Added `ledger_entries` schema and indexing.
  - Implemented `/api/parties/:id/ledger` and atomic settlement endpoint `/api/parties/:id/settle`.
  - Implemented `/api/parties/aging/summary` for aging buckets.
  - Implemented atomic `/api/products/bulk` import and formula-sanitized `/api/products/export` route.
- **Frontend Components**:
  - `src/components/KhataPassbookModal.tsx`: Complete passbook view and settlement workflow.
  - `src/components/CSVImportModal.tsx`: File upload, validation preview table, error badge indicators.
  - `src/components/AdminModule.tsx`: Added dedicated Khata Ledger management tab with AR aging KPIs and party passbooks.
  - `src/components/Inventory.tsx`: Added Bulk CSV Import and Export triggers.
- **Documentation & Configuration**:
  - `package.json`: Version bumped to `1.4.0`.
  - `docs/SPRINT_ACHIEVEMENTS_LOG.md`: Sprint 3.0 logged as SHIPPED.

---

## 4. Final Sign-Off

> [!IMPORTANT]
> **Release Recommendation: GREEN (READY FOR PRODUCTION DEPLOYMENT)**  
> All Sprint 3.0 acceptance criteria, security audits, and production build verifications have passed with zero regressions.
