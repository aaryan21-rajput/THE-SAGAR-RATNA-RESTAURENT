import { MenuItem, Review } from "../types";
import { menuItems as defaultMenuItems, reviews as defaultReviews } from "../data";

export interface Order {
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
  createdAt: string; // ISO string or date
}

export interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  minOrderAmount?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number; // in kg or units
  unit: string;
  minAlertLevel: number;
  category: "Dairy" | "Dry Goods" | "Vegetables" | "Spices" | "Packaging" | "Other";
  lastRestocked: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface RestaurantSettings {
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  deliveryCharges: number;
  gstPercentage: number;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  googleMapsUrl: string;
}

// Generate premium mock orders spanning the last 30 days
const generateMockOrders = (initialMenuItems: MenuItem[]): Order[] => {
  const orders: Order[] = [];
  const names = [
    "Aarav Sharma", "Sneha Patel", "Vikas Rajput", "Rohan Verma", "Ananya Iyer",
    "Aditya Rao", "Pooja Hegde", "Kabir Mehra", "Meera Nair", "Rahul Singhania",
    "Neha Gupta", "Amit Trivedi", "Siddharth Sen", "Deepa Joshi", "Karan Malhotra"
  ];
  const phones = [
    "+91 98765 43210", "+91 91234 56789", "+91 88888 77777", "+91 99999 88888", "+91 98111 22233",
    "+91 95400 11223", "+91 87654 32109", "+91 90123 45678", "+91 93123 93123", "+91 99887 76655",
    "+91 88776 65544", "+91 77665 54433", "+91 96543 21098", "+91 92345 67890", "+91 93456 78901"
  ];
  const emails = names.map(n => n.toLowerCase().replace(" ", ".") + "@gmail.com");

  const today = new Date();
  
  // Pick some items for diverse ordering
  const getRandItems = () => {
    const pool = initialMenuItems.slice(0, 15); // get some of the first pieces
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    const selected: typeof pool = [];
    for (let i = 0; i < count; i++) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (!selected.some(s => s.id === item.id)) {
        selected.push(item);
      }
    }
    return selected.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: Math.floor(Math.random() * 2) + 1,
      customization: Math.random() > 0.7 ? "Less spicy, please" : undefined
    }));
  };

  // Generate 25 orders distributed over the last 30 days
  for (let i = 24; i >= 0; i--) {
    const orderDate = new Date();
    orderDate.setDate(today.getDate() - Math.floor(i * 1.2));
    // randomize hour
    orderDate.setHours(12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

    const items = getRandItems();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gst = Math.round(subtotal * 0.05);
    const orderType = ["dine-in", "takeaway", "delivery"][Math.floor(Math.random() * 3)] as any;
    const packagingCharge = orderType === "dine-in" ? 0 : 25;
    
    let discountAmount = 0;
    let appliedCoupon: string | undefined;
    if (Math.random() > 0.6) {
      discountAmount = Math.round(subtotal * 0.1); // 10% coupon promo
      appliedCoupon = "SAGAR10";
    }

    const grandTotal = subtotal + gst + packagingCharge - discountAmount;
    const statuses: Order["orderStatus"][] = ["New Order", "Accepted", "Preparing", "Ready", "Out For Delivery", "Delivered", "Cancelled"];
    let orderStatus: Order["orderStatus"] = "Delivered"; 
    
    // If it's today's date, make some pending or preparing
    if (i === 0) {
      orderStatus = ["New Order", "Preparing", "Out For Delivery", "Delivered"][Math.floor(Math.random() * 4)] as any;
    } else if (i === 1) {
      orderStatus = Math.random() > 0.8 ? "Cancelled" : "Delivered";
    }

    const paymentStatus: Order["paymentStatus"] = orderStatus === "Cancelled" ? "Failed" : (orderStatus === "New Order" ? "Pending" : "Paid");

    const tableNumber = orderType === "dine-in" ? String(Math.floor(Math.random() * 12) + 1) : undefined;
    const address = orderType === "delivery" ? `${Math.floor(Math.random() * 200) + 1}, Sector-4, Dwarka, New Delhi` : undefined;

    const uIdx = Math.floor(Math.random() * names.length);
    orders.push({
      id: `SR-${1000 + orders.length}`,
      customerName: names[uIdx],
      phoneNumber: phones[uIdx],
      email: emails[uIdx],
      orderType,
      tableNumber,
      address,
      items,
      subtotal,
      gst,
      packagingCharge,
      discountAmount,
      appliedCoupon,
      grandTotal,
      paymentStatus,
      orderStatus,
      createdAt: orderDate.toISOString()
    });
  }

  return orders;
};

// Initial Stock setup
const defaultInventory: InventoryItem[] = [
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

// Initial Coupons setup
const defaultCoupons: Coupon[] = [
  { code: "SAGAR20", type: "percentage", value: 20, expiryDate: "2200-12-31", usageLimit: 500, usageCount: 0, minOrderAmount: 250 },
  { code: "WELCOME50", type: "fixed", value: 50, expiryDate: "2200-06-30", usageLimit: 1000, usageCount: 0, minOrderAmount: 150 },
  { code: "CHEFGIFT", type: "percentage", value: 15, expiryDate: "2026-08-31", usageLimit: 100, usageCount: 0, minOrderAmount: 300 }
];

// Initial default settings
const defaultSettings: RestaurantSettings = {
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

// Initial logs
const defaultAuditLogs: AuditLog[] = [
  { id: "log-1", timestamp: new Date().toISOString(), user: "Admin (owner)", action: "System Initialized", details: "Local database initialized clean. Ready for real orders.", ipAddress: "127.0.0.1" }
];

// Self-executing migration to clean up all old simulated/mock transactions and prefilled data
if (typeof window !== "undefined") {
  const ERASE_VERSION = "v3";
  if (localStorage.getItem("sr_db_erased_version") !== ERASE_VERSION) {
    // Erase all simulation history (orders, logs, and reviews) while preserving settings/menu catalogs
    localStorage.setItem("sr_orders", JSON.stringify([]));
    localStorage.setItem("sr_reviews", JSON.stringify([]));
    localStorage.setItem("sr_audit_logs", JSON.stringify(defaultAuditLogs));
    
    // Wipe static cache items to re-initialize clean default settings/coupons/inventory
    localStorage.removeItem("sr_coupons");
    localStorage.removeItem("sr_settings");
    localStorage.removeItem("sr_inventory");
    
    localStorage.setItem("sr_db_erased_version", ERASE_VERSION);
  }
}

// Database state managers with both offline localStorage caching and full-stack Express API integration
export class LocalDB {
  static getMenuItems(): MenuItem[] {
    const stored = localStorage.getItem("sr_menu_items");
    if (!stored) {
      localStorage.setItem("sr_menu_items", JSON.stringify(defaultMenuItems));
      return defaultMenuItems;
    }
    return JSON.parse(stored);
  }

  static saveMenuItems(items: MenuItem[]): void {
    localStorage.setItem("sr_menu_items", JSON.stringify(items));
    window.dispatchEvent(new Event("storage"));
  }

  static getReviews(): Review[] {
    const stored = localStorage.getItem("sr_reviews");
    if (!stored) {
      localStorage.setItem("sr_reviews", JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }

  static saveReviews(reviews: any[]): void {
    localStorage.setItem("sr_reviews", JSON.stringify(reviews));
  }

  static getOrders(): Order[] {
    const stored = localStorage.getItem("sr_orders");
    if (!stored) {
      localStorage.setItem("sr_orders", JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }

  static saveOrders(orders: Order[]): void {
    localStorage.setItem("sr_orders", JSON.stringify(orders));
    window.dispatchEvent(new Event("storage"));
  }

  static addOrder(order: Omit<Order, "id" | "createdAt">): Order {
    const orders = this.getOrders();
    const newId = `SR-${1000 + orders.length + Math.floor(Math.random() * 10)}`;
    const fullOrder: Order = {
      ...order,
      id: newId,
      createdAt: new Date().toISOString()
    };
    orders.unshift(fullOrder); // add to top
    this.saveOrders(orders);
    
    // Play sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio lock bypass
    }

    const event = new CustomEvent("new_order", { detail: fullOrder });
    window.dispatchEvent(event);

    return fullOrder;
  }

  static getInventory(): InventoryItem[] {
    const stored = localStorage.getItem("sr_inventory");
    if (!stored) {
      localStorage.setItem("sr_inventory", JSON.stringify(defaultInventory));
      return defaultInventory;
    }
    return JSON.parse(stored);
  }

  static saveInventory(inventory: InventoryItem[]): void {
    localStorage.setItem("sr_inventory", JSON.stringify(inventory));
  }

  static getCoupons(): Coupon[] {
    const stored = localStorage.getItem("sr_coupons");
    if (!stored) {
      localStorage.setItem("sr_coupons", JSON.stringify(defaultCoupons));
      return defaultCoupons;
    }
    return JSON.parse(stored);
  }

  static saveCoupons(coupons: Coupon[]): void {
    localStorage.setItem("sr_coupons", JSON.stringify(coupons));
  }

  static getSettings(): RestaurantSettings {
    const stored = localStorage.getItem("sr_settings");
    if (!stored) {
      localStorage.setItem("sr_settings", JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    const settings: RestaurantSettings = JSON.parse(stored);
    if (settings.whatsappNumber === "+919876543210") {
      settings.whatsappNumber = "+919630013483";
      settings.contactNumber = "+91-96300-13483";
      localStorage.setItem("sr_settings", JSON.stringify(settings));
    }
    return settings;
  }

  static saveSettings(settings: RestaurantSettings): void {
    localStorage.setItem("sr_settings", JSON.stringify(settings));
    window.dispatchEvent(new Event("storage"));
  }

  static getAuditLogs(): AuditLog[] {
    const stored = localStorage.getItem("sr_audit_logs");
    if (!stored) {
      localStorage.setItem("sr_audit_logs", JSON.stringify(defaultAuditLogs));
      return defaultAuditLogs;
    }
    return JSON.parse(stored);
  }

  static addAuditLog(action: string, details: string, user: string = "Admin (owner)"): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
      ipAddress: "127.0.0.1"
    };
    logs.unshift(newLog);
    localStorage.setItem("sr_audit_logs", JSON.stringify(logs));
  }

  // --- FULL HARDENED FULL-STACK SYNCHRONIZATION APIS ---
  
  static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("sr_admin_jwt") || sessionStorage.getItem("sr_admin_jwt");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async fetchOrders(): Promise<Order[]> {
    const res = await fetch("/api/orders", { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Unauthorized orders retrieval check.");
    const data = await res.json();
    this.saveOrders(data);
    return data;
  }

  static async apiAddOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to submit order to restaurant database.");
    }
    const result = await res.ok ? await res.json() : {};
    if (!result.order) throw new Error("Malformed server order response.");
    
    // Merge into local cache
    const current = this.getOrders();
    if (!current.some(o => o.id === result.order.id)) {
      current.unshift(result.order);
      this.saveOrders(current);
    }
    
    // Dispatch local notification event on current tab
    const event = new CustomEvent("new_order", { detail: result.order });
    window.dispatchEvent(event);

    return result.order;
  }

  static async apiUpdateOrderStatus(orderId: string, status: Order["orderStatus"], paymentStatus?: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ orderStatus: status, paymentStatus })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update order status inside database.");
    }
    const result = await res.json();
    
    // Reload local orders state
    await this.fetchOrders();
    return result.order;
  }

  static async fetchMenuItems(): Promise<MenuItem[]> {
    const res = await fetch("/api/menu-items");
    if (!res.ok) throw new Error("Failed to load menu catalog.");
    const data = await res.json();
    this.saveMenuItems(data);
    return data;
  }

  static async apiSaveMenuItems(items: MenuItem[]): Promise<void> {
    const res = await fetch("/api/menu-items", {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(items)
    });
    if (!res.ok) throw new Error("Failed to preserve updated menu list.");
    this.saveMenuItems(items);
  }

  static async fetchInventory(): Promise<InventoryItem[]> {
    const res = await fetch("/api/inventory", { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch stock reports.");
    const data = await res.json();
    this.saveInventory(data);
    return data;
  }

  static async apiSaveInventory(inventory: InventoryItem[]): Promise<void> {
    const res = await fetch("/api/inventory", {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(inventory)
    });
    if (!res.ok) throw new Error("Failed to record inventory change.");
    this.saveInventory(inventory);
  }

  static async fetchCoupons(): Promise<Coupon[]> {
    const res = await fetch("/api/coupons");
    if (!res.ok) throw new Error("Failed to synchronize coupon ledger.");
    const data = await res.json();
    this.saveCoupons(data);
    return data;
  }

  static async apiSaveCoupons(coupons: Coupon[]): Promise<void> {
    const res = await fetch("/api/coupons", {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(coupons)
    });
    if (!res.ok) throw new Error("Failed to save coupons list.");
    this.saveCoupons(coupons);
  }

  static async fetchReviews(): Promise<Review[]> {
    const res = await fetch("/api/reviews");
    if (!res.ok) throw new Error("Failed to load reviews catalog.");
    const data = await res.json();
    this.saveReviews(data);
    return data;
  }

  static async apiPostReview(review: Review): Promise<void> {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error("Failed to send review.");
    await this.fetchReviews();
  }

  static async apiSaveReviews(reviews: Review[]): Promise<void> {
    const res = await fetch("/api/reviews", {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(reviews)
    });
    if (!res.ok) throw new Error("Failed to edit reviews array.");
    this.saveReviews(reviews);
  }

  static async fetchSettings(): Promise<RestaurantSettings> {
    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Failed to reload system variables.");
    const data = await res.json();
    this.saveSettings(data);
    return data;
  }

  static async apiSaveSettings(settings: RestaurantSettings): Promise<void> {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error("Failed to write system settings.");
    this.saveSettings(settings);
  }

  static async fetchAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch("/api/audit-logs", { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch logs ledger.");
    const data = await res.json();
    localStorage.setItem("sr_audit_logs", JSON.stringify(data));
    return data;
  }

  static async apiAddAuditLog(action: string, details: string, user: string = "Admin"): Promise<void> {
    const res = await fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, details, user })
    });
    if (res.ok) {
      await this.fetchAuditLogs();
    }
  }
}
