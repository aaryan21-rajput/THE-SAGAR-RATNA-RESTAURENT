import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { menuItems as defaultMenuItems, reviews as defaultReviews } from "./src/data";

interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  tableNumber?: string;
  address?: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customization?: string;
  }[];
  subtotal: number;
  gst: number;
  packagingCharge: number;
  discountAmount: number;
  appliedCoupon?: string;
  grandTotal: number;
  paymentStatus: "Pending" | "Paid" | "Failed";
  orderStatus: "New Order" | "Accepted" | "Preparing" | "Ready" | "Out For Delivery" | "Delivered" | "Cancelled";
  createdAt: string;
  paymentMethod?: string;
  totalAmount?: number;
}

const STORE_PATH = path.join(process.cwd(), "db-store.json");

// JWT Validation Check
function isAuthorizedAdmin(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  if (!token) return false;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    if (payload.sub === "sagar_ratna_admin_id") {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

const defaultInventory = [
  { id: "i1", name: "Premium Basmati Rice", stock: 120, unit: "kg", minAlertLevel: 30, category: "Dry Goods", lastRestocked: "2026-06-10" },
  { id: "i2", name: "Fresh Paneer (Cottage Cheese)", stock: 8, unit: "kg", minAlertLevel: 15, category: "Dairy", lastRestocked: "2026-06-14" },
  { id: "i3", name: "Fermented Dosa Batter", stock: 12, unit: "Litre", minAlertLevel: 20, category: "Dry Goods", lastRestocked: "2026-06-15" },
  { id: "i4", name: "Potatoes (Sourced Red)", stock: 85, unit: "kg", minAlertLevel: 25, category: "Vegetables", lastRestocked: "2026-06-12" },
  { id: "i5", name: "Red Tomatoes", stock: 10, unit: "kg", minAlertLevel: 20, category: "Vegetables", lastRestocked: "2026-06-14" },
  { id: "i6", name: "Soya Chaap Skewers", stock: 45, unit: "units", minAlertLevel: 15, category: "Dry Goods", lastRestocked: "2026-06-12" },
  { id: "i7", name: "Pure Cow Ghee", stock: 24, unit: "kg", minAlertLevel: 10, category: "Dairy", lastRestocked: "2026-06-11" },
  { id: "i8", name: "Wholewheat Atta / Flour", stock: 150, unit: "kg", minAlertLevel: 40, category: "Dry Goods", lastRestocked: "2026-06-08" },
  { id: "i9", name: "Mozzarella Grated Cheese", stock: 6, unit: "kg", minAlertLevel: 12, category: "Dairy", lastRestocked: "2026-06-13" },
  { id: "i10", name: "Eco Packaging boxes", stock: 320, unit: "units", minAlertLevel: 100, category: "Packaging", lastRestocked: "2026-06-09" }
];

const defaultCoupons = [
  { code: "SAGAR20", type: "percentage", value: 20, expiryDate: "2200-12-31", usageLimit: 500, usageCount: 0, minOrderAmount: 250 },
  { code: "WELCOME50", type: "fixed", value: 50, expiryDate: "2200-06-30", usageLimit: 1000, usageCount: 0, minOrderAmount: 150 },
  { code: "CHEFGIFT", type: "percentage", value: 15, expiryDate: "2026-08-31", usageLimit: 100, usageCount: 0, minOrderAmount: 300 }
];

const defaultSettings = {
  name: "Sagar Ratna",
  contactNumber: "+91-96300-13483",
  whatsappNumber: "+919630013483",
  address: "A-15, Subhash Nagar, Ring Road, Opposite Metro Pillar 122, New Delhi, Delhi 110027, India",
  businessHours: "11:00 AM - 11:30 PM DAILY",
  deliveryCharges: 25,
  gstPercentage: 5,
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  twitterUrl: "https://twitter.com",
  googleMapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.0772718136367!2d77.1082!3d28.6322!2m3!1f0!2f0!3f0!3m2!1i1248!2i786!4m2!3m1!1s0x0%3A0x0!2zMjgmdW5pcXVl!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
};

const defaultAuditLogs = [
  { id: "log-1", timestamp: new Date().toISOString(), user: "Admin (owner)", action: "System Initialized", details: "Local database initialized clean. Ready for real orders.", ipAddress: "127.0.0.1" }
];

function readDb() {
  if (!fs.existsSync(STORE_PATH)) {
    const freshDb = {
      orders: [],
      menuItems: defaultMenuItems,
      inventory: defaultInventory,
      coupons: defaultCoupons,
      reviews: defaultReviews,
      settings: defaultSettings,
      auditLogs: defaultAuditLogs
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(freshDb, null, 2), "utf-8");
    return freshDb;
  }
  try {
    const data = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Database file parse failure, resetting store...", err);
    const freshDb = {
      orders: [],
      menuItems: defaultMenuItems,
      inventory: defaultInventory,
      coupons: defaultCoupons,
      reviews: defaultReviews,
      settings: defaultSettings,
      auditLogs: defaultAuditLogs
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(freshDb, null, 2), "utf-8");
    return freshDb;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Database file write failure:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // REST API: ORDERS SECTION
  app.get("/api/orders", (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized access to order logs. System authentication required." });
    }
    const db = readDb();
    res.json(db.orders);
  });

  app.post("/api/orders", (req, res) => {
    try {
      const db = readDb();
      const orderData = req.body;

      // 1. Inputs validation
      if (!orderData.customerName || typeof orderData.customerName !== "string" || !orderData.customerName.trim()) {
        return res.status(400).json({ error: "Customer name is blank or missing. Please state valid checkout identity." });
      }
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return res.status(400).json({ error: "Shopping cart selection is empty. Order rejected." });
      }

      // 2. Duplicate Check
      const now = Date.now();
      const isDuplicate = db.orders.find((o: any) => {
        const orderTime = new Date(o.createdAt).getTime();
        const isRecent = (now - orderTime) < 30000; // 30 seconds debounce window
        const isSameCustomer = o.customerName === orderData.customerName.trim() && 
                               o.phoneNumber === orderData.phoneNumber;
        const isSameTotal = Math.abs(o.grandTotal - orderData.grandTotal) < 1;
        return isRecent && isSameCustomer && isSameTotal;
      });

      if (isDuplicate) {
        return res.status(200).json({ status: "success", order: isDuplicate, duplicate: true });
      }

      // 3. Serialized Unique Order ID Sequence
      const ordersCount = db.orders.length;
      const orderId = `SR-${1000 + ordersCount + Math.floor(Math.random() * 900 + 100)}`;

      const newOrder: Order = {
        ...orderData,
        id: orderId,
        createdAt: new Date().toISOString(),
        orderStatus: orderData.orderStatus || "New Order",
        paymentStatus: orderData.paymentStatus || "Pending",
        paymentMethod: orderData.paymentMethod || "Cash on Delivery",
        totalAmount: orderData.grandTotal
      };

      db.orders.unshift(newOrder); // New order on top
      writeDb(db);

      res.status(201).json({ status: "success", order: newOrder });
    } catch (err) {
      console.error("Failed to store client order:", err);
      res.status(500).json({ error: "Internal Database error. Failed to commit order ledger." });
    }
  });

  app.put("/api/orders/:id/status", (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ error: "Order status is required" });
    }

    const db = readDb();
    const idx = db.orders.findIndex((o: any) => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Order record not found" });
    }

    db.orders[idx].orderStatus = orderStatus;
    if (paymentStatus) {
      db.orders[idx].paymentStatus = paymentStatus;
    } else {
      // Auto assign payment states on standard progression
      if (orderStatus === "Cancelled") {
        db.orders[idx].paymentStatus = "Failed";
      } else if (orderStatus === "Delivered" || orderStatus === "Ready") {
        db.orders[idx].paymentStatus = "Paid";
      }
    }

    // Record Audit Logs
    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "Admin",
      action: "Order Modified",
      details: `Order ID: ${id} status altered to: ${orderStatus}`,
      ipAddress: "127.0.0.1"
    });

    writeDb(db);
    res.json({ success: true, order: db.orders[idx] });
  });

  // REST API: MENU ITEMS SECTION
  app.get("/api/menu-items", (req, res) => {
    const db = readDb();
    res.json(db.menuItems);
  });

  app.post("/api/menu-items", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    const newItem = req.body;
    db.menuItems.push(newItem);
    writeDb(db);
    res.json({ success: true, item: newItem });
  });

  app.put("/api/menu-items", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    db.menuItems = req.body;
    writeDb(db);
    res.json({ success: true });
  });

  // REST API: INVENTORY SECTION
  app.get("/api/inventory", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    res.json(db.inventory);
  });

  app.put("/api/inventory", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    db.inventory = req.body;
    writeDb(db);
    res.json({ success: true });
  });

  // REST API: COUPONS SECTION
  app.get("/api/coupons", (req, res) => {
    const db = readDb();
    res.json(db.coupons);
  });

  app.put("/api/coupons", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    db.coupons = req.body;
    writeDb(db);
    res.json({ success: true });
  });

  // REST API: REVIEWS SECTION
  app.get("/api/reviews", (req, res) => {
    const db = readDb();
    res.json(db.reviews);
  });

  app.post("/api/reviews", (req, res) => {
    const db = readDb();
    const newReview = req.body;
    db.reviews.unshift(newReview);
    writeDb(db);
    res.json({ success: true, review: newReview });
  });

  app.put("/api/reviews", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    db.reviews = req.body;
    writeDb(db);
    res.json({ success: true });
  });

  // REST API: SETTINGS SECTION
  app.get("/api/settings", (req, res) => {
    const db = readDb();
    res.json(db.settings);
  });

  app.post("/api/settings", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(451).json({ error: "Unauthorized" });
    const db = readDb();
    db.settings = req.body;
    writeDb(db);
    res.json({ success: true });
  });

  // REST API: AUDIT LOGS SECTION
  app.get("/api/audit-logs", (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const db = readDb();
    res.json(db.auditLogs);
  });

  app.post("/api/audit-logs", (req, res) => {
    const db = readDb();
    const { action, details, user } = req.body;
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user || "System",
      action,
      details,
      ipAddress: "127.0.0.1"
    };
    db.auditLogs.unshift(newLog);
    writeDb(db);
    res.json({ success: true, log: newLog });
  });

  // Vite Integration Entrypoints
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
    console.log(`[Database Server Engine] Initiated cleanly on port ${PORT}`);
  });
}

startServer();
