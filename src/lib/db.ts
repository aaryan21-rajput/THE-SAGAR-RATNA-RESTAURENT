import { MenuItem, Review, KOT, KOTStatus, OrderItem, RestaurantTable, PrinterEmulatorLog, SupportTicket, TicketReply, Employee, Shift, AttendanceRecord, LeaveRequest, BiometricDevice, BiometricRawLog } from "../types";
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
  branch?: string;
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
  gstNumber?: string;
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
  googleMapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.0772718136367!2d77.1082!3d28.6322!2m3!1f0!2f0!3f0!3m2!1i1248!2i786!4m2!3m1!1s0x0%3A0x0!2zMjgmdW5pcXVl!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin",
  gstNumber: "07AAAAA1111A1Z1"
};

// Initial logs
const defaultAuditLogs: AuditLog[] = [
  { id: "log-1", timestamp: new Date().toISOString(), user: "Admin (owner)", action: "System Initialized", details: "Local database initialized clean. Ready for real orders.", ipAddress: "127.0.0.1" }
];

const defaultSupportTickets: SupportTicket[] = [
  {
    id: "TKT-1001",
    subject: "Need integration with Swiggy",
    category: "Feature Request",
    priority: "Medium",
    description: "We are currently receiving many delivery orders from Swiggy, and manual entry to the POS system is causing delays. Direct API integration would save our staff a lot of time.",
    status: "In Progress",
    createdAt: "2026-06-23T10:00:00Z",
    restaurantName: "Sagar Ratna",
    replies: [
      {
        id: "rep-1",
        author: "Owner",
        message: "Hi support team, is Swiggy integration on the roadmap? We get a lot of deliveries from Swiggy.",
        createdAt: "2026-06-23T10:00:00Z"
      },
      {
        id: "rep-2",
        author: "Support Agent",
        message: "Hello! Yes, Swiggy and Zomato direct sync is currently in beta testing. We expect to launch this in the next update around July 15.",
        createdAt: "2026-06-24T09:00:00Z"
      }
    ],
    internalNotes: "Beta testing group 4",
    unreadUpdate: true
  },
  {
    id: "TKT-1002",
    subject: "Thermal printer not pairing via Bluetooth",
    category: "Technical Support",
    priority: "High",
    description: "Our physical 3-inch Bluetooth thermal printer refuses to pair with the admin tablet. It is visible in Bluetooth settings but fails during pairing handshake.",
    status: "Open",
    createdAt: "2026-06-24T18:30:00Z",
    restaurantName: "Sagar Ratna",
    replies: [
      {
        id: "rep-3",
        author: "Owner",
        message: "The virtual printer logs are fine, but our physical 3-inch thermal printer refuses to pair. Any suggestions?",
        createdAt: "2026-06-24T18:30:00Z"
      }
    ]
  },
  {
    id: "TKT-1003",
    subject: "CGST and SGST bifurcation works beautifully",
    category: "General Feedback",
    priority: "Low",
    description: "The latest update splitting GST into SGST (2.5%) and CGST (2.5%) was perfectly applied! Thank you for the quick turn-around on this compliance requirement.",
    status: "Resolved",
    createdAt: "2026-06-25T01:00:00Z",
    restaurantName: "Sagar Ratna",
    replies: [
      {
        id: "rep-4",
        author: "Owner",
        message: "The latest update splitting GST into SGST (2.5%) and CGST (2.5%) was perfectly applied! Thank you for the quick turn-around.",
        createdAt: "2026-06-25T01:00:00Z"
      },
      {
        id: "rep-5",
        author: "Support Agent",
        message: "You're very welcome! Glad we could help resolve this compliance requirement for you. Let us know if you need any other modifications.",
        createdAt: "2026-06-25T01:15:00Z"
      }
    ]
  },
  {
    id: "TKT-1004",
    subject: "Payment settlement delay",
    category: "Billing",
    priority: "Urgent",
    description: "Our weekly payout was scheduled for yesterday (Tuesday) but has not yet reflected in our bank account. Usually it settles by Tuesday noon.",
    status: "Resolved",
    createdAt: "2026-06-23T11:00:00Z",
    restaurantName: "Bikanervala",
    replies: [
      {
        id: "rep-6",
        author: "Owner",
        message: "Our weekly payout was scheduled for yesterday but hasn't reflected yet.",
        createdAt: "2026-06-23T11:00:00Z"
      },
      {
        id: "rep-7",
        author: "Support Agent",
        message: "We checked and the payout was successfully processed on our end. It might take up to 24 hours to reflect depending on your bank's NEFT settlement cycles.",
        createdAt: "2026-06-23T14:00:00Z"
      }
    ],
    internalNotes: "Gateway status was delayed due to high bank network latency."
  }
];

const defaultShifts: Shift[] = [
  { id: "S-1", name: "Morning Shift", startTime: "09:00", endTime: "17:00", graceMinutes: 15, breakMinutes: 30 },
  { id: "S-2", name: "Evening Shift", startTime: "17:00", endTime: "01:00", graceMinutes: 15, breakMinutes: 30 },
  { id: "S-3", name: "Night Shift", startTime: "21:00", endTime: "05:00", graceMinutes: 15, breakMinutes: 30 }
];

const defaultEmployees: Employee[] = [
  { id: "EMP-101", name: "Rajeev Sharma", role: "Chef", phone: "9876543210", email: "rajeev.sharma@example.com", branch: "Sagar Ratna - CP", hourlyRate: 150, overtimeMultiplier: 1.5, biometricId: "B-101", status: "Active", joinedDate: "2024-01-15", shiftId: "S-1" },
  { id: "EMP-102", name: "Priya Patel", role: "Server", phone: "9812345678", email: "priya.patel@example.com", branch: "Sagar Ratna - CP", hourlyRate: 100, overtimeMultiplier: 1.5, biometricId: "B-102", status: "Active", joinedDate: "2024-03-22", shiftId: "S-1" },
  { id: "EMP-103", name: "Amit Verma", role: "Manager", phone: "9988776655", email: "amit.verma@example.com", branch: "Sagar Ratna - CP", hourlyRate: 250, overtimeMultiplier: 1.5, biometricId: "B-103", status: "Active", joinedDate: "2023-06-10", shiftId: "S-1" },
  { id: "EMP-104", name: "Sunita Devi", role: "Cleaner", phone: "9555666777", email: "sunita.devi@example.com", branch: "Sagar Ratna - CP", hourlyRate: 80, overtimeMultiplier: 1.5, biometricId: "B-104", status: "Active", joinedDate: "2024-02-01", shiftId: "S-2" },
  { id: "EMP-201", name: "Sanjay Kumar", role: "Cashier", phone: "9123456789", email: "sanjay.kumar@example.com", branch: "Sagar Ratna - Noida", hourlyRate: 120, overtimeMultiplier: 1.5, biometricId: "B-201", status: "Active", joinedDate: "2024-05-11", shiftId: "S-1" },
  { id: "EMP-202", name: "Vikram Singh", role: "Security", phone: "9444333222", email: "vikram.singh@example.com", branch: "Sagar Ratna - Noida", hourlyRate: 90, overtimeMultiplier: 1.5, biometricId: "B-202", status: "Active", joinedDate: "2023-11-20", shiftId: "S-3" }
];

const defaultAttendance: AttendanceRecord[] = [
  // CP Branch - June 24, 2026
  { id: "ATT-1001", employeeId: "EMP-101", date: "2026-06-24", shiftId: "S-1", checkIn: "2026-06-24T08:58:00Z", checkOut: "2026-06-24T18:00:00Z", status: "Present", lateMinutes: 0, overtimeMinutes: 60, totalWorkingMinutes: 512, syncSource: "ZKTeco Terminal" },
  { id: "ATT-1002", employeeId: "EMP-102", date: "2026-06-24", shiftId: "S-1", checkIn: "2026-06-24T09:05:00Z", checkOut: "2026-06-24T17:01:00Z", status: "Present", lateMinutes: 5, overtimeMinutes: 0, totalWorkingMinutes: 446, syncSource: "eSSL Terminal" },
  { id: "ATT-1003", employeeId: "EMP-103", date: "2026-06-24", shiftId: "S-1", checkIn: "2026-06-24T09:22:00Z", checkOut: "2026-06-24T17:00:00Z", status: "Late", lateMinutes: 22, overtimeMinutes: 0, totalWorkingMinutes: 428, syncSource: "eSSL Terminal" },
  { id: "ATT-1004", employeeId: "EMP-104", date: "2026-06-24", shiftId: "S-2", checkIn: "2026-06-24T17:02:00Z", checkOut: "2026-06-25T01:05:00Z", status: "Present", lateMinutes: 2, overtimeMinutes: 5, totalWorkingMinutes: 478, syncSource: "ZKTeco Terminal" },
  
  // CP Branch - June 25, 2026
  { id: "ATT-1005", employeeId: "EMP-101", date: "2026-06-25", shiftId: "S-1", checkIn: "2026-06-25T08:55:00Z", checkOut: null, status: "Present", lateMinutes: 0, overtimeMinutes: 0, totalWorkingMinutes: 0, syncSource: "ZKTeco Terminal" },
  { id: "ATT-1006", employeeId: "EMP-102", date: "2026-06-25", shiftId: "S-1", checkIn: "2026-06-25T09:25:00Z", checkOut: null, status: "Late", lateMinutes: 25, overtimeMinutes: 0, totalWorkingMinutes: 0, syncSource: "eSSL Terminal" },
  { id: "ATT-1007", employeeId: "EMP-103", date: "2026-06-25", shiftId: "S-1", checkIn: "2026-06-25T08:50:00Z", checkOut: null, status: "Present", lateMinutes: 0, overtimeMinutes: 0, totalWorkingMinutes: 0, syncSource: "eSSL Terminal" },
];

const defaultLeaves: LeaveRequest[] = [
  { id: "LR-1001", employeeId: "EMP-102", leaveType: "Sick Leave", startDate: "2026-06-20", endDate: "2026-06-21", reason: "Severe dental surgery recovery", status: "Approved", createdAt: "2026-06-19T14:20:00Z" },
  { id: "LR-1002", employeeId: "EMP-104", leaveType: "Casual Leave", startDate: "2026-06-26", endDate: "2026-06-27", reason: "Family wedding celebration", status: "Pending", createdAt: "2026-06-24T10:00:00Z" }
];

const defaultDevices: BiometricDevice[] = [
  { id: "DEV-1", name: "ZKTeco CP Kitchen Terminal", model: "ZKTeco K40", type: "Fingerprint", ipAddress: "192.168.1.150", port: 4370, branch: "Sagar Ratna - CP", status: "Online", lastSyncTime: "2026-06-25T01:30:00Z" },
  { id: "DEV-2", name: "eSSL CP Front Desk Face Reader", model: "eSSL Identix K30", type: "Facial Recognition", ipAddress: "192.168.1.151", port: 5005, branch: "Sagar Ratna - CP", status: "Online", lastSyncTime: "2026-06-25T01:35:00Z" },
  { id: "DEV-3", name: "ZKTeco Noida Gate terminal", model: "ZKTeco FacePass 7", type: "Facial Recognition", ipAddress: "192.168.2.110", port: 4370, branch: "Sagar Ratna - Noida", status: "Online", lastSyncTime: "2026-06-24T23:50:00Z" }
];

const defaultBiometricLogs: BiometricRawLog[] = [
  { id: "LOG-B101", deviceId: "DEV-1", biometricId: "B-101", timestamp: "2026-06-25T08:55:00Z", verifyType: "Fingerprint" },
  { id: "LOG-B102", deviceId: "DEV-2", biometricId: "B-102", timestamp: "2026-06-25T09:25:00Z", verifyType: "Face" },
  { id: "LOG-B103", deviceId: "DEV-2", biometricId: "B-103", timestamp: "2026-06-25T08:50:00Z", verifyType: "Face" },
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
  private static lastOrderSignatures = new Map<string, number>();

  static getNextKOTNumber(): string {
    const kots = this.getKOTs();
    let maxNum = 0;
    for (const k of kots) {
      if (k.id && k.id.startsWith("KOT-")) {
        const num = parseInt(k.id.substring(4), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `KOT-${String(nextNum).padStart(4, "0")}`;
  }

  // Recipe details mapped to culinary recipes to support automated ingredient deductions
  static getRecipeForMenuItem(menuItemId: string, name: string): { ingredientId: string; quantity: number }[] {
    const nameLower = name.toLowerCase();
    const recipe: { ingredientId: string; quantity: number }[] = [];

    // 1. Dosa recipes
    if (menuItemId.includes("dosa") || nameLower.includes("dosa")) {
      recipe.push({ ingredientId: "i3", quantity: 0.2 }); // 0.2L Dosa Batter
      recipe.push({ ingredientId: "i7", quantity: 0.02 }); // 0.02kg Cow Ghee
      if (nameLower.includes("masala") || nameLower.includes("potato")) {
        recipe.push({ ingredientId: "i4", quantity: 0.1 }); // 0.1kg Potatoes
      }
    }
    // 2. Paneer recipes
    else if (nameLower.includes("paneer")) {
      recipe.push({ ingredientId: "i2", quantity: 0.15 }); // 0.15kg Paneer
      recipe.push({ ingredientId: "i5", quantity: 0.1 });  // 0.1kg Tomatoes
      recipe.push({ ingredientId: "i7", quantity: 0.01 }); // 0.01kg Cow Ghee
    }
    // 3. Rice/Biryani recipes
    else if (menuItemId.includes("rice") || menuItemId.includes("biryani") || nameLower.includes("rice") || nameLower.includes("biryani")) {
      recipe.push({ ingredientId: "i1", quantity: 0.15 }); // 0.15kg Basmati Rice
      recipe.push({ ingredientId: "i7", quantity: 0.02 }); // 0.02kg Ghee
    }
    // 4. Chaap recipes
    else if (nameLower.includes("chaap")) {
      recipe.push({ ingredientId: "i6", quantity: 3 });    // 3 Soya Chaap skewers
    }
    // 5. Pizza recipes
    else if (menuItemId.includes("pizza") || nameLower.includes("pizza")) {
      recipe.push({ ingredientId: "i9", quantity: 0.12 }); // 0.12kg Mozzarella Cheese
    }
    // 6. Roti/Naan/Atta recipes
    else if (nameLower.includes("roti") || nameLower.includes("naan") || nameLower.includes("paratha") || nameLower.includes("kulcha")) {
      recipe.push({ ingredientId: "i8", quantity: 0.12 }); // 0.12kg Atta Flour
      if (nameLower.includes("butter") || nameLower.includes("ghee")) {
        recipe.push({ ingredientId: "i7", quantity: 0.01 }); // 0.01kg Cow Ghee
      }
    }
    // 7. General defaults to ensure some inventory deduction happens for testing
    else {
      recipe.push({ ingredientId: "i4", quantity: 0.05 }); // 0.05kg Potatoes as base
    }

    return recipe;
  }

  // Atomically validates and deducts inventory for transaction safety
  static validateAndDeductInventory(items: any[], isDeliveryOrTakeaway: boolean): { success: boolean; error?: string; rollback?: () => void } {
    const inventory = this.getInventory();
    const originalInventoryJson = JSON.stringify(inventory);

    // Sum up required ingredients
    const requirements: Record<string, number> = {};

    // Packaging deduction
    if (isDeliveryOrTakeaway) {
      requirements["i10"] = (requirements["i10"] || 0) + items.reduce((acc, val) => acc + (val.quantity || 1), 0);
    }

    for (const item of items) {
      const recipe = this.getRecipeForMenuItem(item.menuItemId, item.name);
      for (const ingredient of recipe) {
        requirements[ingredient.ingredientId] = (requirements[ingredient.ingredientId] || 0) + (ingredient.quantity * item.quantity);
      }
    }

    // Validate stock levels
    for (const [ingredientId, needed] of Object.entries(requirements)) {
      const stockItem = inventory.find(i => i.id === ingredientId);
      if (!stockItem) continue;

      if (stockItem.stock < needed) {
        return {
          success: false,
          error: `Insufficient stock of "${stockItem.name}". Needed: ${needed.toFixed(2)} ${stockItem.unit}, Available: ${stockItem.stock.toFixed(2)} ${stockItem.unit}. Please restock.`
        };
      }
    }

    // Deduct stock levels and raise low stock alerts
    const alertLogs: string[] = [];
    for (const [ingredientId, needed] of Object.entries(requirements)) {
      const stockItem = inventory.find(i => i.id === ingredientId);
      if (stockItem) {
        stockItem.stock = Number((stockItem.stock - needed).toFixed(3));
        if (stockItem.stock <= stockItem.minAlertLevel) {
          alertLogs.push(`Low stock alert: "${stockItem.name}" has dropped to ${stockItem.stock} ${stockItem.unit} (Min limit: ${stockItem.minAlertLevel} ${stockItem.unit}).`);
        }
      }
    }

    // Commit inventory updates
    this.saveInventory(inventory);
    this.apiSaveInventory(inventory).catch(err => {
      console.warn("[Inventory Sync Warning] Syncing to cloud ledger was scheduled.", err);
    });

    // Write alert logs to Audit log
    for (const alert of alertLogs) {
      this.addAuditLog("Inventory Warning", alert, "System (Inventory)");
    }

    const rollbackFn = () => {
      console.log("[Inventory Transaction Rollback] Restoring original stock levels.");
      const restored = JSON.parse(originalInventoryJson);
      this.saveInventory(restored);
      this.apiSaveInventory(restored).catch(e => console.error("Rollback sync failed:", e));
      this.addAuditLog("Inventory Rollback", "Restored ingredient stock levels due to order creation failure.", "System (Inventory)");
    };

    return {
      success: true,
      rollback: rollbackFn
    };
  }

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
        console.info("[Supabase Status] Sync server currently offline or table uninitialized. Reading from local persistent memory cache.");
        this.addAuditLog(
          "Supabase API Error",
          `HTTP ${status} - Failed to fetch orders from Supabase REST endpoint: ${error.message} (${error.details}). Check if 'orders' table exists in dashboard. Falling back to local ledger cache.`,
          "System (Supabase)"
        );
        return this.getOrders();
      }

      console.log("[Supabase API Response] Successfully fetched orders:", data);

      // Translate snake_case keys back to client camelCase
      const remoteOrders: Order[] = (data || []).map((item: any) => ({
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

      // Merge local un-synced orders to prevent loss of data
      const localOrders = this.getOrders();
      const mergedOrders = [...remoteOrders];
      for (const localOrd of localOrders) {
        if (!mergedOrders.some(o => o.id === localOrd.id)) {
          mergedOrders.push(localOrd);
        }
      }

      // Sort by date descending
      mergedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      this.saveOrders(mergedOrders);
      return mergedOrders;
    } catch (err: any) {
      console.info("[Supabase Transport Notice] Server endpoint was bypassed. Safe local persistent memory storage read instead.");
      this.addAuditLog(
        "Supabase Bridge Offline",
        `Transport link notice: ${err.message || err.toString()}. Reading orders offline from local disk cache.`,
        "System (Offline)"
      );
      return this.getOrders();
    }
  }

  static async apiAddOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
    // Fingerprint request deduplication check to prevent duplicate clicks and rapid retries
    const signature = `${order.orderType}_${order.tableNumber || ""}_${order.customerName}_${order.subtotal}_${order.items.map(i => `${i.menuItemId}:${i.quantity}:${i.customization || ""}`).join(",")}`;
    const now = Date.now();
    const lastTime = this.lastOrderSignatures.get(signature);
    if (lastTime && now - lastTime < 400) {
      console.warn("[Deduplication] Duplicate order submission detected. Rejecting duplicate request.");
      const lastOrders = this.getOrders();
      if (lastOrders.length > 0) {
        return lastOrders[0];
      }
      throw new Error("Duplicate order submission detected.");
    }
    this.lastOrderSignatures.set(signature, now);

    // Core boundary validation for Table QR code source
    if (order.orderType === "dine-in") {
      if (!order.tableNumber) {
        throw new Error("Missing Table Number: Dine-In checkout requires a scanned table QR source.");
      }
      const validTables = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
      if (!validTables.includes(order.tableNumber)) {
        throw new Error(`Invalid QR Code Source: Table number #${order.tableNumber} is not registered in our dining area.`);
      }
    }

    // Same Day Bill Merging Engine
    const orders = this.getOrders();
    const todayStr = new Date().toDateString();
    
    let existingOrder = orders.find(o => {
      // Same business day
      const orderDateStr = new Date(o.createdAt).toDateString();
      if (orderDateStr !== todayStr) return false;

      // Status is OPEN (i.e. unpaid pending and not cancelled/served/delivered)
      if (o.paymentStatus !== "Pending") return false;
      if (["Cancelled", "Served", "Delivered"].includes(o.orderStatus)) return false;

      // Same branch
      if (o.branch !== order.branch) return false;

      // Same table or customer
      const isSameTable = o.orderType === "dine-in" && order.orderType === "dine-in" && o.tableNumber && o.tableNumber === order.tableNumber;
      const isSameCustomer = (o.phoneNumber && o.phoneNumber === order.phoneNumber) || 
                             (o.customerName && o.customerName.toLowerCase() === order.customerName.toLowerCase() && o.customerName.toLowerCase() !== "guest user" && o.customerName.toLowerCase() !== "anonymous");

      return isSameTable || isSameCustomer;
    });

    if (existingOrder) {
      console.log(`[Bill Merging Engine] Found eligible open order ${existingOrder.id}. Merging items...`);
      
      // 1. Append new items
      const mergedItems = [...existingOrder.items];
      for (const newItem of order.items) {
        const existingIdx = mergedItems.findIndex(it => it.menuItemId === newItem.menuItemId && it.customization === newItem.customization);
        if (existingIdx > -1) {
          mergedItems[existingIdx].quantity += newItem.quantity;
        } else {
          mergedItems.push({ ...newItem });
        }
      }

      // 2. Recalculate totals
      const newSubtotal = mergedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      const newGst = Math.round(newSubtotal * 0.05);
      const newPackaging = existingOrder.orderType === "dine-in" ? 0 : 25;
      const newDiscount = existingOrder.discountAmount + (order.discountAmount || 0);
      let newGrand = newSubtotal + newGst + newPackaging - newDiscount;
      if (newGrand < 0) newGrand = 0;

      // Update values
      existingOrder.items = mergedItems;
      existingOrder.subtotal = newSubtotal;
      existingOrder.gst = newGst;
      existingOrder.packagingCharge = newPackaging;
      existingOrder.discountAmount = newDiscount;
      existingOrder.grandTotal = newGrand;
      existingOrder.createdAt = new Date().toISOString(); // Update timestamp as requested

      // 3. Save to Supabase
      const payload = {
        items: existingOrder.items,
        subtotal: Number(existingOrder.subtotal),
        gst: Number(existingOrder.gst),
        packaging_charge: Number(existingOrder.packagingCharge),
        discount_amount: Number(existingOrder.discountAmount),
        grand_total: Number(existingOrder.grandTotal),
        created_at: existingOrder.createdAt
      };

      try {
        await supabase.from("orders").update(payload).eq("id", existingOrder.id);
        await supabase.from("order_items").delete().eq("order_id", existingOrder.id);
        await this.apiAddOrderItems(existingOrder.id, existingOrder.items);
      } catch (err) {
        console.warn("[Supabase Merge Sync Warning] Handled locally:", err);
      }

      // 4. Update locally
      const updatedOrders = orders.map(o => o.id === existingOrder!.id ? existingOrder! : o);
      this.saveOrders(updatedOrders);

      // 5. Generate and Print Incremental KOT containing ONLY the newly added items!
      const kotNumber = this.getNextKOTNumber();

      const freshKOT: KOT = {
        id: kotNumber,
        orderId: existingOrder.id,
        tableNumber: existingOrder.tableNumber || "Takeaway",
        customerName: existingOrder.customerName,
        orderType: existingOrder.orderType,
        status: "New Order",
        specialInstructions: order.items.map(i => i.customization).filter(Boolean).join(", ") || "None",
        createdAt: existingOrder.createdAt,
        preparationTime: 15,
        items: order.items // Print ONLY the newly added items!
      };

      await this.apiAddKOT(freshKOT);

      // 6. Automatically queue print job to Cutie Printer!
      try {
        const CutiePrinterModule = (await import("./printerService")).CutiePrinter;
        await CutiePrinterModule.enqueue(freshKOT);
      } catch (printErr) {
        console.error("Cutie Printer enqueue failed:", printErr);
      }

      // 7. Save Audit Log
      this.addAuditLog(
        "Bill Merged",
        `Order items merged into existing open Bill ${existingOrder.id}. Incremental KOT generated: ${kotNumber}. New Grand Total: ₹${existingOrder.grandTotal}`,
        "System"
      );

      // Notify live tabs
      const event = new CustomEvent("new_order", { detail: existingOrder });
      window.dispatchEvent(event);

      return existingOrder;
    }

    // Enterprise Recipe and Inventory Validation and Deduction Engine
    const isDeliveryOrTakeaway = order.orderType === "delivery" || order.orderType === "takeaway";
    const invTx = this.validateAndDeductInventory(order.items, isDeliveryOrTakeaway);
    if (!invTx.success) {
      throw new Error(invTx.error);
    }

    const ordersList = this.getOrders();
    const newId = `SR-${1000 + ordersList.length + Math.floor(Math.random() * 100)}`;
    const kotNumber = this.getNextKOTNumber();

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
      kot_number: kotNumber,
      branch: fullOrder.branch || null
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

        // Queue print job to Cutie Printer automatically!
        try {
          const CutiePrinterModule = (await import("./printerService")).CutiePrinter;
          await CutiePrinterModule.enqueue(freshKOT);
        } catch (printErr) {
          console.error("Cutie Printer enqueue failed:", printErr);
        }
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
      console.warn("[Supabase Sync Offline Fallback] Falling back to offline-first cache engine:", err);
      this.addAuditLog(
        "Supabase Sync Bypass",
        `Database connection was bypassed. Order stored in local persistent cache instead. Message: ${err.message || err}`,
        "System"
      );

      // Save KOT locally
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

        // Record every generated KOT in the audit log with precise details
        const logDetails = `KOT Number: ${freshKOT.id}, Order Number: ${freshKOT.orderId}, Bill Number: ${freshKOT.orderId}, Table Number: ${freshKOT.tableNumber}, Timestamp: ${freshKOT.createdAt || new Date().toISOString()}, User/Captain: Captain, Print Status: Pending`;
        this.addAuditLog("KOT Generated", logDetails, "Captain");

        // Queue print job to Cutie Printer automatically!
        try {
          const CutiePrinterModule = (await import("./printerService")).CutiePrinter;
          await CutiePrinterModule.enqueue(freshKOT);
        } catch (printErr) {
          console.error("Cutie Printer enqueue failed:", printErr);
        }
      } catch (kotErr) {
        console.warn("Local KOT save warning:", kotErr);
      }

      // Save order locally
      const current = this.getOrders();
      current.unshift(fullOrder);
      this.saveOrders(current);
      
      const event = new CustomEvent("new_order", { detail: fullOrder });
      window.dispatchEvent(event);

      return fullOrder;
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
        console.info("[Supabase Status] Menu catalog table uninitialized or offline. Safely loading from local memory cache.");
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
      console.info("[Supabase Status] Menu Transport sync bypassed. Reading catalog offline.");
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
        googleMapsUrl: item.google_maps_url || "",
        gstNumber: item.gst_number || "07AAAAA1111A1Z1"
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
      google_maps_url: settings.googleMapsUrl,
      gst_number: settings.gstNumber || ""
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

      const remoteKOTs: KOT[] = (data || []).map((item: any) => ({
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

      // Merge local un-synced KOTs to prevent loss of data
      const localKOTs = this.getKOTs();
      const mergedKOTs = [...remoteKOTs];
      for (const localKot of localKOTs) {
        if (!mergedKOTs.some(k => k.id === localKot.id)) {
          mergedKOTs.push(localKot);
        }
      }

      // Sort by date descending
      mergedKOTs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      this.saveKOTs(mergedKOTs);
      return mergedKOTs;
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

      // Record every generated KOT in the audit log with precise details
      const logDetails = `KOT Number: ${kot.id}, Order Number: ${kot.orderId}, Bill Number: ${kot.orderId}, Table Number: ${kot.tableNumber}, Timestamp: ${kot.createdAt || new Date().toISOString()}, User/Captain: Captain, Print Status: ${kot.printed ? "Printed" : "Pending"}`;
      this.addAuditLog("KOT Generated", logDetails, "Captain");
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

  static getSupportTickets(): SupportTicket[] {
    const stored = localStorage.getItem("sr_support_tickets");
    if (!stored) {
      localStorage.setItem("sr_support_tickets", JSON.stringify(defaultSupportTickets));
      return defaultSupportTickets;
    }
    return JSON.parse(stored);
  }

  static saveSupportTickets(tickets: SupportTicket[]): void {
    localStorage.setItem("sr_support_tickets", JSON.stringify(tickets));
    window.dispatchEvent(new Event("storage"));
  }

  static addSupportTicket(ticket: Omit<SupportTicket, "id" | "createdAt" | "replies" | "unreadUpdate">): SupportTicket {
    const tickets = this.getSupportTickets();
    const nextNum = tickets.length > 0 
      ? Math.max(...tickets.map(t => parseInt(t.id.replace("TKT-", ""), 10) || 1000)) + 1 
      : 1001;
    const newId = `TKT-${nextNum}`;

    const newTicket: SupportTicket = {
      ...ticket,
      id: newId,
      createdAt: new Date().toISOString(),
      replies: [
        {
          id: `rep-${Date.now()}`,
          author: "Owner",
          message: ticket.description,
          createdAt: new Date().toISOString()
        }
      ]
    };

    tickets.unshift(newTicket);
    this.saveSupportTickets(tickets);
    this.addAuditLog("Support Ticket Created", `Submitted ticket ${newId}: ${ticket.subject}`, "Admin");
    return newTicket;
  }

  static updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): void {
    const tickets = this.getSupportTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, ...updates };
      }
      return t;
    });
    this.saveSupportTickets(updated);
  }

  static addTicketReply(ticketId: string, author: string, message: string): void {
    const tickets = this.getSupportTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const newReply: TicketReply = {
          id: `rep-${Date.now()}`,
          author,
          message,
          createdAt: new Date().toISOString()
        };
        const updatedReplies = [...t.replies, newReply];
        // If support agent replies, mark as unreadUpdate for the owner
        const isAgent = author === "Support Agent";
        return { 
          ...t, 
          replies: updatedReplies, 
          unreadUpdate: isAgent ? true : t.unreadUpdate 
        };
      }
      return t;
    });
    this.saveSupportTickets(updated);
    this.addAuditLog("Support Ticket Replied", `Reply added to ticket ${ticketId} by ${author}`, "Admin");
  }

  // Shifts
  static getShifts(): Shift[] {
    const stored = localStorage.getItem("sr_shifts");
    if (!stored) {
      localStorage.setItem("sr_shifts", JSON.stringify(defaultShifts));
      return defaultShifts;
    }
    return JSON.parse(stored);
  }

  static saveShifts(shifts: Shift[]): void {
    localStorage.setItem("sr_shifts", JSON.stringify(shifts));
    window.dispatchEvent(new Event("storage"));
  }

  // Employees
  static getEmployees(): Employee[] {
    const stored = localStorage.getItem("sr_employees");
    if (!stored) {
      localStorage.setItem("sr_employees", JSON.stringify(defaultEmployees));
      return defaultEmployees;
    }
    return JSON.parse(stored);
  }

  static saveEmployees(employees: Employee[]): void {
    localStorage.setItem("sr_employees", JSON.stringify(employees));
    window.dispatchEvent(new Event("storage"));
  }

  static addEmployee(employee: Omit<Employee, "id" | "joinedDate">): Employee {
    const employees = this.getEmployees();
    const nextId = employees.length > 0
      ? Math.max(...employees.map(e => parseInt(e.id.replace("EMP-", ""), 10) || 100)) + 1
      : 101;
    const newEmployee: Employee = {
      ...employee,
      id: `EMP-${nextId}`,
      joinedDate: new Date().toISOString().split("T")[0]
    };
    employees.push(newEmployee);
    this.saveEmployees(employees);
    this.addAuditLog("Employee Hired", `Added new employee ${newEmployee.name} as ${newEmployee.role}`, "Admin");
    return newEmployee;
  }

  static updateEmployee(employeeId: string, updates: Partial<Employee>): void {
    const employees = this.getEmployees();
    const updated = employees.map(e => {
      if (e.id === employeeId) {
        return { ...e, ...updates };
      }
      return e;
    });
    this.saveEmployees(updated);
  }

  // Attendance Records
  static getAttendance(): AttendanceRecord[] {
    const stored = localStorage.getItem("sr_attendance");
    if (!stored) {
      localStorage.setItem("sr_attendance", JSON.stringify(defaultAttendance));
      return defaultAttendance;
    }
    return JSON.parse(stored);
  }

  static saveAttendance(records: AttendanceRecord[]): void {
    localStorage.setItem("sr_attendance", JSON.stringify(records));
    window.dispatchEvent(new Event("storage"));
  }

  static addAttendanceRecord(record: Omit<AttendanceRecord, "id">): AttendanceRecord {
    const records = this.getAttendance();
    const nextId = records.length > 0
      ? Math.max(...records.map(r => parseInt(r.id.replace("ATT-", ""), 10) || 1000)) + 1
      : 1001;
    const newRecord: AttendanceRecord = {
      ...record,
      id: `ATT-${nextId}`
    };
    records.unshift(newRecord);
    this.saveAttendance(records);
    return newRecord;
  }

  static updateAttendanceRecord(recordId: string, updates: Partial<AttendanceRecord>): void {
    const records = this.getAttendance();
    const updated = records.map(r => {
      if (r.id === recordId) {
        return { ...r, ...updates };
      }
      return r;
    });
    this.saveAttendance(updated);
  }

  // Leave Requests
  static getLeaveRequests(): LeaveRequest[] {
    const stored = localStorage.getItem("sr_leave_requests");
    if (!stored) {
      localStorage.setItem("sr_leave_requests", JSON.stringify(defaultLeaves));
      return defaultLeaves;
    }
    return JSON.parse(stored);
  }

  static saveLeaveRequests(requests: LeaveRequest[]): void {
    localStorage.setItem("sr_leave_requests", JSON.stringify(requests));
    window.dispatchEvent(new Event("storage"));
  }

  static addLeaveRequest(req: Omit<LeaveRequest, "id" | "createdAt">): LeaveRequest {
    const requests = this.getLeaveRequests();
    const nextId = requests.length > 0
      ? Math.max(...requests.map(r => parseInt(r.id.replace("LR-", ""), 10) || 1000)) + 1
      : 1001;
    const newRequest: LeaveRequest = {
      ...req,
      id: `LR-${nextId}`,
      createdAt: new Date().toISOString()
    };
    requests.unshift(newRequest);
    this.saveLeaveRequests(requests);
    return newRequest;
  }

  static updateLeaveRequest(reqId: string, status: LeaveRequest["status"]): void {
    const requests = this.getLeaveRequests();
    const updated = requests.map(r => {
      if (r.id === reqId) {
        // If approved, update attendance logs for that range to "On Leave"
        if (status === "Approved") {
          const emp = this.getEmployees().find(e => e.id === r.employeeId);
          if (emp) {
            // Generate attendance records of status "On Leave" for those dates
            const start = new Date(r.startDate);
            const end = new Date(r.endDate);
            const attendance = this.getAttendance();
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split("T")[0];
              // Check if already exists
              const existingIndex = attendance.findIndex(a => a.employeeId === r.employeeId && a.date === dateStr);
              if (existingIndex !== -1) {
                attendance[existingIndex].status = "On Leave";
              } else {
                const nextIdVal = attendance.length > 0
                  ? Math.max(...attendance.map(a => parseInt(a.id.replace("ATT-", ""), 10) || 1000)) + 1
                  : 1001;
                attendance.unshift({
                  id: `ATT-${nextIdVal}`,
                  employeeId: r.employeeId,
                  date: dateStr,
                  shiftId: emp.shiftId,
                  checkIn: null,
                  checkOut: null,
                  status: "On Leave",
                  lateMinutes: 0,
                  overtimeMinutes: 0,
                  totalWorkingMinutes: 0,
                  syncSource: "Manual"
                });
              }
            }
            this.saveAttendance(attendance);
          }
        }
        return { ...r, status };
      }
      return r;
    });
    this.saveLeaveRequests(updated);
    this.addAuditLog("Leave Request Updated", `Leave request ${reqId} changed to ${status}`, "Admin");
  }

  // Biometric Devices
  static getBiometricDevices(): BiometricDevice[] {
    const stored = localStorage.getItem("sr_biometric_devices");
    if (!stored) {
      localStorage.setItem("sr_biometric_devices", JSON.stringify(defaultDevices));
      return defaultDevices;
    }
    return JSON.parse(stored);
  }

  static saveBiometricDevices(devices: BiometricDevice[]): void {
    localStorage.setItem("sr_biometric_devices", JSON.stringify(devices));
    window.dispatchEvent(new Event("storage"));
  }

  static addBiometricDevice(device: Omit<BiometricDevice, "id" | "lastSyncTime">): BiometricDevice {
    const devices = this.getBiometricDevices();
    const nextId = devices.length > 0
      ? Math.max(...devices.map(d => parseInt(d.id.replace("DEV-", ""), 10) || 0)) + 1
      : 1;
    const newDevice: BiometricDevice = {
      ...device,
      id: `DEV-${nextId}`,
      lastSyncTime: null
    };
    devices.push(newDevice);
    this.saveBiometricDevices(devices);
    this.addAuditLog("Biometric Terminal Registered", `Registered ${newDevice.name} device at ${newDevice.ipAddress}`, "Admin");
    return newDevice;
  }

  // Biometric Raw Logs
  static getBiometricRawLogs(): BiometricRawLog[] {
    const stored = localStorage.getItem("sr_biometric_raw_logs");
    if (!stored) {
      localStorage.setItem("sr_biometric_raw_logs", JSON.stringify(defaultBiometricLogs));
      return defaultBiometricLogs;
    }
    return JSON.parse(stored);
  }

  static saveBiometricRawLogs(logs: BiometricRawLog[]): void {
    localStorage.setItem("sr_biometric_raw_logs", JSON.stringify(logs));
    window.dispatchEvent(new Event("storage"));
  }

  static addBiometricRawLog(log: Omit<BiometricRawLog, "id">): BiometricRawLog {
    const logs = this.getBiometricRawLogs();
    const nextId = `LOG-${Date.now()}`;
    const newLog: BiometricRawLog = {
      ...log,
      id: nextId
    };
    logs.unshift(newLog);
    this.saveBiometricRawLogs(logs);
    return newLog;
  }

  // Simulate Device Poll Sync Operation
  static syncAttendanceFromBiometrics(deviceId: string): { syncedCount: number, errorLogs: string[] } {
    const devices = this.getBiometricDevices();
    const deviceIndex = devices.findIndex(d => d.id === deviceId);
    if (deviceIndex === -1) {
      return { syncedCount: 0, errorLogs: ["Device not found"] };
    }

    if (devices[deviceIndex].status === "Offline") {
      return { syncedCount: 0, errorLogs: ["Failed to connect: Terminal is currently offline."] };
    }

    const employees = this.getEmployees();
    const rawLogs = this.getBiometricRawLogs();
    const attendance = this.getAttendance();
    const shifts = this.getShifts();

    let syncedCount = 0;
    const errorLogs: string[] = [];

    // Filter logs for this device
    const deviceLogs = rawLogs.filter(log => log.deviceId === deviceId);

    deviceLogs.forEach(log => {
      // Find employee associated with this biometric ID
      const emp = employees.find(e => e.biometricId === log.biometricId);
      if (!emp) {
        errorLogs.push(`Unknown biometric credential ID: ${log.biometricId}`);
        return;
      }

      // Sync log timestamp
      const logTime = new Date(log.timestamp);
      const dateStr = logTime.toISOString().split("T")[0]; // YYYY-MM-DD

      // Find shift assigned or S-1 as fallback
      const shift = shifts.find(s => s.id === emp.shiftId) || shifts[0];
      
      // Check if an attendance record exists for this employee on this date
      const existingIdx = attendance.findIndex(att => att.employeeId === emp.id && att.date === dateStr);

      if (existingIdx === -1) {
        // Create new record with Check-In
        // Determine Status based on shift start time + graceMinutes
        const [shiftH, shiftM] = shift.startTime.split(":").map(Number);
        const [logH, logM] = [logTime.getUTCHours(), logTime.getUTCMinutes()]; // match standard UTC time
        
        const shiftStartMinutes = shiftH * 60 + shiftM;
        const logMinutes = logH * 60 + logM;

        let status: AttendanceRecord["status"] = "Present";
        let lateMinutes = 0;

        if (logMinutes > shiftStartMinutes + shift.graceMinutes) {
          status = "Late";
          lateMinutes = logMinutes - shiftStartMinutes;
        }

        const nextAttNum = attendance.length > 0
          ? Math.max(...attendance.map(a => parseInt(a.id.replace("ATT-", ""), 10) || 1000)) + 1
          : 1001;

        attendance.unshift({
          id: `ATT-${nextAttNum}`,
          employeeId: emp.id,
          date: dateStr,
          shiftId: shift.id,
          checkIn: log.timestamp,
          checkOut: null,
          status: status,
          lateMinutes: lateMinutes,
          overtimeMinutes: 0,
          totalWorkingMinutes: 0,
          syncSource: devices[deviceIndex].model.includes("ZKTeco") ? "ZKTeco Terminal" : "eSSL Terminal",
          rawLogId: log.id
        });

        syncedCount++;
      } else {
        // Update Check-Out if it's currently null and this log is later than check-in
        const record = attendance[existingIdx];
        if (record.checkIn && !record.checkOut) {
          const checkInTime = new Date(record.checkIn);
          if (logTime > checkInTime) {
            // Calculate total working minutes and overtime
            const diffMs = logTime.getTime() - checkInTime.getTime();
            const workedMinutes = Math.floor(diffMs / 60000) - shift.breakMinutes;
            
            // Expected shift duration
            const [startH, startM] = shift.startTime.split(":").map(Number);
            const [endH, endM] = shift.endTime.split(":").map(Number);
            let expectedMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (expectedMinutes < 0) expectedMinutes += 24 * 60; // overnight shift
            expectedMinutes -= shift.breakMinutes;

            let overtimeMinutes = 0;
            if (workedMinutes > expectedMinutes) {
              overtimeMinutes = workedMinutes - expectedMinutes;
            }

            record.checkOut = log.timestamp;
            record.totalWorkingMinutes = workedMinutes < 0 ? 0 : workedMinutes;
            record.overtimeMinutes = overtimeMinutes;

            syncedCount++;
          }
        }
      }
    });

    // Update last sync time of device
    devices[deviceIndex].lastSyncTime = new Date().toISOString();
    this.saveBiometricDevices(devices);
    this.saveAttendance(attendance);

    this.addAuditLog(
      "Biometric Terminal Sync", 
      `Synced logs from ${devices[deviceIndex].name}. Synchronized ${syncedCount} log entries. Errors: ${errorLogs.length}`, 
      "Support Agent"
    );

    return { syncedCount, errorLogs };
  }
}

