import { MenuItem, Review, KOT, KOTStatus, OrderItem, RestaurantTable, PrinterEmulatorLog } from "../types";
import { menuItems as defaultMenuItems, reviews as defaultReviews } from "../data";
import { createClient } from "@supabase/supabase-js";

// Load configuration with broad support for multiple environments
const anyMeta = import.meta as any;
const supabaseUrl = anyMeta.env?.VITE_SUPABASE_URL || 
                    anyMeta.env?.NEXT_PUBLIC_SUPABASE_URL || 
                    "https://xykdbtebmjzapaozsggl.supabase.co";

const supabaseKey = anyMeta.env?.VITE_SUPABASE_ANON_KEY || 
                    anyMeta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    "sb_publishable_MbOmjXCRkgLRdic8YE-8ng_RyBIkI7G";

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  orderStatus: "New Order" | "Accepted" | "Preparing" | "Ready" | "Out For Delivery" | "Delivered" | "Cancelled" | "Served";
  createdAt: string; // ISO string or date
  paymentMethod?: string;
  kotNumber?: string;
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

  static getTables(): RestaurantTable[] {
    const stored = localStorage.getItem("sr_tables");
    if (!stored) {
      const defaultTables: RestaurantTable[] = [
        { id: "tbl-1", tableNumber: "1", capacity: 4, seatingArea: "Main Dining Hall", status: "Available" },
        { id: "tbl-2", tableNumber: "2", capacity: 4, seatingArea: "Main Dining Hall", status: "Available" },
        { id: "tbl-3", tableNumber: "3", capacity: 2, seatingArea: "Window Alcove", status: "Available" },
        { id: "tbl-4", tableNumber: "4", capacity: 6, seatingArea: "Family Suite", status: "Available" },
        { id: "tbl-5", tableNumber: "5", capacity: 8, seatingArea: "VIP Lounge", status: "Reserved" },
        { id: "tbl-6", tableNumber: "6", capacity: 2, seatingArea: "Balcony", status: "Available" },
        { id: "tbl-7", tableNumber: "7", capacity: 4, seatingArea: "Courtyard Garden", status: "Available" },
        { id: "tbl-8", tableNumber: "8", capacity: 4, seatingArea: "Courtyard Garden", status: "Available" }
      ];
      localStorage.setItem("sr_tables", JSON.stringify(defaultTables));
      return defaultTables;
    }
    return JSON.parse(stored);
  }

  static saveTables(tables: RestaurantTable[]): void {
    localStorage.setItem("sr_tables", JSON.stringify(tables));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("tables_updated"));
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

  // --- SUPABASE DIRECT INTEGRATION CODES & BACKENDS ---
  
  static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("sr_admin_jwt") || sessionStorage.getItem("sr_admin_jwt");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async fetchOrders(): Promise<Order[]> {
    console.log("[Supabase API Request] Loading orders list...");
    try {
      const { data, error, status } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Supabase API Error] Orders fetch failed:", error);
        this.addAuditLog(
          "Supabase API Error",
          `HTTP ${status} - Failed to fetch orders from Supabase REST endpoint: ${error.message} (${error.details}). Check if 'orders' table exists in dashboard. Falling back to local ledger cache.`,
          "System (Supabase)"
        );
        return this.getOrders();
      }

      console.log("[Supabase API Response] Successfully fetched orders:", data);

      // Translate snake_case keys back to client camelCase
      const mapped: Order[] = (data || []).map((item: any) => ({
        id: item.id,
        customerName: item.customer_name || "Guest User",
        phoneNumber: item.phone_number || "",
        email: item.email || "",
        orderType: item.order_type || "takeaway",
        tableNumber: item.table_number || undefined,
        address: item.address || undefined,
        items: Array.isArray(item.items) ? item.items : (typeof item.items === 'string' ? JSON.parse(item.items) : []),
        subtotal: Number(item.subtotal || 0),
        gst: Number(item.gst || 0),
        packagingCharge: Number(item.packaging_charge || 0),
        discountAmount: Number(item.discount_amount || 0),
        appliedCoupon: item.applied_coupon || undefined,
        grandTotal: Number(item.grand_total || 0),
        paymentStatus: item.payment_status || "Pending",
        orderStatus: item.order_status || "New Order",
        createdAt: item.created_at || new Date().toISOString(),
        paymentMethod: item.payment_method || "Cash on Delivery"
      }));

      this.saveOrders(mapped);
      return mapped;
    } catch (err: any) {
      console.error("[Supabase Transport Error] Failed to contact rest endpoint:", err);
      this.addAuditLog(
        "Supabase Bridge Offline",
        `Transport link offline: ${err.message || err.toString()}. Reading orders offline from local disk cache.`,
        "System (Offline)"
      );
      return this.getOrders();
    }
  }

  static async apiAddOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
    const orders = this.getOrders();
    const newId = `SR-${1000 + orders.length + Math.floor(Math.random() * 100)}`;
    const kotCount = this.getKOTs().length + 1;
    const kotNumber = `KOT-${String(kotCount).padStart(4, "0")}`;

    const fullOrder: Order = {
      ...order,
      id: newId,
      createdAt: new Date().toISOString(),
      kotNumber: kotNumber
    };

    const payload = {
      id: fullOrder.id,
      customer_name: fullOrder.customerName,
      phone_number: fullOrder.phoneNumber,
      email: fullOrder.email,
      order_type: fullOrder.orderType,
      table_number: fullOrder.tableNumber || null,
      address: fullOrder.address || null,
      items: fullOrder.items,
      subtotal: Number(fullOrder.subtotal || 0),
      gst: Number(fullOrder.gst || 0),
      packaging_charge: Number(fullOrder.packagingCharge || 0),
      discount_amount: Number(fullOrder.discountAmount || 0),
      applied_coupon: fullOrder.appliedCoupon || null,
      grand_total: Number(fullOrder.grandTotal || 0),
      payment_status: fullOrder.paymentStatus || "Pending",
      order_status: fullOrder.orderStatus || "New Order",
      created_at: fullOrder.createdAt,
      payment_method: fullOrder.paymentMethod || "Cash on Delivery",
      kot_number: kotNumber
    };

    console.log("[Supabase API POST Payload] Submitting new order:", payload);

    try {
      const { error, status } = await supabase
        .from("orders")
        .insert(payload);

      if (error) {
        console.error("[Supabase API Error] Failed to submit order payload:", error);
        this.addAuditLog(
          "Supabase Sync Failed",
          `HTTP ${status} - Error placing order on remote database: ${error.message}. Please create the 'orders' table in Supabase. Details: ${error.details || 'None'}`,
          "System"
        );
        throw new Error(`Supabase post insertion failure: ${error.message} (${error.details || 'Check details in table schemas'})`);
      }

      console.log(`[Supabase API POST Success] Order ${newId} synchronized in cloud ledger.`);
      this.addAuditLog(
        "Supabase Sync Success",
        `Order reference ${newId} with total ₹${fullOrder.grandTotal} stored inside cloud database successfully.`,
        "System"
      );

      // Successfully saved order. Now save order items and KOT in Supabase
      try {
        await this.apiAddOrderItems(fullOrder.id, fullOrder.items);
        
        const freshKOT: KOT = {
          id: kotNumber,
          orderId: fullOrder.id,
          tableNumber: fullOrder.tableNumber || "Takeaway",
          customerName: fullOrder.customerName,
          orderType: fullOrder.orderType,
          status: "New Order",
          specialInstructions: fullOrder.items.map(i => i.customization).filter(Boolean).join(", ") || "None",
          createdAt: fullOrder.createdAt,
          preparationTime: 15,
          items: fullOrder.items
        };
        await this.apiAddKOT(freshKOT);
      } catch (childErr) {
        console.warn("[KOT/Items Child Sync Error] Handled locally:", childErr);
      }

      // Play audio ring
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
      } catch (e) {}

      // Prepend and save locally
      const current = this.getOrders();
      current.unshift(fullOrder);
      this.saveOrders(current);

      // Notify other live tabs
      const event = new CustomEvent("new_order", { detail: fullOrder });
      window.dispatchEvent(event);

      return fullOrder;
    } catch (err: any) {
      console.error("[Order Relay Exception]", err);
      
      // Save KOT locally anyway
      try {
        const freshKOT: KOT = {
          id: kotNumber,
          orderId: fullOrder.id,
          tableNumber: fullOrder.tableNumber || "Takeaway",
          customerName: fullOrder.customerName,
          orderType: fullOrder.orderType,
          status: "New Order",
          specialInstructions: fullOrder.items.map(i => i.customization).filter(Boolean).join(", ") || "None",
          createdAt: fullOrder.createdAt,
          preparationTime: 15,
          items: fullOrder.items
        };
        
        const localKOTs = this.getKOTs();
        localKOTs.unshift(freshKOT);
        this.saveKOTs(localKOTs);
      } catch (kotErr) {
        console.error("Local KOT save failure:", kotErr);
      }

      // Let's fallback to local saving if connection fails, so order is not fully lost for current user!
      const current = this.getOrders();
      current.unshift(fullOrder);
      this.saveOrders(current);
      
      const event = new CustomEvent("new_order", { detail: fullOrder });
      window.dispatchEvent(event);

      // Re-throw so frontend displays exact error
      throw err;
    }
  }

  static async apiUpdateOrderStatus(orderId: string, status: Order["orderStatus"], paymentStatus?: string): Promise<Order> {
    console.log(`[Supabase API PATCH Payload] Updating Order ${orderId}:`, { status, paymentStatus });
    try {
      const updatePayload: any = { order_status: status };
      if (paymentStatus) {
        updatePayload.payment_status = paymentStatus;
      }

      const { error, status: httpStatus } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);

      if (error) {
        console.error("[Supabase API Error] Order update failed:", error);
        this.addAuditLog(
          "Supabase Action Failed",
          `HTTP ${httpStatus} - Failed to update order status: ${error.message}`,
          "Admin (owner)"
        );
        throw new Error(`Supabase update failure: ${error.message}`);
      }

      console.log(`[Supabase API PATCH Success] Order ${orderId} updated.`);
      
      // Update in local array
      const current = this.getOrders();
      const idx = current.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        current[idx].orderStatus = status;
        if (paymentStatus) {
          current[idx].paymentStatus = paymentStatus as any;
        }
        this.saveOrders(current);
      }

      return current[idx] || { id: orderId, orderStatus: status, paymentStatus: paymentStatus } as any;
    } catch (err: any) {
      console.error("[Order Status Relay Exception]", err);
      throw err;
    }
  }

  static async fetchMenuItems(): Promise<MenuItem[]> {
    console.log("[Supabase API Request] Loading menus list...");
    try {
      const { data, error, status } = await supabase
        .from("menu_items")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("[Supabase API Error] Menu catalog load failed:", error);
        this.addAuditLog(
          "Catalog Sync Error",
          `HTTP ${status} - Failed to fetch menu catalog from Supabase REST endpoint: ${error.message}. Please create the 'menu_items' table. Falling back to offline defaults.`,
          "System (Supabase)"
        );
        return this.getMenuItems();
      }

      console.log("[Supabase API Response] Successfully fetched menus:", data);

      const mapped: MenuItem[] = (data || []).map((item: any) => ({
        id: item.id || `item-${Date.now()}-${Math.random()}`,
        name: item.name || "Unnamed Item",
        price: Number(item.price || 0),
        category: item.category || "Other",
        description: item.description || "",
        isVeg: item.is_veg !== undefined ? item.is_veg : true,
        isBestseller: item.is_bestseller || false,
        isChefSpecial: item.is_chef_special || false,
        image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        spiciness: Number(item.spiciness || 0),
        rating: Number(item.rating || 4.5),
        ratingCount: Number(item.rating_count || 10)
      }));

      this.saveMenuItems(mapped);
      return mapped;
    } catch (err: any) {
      console.error("[Menu Transport Sync Error]", err);
      return this.getMenuItems();
    }
  }

  static async apiSaveMenuItems(items: MenuItem[]): Promise<void> {
    const payload = items.map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      category: item.category,
      description: item.description,
      is_veg: item.isVeg,
      is_bestseller: !!item.isBestseller,
      is_chef_special: !!item.isChefSpecial,
      image: item.image,
      spiciness: Number(item.spiciness || 0),
      rating: Number(item.rating || 4.5),
      rating_count: Number(item.ratingCount || 10)
    }));

    console.log("[Supabase API UPSERT] Uploading full menu items list:", payload);

    try {
      // Direct upsert to remote database
      const { error, status } = await supabase
        .from("menu_items")
        .upsert(payload);

      if (error) {
        console.error("[Supabase Menu Update failed]", error);
        this.addAuditLog(
          "Menu Sync Failed",
          `HTTP ${status} - Error saving menus in Supabase cloud: ${error.message}. Details: ${error.details}`,
          "Admin (owner)"
        );
        throw new Error(`Supabase Upsert fails: ${error.message} (${error.details || 'Check constraints'})`);
      }

      console.log("[Supabase API UPSERT Success] Menu database synced catalog successfully.");
      this.saveMenuItems(items);
      this.addAuditLog("Menu Catalog Saved", `Catalog containing ${items.length} dishes updated inside Supabase and local disk.`, "Admin (owner)");
    } catch (err: any) {
      console.error("[Menu Sync Exception]", err);
      this.saveMenuItems(items);
      throw err;
    }
  }

  static async fetchInventory(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.warn("[Supabase] inventory missing. Falling back to local storage.", error);
        return this.getInventory();
      }

      const mapped: InventoryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        stock: Number(item.stock || 0),
        unit: item.unit || "kg",
        minAlertLevel: Number(item.min_alert_level || 10),
        category: item.category || "Other",
        lastRestocked: item.last_restocked || new Date().toISOString().split("T")[0]
      }));

      this.saveInventory(mapped);
      return mapped;
    } catch {
      return this.getInventory();
    }
  }

  static async apiSaveInventory(inventory: InventoryItem[]): Promise<void> {
    const payload = inventory.map(item => ({
      id: item.id,
      name: item.name,
      stock: Number(item.stock || 0),
      unit: item.unit,
      min_alert_level: Number(item.minAlertLevel || 10),
      category: item.category,
      last_restocked: item.lastRestocked
    }));

    try {
      const { error } = await supabase.from("inventory").upsert(payload);
      if (error) throw error;
      this.saveInventory(inventory);
    } catch (err) {
      console.error("[Supabase Inventory Sync Failed]", err);
      this.saveInventory(inventory);
    }
  }

  static async fetchCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("code", { ascending: true });

      if (error) {
        console.warn("[Supabase] 'coupons' table missing. Using client defaults.", error);
        return this.getCoupons();
      }

      const mapped: Coupon[] = (data || []).map((item: any) => ({
        code: item.code,
        type: item.type || "percentage",
        value: Number(item.value || 0),
        expiryDate: item.expiry_date || "2200-12-31",
        usageLimit: Number(item.usage_limit || 100),
        usageCount: Number(item.usage_count || 0),
        minOrderAmount: item.min_order_amount ? Number(item.min_order_amount) : undefined
      }));

      this.saveCoupons(mapped);
      return mapped;
    } catch {
      return this.getCoupons();
    }
  }

  static async apiSaveCoupons(coupons: Coupon[]): Promise<void> {
    const payload = coupons.map(item => ({
      code: item.code,
      type: item.type,
      value: Number(item.value || 0),
      expiry_date: item.expiryDate,
      usage_limit: Number(item.usageLimit || 100),
      usage_count: Number(item.usageCount || 0),
      min_order_amount: item.minOrderAmount || null
    }));

    try {
      const { error } = await supabase.from("coupons").upsert(payload);
      if (error) throw error;
      this.saveCoupons(coupons);
    } catch (err) {
      console.error("[Supabase Coupons Sync Failed]", err);
      this.saveCoupons(coupons);
    }
  }

  static async fetchReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'reviews' query fallback to localStorage.", error);
        return this.getReviews();
      }

      const mapped: Review[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        rating: Number(item.rating || 5),
        date: item.date || new Date().toISOString(),
        comment: item.comment || "",
        avatar: item.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
      }));

      this.saveReviews(mapped);
      return mapped;
    } catch {
      return this.getReviews();
    }
  }

  static async apiPostReview(review: Review): Promise<void> {
    const payload = {
      id: review.id,
      name: review.name,
      rating: Number(review.rating || 5),
      date: review.date,
      comment: review.comment,
      avatar: review.avatar
    };

    try {
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;
      await this.fetchReviews();
    } catch (err) {
      console.error("[Supabase Review POST Failed]", err);
      const current = this.getReviews();
      current.unshift(review);
      this.saveReviews(current);
    }
  }

  static async apiSaveReviews(reviews: Review[]): Promise<void> {
    const payload = reviews.map(item => ({
      id: item.id,
      name: item.name,
      rating: Number(item.rating || 5),
      date: item.date,
      comment: item.comment,
      avatar: item.avatar
    }));

    try {
      const { error } = await supabase.from("reviews").upsert(payload);
      if (error) throw error;
      this.saveReviews(reviews);
    } catch (err) {
      console.error("[Supabase Reviews Batch Saving Failed]", err);
      this.saveReviews(reviews);
    }
  }

  static async fetchSettings(): Promise<RestaurantSettings> {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1);

      if (error || !data || data.length === 0) {
        console.warn("[Supabase] Settings fetch fallback.", error);
        return this.getSettings();
      }

      const item = data[0];
      const mapped: RestaurantSettings = {
        name: item.name || "Sagar Ratna",
        contactNumber: item.contact_number || "+91-96300-13483",
        address: item.address || "",
        businessHours: item.business_hours || "11:00 AM - 11:30 PM DAILY",
        deliveryCharges: Number(item.delivery_charges || 25),
        gstPercentage: Number(item.gst_percentage || 5),
        facebookUrl: item.facebook_url || "https://facebook.com",
        instagramUrl: item.instagram_url || "https://instagram.com",
        twitterUrl: item.twitter_url || "https://twitter.com",
        googleMapsUrl: item.google_maps_url || ""
      };

      this.saveSettings(mapped);
      return mapped;
    } catch {
      return this.getSettings();
    }
  }

  static async apiSaveSettings(settings: RestaurantSettings): Promise<void> {
    const payload = {
      id: "singleton-config", // Keep simple single row config
      name: settings.name,
      contact_number: settings.contactNumber,
      address: settings.address,
      business_hours: settings.businessHours,
      delivery_charges: Number(settings.deliveryCharges || 0),
      gst_percentage: Number(settings.gstPercentage || 0),
      facebook_url: settings.facebookUrl,
      instagram_url: settings.instagramUrl,
      twitter_url: settings.twitterUrl,
      google_maps_url: settings.googleMapsUrl
    };

    try {
      const { error } = await supabase.from("settings").upsert(payload);
      if (error) throw error;
      this.saveSettings(settings);
    } catch (err) {
      console.error("[Supabase Settings save failed]", err);
      this.saveSettings(settings);
    }
  }

  static async fetchAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'audit_logs' query fallback to localStorage.", error);
        return this.getAuditLogs();
      }

      const mapped: AuditLog[] = (data || []).map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp || new Date().toISOString(),
        user: item.user || "Admin",
        action: item.action || "Log Captured",
        details: item.details || "",
        ipAddress: item.ip_address || "127.0.0.1"
      }));

      localStorage.setItem("sr_audit_logs", JSON.stringify(mapped));
      return mapped;
    } catch {
      return this.getAuditLogs();
    }
  }

  static async apiAddAuditLog(action: string, details: string, user: string = "Admin"): Promise<void> {
    const logId = `log-${Date.now()}`;
    const payload = {
      id: logId,
      timestamp: new Date().toISOString(),
      user: user,
      action: action,
      details: details,
      ip_address: "127.0.0.1"
    };

    try {
      const { error } = await supabase.from("audit_logs").insert(payload);
      if (error) throw error;
      await this.fetchAuditLogs();
    } catch (err) {
      console.error("[Supabase Audit Log POST Failed]", err);
      const logs = this.getAuditLogs();
      logs.unshift({
        id: logId,
        timestamp: payload.timestamp,
        user: payload.user,
        action: payload.action,
        details: payload.details,
        ipAddress: payload.ip_address
      });
      localStorage.setItem("sr_audit_logs", JSON.stringify(logs));
    }
  }

  // --- KOT DATABASE SYSTEM OPERATIONS ---
  static getKOTs(): KOT[] {
    const stored = localStorage.getItem("sr_kots");
    if (!stored) {
      // Seed with fallback mock KOTs matching existing active mock orders for initial realism
      const fallbackKOTs: KOT[] = [];
      localStorage.setItem("sr_kots", JSON.stringify(fallbackKOTs));
      return fallbackKOTs;
    }
    return JSON.parse(stored);
  }

  static saveKOTs(kots: KOT[]): void {
    localStorage.setItem("sr_kots", JSON.stringify(kots));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("kots_updated"));
  }

  static async fetchKOTs(): Promise<KOT[]> {
    console.log("[Supabase API Request] Loading KOT list...");
    try {
      const { data, error, status } = await supabase
        .from("kots")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'kots' query fallback to localStorage.", error);
        return this.getKOTs();
      }

      const mapped: KOT[] = (data || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        tableNumber: item.table_number || "Takeaway",
        customerName: item.customer_name || "Guest User",
        orderType: item.order_type || "takeaway",
        status: item.status || "New Order",
        specialInstructions: item.special_instructions || "None",
        createdAt: item.created_at || new Date().toISOString(),
        preparationTime: Number(item.preparation_time || 15),
        printed: item.printed !== undefined ? !!item.printed : false,
        items: Array.isArray(item.items) ? item.items : (typeof item.items === 'string' ? JSON.parse(item.items) : [])
      }));

      this.saveKOTs(mapped);
      return mapped;
    } catch (err) {
      console.error("[KOT Transport Sync Error]", err);
      return this.getKOTs();
    }
  }

  static async apiAddKOT(kot: KOT): Promise<KOT> {
    const payload = {
      id: kot.id,
      order_id: kot.orderId,
      table_number: kot.tableNumber,
      customer_name: kot.customerName,
      order_type: kot.orderType,
      status: kot.status,
      special_instructions: kot.specialInstructions,
      created_at: kot.createdAt,
      preparation_time: Number(kot.preparationTime),
      printed: kot.printed || false,
      items: kot.items
    };

    try {
      const { error } = await supabase.from("kots").insert(payload);
      if (error) {
        console.error("[Supabase KOT insertion failed]", error);
      }
    } catch (err) {
      console.error("[Supabase KOT connection failed]", err);
    }

    const kots = this.getKOTs();
    // check unique
    if (!kots.some(k => k.id === kot.id)) {
      kots.unshift({ ...kot, printed: kot.printed || false });
      this.saveKOTs(kots);
    }

    return kot;
  }

  static async apiUpdateKOTPrinted(kotId: string, printed: boolean): Promise<void> {
    console.log(`[Supabase API Request] Updating KOT ${kotId} printed status to ${printed}`);
    try {
      const { error } = await supabase
        .from("kots")
        .update({ printed })
        .eq("id", kotId);
      
      if (error) {
        console.error("[Supabase KOT Printed update failed]", error);
      }

      // Update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].printed = printed;
        this.saveKOTs(kots);
      }
    } catch (err) {
      console.error("[KOT printed update exception]", err);
      // Fallback update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].printed = printed;
        this.saveKOTs(kots);
      }
    }
  }

  static async apiUpdateKOTStatus(kotId: string, status: KOTStatus): Promise<void> {
    console.log(`[Supabase API Request] Updating KOT status ${kotId} to ${status}`);
    try {
      const { error } = await supabase
        .from("kots")
        .update({ status })
        .eq("id", kotId);
      
      if (error) {
        console.error("[Supabase KOT Status update failed]", error);
      }

      // Update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].status = status;
        this.saveKOTs(kots);

        // Map KOTStatus to OrderStatus and update linked order status
        const orderId = kots[kotIdx].orderId;
        
        let mappedOrderStatus = status as any;
        if (status === "New Order") mappedOrderStatus = "New Order";
        else if (status === "Accepted") mappedOrderStatus = "Accepted";
        else if (status === "Preparing") mappedOrderStatus = "Preparing";
        else if (status === "Ready") mappedOrderStatus = "Ready";
        else if (status === "Served") mappedOrderStatus = "Delivered";
        else if (status === "Cancelled") mappedOrderStatus = "Cancelled";
        
        await this.apiUpdateOrderStatus(orderId, mappedOrderStatus);
      }
    } catch (err) {
      console.error("[KOT status update exception]", err);
      // Fallback update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].status = status;
        this.saveKOTs(kots);
      }
    }
  }

  static async apiAddOrderItems(orderId: string, items: { menuItemId: string; name: string; price: number; quantity: number; customization?: string }[]): Promise<void> {
    const payloads = items.map((item, index) => ({
      id: `${orderId}-item-${index}-${Date.now()}`,
      order_id: orderId,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      customization: item.customization || ""
    }));

    try {
      const { error } = await supabase.from("order_items").insert(payloads);
      if (error) {
        console.error("[Supabase OrderItems insertion failed]", error);
      }
    } catch (err) {
      console.error("[Supabase OrderItems connection failed]", err);
    }
  }

  static getPrinterLogs(): PrinterEmulatorLog[] {
    const stored = localStorage.getItem("sr_printer_logs");
    if (!stored) {
      localStorage.setItem("sr_printer_logs", JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }

  static savePrinterLogs(logs: PrinterEmulatorLog[]): void {
    localStorage.setItem("sr_printer_logs", JSON.stringify(logs));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("printer_logs_updated"));
  }

  static async fetchPrinterLogs(): Promise<PrinterEmulatorLog[]> {
    try {
      const { data, error } = await supabase
        .from("printer_emulator_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'printer_emulator_logs' table select error:", error);
        return this.getPrinterLogs();
      }

      const mapped: PrinterEmulatorLog[] = (data || []).map((item: any) => ({
        id: item.id,
        kotId: item.kot_id,
        kotNumber: item.kot_number,
        restaurantId: item.restaurant_id,
        receiptText: item.receipt_text,
        printStatus: item.print_status,
        createdAt: item.created_at
      }));

      this.savePrinterLogs(mapped);
      return mapped;
    } catch (err) {
      console.error("[Supabase fetchPrinterLogs failure]:", err);
      return this.getPrinterLogs();
    }
  }

  static async apiAddPrinterLog(log: Omit<PrinterEmulatorLog, "id" | "createdAt">): Promise<PrinterEmulatorLog> {
    const logs = this.getPrinterLogs();
    const newId = `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullLog: PrinterEmulatorLog = {
      ...log,
      id: newId,
      createdAt: new Date().toISOString()
    };

    const payload = {
      id: fullLog.id,
      kot_id: fullLog.kotId,
      kot_number: fullLog.kotNumber,
      restaurant_id: fullLog.restaurantId,
      receipt_text: fullLog.receiptText,
      print_status: fullLog.printStatus,
      created_at: fullLog.createdAt
    };

    try {
      const { error } = await supabase.from("printer_emulator_logs").insert(payload);
      if (error) {
        console.error("[Supabase insertion printer_emulator_logs failed]", error);
      }
    } catch (err) {
      console.error("[Supabase connection printer_emulator_logs failed]", err);
    }

    logs.unshift(fullLog);
    this.savePrinterLogs(logs);
    return fullLog;
  }
}

