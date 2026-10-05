# Unidex ERP — Cashier & Store Owner Visual Onboarding Manual
**Manual Version:** 3.0.0 (Commercial Store Edition)  
**Target Roles:** Cashiers, Counter Operators, Store Managers, Retail Business Owners  
**Core Modules:** QuickBill POS, Khata Ledgers, Inventory Catalog, Thermal & WhatsApp Engine  

---

```
====================================================================================================
                        UNIDEX ERP — COUNTER OPERATOR CHEAT-SHEET
====================================================================================================
  1-CLICK LAUNCH:        Double-click [START_UNIDEX_ERP.bat] on your Windows Desktop
  DEFAULT ACCESS:        Admin / Cashier: cashier1 / Cashier@123  (or admin / Admin@123)
  POS KEYBOARD HOTKEYS:  [F2] Focus Search   |   [F4] Select Customer   |   [Enter] Checkout / Bill
====================================================================================================
```

---

## 1. QuickBill Counter Billing Ergonomics & Hotkeys

The Unidex QuickBill interface is architected for **keyboard-first, mouse-free** retail throughput. Keep your hands on the keyboard for maximum checkout velocity during customer rushes.

### Keyboard Shortcut Mapping

| Key Shortcut | Function | Action Description |
| :---: | :--- | :--- |
| <kbd>F2</kbd> | **Focus Search / Barcode** | Instantly positions keyboard cursor into the search box ready for barcode scan or SKU typing. |
| <kbd>Enter</kbd> (in Search) | **Direct Barcode Entry** | If exact barcode or product name matches, immediately adds item to cart and clears input. |
| <kbd>F4</kbd> | **Customer Khata Lookup** | Toggles customer selection dropdown to bill regular ledger clients or walk-ins. |
| <kbd>Enter</kbd> (in Cart) | **Trigger Settlement** | Opens the payment settlement modal when cart has items. |
| <kbd>Esc</kbd> | **Dismiss / Cancel** | Closes active modal, clears customer dropdown, or cancels checkout. |

### 3-Step Counter Checkout Flow

```
[ Step 1: Scan / Search ]               [ Step 2: Review Cart ]               [ Step 3: Settle & Slip ]
  +-----------------------+              +-----------------------+              +-----------------------+
  | Hit [F2]              |              | Item: Amul Butter     |              | Hit [Enter]           |
  | Scan barcode with gun |  ========>   | Qty:  2  [+][-]       |  ========>   | Choose Cash / UPI QR  |
  | Item added to cart!   |              | GST:  12% (₹24.00)    |              | Print Thermal Slip    |
  +-----------------------+              | Total: ₹224.00        |              | Or Send WhatsApp Bill |
                                         +-----------------------+              +-----------------------+
```

---

## 2. Fast Cart Adjustments & Quantity Editing

```
+--------------------------------------------------------------------------------------------------+
| CART DRAWER (RIGHT PANEL)                                                                        |
+--------------------------------------------------------------------------------------------------+
| Customer: [ Walk-in Customer (F4) v ]                                      Items in Cart: [ 2 ]  |
| ------------------------------------------------------------------------------------------------ |
|  1. Britannia Good Day 100g                     Qty: [ - ]  ( 4 )  [ + ]     Total: ₹120.00      |
|     HSN: 19053100  |  GST: +18%                                              [ Trash Icon ]      |
|                                                                                                  |
|  2. Tata Tea Gold 250g                          Qty: [ - ]  ( 1 )  [ + ]     Total: ₹145.00      |
|     HSN: 09023020  |  GST: +5%                                               [ Trash Icon ]      |
| ------------------------------------------------------------------------------------------------ |
| Subtotal: ₹232.00   |   Total GST: ₹33.00   |   Round-Off: +₹0.00   |   GRAND TOTAL: ₹265.00     |
|                                                                                                  |
|                      [  COMPLETE SETTLEMENT / BILL (Enter)  ]                                    |
+--------------------------------------------------------------------------------------------------+
```

1. **Adjust Quantities:** Click `+` or `-` to increment/decrement units.
2. **Remove Erroneous Scan:** Click the red **Trash** icon beside the item.
3. **Clear Whole Cart:** Switch customers or click clear to reset cart cleanly.

---

## 3. Thermal Slip Printing (80mm / 58mm) & WhatsApp Sharing

When settlement completes, the **Thermal Receipt & Sharing Modal** pops up automatically.

```
+--------------------------------------------------------------------------------------------------+
| THERMAL RECEIPT PREVIEW                                                                          |
+--------------------------------------------------------------------------------------------------+
| Paper Width:  (•) 80mm Standard       ( ) 58mm Compact Pocket                                    |
| ------------------------------------------------------------------------------------------------ |
|                                      UNIDEX SUPERMARKET                                          |
|                                123 Commercial Road, City Centre                                  |
|                                    GSTIN: 27AABCU9603R1ZM                                        |
|                                         TAX INVOICE                                              |
|                               --------------------------------                                   |
|                               Inv #: INV-0042        05/10/2026                                  |
|                               Cust: Ramesh Patel (Walk-in)                                       |
|                               --------------------------------                                   |
|                               Item                    Qty    Price     Total                     |
|                               Good Day 100g             4    30.00    120.00                     |
|                               Tata Tea 250g             1   145.00    145.00                     |
|                               --------------------------------                                   |
|                               Taxable Subtotal:                ₹232.00                           |
|                               Total GST (5% & 18%):             ₹33.00                           |
|                               GRAND TOTAL:                     ₹265.00                           |
|                               Paid via:                           CASH                           |
|                               --------------------------------                                   |
|                                 Thank you! Visit again soon.                                     |
| ------------------------------------------------------------------------------------------------ |
| [ 🖨️ Print Thermal Slip (Ctrl+P) ]    [ 💬 Share on WhatsApp ]    [ 📋 Copy Bill Text ]          |
+--------------------------------------------------------------------------------------------------+
```

- **Instant Thermal Print:** Press <kbd>Enter</kbd> or click **Print Thermal Slip**. Your USB/Bluetooth POS printer will instantly spit out the receipt.
- **WhatsApp Bill Sharing:** Click **Share on WhatsApp**. If the customer has a mobile number entered, WhatsApp Web or WhatsApp Desktop opens immediately with an itemized digital receipt and direct UPI payment link!

---

## 4. Customer Khata (Udhar) & 1-Click WhatsApp Reminders

When customers purchase on credit or partial payment, use the **Parties & Khata** ledger:

```
+--------------------------------------------------------------------------------------------------+
| CUSTOMER LEDGER STATEMENT & AGING ANALYSIS                                                       |
+--------------------------------------------------------------------------------------------------+
| Customer: RAMESH PATEL (Phone: 98200 12345)                 Current Balance: ₹4,850.00 DR        |
| Credit Aging: [ ● 14 Days (Current 0-30d) ]   Credit Limit: ₹10,000                              |
| ------------------------------------------------------------------------------------------------ |
| Date        Voucher Type       Ref #          Debit (+Dr)       Credit (-Cr)     Running Balance |
| 28/09/2026  TAX INVOICE        INV-0019       ₹3,200.00         —                ₹3,200.00 DR    |
| 01/10/2026  PAYMENT RECEIVED   PAY-0081       —                 ₹1,500.00        ₹1,700.00 DR    |
| 04/10/2026  TAX INVOICE        INV-0038       ₹3,150.00         —                ₹4,850.00 DR    |
| ------------------------------------------------------------------------------------------------ |
| [ + Record Payment Received ]                      [ 💬 Send 1-Click WhatsApp Balance Reminder ] |
+--------------------------------------------------------------------------------------------------+
```

### Sending a WhatsApp Payment Reminder
Clicking **Send 1-Click WhatsApp Balance Reminder** opens a pre-composed message with:
1. Store Name and Greeting.
2. Exact Outstanding Balance (`₹4,850.00`).
3. Overdue Invoice references.
4. **Merchant UPI ID & Clickable UPI Intent Payment Link** (`upi://pay?pa=yourstore@upi&am=4850.00`).

---

## 5. End-of-Day Store Closure & Database Backup Guide

Before shutting down the counter at night:

```
+--------------------------------------------------------------------------------------------------+
| END-OF-DAY SAFETY CHECKLIST                                                                      |
+--------------------------------------------------------------------------------------------------+
|  [✓] STEP 1: Verify Daily Sales in Dashboard                                                     |
|      Open 'Sales' module -> Compare Total Cash Collected against physical cash in drawer.        |
|                                                                                                  |
|  [✓] STEP 2: Backup Local Database (1-Click)                                                     |
|      Copy the database file from:                                                                |
|      d:\New_ERP-main\data\unidex.db                                                              |
|      Paste it to a USB Pendrive or Google Drive folder labeled with today's date.                 |
|                                                                                                  |
|  [✓] STEP 3: Close Application Cleanly                                                           |
|      Close the browser tab, then close the terminal window running the ERP server.               |
+--------------------------------------------------------------------------------------------------+
```

---

## 6. Cashier Troubleshooting FAQ

**Q1: The barcode scanner is plugged in but not typing into Unidex.**  
*Fix:* Press <kbd>F2</kbd> or click into the search input box before scanning. Ensure your scanner is set to send an `Enter` suffix (standard default mode).

**Q2: The thermal receipt is printing blank or misaligned.**  
*Fix:* In the Thermal Modal, switch between **80mm** (standard 3-inch counter printers) and **58mm** (portable 2-inch Bluetooth printers) before clicking Print.

**Q3: Can I run Unidex if the broadband router is completely switched off?**  
*Fix:* **Yes!** Unidex is 100% offline-first. Your database runs locally on `http://localhost:5173`. No internet connection is ever required for billing, stock updates, or receipt printing.
