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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Database setup (JSON)
  let data = {
    products: [],
    orders: [],
    order_items: [],
    drivers: [],
    customers: [],
    vouchers: [],
    settings: {
      delivery_fee: 200,
      delivery_increment: 50
    }
  };

  try {
    const fileContent = await fs.readFile(DB_FILE, "utf-8");
    const loadedData = JSON.parse(fileContent);
    data = { ...data, ...loadedData };
    console.log("Database loaded from file.");
  } catch (err) {
    console.log("Database file not found, creating new one.");
    // Initial products
    data.products = [
      { id: 1, name: "Poulet entier", price: 1200, image: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?auto=format&fit=crop&w=800&q=80", stock: 20, category: "Volailles" },
      { id: 2, name: "Cuisses", price: 700, image: "https://images.unsplash.com/photo-1615557960916-5f4791effe82?auto=format&fit=crop&w=800&q=80", stock: 50, category: "Pièces" },
      { id: 3, name: "Ailes", price: 500, image: "https://images.unsplash.com/photo-1569396116180-210c182bedb8?auto=format&fit=crop&w=800&q=80", stock: 100, category: "Pièces" },
      { id: 4, name: "Filet", price: 900, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80", stock: 30, category: "Pièces" },
      { id: 5, name: "Poulet mariné", price: 1300, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80", stock: 15, category: "Volailles" },
    ];
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  }

  const saveData = async () => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  };

  // API Routes
  app.get("/api/settings", (req, res) => {
    res.json(data.settings);
  });

  app.put("/api/settings", async (req, res) => {
    data.settings = { ...data.settings, ...req.body };
    await saveData();
    res.json(data.settings);
  });

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
    const ordersWithItems = data.orders.map(order => {
      const driver = data.drivers.find(d => d.id === order.driver_id);
      return {
        ...order,
        driver_name: driver ? driver.name : null,
        items: data.order_items.filter(item => item.order_id === order.id).map(item => ({
          ...item,
          name: data.products.find(p => p.id === item.product_id)?.name || "Produit inconnu"
        }))
      };
    });
    res.json(ordersWithItems);
  });

  app.post("/api/orders", async (req, res) => {
    const { items, voucher_id, ...orderInfo } = req.body;
    
    // 1. Check stock for all items
    for (const item of items) {
      const product = data.products.find(p => p.id === item.product_id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Stock insuffisant pour le produit: ${product ? product.name : 'Inconnu'}.` 
        });
      }
    }

    const orderId = Date.now();
    const newOrder = {
      ...orderInfo,
      total_price: Number(orderInfo.total_price),
      id: orderId,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Handle voucher usage
    if (voucher_id) {
      const voucher = data.vouchers.find(v => v.id === voucher_id && !v.used && v.customer_phone === orderInfo.customer_phone);
      if (voucher) {
        voucher.used = true;
        newOrder.discount = voucher.amount;
        newOrder.voucher_id = voucher_id;
      }
    }

    data.orders.push(newOrder);

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
      const oldStatus = order.status;
      order.status = status;

      // Loyalty points logic
      if (status === 'delivered' && oldStatus !== 'delivered') {
        const pointsToAdd = Math.floor(Number(order.total_price) / 5000) * 10;
        if (pointsToAdd > 0) {
          // Normalize phone numbers for comparison (remove spaces)
          const normalizedOrderPhone = order.customer_phone.replace(/\s/g, '');
          let customer = data.customers.find(c => c.phone.replace(/\s/g, '') === normalizedOrderPhone);
          
          if (!customer) {
            customer = { phone: normalizedOrderPhone, name: order.customer_name, points: 0 };
            data.customers.push(customer);
          }
          customer.points += pointsToAdd;
        }
      }

      await saveData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/orders/:id/rate", async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const order = data.orders.find(o => o.id === parseInt(id));
    if (order) {
      order.rating = rating;
      order.rating_comment = comment;
      await saveData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Driver API
  app.get("/api/drivers", (req, res) => {
    res.json(data.drivers);
  });

  app.post("/api/drivers/register", async (req, res) => {
    const { name, phone } = req.body;
    const existingDriver = data.drivers.find(d => d.phone === phone);
    if (existingDriver) {
      return res.status(400).json({ error: "Ce numéro est déjà enregistré." });
    }
    const newDriver = {
      id: Date.now(),
      name,
      phone,
      status: 'active'
    };
    data.drivers.push(newDriver);
    await saveData();
    res.json(newDriver);
  });

  app.post("/api/drivers/login", async (req, res) => {
    const { phone } = req.body;
    const driver = data.drivers.find(d => d.phone === phone);
    if (driver) {
      res.json(driver);
    } else {
      res.status(404).json({ error: "Livreur non trouvé." });
    }
  });

  app.patch("/api/orders/:id/assign", async (req, res) => {
    const { id } = req.params;
    const { driver_id } = req.body;
    const order = data.orders.find(o => o.id === parseInt(id));
    if (order) {
      order.driver_id = driver_id;
      await saveData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Loyalty API
  app.post("/api/customers/register", async (req, res) => {
    const { name, phone } = req.body;
    const normalizedPhone = phone.replace(/\s/g, '');
    const existingCustomer = data.customers.find(c => c.phone.replace(/\s/g, '') === normalizedPhone);
    if (existingCustomer) {
      return res.status(400).json({ error: "Ce numéro est déjà enregistré." });
    }
    const newCustomer = {
      phone: normalizedPhone,
      name,
      points: 0
    };
    data.customers.push(newCustomer);
    await saveData();
    res.json(newCustomer);
  });

  app.get("/api/customers/:phone/orders", (req, res) => {
    const { phone } = req.params;
    const normalizedPhone = phone.replace(/\s/g, '');
    const customerOrders = data.orders.filter(o => o.customer_phone.replace(/\s/g, '') === normalizedPhone);
    
    const ordersWithItems = customerOrders.map(order => {
      const driver = data.drivers.find(d => d.id === order.driver_id);
      return {
        ...order,
        driver_name: driver ? driver.name : null,
        items: data.order_items.filter(item => item.order_id === order.id).map(item => ({
          ...item,
          name: data.products.find(p => p.id === item.product_id)?.name || "Produit inconnu"
        }))
      };
    });
    
    res.json(ordersWithItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  });

  app.post("/api/customers/login", async (req, res) => {
    const { phone } = req.body;
    const normalizedPhone = phone.replace(/\s/g, '');
    const customer = data.customers.find(c => c.phone.replace(/\s/g, '') === normalizedPhone);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: "Client non trouvé. Veuillez vous inscrire." });
    }
  });

  app.get("/api/customers/:phone", (req, res) => {
    const { phone } = req.params;
    const normalizedPhone = phone.replace(/\s/g, '');
    
    const customer = data.customers.find(c => c.phone.replace(/\s/g, '') === normalizedPhone) || { phone, name: "Client", points: 0 };
    const vouchers = data.vouchers.filter(v => v.customer_phone.replace(/\s/g, '') === normalizedPhone && !v.used);
    
    const customerOrders = data.orders.filter(o => o.customer_phone.replace(/\s/g, '') === normalizedPhone);
    const ordersWithItems = customerOrders.map(order => {
      const driver = data.drivers.find(d => d.id === order.driver_id);
      return {
        ...order,
        driver_name: driver ? driver.name : null,
        items: data.order_items.filter(item => item.order_id === order.id).map(item => ({
          ...item,
          name: data.products.find(p => p.id === item.product_id)?.name || "Produit inconnu"
        }))
      };
    });

    res.json({ 
      customer, 
      vouchers, 
      orders: ordersWithItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) 
    });
  });

  app.post("/api/loyalty/redeem", async (req, res) => {
    const { phone } = req.body;
    const normalizedPhone = phone.replace(/\s/g, '');
    const customer = data.customers.find(c => c.phone.replace(/\s/g, '') === normalizedPhone);
    
    if (!customer || customer.points < 100) {
      return res.status(400).json({ error: "Points insuffisants. Il vous faut au moins 100 points." });
    }

    // Determine how many points to redeem (multiples of 100)
    const pointsToRedeem = Math.floor(customer.points / 100) * 100;
    const voucherAmount = (pointsToRedeem / 100) * 2000;

    customer.points -= pointsToRedeem;
    const voucher = {
      id: "V-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      customer_phone: normalizedPhone,
      amount: voucherAmount,
      used: false,
      created_at: new Date().toISOString()
    };
    data.vouchers.push(voucher);
    await saveData();
    res.json(voucher);
  });

  app.get("/api/vouchers/:id", (req, res) => {
    const { id } = req.params;
    const { phone } = req.query;
    const voucher = data.vouchers.find(v => v.id === id && v.customer_phone === phone && !v.used);
    if (voucher) {
      res.json(voucher);
    } else {
      res.status(404).json({ error: "Bon d'achat invalide ou déjà utilisé." });
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
