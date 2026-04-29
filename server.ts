import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Unidex ERP Server is active" });
  });

  // Mock database (In production, replace with real DB like Firebase or PostgreSQL)
  let transactions: any[] = [];
  let purchases: any[] = [];
  let products: any[] = [
    { 
      id: '1', 
      name: 'iPhone 15 Pro', 
      barcode: '6901234567890',
      costPrice: 85000, 
      sellPrice: 134900, 
      mrp: 134900,
      discount: 0,
      discountType: 'amount',
      stock: 45, 
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1696446701796-da6122bc1d88?w=100&h=100&fit=crop'
    },
    { 
      id: '2', 
      name: 'Wireless Keyboard', 
      barcode: '8901234567890',
      costPrice: 1200, 
      sellPrice: 2499, 
      mrp: 2999,
      discount: 500,
      discountType: 'amount',
      stock: 12, 
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=100&h=100&fit=crop'
    }
  ];
  let parties: any[] = [
    { id: 'P1', name: 'John Doe', type: 'customer', phone: '9876543210', balance: 500 },
    { id: 'P2', name: 'Acme Corp', type: 'vendor', phone: '1234567890', balance: -1200 }
  ];

  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const product = { ...req.body, id: `${Date.now()}` };
    products.push(product);
    res.status(201).json(product);
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...req.body };
      res.json(products[index]);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    products = products.filter(p => p.id !== id);
    res.status(204).send();
  });

  let settings = {
    businessName: "Unidex ERP",
    upiId: "merchant@upi",
    gstNumber: "22AAAAA0000A1Z5",
    address: "123 Business Park, Tech City"
  };

  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.get("/api/parties", (req, res) => {
    res.json(parties);
  });

  app.put("/api/settings", (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
  });

  app.post("/api/parties", (req, res) => {
    const party = { ...req.body, id: `P-${Date.now()}` };
    parties.push(party);
    res.status(201).json(party);
  });

  app.post("/api/invoices", (req, res) => {
    const { items, total, customer } = req.body;
    const invoice = { items, total, customer, id: `INV-${Date.now()}`, date: new Date().toISOString() };
    
    // Reduce stock
    items.forEach((item: any) => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        product.stock = Math.max(0, product.stock - item.qty);
      }
    });

    transactions.push(invoice);
    res.status(201).json(invoice);
  });

  app.get("/api/invoices", (req, res) => {
    res.json(transactions);
  });

  app.post("/api/purchases", (req, res) => {
    const { items, total, vendor } = req.body;
    const purchase = { items, total, vendor, id: `PUR-${Date.now()}`, date: new Date().toISOString() };
    
    // Increase stock
    items.forEach((item: any) => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        product.stock = (product.stock || 0) + item.qty;
        // Track last vendor
        product.lastVendor = vendor?.name || 'Unknown';
        product.lastPurchasePrice = item.price || item.costPrice;
      }
    });

    purchases.push(purchase);
    res.status(201).json(purchase);
  });

  app.get("/api/purchases", (req, res) => {
    res.json(purchases);
  });

  app.get("/api/dashboard/stats", (req, res) => {
    res.json({
      totalSales: transactions.reduce((acc, curr) => acc + (curr.total || 0), 0),
      invoiceCount: transactions.length,
      activeProducts: products.length,
      purchaseVolume: purchases.reduce((acc, curr) => acc + (curr.total || 0), 0),
      recentInvoices: transactions.slice(-5).reverse()
    });
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
