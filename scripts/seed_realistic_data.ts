import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SQLITE_DB_FILE = path.join(DATA_DIR, "unidex.db");
const AUDIT_LOG_FILE = path.join(DATA_DIR, "audit_trail.log");

const db = new DatabaseSync(SQLITE_DB_FILE);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

console.log("Seeding realistic retail & supermarket data...");

// 1. Realistic Products (Grocery, FMCG, Dairy, Electronics, Personal Care)
const products = [
  { id: "P101", name: "Amul Butter 500g", barcode: "8901262010125", hsnCode: "0405", gstRate: 12, costPrice: 245, sellPrice: 280, mrp: 285, stock: 45, category: "Dairy", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100&h=100&fit=crop" },
  { id: "P102", name: "Amul Taaza Milk 1L", barcode: "8901262010019", hsnCode: "0401", gstRate: 0, costPrice: 52, sellPrice: 56, mrp: 56, stock: 60, category: "Dairy", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop" },
  { id: "P103", name: "Maggi 2-Minute Noodles 70g", barcode: "8901058852331", hsnCode: "1902", gstRate: 12, costPrice: 11.5, sellPrice: 14, mrp: 14, stock: 120, category: "FMCG", image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=100&h=100&fit=crop" },
  { id: "P104", name: "Tata Salt Vacuum Evaporated 1kg", barcode: "8901030005012", hsnCode: "2501", gstRate: 0, costPrice: 22, sellPrice: 28, mrp: 28, stock: 85, category: "Grocery", image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=100&h=100&fit=crop" },
  { id: "P105", name: "Aashirvaad Shudh Chakki Atta 5kg", barcode: "8901725181223", hsnCode: "1101", gstRate: 5, costPrice: 220, sellPrice: 260, mrp: 275, stock: 35, category: "Grocery", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&h=100&fit=crop" },
  { id: "P106", name: "Fortune Sunlite Refined Oil 1L", barcode: "8906007281014", hsnCode: "1512", gstRate: 5, costPrice: 128, sellPrice: 145, mrp: 155, stock: 50, category: "Grocery", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop" },
  { id: "P107", name: "Cadbury Dairy Milk Silk 150g", barcode: "8901233024501", hsnCode: "1806", gstRate: 18, costPrice: 145, sellPrice: 180, mrp: 185, stock: 75, category: "Snacks", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100&h=100&fit=crop" },
  { id: "P108", name: "Dettol Antiseptic Liquid 550ml", barcode: "8901396321012", hsnCode: "3004", gstRate: 12, costPrice: 210, sellPrice: 255, mrp: 260, stock: 28, category: "Personal Care", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop" },
  { id: "P109", name: "Colgate MaxFresh Gel Paste 150g", barcode: "8901314010214", hsnCode: "3306", gstRate: 18, costPrice: 92, sellPrice: 115, mrp: 120, stock: 65, category: "Personal Care", image: "https://images.unsplash.com/photo-1559591937-e1032397e556?w=100&h=100&fit=crop" },
  { id: "P110", name: "Surf Excel Quick Wash Powder 1kg", barcode: "8901030381021", hsnCode: "3402", gstRate: 18, costPrice: 135, sellPrice: 165, mrp: 170, stock: 40, category: "Household", image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=100&h=100&fit=crop" },
  { id: "P111", name: "Boat Bassheads 100 Earphones", barcode: "8904123456789", hsnCode: "8518", gstRate: 18, costPrice: 280, sellPrice: 399, mrp: 499, stock: 22, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop" },
  { id: "P112", name: "SanDisk Cruzer Blade 32GB USB", barcode: "619659069208", hsnCode: "8523", gstRate: 18, costPrice: 260, sellPrice: 349, mrp: 450, stock: 18, category: "Electronics", image: "https://images.unsplash.com/photo-1624823183492-f0466a98c8c6?w=100&h=100&fit=crop" }
];

const insertProductStmt = db.prepare(`
  INSERT OR REPLACE INTO products (
    id, name, barcode, hsn_code, gst_rate, cost_price, sell_price, mrp,
    discount, discount_type, stock, category, image, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const nowIso = new Date().toISOString();
for (const p of products) {
  insertProductStmt.run(
    p.id, p.name, p.barcode, p.hsnCode, p.gstRate, p.costPrice, p.sellPrice, p.mrp,
    0, 'amount', p.stock, p.category, p.image, nowIso
  );
}

// 2. Realistic Customers & Vendors (Parties)
const parties = [
  { id: "PRT-CUST-1", name: "Ramesh Sharma (General Store)", phone: "9820112345", type: "customer", balance: 3450, gstin: "27AABCU9603R1ZM" },
  { id: "PRT-CUST-2", name: "Pooja Verma", phone: "9819098765", type: "customer", balance: 1200, gstin: "" },
  { id: "PRT-CUST-3", name: "Amit Patel (Patel Electronics)", phone: "9769012344", type: "customer", balance: 8500, gstin: "24AAECP1234B1ZV" },
  { id: "PRT-CUST-4", name: "Vikram Malhotra", phone: "9821456789", type: "customer", balance: 0, gstin: "" },
  { id: "PRT-CUST-5", name: "Sneha Kulkarni", phone: "9988776655", type: "customer", balance: 450, gstin: "" },
  { id: "PRT-VEND-1", name: "Metro Cash & Carry India", phone: "02228509999", type: "vendor", balance: -45000, gstin: "27AABCM8888F1ZQ" },
  { id: "PRT-VEND-2", name: "Hindustan Unilever Distributor", phone: "9820055443", type: "vendor", balance: -18500, gstin: "27AAACH1111A1Z9" },
  { id: "PRT-VEND-3", name: "Gujarat Co-op Milk Marketing (Amul)", phone: "9819922334", type: "vendor", balance: -12400, gstin: "24AAAAG1234A1Z1" }
];

const insertPartyStmt = db.prepare(`
  INSERT OR REPLACE INTO parties (id, name, phone, type, balance, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const party of parties) {
  insertPartyStmt.run(party.id, party.name, party.phone, party.type, party.balance, nowIso);
}

// 3. Realistic Recent Invoices with Section 170 Round-off
const invoicesData = [
  {
    id: "INV/26-27/00001",
    customer: "Ramesh Sharma (General Store)",
    customerId: "PRT-CUST-1",
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    paymentMethod: "credit",
    items: [
      { id: "P101", name: "Amul Butter 500g", price: 280, qty: 5, gstRate: 12, hsnCode: "0405" },
      { id: "P105", name: "Aashirvaad Shudh Chakki Atta 5kg", price: 260, qty: 3, gstRate: 5, hsnCode: "1101" },
      { id: "P107", name: "Cadbury Dairy Milk Silk 150g", price: 180, qty: 4, gstRate: 18, hsnCode: "1806" }
    ]
  },
  {
    id: "INV/26-27/00002",
    customer: "Pooja Verma",
    customerId: "PRT-CUST-2",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    paymentMethod: "upi",
    items: [
      { id: "P103", name: "Maggi 2-Minute Noodles 70g", price: 14, qty: 10, gstRate: 12, hsnCode: "1902" },
      { id: "P102", name: "Amul Taaza Milk 1L", price: 56, qty: 2, gstRate: 0, hsnCode: "0401" },
      { id: "P108", name: "Dettol Antiseptic Liquid 550ml", price: 255, qty: 1, gstRate: 12, hsnCode: "3004" }
    ]
  },
  {
    id: "INV/26-27/00003",
    customer: "Walk-in Cash Customer",
    customerId: null,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    paymentMethod: "cash",
    items: [
      { id: "P104", name: "Tata Salt Vacuum Evaporated 1kg", price: 28, qty: 2, gstRate: 0, hsnCode: "2501" },
      { id: "P106", name: "Fortune Sunlite Refined Oil 1L", price: 145, qty: 2, gstRate: 5, hsnCode: "1512" },
      { id: "P110", name: "Surf Excel Quick Wash Powder 1kg", price: 165, qty: 1, gstRate: 18, hsnCode: "3402" }
    ]
  },
  {
    id: "INV/26-27/00004",
    customer: "Amit Patel (Patel Electronics)",
    customerId: "PRT-CUST-3",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    paymentMethod: "credit",
    items: [
      { id: "P111", name: "Boat Bassheads 100 Earphones", price: 399, qty: 10, gstRate: 18, hsnCode: "8518" },
      { id: "P112", name: "SanDisk Cruzer Blade 32GB USB", price: 349, qty: 10, gstRate: 18, hsnCode: "8523" }
    ]
  },
  {
    id: "INV/26-27/00005",
    customer: "Vikram Malhotra",
    customerId: "PRT-CUST-4",
    date: new Date().toISOString(),
    paymentMethod: "upi",
    items: [
      { id: "P101", name: "Amul Butter 500g", price: 280, qty: 2, gstRate: 12, hsnCode: "0405" },
      { id: "P107", name: "Cadbury Dairy Milk Silk 150g", price: 180, qty: 3, gstRate: 18, hsnCode: "1806" }
    ]
  }
];

const insertInvoiceStmt = db.prepare(`
  INSERT OR REPLACE INTO invoices (
    id, date, customer, customer_id, subtotal, tax, round_off, total,
    gst_type, payment_method, items_json, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLedgerStmt = db.prepare(`
  INSERT OR REPLACE INTO ledger_entries (
    id, party_id, date, type, debit, credit, balance, reference_id, payment_mode, notes, created_by, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const inv of invoicesData) {
  let subtotal = 0;
  let totalTax = 0;

  for (const item of inv.items) {
    const itemSubtotal = item.price * item.qty;
    const taxRate = item.gstRate ?? 18;
    const itemTax = (itemSubtotal * taxRate) / 100;
    subtotal += itemSubtotal;
    totalTax += itemTax;
  }

  const unroundedTotal = subtotal + totalTax;
  const roundedTotal = Math.round(unroundedTotal);
  const roundOff = +(roundedTotal - unroundedTotal).toFixed(2);

  insertInvoiceStmt.run(
    inv.id, inv.date, inv.customer, inv.customerId, subtotal, totalTax, roundOff, roundedTotal,
    'GST', inv.paymentMethod, JSON.stringify(inv.items), 'admin'
  );

  // If credit invoice, insert into ledger
  if (inv.paymentMethod === 'credit' && inv.customerId) {
    insertLedgerStmt.run(
      `LED-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      inv.customerId,
      inv.date,
      'INVOICE',
      roundedTotal,
      0,
      roundedTotal,
      inv.id,
      null,
      `Credit Tax Invoice #${inv.id}`,
      'admin',
      inv.date
    );
  }
}

// 4. Realistic Procurement Purchases
const purchases = [
  {
    id: "PUR-2026-001",
    vendor: { name: "Metro Cash & Carry India", phone: "02228509999" },
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    total: 35000,
    items: [
      { id: "P105", name: "Aashirvaad Shudh Chakki Atta 5kg", qty: 50, costPrice: 220 },
      { id: "P106", name: "Fortune Sunlite Refined Oil 1L", qty: 60, costPrice: 128 },
      { id: "P104", name: "Tata Salt 1kg", qty: 100, costPrice: 22 }
    ]
  },
  {
    id: "PUR-2026-002",
    vendor: { name: "Gujarat Co-op Milk Marketing (Amul)", phone: "9819922334" },
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    total: 21500,
    items: [
      { id: "P101", name: "Amul Butter 500g", qty: 60, costPrice: 245 },
      { id: "P102", name: "Amul Taaza Milk 1L", qty: 100, costPrice: 52 }
    ]
  }
];

const insertPurchaseStmt = db.prepare(`
  INSERT OR REPLACE INTO purchases (id, date, vendor_json, total, items_json)
  VALUES (?, ?, ?, ?, ?)
`);

for (const p of purchases) {
  insertPurchaseStmt.run(
    p.id, p.date, JSON.stringify(p.vendor), p.total, JSON.stringify(p.items)
  );
}

// 5. Update Sequence Number
db.prepare(`
  INSERT OR REPLACE INTO invoice_sequence (fy, next_number)
  VALUES ('2026-27', 6)
`).run();

// 6. Realistic Store Settings
db.prepare(`
  INSERT OR REPLACE INTO settings (key, value_json)
  VALUES ('company', ?)
`).run(JSON.stringify({
  businessName: "SHREE BALAJI SUPERMARKET & PROVISION",
  upiId: "balajimart@icici",
  gstNumber: "27AABCS1429B1Z8",
  address: "Shop No. 4-5, Shanti Niketan Complex, Station Road, Mumbai 400001",
  phone: "+91 98200 12345"
}));

console.log("Realistic retail seed completed successfully!");
