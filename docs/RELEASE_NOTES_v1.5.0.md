# Release Notes — Unidex ERP v1.5.0 (Sprint 4.0)

**Release Date:** October 5, 2026  
**Milestone:** Sprint 4.0: "Win the Counter First" — Pilot Hardening & Counter Workflow Perfection  
**Sign-off:** Approved by Rex (Release Manager), Priya (CPO), Quinn (QA Lead), Maya (Security), and Meera (Legal)  

---

## 🌟 Executive Summary

**Unidex ERP v1.5.0** marks the commercial counter hardening release designed specifically to win the daily retail checkout experience during merchant beta pilots. With strict Rule 46 GST 15-character sequential numbering, multi-tender split payments (Cash + UPI + Card + Credit), cash register shift tracking with printable ESC/POS 80mm Z-Reports, and an instant zero-cost local OmniSearch command palette (`Ctrl+K`), Unidex ERP delivers high-speed, 100% offline retail operations without cloud latency or token taxes.

---

## 🚀 What's New in v1.5.0

### 1. ⚖️ Statutory Rule 46 Strict 15-Character Invoice Numbering
- **Statutory Standard:** Conforms strictly to **Rule 46(b) of the CGST Rules, 2017**, which prohibits invoice serial numbers from exceeding 16 characters.
- **Format:** `INV/YY-YY/00001` (e.g. `INV/26-27/00001` = **exactly 14-15 characters**).
- **Self-Healing Monotonic Sequence:** Automatically queries maximum existing invoice numbers for the financial year upon boot, preventing ID collisions even after data imports or resets.

### 2. 💳 Multi-Tender & Split Payment Billing (`QuickBill.tsx`)
- **Fast Single-Click Tenders:** Instant 1-click checkout for `100% Cash`, `100% UPI QR`, `Card Swipe`, and `Customer Credit (Udhar)`.
- **Split Tender Billing:** Allows cashiers to divide a single invoice across any combination of payment methods:
  - **Cash:** Denomination chips (`+₹100`, `+₹500`, `+₹2000`, `Fill Remainder`).
  - **UPI:** Dynamic zero-cost local QR code that adjusts in real-time to match the exact remaining UPI portion.
  - **Card:** Card swipe/POS entry with optional auth code / reference tracking.
  - **Credit (Udhar):** Charges remaining balance to the customer's Bahi-Khata ledger (disabled for anonymous walk-in shoppers).
- **Real-Time Balance & Cash Change Engine:** Continuously verifies that total tendered covers the rounded bill total and computes exact cash change to return to the shopper.
- **Thermal Slip Itemization:** Both 80mm/58mm thermal receipts and WhatsApp receipts itemize the exact tender breakdown.

### 3. 💼 Cash Register Shift Management & Day-End Z-Report (`CashDrawerModal.tsx`)
- **Shift Lifecycle (`cash_shifts` in SQLite):**
  - Cashier declares physical opening float (e.g. ₹2,000) before counter billing begins.
  - QuickBill header displays real-time register status badge (`Register Open: ₹X` / `Register Closed`).
- **Petty Cash Operations (`cash_drawer_transactions`):**
  - **Cash In:** Log additional cash float additions from the store safe.
  - **Cash Out:** Log petty cash expenses (tea/refreshments, courier charges, packing materials, vendor payouts).
- **Day-End Reconciliation & Denominations Counter:**
  - Cashier counts physical cash using a built-in Indian currency denomination counter (₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, coins).
  - Automatically compares counted physical cash against expected cash (`openingFloat + cashSales + cashIn - cashOut`) to identify balanced registers, shortages, or overages.
- **Printable 80mm ESC/POS Z-Report Slip:** Generates an unalterable, permanent day-end Z-Report slip ready for 1-click thermal printing.

### 4. ⚡ Zero-Cost Local OmniSearch Command Palette (`Ctrl+K` / `Cmd+K`)
- **Instant Keyboard Navigation:** Global hotkey `Ctrl+K` (or `Ctrl+D` for Cash Drawer) opens a centered command overlay within 10ms.
- **Unified Local Search:**
  - **Inventory Catalog:** Search by item name, barcode, or category; shows sell price, live stock counts, and low-stock alerts. Cashier role automatically redacts wholesale cost prices.
  - **Customer Khata Debts:** Search by customer name or phone number; displays outstanding balance and triggers 1-click WhatsApp payment reminders with dynamic UPI links.
  - **System Hotkeys:** Instant jump to QuickBill (`Alt+2`), Dashboard (`Alt+1`), Inventory (`Alt+4`), Sales (`Alt+3`), Cash Drawer, and Dark/Light Mode.

---

## 🛠️ Architecture & Technical Changes

| Component | Nature | Description |
| :--- | :--- | :--- |
| `server.ts` | Modified | Updated FY helper to Rule 46 2-digit standard (`YY-YY`); added `cash_shifts` and `cash_drawer_transactions` schemas; updated `POST /api/invoices` with multi-tender split routing and self-healing monotonic sequences; added `/api/shifts/*` endpoints. |
| `src/components/CashDrawerModal.tsx` | New | Comprehensive shift management UI: opening float declaration, petty cash logging, denomination counter, and printable ESC/POS 80mm Z-Report. |
| `src/components/OmniSearchModal.tsx` | New | High-speed client-side command palette with fuzzy search across products, customer ledgers, and keyboard navigation. |
| `src/components/QuickBill.tsx` | Modified | Integrated register shift badge, multi-tender split payment modal with real-time dynamic UPI QR adjustment, and split receipt generation. |
| `src/components/ThermalReceiptModal.tsx` | Modified | Updated `ReceiptData` interface and thermal print layout to itemize tender breakdown for split payments. |
| `src/App.tsx` | Modified | Mounted `OmniSearchModal` and `CashDrawerModal` with global hotkeys (`Ctrl+K`, `Ctrl+D`, `Alt+1-6`) and sidebar search trigger. |
| `package.json` | Modified | Version incremented to `v1.5.0`. |

---

## 🛡️ Verification & Sign-Off

- **TypeScript Engine:** `tsc --noEmit` $\rightarrow$ **0 Errors (PASS)**.
- **Vite Production Bundler:** `npm run build` $\rightarrow$ **Clean Production Bundle in 8.09s (PASS)**.
- **End-to-End API Test Suite:**
  - Shift Open (`SHIFT-20261005-592`) $\rightarrow$ **PASS**.
  - Petty Cash In (+₹500) & Petty Cash Out (-₹80) $\rightarrow$ **PASS**.
  - Multi-Tender Split Checkout (Cash + UPI) $\rightarrow$ **PASS**.
  - Statutory Rule 46 Length Audit (`INV/26-27/00006`, Length 15 $\le$ 16) $\rightarrow$ **PASS**.
  - Shift Reconcile & Z-Report (`Z-20261005-592`, Variance: ₹0 BALANCED) $\rightarrow$ **PASS**.

---

**Unidex ERP v1.5.0 is formally signed off and ready for deployment.**
