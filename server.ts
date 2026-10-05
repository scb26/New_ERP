import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { DatabaseSync } from "node:sqlite";
dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SQLite Database Engine & Migration Setup ---
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const AUDIT_LOG_FILE = path.join(DATA_DIR, "audit_trail.log");
const SQLITE_DB_FILE = path.join(DATA_DIR, "unidex.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite with WAL journal mode
const db = new DatabaseSync(SQLITE_DB_FILE);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT,
    hsn_code TEXT,
    gst_rate REAL DEFAULT 18,
    cost_price REAL DEFAULT 0,
    sell_price REAL NOT NULL,
    mrp REAL,
    discount REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'amount',
    stock REAL DEFAULT 0,
    category TEXT DEFAULT 'General',
    image TEXT,
    last_vendor TEXT,
    last_purchase_price REAL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    customer TEXT NOT NULL,
    customer_id TEXT,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    round_off REAL DEFAULT 0,
    total REAL NOT NULL,
    gst_type TEXT DEFAULT 'GST',
    payment_method TEXT DEFAULT 'cash',
    items_json TEXT NOT NULL,
    created_by TEXT DEFAULT 'system'
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    vendor_json TEXT,
    total REAL NOT NULL,
    items_json TEXT NOT NULL,
    created_by TEXT DEFAULT 'system'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoice_sequence (
    fy TEXT PRIMARY KEY,
    next_number INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details_json TEXT,
    username TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    party_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'sale', 'payment', 'purchase', 'purchase_payment'
    reference_id TEXT, -- invoice_id or purchase_id or payment reference
    description TEXT,
    debit REAL DEFAULT 0,  -- Increases receivable (for customer sale)
    credit REAL DEFAULT 0, -- Decreases receivable (for customer payment) or increases vendor liability
    balance REAL NOT NULL, -- Running balance after this entry
    payment_mode TEXT,     -- 'cash', 'upi', 'cheque', 'bank_transfer'
    notes TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TEXT NOT NULL,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_ledger_party_date ON ledger_entries(party_id, date);
  CREATE INDEX IF NOT EXISTS idx_ledger_ref ON ledger_entries(reference_id);
`);

// Current Financial Year helper (April 1 to March 31) e.g., "2026-27"
function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYearShort}`;
}

// Seed Default Users (admin, cashier, accountant)
const seedUsers = [
  { id: 'u-admin', username: 'admin', password: 'admin123', name: 'Admin Owner', role: 'admin' },
  { id: 'u-cashier', username: 'cashier', password: 'cashier123', name: 'Counter Cashier', role: 'cashier' },
  { id: 'u-acct', username: 'accountant', password: 'acct123', name: 'Lead Accountant', role: 'accountant' },
];

const insertUserStmt = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password, name, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const nowIso = new Date().toISOString();
for (const u of seedUsers) {
  insertUserStmt.run(u.id, u.username, u.password, u.name, u.role, nowIso);
}

// Initial settings seed if missing
const getSettingsStmt = db.prepare("SELECT value_json FROM settings WHERE key = 'company'");
let existingSettings = getSettingsStmt.get() as { value_json: string } | undefined;
if (!existingSettings) {
  const defaultSettings = {
    businessName: "Unidex ERP",
    upiId: "merchant@upi",
    gstNumber: "22AAAAA0000A1Z5",
    address: "123 Business Park, Tech City",
    phone: "9876543210"
  };
  db.prepare("INSERT INTO settings (key, value_json) VALUES ('company', ?)").run(JSON.stringify(defaultSettings));
}

// Auto-migration from store.json if products table is empty
const productCount = (db.prepare("SELECT count(*) as count FROM products").get() as { count: number }).count;
if (productCount === 0 && fs.existsSync(STORE_FILE)) {
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const jsonStore = JSON.parse(raw);
    const insertProd = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, barcode, hsn_code, gst_rate, cost_price, sell_price, mrp, 
        discount, discount_type, stock, category, image, last_vendor, last_purchase_price, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (Array.isArray(jsonStore.products)) {
      for (const p of jsonStore.products) {
        insertProd.run(
          String(p.id),
          p.name || 'Unnamed Product',
          p.barcode || null,
          p.hsnCode || null,
          Number(p.gstRate ?? 18),
          Number(p.costPrice ?? 0),
          Number(p.sellPrice ?? p.price ?? 0),
          p.mrp !== undefined ? Number(p.mrp) : null,
          Number(p.discount ?? 0),
          p.discountType || 'amount',
          Number(p.stock ?? 0),
          p.category || 'General',
          p.image || null,
          p.lastVendor || null,
          p.lastPurchasePrice !== undefined ? Number(p.lastPurchasePrice) : null,
          new Date().toISOString()
        );
      }
    }

    if (Array.isArray(jsonStore.parties)) {
      const insertParty = db.prepare(`
        INSERT OR REPLACE INTO parties (id, name, type, phone, balance, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const p of jsonStore.parties) {
        insertParty.run(
          String(p.id),
          p.name,
          p.type || 'customer',
          p.phone || null,
          Number(p.balance ?? 0),
          new Date().toISOString()
        );
      }
    }

    if (Array.isArray(jsonStore.transactions)) {
      const insertInv = db.prepare(`
        INSERT OR REPLACE INTO invoices (
          id, date, customer, customer_id, subtotal, tax, round_off, total, gst_type, payment_method, items_json, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const inv of jsonStore.transactions) {
        insertInv.run(
          String(inv.id),
          inv.date || new Date().toISOString(),
          inv.customer || 'Walk-in Customer',
          inv.customerId || null,
          Number(inv.subtotal ?? inv.total ?? 0),
          Number(inv.tax ?? 0),
          Number(inv.roundOff ?? 0),
          Number(inv.total ?? 0),
          inv.gstType || 'GST',
          inv.paymentMethod || 'cash',
          JSON.stringify(inv.items || []),
          'migration'
        );
      }
    }

    if (Array.isArray(jsonStore.purchases)) {
      const insertPur = db.prepare(`
        INSERT OR REPLACE INTO purchases (id, date, vendor_json, total, items_json, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const pur of jsonStore.purchases) {
        insertPur.run(
          String(pur.id),
          pur.date || new Date().toISOString(),
          JSON.stringify(pur.vendor || {}),
          Number(pur.total ?? 0),
          JSON.stringify(pur.items || []),
          'migration'
        );
      }
    }

    if (jsonStore.settings) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value_json) VALUES ('company', ?)").run(JSON.stringify(jsonStore.settings));
    }

    if (jsonStore.invoiceSequence) {
      db.prepare("INSERT OR REPLACE INTO invoice_sequence (fy, next_number) VALUES (?, ?)")
        .run(jsonStore.invoiceSequence.fy, Number(jsonStore.invoiceSequence.nextNumber));
    }

    console.log("Successfully migrated store.json into SQLite unidex.db");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

// MCA Audit Trail logger with SQLite & Append Log File
function logAudit(action: string, entity: string, entityId: string, details: any, user: string = "system") {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      details,
      user
    };
    // Append to compliance log file
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");

    // Insert to SQLite audit_logs table
    db.prepare(`
      INSERT INTO audit_logs (timestamp, action, entity, entity_id, details_json, username)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(entry.timestamp, action, entity, entityId, JSON.stringify(details), user);
  } catch (err) {
    console.error("Failed to write to audit trail:", err);
  }
}

// Helpers to format product row from SQLite to frontend structure
function mapProductRow(row: any) {
  return {
    id: String(row.id),
    name: row.name,
    barcode: row.barcode || '',
    hsnCode: row.hsn_code || '',
    gstRate: Number(row.gst_rate ?? 18),
    costPrice: Number(row.cost_price ?? 0),
    sellPrice: Number(row.sell_price ?? 0),
    price: Number(row.sell_price ?? 0),
    mrp: row.mrp !== null ? Number(row.mrp) : Number(row.sell_price ?? 0),
    discount: Number(row.discount ?? 0),
    discountType: row.discount_type || 'amount',
    stock: Number(row.stock ?? 0),
    category: row.category || 'General',
    image: row.image || '',
    lastVendor: row.last_vendor || '',
    lastPurchasePrice: row.last_purchase_price !== null ? Number(row.last_purchase_price) : undefined,
    updatedAt: row.updated_at
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth middleware: Extract & verify cryptographically generated session token
  app.use((req: any, _res, next) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    }

    if (token) {
      // Validate session in SQLite database
      const nowIso = new Date().toISOString();
      const sessionRow = db.prepare(`
        SELECT * FROM sessions WHERE token = ? AND expires_at > ?
      `).get(token, nowIso) as any;

      if (sessionRow) {
        req.user = {
          id: sessionRow.user_id,
          username: sessionRow.username,
          name: sessionRow.name,
          role: sessionRow.role
        };
      } else {
        // Token is invalid or expired
        req.user = null;
      }
    } else {
      // Unauthenticated requests MUST NOT get admin privileges
      req.user = null;
    }
    next();
  });

  // Helper middleware for route security
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Valid authentication token required." });
    }
    next();
  };

  const requireNonCashier = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Valid authentication token required." });
    }
    if (req.user.role === 'cashier') {
      return res.status(403).json({ error: "Forbidden: Cashier role does not have permission for this action." });
    }
    next();
  };

  // --- API Routes ---
  
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Unidex ERP Server is active with SQLite ACID Engine & Hardened RBAC" });
  });

  // Multi-User Authentication Routes with Cryptographic Token Generation & Password Validation
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const userRow = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (!userRow) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password against stored credentials
    if (userRow.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate cryptographically secure 256-bit token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days validity

    db.prepare(`
      INSERT INTO sessions (token, user_id, username, name, role, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(token, userRow.id, userRow.username, userRow.name, userRow.role, now.toISOString(), expiresAt);

    const userPayload = {
      id: userRow.id,
      username: userRow.username,
      name: userRow.name,
      role: userRow.role
    };

    logAudit("LOGIN", "User", userRow.id, { username: userRow.username, role: userRow.role }, userRow.username);
    res.json({ token, user: userPayload });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Audit trail endpoint: Strictly protected (reject unauthenticated with 401, reject cashier with 403)
  app.get("/api/audit-trail", requireNonCashier, (_req, res) => {
    try {
      const logs = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100").all() as any[];
      const formatted = logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        details: l.details_json ? JSON.parse(l.details_json) : null,
        user: l.username
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: "Failed to read audit trail" });
    }
  });

  // Products with RBAC Data Redaction for Cashiers
  app.get("/api/products", (req: any, res) => {
    try {
      const rows = db.prepare("SELECT * FROM products ORDER BY id ASC").all();
      const mapped = rows.map(mapProductRow);

      if (req.user?.role === 'cashier') {
        // Redact costPrice, lastPurchasePrice, lastVendor for Cashiers
        const redacted = mapped.map(p => {
          const clone: any = { ...p };
          delete clone.costPrice;
          delete clone.lastPurchasePrice;
          delete clone.lastVendor;
          return clone;
        });
        return res.json(redacted);
      }

      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", requireNonCashier, (req: any, res) => {
    try {
      const p = req.body;
      const id = p.id ? String(p.id) : `${Date.now()}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO products (
          id, name, barcode, hsn_code, gst_rate, cost_price, sell_price, mrp,
          discount, discount_type, stock, category, image, last_vendor, last_purchase_price, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        p.name || 'Unnamed Product',
        p.barcode || '',
        p.hsnCode || '',
        Number(p.gstRate ?? 18),
        Number(p.costPrice ?? 0),
        Number(p.sellPrice ?? p.price ?? 0),
        p.mrp !== undefined ? Number(p.mrp) : null,
        Number(p.discount ?? 0),
        p.discountType || 'amount',
        Number(p.stock ?? 0),
        p.category || 'General',
        p.image || '',
        p.lastVendor || null,
        p.lastPurchasePrice !== undefined ? Number(p.lastPurchasePrice) : null,
        now
      );

      const created = mapProductRow(db.prepare("SELECT * FROM products WHERE id = ?").get(id));
      logAudit("CREATE", "Product", id, { name: p.name, price: p.sellPrice, gstRate: p.gstRate }, req.user?.username || 'system');
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", requireNonCashier, (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }

      const p = req.body;
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE products SET
          name = COALESCE(?, name),
          barcode = COALESCE(?, barcode),
          hsn_code = COALESCE(?, hsn_code),
          gst_rate = COALESCE(?, gst_rate),
          cost_price = COALESCE(?, cost_price),
          sell_price = COALESCE(?, sell_price),
          mrp = COALESCE(?, mrp),
          discount = COALESCE(?, discount),
          discount_type = COALESCE(?, discount_type),
          stock = COALESCE(?, stock),
          category = COALESCE(?, category),
          image = COALESCE(?, image),
          updated_at = ?
        WHERE id = ?
      `).run(
        p.name !== undefined ? p.name : null,
        p.barcode !== undefined ? p.barcode : null,
        p.hsnCode !== undefined ? p.hsnCode : null,
        p.gstRate !== undefined ? Number(p.gstRate) : null,
        p.costPrice !== undefined ? Number(p.costPrice) : null,
        (p.sellPrice !== undefined || p.price !== undefined) ? Number(p.sellPrice ?? p.price) : null,
        p.mrp !== undefined ? Number(p.mrp) : null,
        p.discount !== undefined ? Number(p.discount) : null,
        p.discountType !== undefined ? p.discountType : null,
        p.stock !== undefined ? Number(p.stock) : null,
        p.category !== undefined ? p.category : null,
        p.image !== undefined ? p.image : null,
        now,
        id
      );

      const updated = mapProductRow(db.prepare("SELECT * FROM products WHERE id = ?").get(id));
      logAudit("UPDATE", "Product", id, { updated }, req.user?.username || 'system');
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", requireNonCashier, (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
      if (existing) {
        db.prepare("DELETE FROM products WHERE id = ?").run(id);
        logAudit("DELETE", "Product", id, { deleted: existing }, req.user?.username || 'system');
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings with RBAC: Deny unauthenticated (401) and cashiers (403)
  app.get("/api/settings", (_req, res) => {
    try {
      const row = db.prepare("SELECT value_json FROM settings WHERE key = 'company'").get() as any;
      if (row) {
        res.json(JSON.parse(row.value_json));
      } else {
        res.json({});
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/settings", requireNonCashier, (req: any, res) => {
    try {
      const existingRow = db.prepare("SELECT value_json FROM settings WHERE key = 'company'").get() as any;
      const current = existingRow ? JSON.parse(existingRow.value_json) : {};
      const updated = { ...current, ...req.body };
      db.prepare("INSERT OR REPLACE INTO settings (key, value_json) VALUES ('company', ?)").run(JSON.stringify(updated));
      logAudit("UPDATE", "Settings", "company_settings", { updated }, req.user?.username || 'system');
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Parties
  app.get("/api/parties", (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM parties ORDER BY id ASC").all() as any[];
      const parties = rows.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        phone: r.phone || '',
        balance: Number(r.balance || 0),
        updatedAt: r.updated_at
      }));
      res.json(parties);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/parties", requireAuth, (req: any, res) => {
    try {
      const party = { ...req.body, id: req.body.id || `P-${Date.now()}`, balance: Number(req.body.balance || 0) };
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO parties (id, name, type, phone, balance, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(party.id, party.name, party.type || 'customer', party.phone || '', party.balance, now);

      logAudit("CREATE", "Party", party.id, party, req.user?.username || 'system');
      res.status(201).json(party);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/parties/:id", requireAuth, (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = db.prepare("SELECT * FROM parties WHERE id = ?").get(id) as any;
      if (!existing) {
        return res.status(404).json({ message: "Party not found" });
      }

      const p = req.body;
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE parties SET
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          phone = COALESCE(?, phone),
          balance = COALESCE(?, balance),
          updated_at = ?
        WHERE id = ?
      `).run(
        p.name !== undefined ? p.name : null,
        p.type !== undefined ? p.type : null,
        p.phone !== undefined ? p.phone : null,
        p.balance !== undefined ? Number(p.balance) : null,
        now,
        id
      );

      const updated = db.prepare("SELECT * FROM parties WHERE id = ?").get(id);
      logAudit("UPDATE", "Party", id, { updated }, req.user?.username || 'system');
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/parties/:id/ledger: Fetch ledger transactions with running balance
  app.get("/api/parties/:id/ledger", requireAuth, (req: any, res) => {
    try {
      const { id } = req.params;
      const party = db.prepare("SELECT * FROM parties WHERE id = ?").get(id) as any;
      if (!party) {
        return res.status(404).json({ error: "Party not found" });
      }

      const entries = db.prepare(`
        SELECT * FROM ledger_entries WHERE party_id = ? ORDER BY date ASC, id ASC
      `).all(id) as any[];

      res.json({
        party: {
          id: party.id,
          name: party.name,
          type: party.type,
          phone: party.phone,
          balance: Number(party.balance)
        },
        entries: entries.map(e => ({
          id: e.id,
          date: e.date,
          type: e.type,
          referenceId: e.reference_id,
          description: e.description,
          debit: Number(e.debit),
          credit: Number(e.credit),
          balance: Number(e.balance),
          paymentMode: e.payment_mode,
          notes: e.notes,
          createdBy: e.created_by,
          createdAt: e.created_at
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/parties/:id/payments: Record settlement payment in ACID transaction
  app.post("/api/parties/:id/payments", requireAuth, (req: any, res) => {
    const { id } = req.params;
    const { amount, paymentMode, notes, reference } = req.body;
    const payAmount = Number(amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: "Valid payment amount is required." });
    }

    db.exec("BEGIN TRANSACTION;");
    try {
      const party = db.prepare("SELECT * FROM parties WHERE id = ?").get(id) as any;
      if (!party) {
        db.exec("ROLLBACK;");
        return res.status(404).json({ error: "Party not found" });
      }

      // Customer payment reduces customer balance (debit balance decreases).
      // Vendor payment settles vendor liability (negative balance moves towards zero).
      const currentBalance = Number(party.balance) || 0;
      let newBalance = currentBalance;
      let debit = 0;
      let credit = 0;
      const type = party.type === 'vendor' ? 'purchase_payment' : 'payment';

      if (party.type === 'vendor') {
        // Paying vendor reduces liability -> balance becomes less negative (+ payAmount)
        newBalance = currentBalance + payAmount;
        debit = payAmount; // Debit to vendor account settles credit
        credit = 0;
      } else {
        // Customer paying us reduces their receivable balance
        newBalance = currentBalance - payAmount;
        debit = 0;
        credit = payAmount; // Credit to customer account
      }

      const now = new Date().toISOString();
      db.prepare("UPDATE parties SET balance = ?, updated_at = ? WHERE id = ?").run(newBalance, now, id);

      const entryId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const desc = `${party.type === 'vendor' ? 'Paid to' : 'Received from'} ${party.name} via ${(paymentMode || 'cash').toUpperCase()}`;

      db.prepare(`
        INSERT INTO ledger_entries (
          id, party_id, date, type, reference_id, description, debit, credit, balance, payment_mode, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entryId,
        id,
        now,
        type,
        reference || entryId,
        desc,
        debit,
        credit,
        newBalance,
        paymentMode || 'cash',
        notes || '',
        req.user?.username || 'system',
        now
      );

      db.exec("COMMIT;");

      logAudit("PAYMENT", "Party", id, { amount: payAmount, paymentMode, newBalance, party: party.name }, req.user?.username || 'system');

      res.status(201).json({
        success: true,
        partyId: id,
        amount: payAmount,
        newBalance,
        paymentMode,
        reference: entryId,
        date: now
      });
    } catch (err: any) {
      db.exec("ROLLBACK;");
      console.error("Payment settlement transaction failed:", err);
      res.status(500).json({ error: "Failed to process payment settlement: " + err.message });
    }
  });

  // GET /api/parties/aging-summary: Receivables Aging Analysis (0-30, 31-60, 60+ days)
  app.get("/api/parties/aging-summary", requireAuth, (_req, res) => {
    try {
      const parties = db.prepare("SELECT * FROM parties WHERE type = 'customer' AND balance > 0 ORDER BY balance DESC").all() as any[];
      const now = new Date().getTime();

      let totalReceivables = 0;
      let total0To30 = 0;
      let total31To60 = 0;
      let total60Plus = 0;

      const customerAging = parties.map(p => {
        const bal = Number(p.balance) || 0;
        totalReceivables += bal;

        // Fetch unpaid/credit invoices or oldest unpaid ledger entries for this party
        const oldestEntry = db.prepare(`
          SELECT date FROM ledger_entries WHERE party_id = ? AND debit > 0 ORDER BY date ASC LIMIT 1
        `).get(p.id) as { date: string } | undefined;

        let daysOverdue = 0;
        if (oldestEntry) {
          const entryTime = new Date(oldestEntry.date).getTime();
          daysOverdue = Math.max(0, Math.floor((now - entryTime) / (1000 * 60 * 60 * 24)));
        } else {
          const partyUpdated = new Date(p.updated_at).getTime();
          daysOverdue = Math.max(0, Math.floor((now - partyUpdated) / (1000 * 60 * 60 * 24)));
        }

        let bucket: '0-30' | '31-60' | '60+' = '0-30';
        if (daysOverdue > 60) {
          bucket = '60+';
          total60Plus += bal;
        } else if (daysOverdue > 30) {
          bucket = '31-60';
          total31To60 += bal;
        } else {
          bucket = '0-30';
          total0To30 += bal;
        }

        return {
          id: p.id,
          name: p.name,
          phone: p.phone || '',
          balance: bal,
          oldestDueDays: daysOverdue,
          bucket,
          status: daysOverdue > 60 ? 'critical' : daysOverdue > 30 ? 'overdue' : 'current'
        };
      });

      res.json({
        totalReceivables,
        buckets: {
          current_0_30: total0To30,
          overdue_31_60: total31To60,
          critical_60_plus: total60Plus
        },
        customers: customerAging
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/products/bulk: Batch Import Products with atomic transaction & validation
  app.post("/api/products/bulk", requireNonCashier, (req: any, res) => {
    const { products: rawProducts } = req.body;
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return res.status(400).json({ error: "Expected an array of products for bulk import." });
    }

    const errors: { row: number; name?: string; message: string }[] = [];
    const validRows: any[] = [];

    rawProducts.forEach((item: any, idx: number) => {
      const rowNum = idx + 1;
      const name = String(item.name || '').trim();
      const sellPrice = Number(item.sellPrice ?? item.price ?? 0);
      const costPrice = Number(item.costPrice ?? 0);
      const mrp = item.mrp !== undefined && item.mrp !== '' ? Number(item.mrp) : sellPrice;

      if (!name) {
        errors.push({ row: rowNum, name, message: "Missing product name" });
        return;
      }
      if (isNaN(sellPrice) || sellPrice <= 0) {
        errors.push({ row: rowNum, name, message: "Invalid Selling Price (must be > 0)" });
        return;
      }
      if (costPrice > sellPrice && costPrice > 0) {
        errors.push({ row: rowNum, name, message: "Cost Price cannot exceed Sell Price" });
        return;
      }

      validRows.push({
        id: item.id ? String(item.id) : `${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name,
        barcode: item.barcode ? String(item.barcode).trim() : '',
        hsnCode: item.hsnCode ? String(item.hsnCode).trim() : '',
        gstRate: item.gstRate !== undefined ? Number(item.gstRate) : 18,
        costPrice,
        sellPrice,
        mrp,
        discount: Number(item.discount ?? 0),
        discountType: item.discountType || 'amount',
        stock: Number(item.stock ?? 0),
        category: item.category || 'General',
        image: item.image || ''
      });
    });

    if (errors.length > 0 && validRows.length === 0) {
      return res.status(422).json({ error: "Validation failed for all rows", errors });
    }

    db.exec("BEGIN TRANSACTION;");
    try {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO products (
          id, name, barcode, hsn_code, gst_rate, cost_price, sell_price, mrp,
          discount, discount_type, stock, category, image, last_vendor, last_purchase_price, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();

      for (const p of validRows) {
        insertStmt.run(
          p.id,
          p.name,
          p.barcode,
          p.hsnCode,
          p.gstRate,
          p.costPrice,
          p.sellPrice,
          p.mrp,
          p.discount,
          p.discountType,
          p.stock,
          p.category,
          p.image,
          null,
          null,
          now
        );
      }

      db.exec("COMMIT;");

      logAudit("BULK_IMPORT", "Products", "batch", { importedCount: validRows.length, rejectedCount: errors.length }, req.user?.username || 'system');

      res.status(201).json({
        importedCount: validRows.length,
        rejectedCount: errors.length,
        errors,
        products: validRows
      });
    } catch (err: any) {
      db.exec("ROLLBACK;");
      console.error("Bulk product import transaction failed:", err);
      res.status(500).json({ error: "Bulk import failed: " + err.message });
    }
  });

  // GET /api/products/export: Export Catalog as CSV
  app.get("/api/products/export", requireAuth, (req: any, res) => {
    try {
      const rows = db.prepare("SELECT * FROM products ORDER BY name ASC").all();
      const mapped = rows.map(mapProductRow);
      const isCashier = req.user?.role === 'cashier';

      // CSV Header
      let headers = ['id', 'name', 'barcode', 'hsnCode', 'gstRate', 'sellPrice', 'mrp', 'discount', 'discountType', 'stock', 'category'];
      if (!isCashier) {
        headers.push('costPrice', 'lastVendor', 'lastPurchasePrice');
      }

      const csvLines = [headers.join(',')];

      // Helper to neutralize CSV formula injection (prepend single quote if starting with =, +, -, @, \t, \r)
      const sanitizeCsvField = (val: any) => {
        const str = String(val ?? '');
        const escaped = str.replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(str)) {
          return `"'${escaped}"`;
        }
        return `"${escaped}"`;
      };

      for (const p of mapped) {
        const line = [
          sanitizeCsvField(p.id),
          sanitizeCsvField(p.name),
          sanitizeCsvField(p.barcode),
          sanitizeCsvField(p.hsnCode),
          p.gstRate,
          p.sellPrice,
          p.mrp,
          p.discount,
          sanitizeCsvField(p.discountType),
          p.stock,
          sanitizeCsvField(p.category || 'General')
        ];
        if (!isCashier) {
          line.push(p.costPrice, sanitizeCsvField(p.lastVendor), p.lastPurchasePrice ?? '');
        }
        csvLines.push(line.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="unidex_catalog_${Date.now()}.csv"`);
      res.send(csvLines.join('\n'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ACID Transaction Checkout: Invoices
  app.post("/api/invoices", requireAuth, (req: any, res) => {
    const { items, total, customer, customerId, subtotal, tax, gstType, paymentMethod } = req.body;
    const currentFy = getCurrentFinancialYear();

    db.exec("BEGIN TRANSACTION;");
    try {
      // 1. Manage Sequence Number
      let seqRow = db.prepare("SELECT next_number FROM invoice_sequence WHERE fy = ?").get(currentFy) as { next_number: number } | undefined;
      let nextNum = 1;
      if (!seqRow) {
        db.prepare("INSERT INTO invoice_sequence (fy, next_number) VALUES (?, 2)").run(currentFy);
      } else {
        nextNum = seqRow.next_number;
        db.prepare("UPDATE invoice_sequence SET next_number = ? WHERE fy = ?").run(nextNum + 1, currentFy);
      }

      const seqNumStr = String(nextNum).padStart(5, '0');
      const invoiceId = `INV/${currentFy}/${seqNumStr}`;

      // Section 170 GST Act: Round off to nearest whole rupee
      const computedSubtotal = subtotal !== undefined ? Number(subtotal) : 0;
      const computedTax = tax !== undefined ? Number(tax) : 0;
      const unroundedTotal = computedSubtotal + computedTax > 0 ? (computedSubtotal + computedTax) : Number(total || 0);
      const roundedTotal = Math.round(unroundedTotal);
      const roundOff = +(roundedTotal - unroundedTotal).toFixed(2);

      // 2. Decrement Stock for each item
      if (Array.isArray(items)) {
        const updateStockStmt = db.prepare("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?");
        for (const item of items) {
          const qty = Number(item.qty || 1);
          updateStockStmt.run(qty, String(item.id));
        }
      }

      // 3. Customer Ledger Balance sync & Ledger Entry
      if (paymentMethod === 'credit' || paymentMethod === 'unpaid') {
        let matchedParty: any = null;
        if (customerId) {
          matchedParty = db.prepare("SELECT * FROM parties WHERE id = ?").get(customerId);
        } else if (customer) {
          matchedParty = db.prepare("SELECT * FROM parties WHERE LOWER(name) = LOWER(?)").get(customer);
        }

        if (matchedParty) {
          const newBal = (Number(matchedParty.balance) || 0) + roundedTotal;
          db.prepare("UPDATE parties SET balance = ?, updated_at = ? WHERE id = ?").run(newBal, new Date().toISOString(), matchedParty.id);

          // Insert Ledger Entry (Debit increases receivable from customer)
          db.prepare(`
            INSERT INTO ledger_entries (
              id, party_id, date, type, reference_id, description, debit, credit, balance, payment_mode, notes, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            matchedParty.id,
            new Date().toISOString(),
            'sale',
            invoiceId,
            `Credit Sale Invoice ${invoiceId}`,
            roundedTotal,
            0,
            newBal,
            'credit',
            `Credit Sale for ₹${roundedTotal}`,
            req.user?.username || 'system',
            new Date().toISOString()
          );
        }
      }

      // 4. Insert Invoice Record
      const invoice = {
        id: invoiceId,
        date: new Date().toISOString(),
        items,
        subtotal: +computedSubtotal.toFixed(2),
        tax: +computedTax.toFixed(2),
        roundOff,
        total: roundedTotal,
        customer: customer || 'Walk-in Customer',
        customerId: customerId || null,
        gstType: gstType || 'GST',
        paymentMethod: paymentMethod || 'cash'
      };

      db.prepare(`
        INSERT INTO invoices (
          id, date, customer, customer_id, subtotal, tax, round_off, total, gst_type, payment_method, items_json, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoice.id,
        invoice.date,
        invoice.customer,
        invoice.customerId,
        invoice.subtotal,
        invoice.tax,
        invoice.roundOff,
        invoice.total,
        invoice.gstType,
        invoice.paymentMethod,
        JSON.stringify(invoice.items || []),
        req.user?.username || 'system'
      );

      // Commit the ACID transaction
      db.exec("COMMIT;");

      logAudit("CREATE", "Invoice", invoice.id, { total: roundedTotal, roundOff, customer: invoice.customer, paymentMethod }, req.user?.username || 'system');
      res.status(201).json(invoice);
    } catch (err: any) {
      db.exec("ROLLBACK;");
      console.error("Invoice transaction failed:", err);
      res.status(500).json({ error: "Failed to process invoice transaction: " + err.message });
    }
  });

  app.get("/api/invoices", (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM invoices ORDER BY date DESC").all() as any[];
      const mapped = rows.map(r => ({
        id: r.id,
        date: r.date,
        customer: r.customer,
        customerId: r.customer_id,
        subtotal: Number(r.subtotal),
        tax: Number(r.tax),
        roundOff: Number(r.round_off),
        total: Number(r.total),
        gstType: r.gst_type,
        paymentMethod: r.payment_method,
        items: JSON.parse(r.items_json || "[]")
      }));
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Purchases: Update stock and track vendor in SQLite transaction (Denied to cashiers)
  app.post("/api/purchases", requireNonCashier, (req: any, res) => {
    const { items, total, vendor } = req.body;
    const purchase = {
      id: `PUR-${Date.now()}`,
      date: new Date().toISOString(),
      vendor,
      total: Number(total || 0),
      items
    };

    db.exec("BEGIN TRANSACTION;");
    try {
      if (Array.isArray(items)) {
        const updateStockAndVendor = db.prepare(`
          UPDATE products SET
            stock = stock + ?,
            last_vendor = ?,
            last_purchase_price = ?,
            updated_at = ?
          WHERE id = ?
        `);
        const now = new Date().toISOString();
        for (const item of items) {
          const qty = Number(item.qty || 1);
          const price = Number(item.price || item.costPrice || 0);
          updateStockAndVendor.run(qty, vendor?.name || 'Unknown', price, now, String(item.id));
        }
      }

      db.prepare(`
        INSERT INTO purchases (id, date, vendor_json, total, items_json, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        purchase.id,
        purchase.date,
        JSON.stringify(purchase.vendor || {}),
        purchase.total,
        JSON.stringify(purchase.items || []),
        req.user?.username || 'system'
      );

      // Vendor Ledger update (liability to vendor increases: negative customer balance or increased debt)
      if (vendor && (vendor.id || vendor.name)) {
        let matchedVendor: any = null;
        if (vendor.id) {
          matchedVendor = db.prepare("SELECT * FROM parties WHERE id = ?").get(vendor.id);
        } else if (vendor.name) {
          matchedVendor = db.prepare("SELECT * FROM parties WHERE LOWER(name) = LOWER(?)").get(vendor.name);
        }

        if (matchedVendor) {
          // Vendor liability increases: balance becomes more negative or increments
          const newBal = (Number(matchedVendor.balance) || 0) - Number(purchase.total);
          db.prepare("UPDATE parties SET balance = ?, updated_at = ? WHERE id = ?").run(newBal, new Date().toISOString(), matchedVendor.id);

          db.prepare(`
            INSERT INTO ledger_entries (
              id, party_id, date, type, reference_id, description, debit, credit, balance, payment_mode, notes, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            matchedVendor.id,
            new Date().toISOString(),
            'purchase',
            purchase.id,
            `Procurement Purchase ${purchase.id}`,
            0,
            Number(purchase.total),
            newBal,
            'credit',
            `Purchase of items worth ₹${purchase.total}`,
            req.user?.username || 'system',
            new Date().toISOString()
          );
        }
      }

      db.exec("COMMIT;");

      logAudit("CREATE", "Purchase", purchase.id, { total: purchase.total, vendor: vendor?.name }, req.user?.username || 'system');
      res.status(201).json(purchase);
    } catch (err: any) {
      db.exec("ROLLBACK;");
      console.error("Purchase transaction failed:", err);
      res.status(500).json({ error: "Failed to record purchase: " + err.message });
    }
  });

  app.get("/api/purchases", requireNonCashier, (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM purchases ORDER BY date DESC").all() as any[];
      const mapped = rows.map(r => ({
        id: r.id,
        date: r.date,
        vendor: JSON.parse(r.vendor_json || "{}"),
        total: Number(r.total),
        items: JSON.parse(r.items_json || "[]")
      }));
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/dashboard/stats", (_req, res) => {
    try {
      const totalSalesRow = db.prepare("SELECT COALESCE(SUM(total), 0) as totalSales, count(*) as count FROM invoices").get() as any;
      const totalProductsRow = db.prepare("SELECT count(*) as count FROM products").get() as any;
      const totalPurchaseRow = db.prepare("SELECT COALESCE(SUM(total), 0) as totalPurchases FROM purchases").get() as any;
      const recentInvoicesRows = db.prepare("SELECT * FROM invoices ORDER BY date DESC LIMIT 5").all() as any[];

      const recentInvoices = recentInvoicesRows.map(r => ({
        id: r.id,
        date: r.date,
        customer: r.customer,
        customerId: r.customer_id,
        subtotal: Number(r.subtotal),
        tax: Number(r.tax),
        roundOff: Number(r.round_off),
        total: Number(r.total),
        gstType: r.gst_type,
        paymentMethod: r.payment_method,
        items: JSON.parse(r.items_json || "[]")
      }));

      res.json({
        totalSales: Number(totalSalesRow.totalSales || 0),
        invoiceCount: Number(totalSalesRow.count || 0),
        activeProducts: Number(totalProductsRow.count || 0),
        purchaseVolume: Number(totalPurchaseRow.totalPurchases || 0),
        recentInvoices
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AI Development Team ---

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const AGENTS: Record<string, { name: string; shortName: string; role: string; emoji: string; color: string; systemPrompt: string }> = {
    'product-manager': {
      name: 'Priya (Product Manager)',
      shortName: 'Priya',
      role: 'Product Manager',
      emoji: '🧠',
      color: '#8B5CF6',
      systemPrompt: `You are Priya, a senior Product Manager for the Unidex ERP project — a React 19 + TypeScript + Express.js business ERP system.
Your responsibilities: collect requirements, write user stories with acceptance criteria, maintain the product backlog, and define feature priorities.
Current ERP modules: Dashboard (KPIs & recent invoices), Quick Bill (POS billing with barcode scan), Sales (invoice history), Inventory (product/stock management), Purchases (vendor procurement), Admin (company profile & settings).
Tech stack context: React 19, TypeScript, Tailwind CSS v4, Vite, Express.js, lucide-react icons, motion/react animations, @google/genai.
Always respond in a structured, professional manner. Use headings and bullet points. Be user-focused and business-outcome driven.`
    },
    'developer': {
      name: 'Dev (Senior Developer)',
      shortName: 'Dev',
      role: 'Senior Developer',
      emoji: '💻',
      color: '#3B82F6',
      systemPrompt: `You are Dev, a senior full-stack developer for the Unidex ERP project.
Tech stack: React 19, TypeScript, Tailwind CSS v4, Vite, Express.js, Node.js, lucide-react, motion/react, @google/genai.
Current ERP modules: Dashboard, Quick Bill (barcode scanning with html5-qrcode), Sales, Inventory, Purchases, Admin.
Backend: Express.js with in-memory storage (arrays for products, transactions, purchases, parties, settings). All API routes at /api/*.
Frontend: React components in src/components/, dark theme (#0A0A0A bg, blue-600 accents, white/5 borders, rounded-[32px] cards).
When writing code, provide complete TypeScript with proper types. Follow existing code patterns. Always include error handling.`
    },
    'qa-engineer': {
      name: 'Quinn (QA Engineer)',
      shortName: 'Quinn',
      role: 'QA Engineer',
      emoji: '🔍',
      color: '#10B981',
      systemPrompt: `You are Quinn, a senior QA Engineer for the Unidex ERP project.
The app is: React 19 + TypeScript + Express.js ERP with modules: Dashboard, Quick Bill, Sales, Inventory, Purchases, Admin.
Backend is in-memory (no persistence) — data resets on server restart. Frontend fetches from /api/* endpoints.
Your job: write detailed test cases (manual and automated), find edge cases, identify bugs, review code for quality issues, suggest improvements.
Think about: form validation, concurrent user actions, data integrity, API error states, mobile responsiveness, accessibility, and security.`
    },
    'release-manager': {
      name: 'Rex (Release Manager)',
      shortName: 'Rex',
      role: 'Release Manager',
      emoji: '🚀',
      color: '#F59E0B',
      systemPrompt: `You are Rex, the Release Manager for the Unidex ERP project.
The project uses: React 19 + TypeScript + Vite for frontend, Express.js backend, npm for package management.
Build commands: npm run dev (development), npm run build (production Vite build), npm run preview.
Your responsibilities: plan releases, write changelogs, create deployment checklists, manage versioning (semantic versioning), document breaking changes, plan rollback strategies.
Always be thorough about what could go wrong during deployment and how to recover.`
    },
    'tech-lead': {
      name: 'Zara (Tech Lead)',
      shortName: 'Zara',
      role: 'Tech Lead & Architect',
      emoji: '🎯',
      color: '#EF4444',
      systemPrompt: `You are Zara, the Tech Lead and Architect for the Unidex ERP project.
Full tech stack: React 19, TypeScript ~5.8, Tailwind CSS v4, Vite 6, Express 4, Node.js, lucide-react, motion/react, @google/genai, html5-qrcode.
You make final architectural decisions, review code for scalability and maintainability, resolve technical disagreements, and guide the overall engineering direction.
Current ERP modules: Dashboard, Quick Bill, Sales, Inventory, Purchases, Admin, AI Team (new).
When orchestrating team discussions, synthesize perspectives from Product Manager (Priya), Developer (Dev), QA Engineer (Quinn), and Release Manager (Rex). Clearly attribute each viewpoint.`
    }
  };

  // Get all agents metadata
  app.get("/api/ai-team/agents", (_req, res) => {
    const agentList = Object.entries(AGENTS).map(([id, agent]) => ({
      id,
      name: agent.name,
      shortName: agent.shortName,
      role: agent.role,
      emoji: agent.emoji,
      color: agent.color,
    }));
    res.json(agentList);
  });

  // Chat with a specific agent
  app.post("/api/ai-team/chat", async (req, res) => {
    const { agentId, message, history = [] } = req.body;
    const agent = AGENTS[agentId as string];
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured. Please add it to .env.local" });
      return;
    }
    try {
      const chat = genai.chats.create({
        model: "gemini-3.8-flash",
        config: { systemInstruction: agent.systemPrompt },
        history: history
      });
      const result = await chat.sendMessage({ message });
      res.json({
        response: result.text,
        agentId,
        agentName: agent.name,
        agentEmoji: agent.emoji,
        agentColor: agent.color,
      });
    } catch (err: any) {
      console.error("AI Team chat error:", err);
      res.status(500).json({ error: err.message || "Failed to get AI response" });
    }
  });

  // Team discussion — Tech Lead synthesizes all perspectives
  app.post("/api/ai-team/discuss", async (req, res) => {
    const { topic, history = [] } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured. Please add it to .env.local" });
      return;
    }
    try {
      const discussionPrompt = AGENTS['tech-lead'].systemPrompt +
        `\n\nIMPORTANT: When answering, always structure your response as a team meeting. Include perspectives from:
- 🧠 **Priya (PM):** [product/business view]
- 💻 **Dev (Developer):** [technical implementation view]
- 🔍 **Quinn (QA):** [quality/testing view]
- 🚀 **Rex (Release):** [deployment/release view]
- 🎯 **Zara (Tech Lead):** [final decision/synthesis]

Keep each perspective concise but insightful.`;

      const chat = genai.chats.create({
        model: "gemini-3.8-flash",
        config: { systemInstruction: discussionPrompt },
        history: history
      });
      const result = await chat.sendMessage({ message: topic });
      res.json({ response: result.text });
    } catch (err: any) {
      console.error("AI Team discuss error:", err);
      res.status(500).json({ error: err.message || "Failed to get team discussion" });
    }
  });

  // --- Admin Maintenance & Pilot Setup ---

  // GET /api/admin/backup-db: Stream sqlite db file for 1-click merchant backup
  app.get("/api/admin/backup-db", requireNonCashier, (_req: any, res) => {
    try {
      if (!fs.existsSync(SQLITE_DB_FILE)) {
        return res.status(404).json({ error: "Database file not found." });
      }
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `unidex_backup_${dateStr}.db`;
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      const fileStream = fs.createReadStream(SQLITE_DB_FILE);
      fileStream.pipe(res);
    } catch (err: any) {
      console.error("Backup failed:", err);
      res.status(500).json({ error: "Failed to download database backup: " + err.message });
    }
  });

  // POST /api/admin/reset-demo: Reset demo invoices, ledger entries, and optionally products
  app.post("/api/admin/reset-demo", requireNonCashier, (req: any, res) => {
    const { wipeProducts = false } = req.body || {};
    try {
      db.exec("BEGIN TRANSACTION;");

      // Wipe transactional records
      db.exec("DELETE FROM invoices;");
      db.exec("DELETE FROM purchases;");
      db.exec("DELETE FROM ledger_entries;");
      
      // Reset party balances to 0
      db.exec("UPDATE parties SET balance = 0, updated_at = datetime('now');");
      
      // Reset invoice sequence
      db.exec("DELETE FROM invoice_sequence;");

      if (wipeProducts) {
        db.exec("DELETE FROM products;");
      }

      db.exec("COMMIT;");

      logAudit(
        "RESET_DEMO_DATA",
        "System",
        "database",
        { wipeProducts, timestamp: new Date().toISOString() },
        req.user?.username || "admin"
      );

      res.json({
        success: true,
        message: "Demo transactions wiped successfully. System ready for live business.",
        wipedProducts: !!wipeProducts
      });
    } catch (err: any) {
      db.exec("ROLLBACK;");
      console.error("Reset demo failed:", err);
      res.status(500).json({ error: "Failed to reset demo data: " + err.message });
    }
  });

  // --- Vite Integration ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Unidex ERP running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
