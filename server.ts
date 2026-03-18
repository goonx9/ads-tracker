import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("ecom_tracker.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost_price REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    selling_price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ad_spend (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Migration: Add status column if it doesn't exist (for existing databases)
const tableInfo = db.prepare("PRAGMA table_info(orders)").all();
const hasStatus = tableInfo.some((col: any) => col.name === 'status');
if (!hasStatus) {
  db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, cost_price, delivery_fee, selling_price } = req.body;
    const info = db.prepare(`
      INSERT INTO products (name, cost_price, delivery_fee, selling_price)
      VALUES (?, ?, ?, ?)
    `).run(name, cost_price, delivery_fee, selling_price);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    // Also cleanup related data
    db.prepare("DELETE FROM ad_spend WHERE product_id = ?").run(id);
    db.prepare("DELETE FROM orders WHERE product_id = ?").run(id);
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/ad-spend-list", (req, res) => {
    const adSpend = db.prepare(`
      SELECT a.*, p.name as product_name 
      FROM ad_spend a 
      JOIN products p ON a.product_id = p.id
      ORDER BY a.date DESC
    `).all();
    res.json(adSpend);
  });

  app.post("/api/ad-spend", (req, res) => {
    const { product_id, date, amount } = req.body;
    db.prepare(`
      INSERT INTO ad_spend (product_id, date, amount)
      VALUES (?, ?, ?)
    `).run(product_id, date, amount);
    res.json({ success: true });
  });

  app.delete("/api/ad-spend/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM ad_spend WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Orders
  app.post("/api/orders", (req, res) => {
    const { product_id, date, customer_name, customer_phone, status = 'pending' } = req.body;
    db.prepare(`
      INSERT INTO orders (product_id, date, customer_name, customer_phone, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(product_id, date, customer_name, customer_phone, status);
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM orders WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Dashboard / Reports
  app.get("/api/stats", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    const stats = products.map((p: any) => {
      const adSpend = db.prepare("SELECT SUM(amount) as total FROM ad_spend WHERE product_id = ?").get(p.id) as any;
      const orders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE product_id = ? AND status = 'confirmed'").get(p.id) as any;
      
      const totalAdSpend = adSpend.total || 0;
      const orderCount = orders.count || 0;
      const revenue = orderCount * p.selling_price;
      const cogs = orderCount * p.cost_price;
      const delivery = orderCount * p.delivery_fee;
      const profit = revenue - cogs - delivery - totalAdSpend;
      const roas = totalAdSpend > 0 ? (revenue / totalAdSpend).toFixed(2) : 0;

      return {
        ...p,
        totalAdSpend,
        orderCount,
        revenue,
        profit,
        roas
      };
    });
    res.json(stats);
  });

  app.get("/api/timeline", (req, res) => {
    // Get last 30 days of data
    const timeline = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-29 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT 
        d.date,
        COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN p.selling_price ELSE 0 END), 0) as revenue,
        COALESCE((SELECT SUM(amount) FROM ad_spend WHERE date = d.date), 0) as ad_spend
      FROM dates d
      LEFT JOIN orders o ON d.date = o.date
      LEFT JOIN products p ON o.product_id = p.id
      GROUP BY d.date
      ORDER BY d.date ASC
    `).all();
    res.json(timeline);
  });

  app.get("/api/orders-list", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, p.name as product_name, p.selling_price 
      FROM orders o 
      JOIN products p ON o.product_id = p.id
      ORDER BY o.date DESC
    `).all();
    res.json(orders);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
