import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), "database.json");

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database setup (JSON)
  let data = {
    products: [],
    orders: [],
    order_items: []
  };

  try {
    const fileContent = await fs.readFile(DB_FILE, "utf-8");
    data = JSON.parse(fileContent);
    console.log("Database loaded from file.");
  } catch (err) {
    console.log("Database file not found, creating new one.");
    // Initial products
    data.products = [
      { id: 1, name: "Poulet entier", price: 1200, image: "https://images.unsplash.com/photo-1587593810167-a84920ea084d?auto=format&fit=crop&w=800&q=80", stock: 20, category: "Volailles" },
      { id: 2, name: "Cuisses", price: 700, image: "https://images.unsplash.com/photo-1615557960916-5f4791effe82?auto=format&fit=crop&w=800&q=80", stock: 50, category: "Pièces" },
      { id: 3, name: "Ailes", price: 500, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80", stock: 100, category: "Pièces" },
      { id: 4, name: "Filet", price: 900, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80", stock: 30, category: "Pièces" },
      { id: 5, name: "Poulet mariné", price: 1300, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80", stock: 15, category: "Volailles" },
    ];
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  }

  const saveData = async () => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  };

  // API Routes
  app.get("/api/products", (req, res) => {
    res.json(data.products);
  });

  app.post("/api/products", async (req, res) => {
    const newProduct = { ...req.body, id: Date.now() };
    data.products.push(newProduct);
    await saveData();
    res.json(newProduct);
  });

  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const index = data.products.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      data.products[index] = { ...data.products[index], ...req.body };
      await saveData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    data.products = data.products.filter(p => p.id !== parseInt(id));
    await saveData();
    res.json({ success: true });
  });

  app.get("/api/orders", (req, res) => {
    const ordersWithItems = data.orders.map(order => ({
      ...order,
      items: data.order_items.filter(item => item.order_id === order.id).map(item => ({
        ...item,
        name: data.products.find(p => p.id === item.product_id)?.name || "Produit inconnu"
      }))
    }));
    res.json(ordersWithItems);
  });

  app.post("/api/orders", async (req, res) => {
    const orderId = Date.now();
    const newOrder = {
      ...req.body,
      id: orderId,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    const { items, ...orderInfo } = newOrder;
    data.orders.push(orderInfo);

    for (const item of items) {
      data.order_items.push({
        ...item,
        id: Date.now() + Math.random(),
        order_id: orderId
      });
      // Update stock
      const product = data.products.find(p => p.id === item.product_id);
      if (product) product.stock -= item.quantity;
    }

    await saveData();
    res.json({ id: orderId });
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = data.orders.find(o => o.id === parseInt(id));
    if (order) {
      order.status = status;
      await saveData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware added.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
