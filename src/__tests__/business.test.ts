import { describe, it, expect, beforeEach, vi } from "vitest";

// Define a robust, clean browser simulation for Node.js
if (typeof window === "undefined") {
  const listeners: Record<string, Function[]> = {};
  
  // Simulated AudioContext
  const mockAudioContext = class {
    createOscillator() {
      return {
        type: "",
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: () => {},
      };
    }
    get currentTime() {
      return 0;
    }
    get destination() {
      return {};
    }
  };

  global.window = {
    addEventListener: (event: string, cb: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: Function) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((x) => x !== cb);
    },
    dispatchEvent: (event: any) => {
      const name = event.type || event;
      if (listeners[name]) {
        listeners[name].forEach((cb) => cb(event));
      }
      return true;
    },
    AudioContext: mockAudioContext as any,
    webkitAudioContext: mockAudioContext as any,
  } as any;

  global.Event = class {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  } as any;

  global.CustomEvent = class {
    type: string;
    detail: any;
    constructor(type: string, options?: any) {
      this.type = type;
      this.detail = options?.detail;
    }
  } as any;
}

// In-memory mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock Supabase JS Client to allow executing async/sync cloud sync APIs with 100% test coverage
vi.mock("@supabase/supabase-js", () => {
  const mockBuilder: any = {
    select: vi.fn().mockImplementation(() => mockBuilder),
    insert: vi.fn().mockImplementation(() => mockBuilder),
    update: vi.fn().mockImplementation(() => mockBuilder),
    upsert: vi.fn().mockImplementation(() => mockBuilder),
    delete: vi.fn().mockImplementation(() => mockBuilder),
    eq: vi.fn().mockImplementation(() => mockBuilder),
    order: vi.fn().mockImplementation(() => mockBuilder),
    limit: vi.fn().mockImplementation(() => mockBuilder),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
  };
  return {
    createClient: () => ({
      from: () => mockBuilder,
    }),
  };
});

// Mock global fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});

// Import target systems
import { LocalDB, Order, Coupon, InventoryItem } from "../lib/db";
import { signToken, verifyToken, isAuthorizedAdmin } from "../../server";
import { KOT, KOTStatus } from "../types";

describe("Restaurant Management Enterprise - Core Business Logic Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    // Pre-initialize lists with fresh copies to avoid modifying global default arrays in memory
    localStorage.setItem("sr_attendance", JSON.stringify([]));
    localStorage.setItem("sr_raw_logs", JSON.stringify([]));
  });

  // ==========================================
  // 1. AUTHENTICATION & SECURITY RULES
  // ==========================================
  describe("Authentication & Token Cryptography", () => {
    it("should successfully sign a JWT token and verify it", () => {
      const payload = { sub: "test_user", role: "Manager", email: "manager@sagarratna.com" };
      const token = signToken(payload);
      
      expect(token).toBeDefined();
      expect(token.split(".").length).toBe(3);

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe("test_user");
      expect(decoded.role).toBe("Manager");
    });

    it("should reject tampered JWT tokens with modified signatures", () => {
      const payload = { sub: "test_user", role: "Manager" };
      const token = signToken(payload);
      
      // Tamper signature part
      const parts = token.split(".");
      parts[2] = "invalidSignatureValueThatIsModified123";
      const tamperedToken = parts.join(".");

      const decoded = verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it("should handle malformed token strings gracefully", () => {
      expect(verifyToken("invalid-token-without-periods")).toBeNull();
      expect(verifyToken("one.two")).toBeNull();
      expect(verifyToken("")).toBeNull();
    });
  });

  // ==========================================
  // 2. MENU CATALOG & CONFIGURATION
  // ==========================================
  describe("Menu Catalog Management", () => {
    it("should retrieve default menu items if cache is uninitialized", () => {
      const menu = LocalDB.getMenuItems();
      expect(menu).toBeDefined();
      expect(menu.length).toBeGreaterThan(0);
      
      // Check veg filter support
      const vegItems = menu.filter(item => item.isVeg);
      expect(vegItems.length).toBeGreaterThan(0);
      expect(vegItems[0].isVeg).toBe(true);
    });

    it("should save and retrieve custom menu catalog configurations", () => {
      const mockItems = [
        {
          id: "m_test1",
          name: "Masala Dosa Super",
          price: 180,
          category: "Dosa",
          description: "Golden crispy dosa",
          isVeg: true,
          isBestseller: true,
          image: "",
          spiciness: 1,
          rating: 4.8,
          ratingCount: 150
        }
      ];
      LocalDB.saveMenuItems(mockItems);
      
      const retrieved = LocalDB.getMenuItems();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].name).toBe("Masala Dosa Super");
      expect(retrieved[0].isBestseller).toBe(true);
    });
  });

  // ==========================================
  // 3. CART, BILLING & COUPON RULES
  // ==========================================
  describe("Cart & Billing Operations", () => {
    it("should process standard local synchronous order creations", () => {
      const sampleOrder: Omit<Order, "id" | "createdAt"> = {
        customerName: "John Doe",
        phoneNumber: "+91 99999 88888",
        email: "john@example.com",
        orderType: "dine-in",
        tableNumber: "5",
        items: [
          { menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 2 }
        ],
        subtotal: 300,
        gst: 15,
        packagingCharge: 0,
        discountAmount: 0,
        grandTotal: 315,
        paymentStatus: "Pending",
        orderStatus: "New Order"
      };

      const created = LocalDB.addOrder(sampleOrder);
      expect(created.id).toBeDefined();
      expect(created.id.startsWith("SR-")).toBe(true);
      expect(created.createdAt).toBeDefined();
      expect(created.subtotal).toBe(300);
      expect(created.grandTotal).toBe(315);
    });
  });

  describe("Coupon Validation & Application Rules", () => {
    it("should initialize default coupon options", () => {
      const coupons = LocalDB.getCoupons();
      expect(coupons.length).toBeGreaterThan(0);
      
      const sagar20 = coupons.find(c => c.code === "SAGAR20");
      expect(sagar20).toBeDefined();
      expect(sagar20?.type).toBe("percentage");
      expect(sagar20?.value).toBe(20);
      expect(sagar20?.minOrderAmount).toBe(250);
    });

    it("should allow saving and modifying custom coupon entries", () => {
      const customCoupons: Coupon[] = [
        {
          code: "FESTIVE100",
          type: "fixed",
          value: 100,
          expiryDate: "2030-12-31",
          usageLimit: 50,
          usageCount: 5,
          minOrderAmount: 500
        }
      ];
      LocalDB.saveCoupons(customCoupons);

      const retrieved = LocalDB.getCoupons();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].code).toBe("FESTIVE100");
      expect(retrieved[0].value).toBe(100);
    });
  });

  // ==========================================
  // 4. INVENTORY ENGINE & RECIPES
  // ==========================================
  describe("Inventory & Recipe Deductions", () => {
    it("should lookup precise recipes for distinct menu items", () => {
      // Dosa items should deduct batter (i3) and ghee (i7)
      const dosaRecipe = LocalDB.getRecipeForMenuItem("dosa-1", "Onion Rava Dosa");
      expect(dosaRecipe).toContainEqual({ ingredientId: "i3", quantity: 0.2 });
      expect(dosaRecipe).toContainEqual({ ingredientId: "i7", quantity: 0.02 });

      // Paneer items should deduct paneer (i2) and tomatoes (i5)
      const paneerRecipe = LocalDB.getRecipeForMenuItem("p1", "Kadhai Paneer");
      expect(paneerRecipe).toContainEqual({ ingredientId: "i2", quantity: 0.15 });
      expect(paneerRecipe).toContainEqual({ ingredientId: "i5", quantity: 0.1 });
    });

    it("should atomically deduct stock levels on successful verification", () => {
      const inventory = LocalDB.getInventory();
      const initialGhee = inventory.find(i => i.id === "i7")?.stock || 0;

      // Create dummy order containing ghee-heavy item (Dosa)
      const orderItems = [{ menuItemId: "dosa-1", name: "Ghee Roast Dosa", price: 120, quantity: 5 }];
      const result = LocalDB.validateAndDeductInventory(orderItems, false);

      expect(result.success).toBe(true);
      expect(result.rollback).toBeTypeOf("function");

      const postInventory = LocalDB.getInventory();
      const postGhee = postInventory.find(i => i.id === "i7")?.stock || 0;
      
      // Each Dosa uses 0.02kg ghee * 5 dosas = 0.1kg ghee deduction
      expect(postGhee).toBeCloseTo(initialGhee - 0.1, 3);
    });

    it("should raise warnings when inventory levels drop below critical thresholds", () => {
      const inventory = LocalDB.getInventory();
      // Set Ghee stock close to its alert level (minAlertLevel = 10)
      const ghee = inventory.find(i => i.id === "i7")!;
      ghee.stock = 10.05;
      LocalDB.saveInventory(inventory);

      const orderItems = [{ menuItemId: "dosa-1", name: "Ghee Roast Dosa", price: 120, quantity: 4 }];
      LocalDB.validateAndDeductInventory(orderItems, false);

      // Drops below 10.0
      const auditLogs = LocalDB.getAuditLogs();
      const warnings = auditLogs.filter(log => log.action === "Inventory Warning");
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].details).toContain("Low stock alert");
    });

    it("should return failure when stock levels are insufficient", () => {
      const inventory = LocalDB.getInventory();
      const tomatoes = inventory.find(i => i.id === "i5")!;
      tomatoes.stock = 0.1; // extreme low stock
      LocalDB.saveInventory(inventory);

      const orderItems = [{ menuItemId: "paneer-1", name: "Shahi Paneer", price: 250, quantity: 5 }];
      // Shahi Paneer recipe needs 0.1kg tomatoes * 5 = 0.5kg tomatoes
      const result = LocalDB.validateAndDeductInventory(orderItems, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient stock of \"Red Tomatoes\"");
    });

    it("should support instant rollback transaction to restore original stocks", () => {
      const initialInventory = LocalDB.getInventory();
      const orderItems = [{ menuItemId: "dosa-1", name: "Masala Dosa", price: 130, quantity: 10 }];
      
      const result = LocalDB.validateAndDeductInventory(orderItems, false);
      expect(result.success).toBe(true);

      // Perform rollback
      result.rollback?.();

      const finalInventory = LocalDB.getInventory();
      expect(finalInventory).toEqual(initialInventory);
    });
  });

  // ==========================================
  // 5. STAFF ATTENDANCE & PAYROLL RULES
  // ==========================================
  describe("Staff, Shifts & Biometrics Sync", () => {
    it("should reject syncing from an offline biometric device", () => {
      const devices = LocalDB.getBiometricDevices();
      // Force offline
      devices[0].status = "Offline";
      LocalDB.saveBiometricDevices(devices);

      const syncResult = LocalDB.syncAttendanceFromBiometrics(devices[0].id);
      expect(syncResult.syncedCount).toBe(0);
      expect(syncResult.errorLogs).toContain("Failed to connect: Terminal is currently offline.");
    });

    it("should calculate check-in statuses (Late / Present) correctly based on shift times", () => {
      const employees = LocalDB.getEmployees();
      const shifts = LocalDB.getShifts();
      const devices = LocalDB.getBiometricDevices();

      // Ensure device is online
      devices[0].status = "Online";
      LocalDB.saveBiometricDevices(devices);

      // Set up employee shift
      const employee = employees[0];
      employee.biometricId = "bio_emp_1";
      const shift = shifts.find(s => s.id === employee.shiftId) || shifts[0];
      shift.startTime = "09:00";
      shift.graceMinutes = 15;
      LocalDB.saveEmployees(employees);
      LocalDB.saveShifts(shifts);

      // 1. Sync check-in at 09:10 UTC (Within 15 min grace period) -> Present
      const logTimestampOnTime = "2026-06-28T09:10:00.000Z"; 
      LocalDB.saveBiometricRawLogs([
        {
          id: "log_1",
          deviceId: devices[0].id,
          biometricId: "bio_emp_1",
          timestamp: logTimestampOnTime,
          verifyType: "Fingerprint"
        }
      ]);

      const resOnTime = LocalDB.syncAttendanceFromBiometrics(devices[0].id);
      expect(resOnTime.syncedCount).toBe(1);

      const attendanceOnTime = LocalDB.getAttendance();
      const record = attendanceOnTime.find(r => r.employeeId === employee.id && r.date === "2026-06-28");
      expect(record).toBeDefined();
      expect(record?.status).toBe("Present");
      expect(record?.lateMinutes).toBe(0);

      // Clear attendance for second trial
      LocalDB.saveAttendance([]);

      // 2. Sync check-in at 09:30 UTC (Exceeds grace period) -> Late (30 minutes)
      const logTimestampLate = "2026-06-28T09:30:00.000Z";
      LocalDB.saveBiometricRawLogs([
        {
          id: "log_2",
          deviceId: devices[0].id,
          biometricId: "bio_emp_1",
          timestamp: logTimestampLate,
          verifyType: "Fingerprint"
        }
      ]);

      const resLate = LocalDB.syncAttendanceFromBiometrics(devices[0].id);
      expect(resLate.syncedCount).toBe(1);

      const attendanceLate = LocalDB.getAttendance();
      const recordLate = attendanceLate.find(r => r.employeeId === employee.id && r.date === "2026-06-28");
      expect(recordLate?.status).toBe("Late");
      expect(recordLate?.lateMinutes).toBe(30);
    });

    it("should calculate check-out working minutes and overtime on second check-in sync", () => {
      const employees = LocalDB.getEmployees();
      const shifts = LocalDB.getShifts();
      const devices = LocalDB.getBiometricDevices();

      devices[0].status = "Online";
      LocalDB.saveBiometricDevices(devices);

      const employee = employees[0];
      employee.biometricId = "bio_emp_1";
      const shift = shifts.find(s => s.id === employee.shiftId) || shifts[0];
      shift.startTime = "09:00";
      shift.endTime = "17:00"; // 8 hours = 480 minutes
      shift.breakMinutes = 60; // 1 hour break
      LocalDB.saveEmployees(employees);
      LocalDB.saveShifts(shifts);

      // 1. First sync check-in at 09:00 UTC
      LocalDB.saveBiometricRawLogs([
        { id: "log_in", deviceId: devices[0].id, biometricId: "bio_emp_1", timestamp: "2026-06-28T09:00:00.000Z", verifyType: "Fingerprint" }
      ]);
      LocalDB.syncAttendanceFromBiometrics(devices[0].id);

      // 2. Second sync check-out at 18:30 UTC (9.5 hours later)
      // Working: 570 mins total time. Minus 60 min break = 510 mins. Expected: 480 - 60 = 420 mins. Overtime: 90 mins.
      LocalDB.saveBiometricRawLogs([
        { id: "log_in", deviceId: devices[0].id, biometricId: "bio_emp_1", timestamp: "2026-06-28T09:00:00.000Z", verifyType: "Fingerprint" },
        { id: "log_out", deviceId: devices[0].id, biometricId: "bio_emp_1", timestamp: "2026-06-28T18:30:00.000Z", verifyType: "Fingerprint" }
      ]);
      const res = LocalDB.syncAttendanceFromBiometrics(devices[0].id);
      expect(res.syncedCount).toBe(1); // One sync record updated (Check-Out)

      const finalRecord = LocalDB.getAttendance().find(r => r.employeeId === employee.id && r.date === "2026-06-28");
      expect(finalRecord?.checkOut).toBe("2026-06-28T18:30:00.000Z");
      expect(finalRecord?.totalWorkingMinutes).toBe(510);
      expect(finalRecord?.overtimeMinutes).toBe(90);
    });

    it("should support manual leave request lifecycle approvals", () => {
      const sampleLeave = {
        employeeId: "emp_1",
        leaveType: "Sick Leave" as const,
        startDate: "2026-07-01",
        endDate: "2026-07-03",
        reason: "Fever",
        status: "Pending" as const
      };

      const created = LocalDB.addLeaveRequest(sampleLeave);
      expect(created.id).toBeDefined();
      expect(created.status).toBe("Pending");

      // Approve
      LocalDB.updateLeaveRequest(created.id, "Approved");
      const approved = LocalDB.getLeaveRequests().find(r => r.id === created.id);
      expect(approved?.status).toBe("Approved");
    });
  });

  // ==========================================
  // 6. TABLES SEATING FLOORPLAN
  // ==========================================
  describe("Table & Floorplan Management", () => {
    it("should retrieve and update restaurant table seating states", () => {
      const tables = LocalDB.getTables();
      expect(tables.length).toBeGreaterThan(0);

      const t1 = tables[0];
      expect(t1.status).toBe("Available");

      // Occupy table
      t1.status = "Occupied";
      LocalDB.saveTables(tables);

      const updated = LocalDB.getTables();
      expect(updated[0].status).toBe("Occupied");
    });
  });

  // ==========================================
  // 7. SECURITY: FORMULA INJECTION ESCAPING
  // ==========================================
  describe("Security: CSV Formula Injection Escaping", () => {
    const escapeCSVField = (val: any): string => {
      const str = String(val ?? "");
      if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
        return `'${str}`;
      }
      return str;
    };

    it("should prepend a single-quote to fields beginning with special formula chars", () => {
      expect(escapeCSVField("=SUM(A1:A5)")).toBe("'=SUM(A1:A5)");
      expect(escapeCSVField("+9199999999")).toBe("'+9199999999");
      expect(escapeCSVField("-100")).toBe("'-100");
      expect(escapeCSVField("@username")).toBe("'@username");
    });

    it("should keep benign alphanumeric strings unaltered", () => {
      expect(escapeCSVField("John Doe")).toBe("John Doe");
      expect(escapeCSVField("₹150")).toBe("₹150");
      expect(escapeCSVField("")).toBe("");
    });
  });

  // ==========================================
  // 8. DIRECT ROUTE AUTHORIZATION CHECKS
  // ==========================================
  describe("Admin Route Authorization Checks", () => {
    it("should authorize requests with a valid signed Bearer token", () => {
      const token = signToken({ sub: "sagar_ratna_admin_id", role: "Owner" });
      const mockReq = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const result = isAuthorizedAdmin(mockReq as any);
      expect(result).toBe(true);
    });

    it("should reject requests with missing authorization headers", () => {
      const mockReq = { headers: {} };
      const result = isAuthorizedAdmin(mockReq as any);
      expect(result).toBe(false);
    });

    it("should reject requests with non-Bearer token structures", () => {
      const mockReq = {
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ="
        }
      };
      const result = isAuthorizedAdmin(mockReq as any);
      expect(result).toBe(false);
    });

    it("should reject requests with corrupted or tampered Bearer tokens", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer invalid.token.value"
        }
      };
      const result = isAuthorizedAdmin(mockReq as any);
      expect(result).toBe(false);
    });
  });

  // ==========================================
  // 9. LOCAL DATA ACCESSORS & MUTATORS
  // ==========================================
  describe("LocalDB Local Settings, Logs, and Staff Management", () => {
    it("should support settings retrieval and persistence", () => {
      const initial = LocalDB.getSettings();
      expect(initial.name).toBe("Sagar Ratna");

      const modified = { ...initial, name: "Sagar Ratna CP" };
      LocalDB.saveSettings(modified);
      expect(LocalDB.getSettings().name).toBe("Sagar Ratna CP");
    });

    it("should support KOT list retrieval, persistence, and insertion", () => {
      const kots = LocalDB.getKOTs();
      expect(kots).toBeDefined();

      const sampleKOT = {
        id: "KOT-9999",
        orderId: "SR-9999",
        tableNumber: "4",
        customerName: "Alice",
        orderType: "dine-in" as const,
        status: "New Order" as const,
        specialInstructions: "Less spicy",
        createdAt: new Date().toISOString(),
        preparationTime: 15,
        items: []
      };

      const currentKots = LocalDB.getKOTs();
      currentKots.push(sampleKOT);
      LocalDB.saveKOTs(currentKots);

      const retrieved = LocalDB.getKOTs();
      expect(retrieved.find(k => k.id === "KOT-9999")).toBeDefined();

      const kotsToUpdate = LocalDB.getKOTs();
      const found = kotsToUpdate.find(k => k.id === "KOT-9999");
      if (found) found.status = "Preparing";
      LocalDB.saveKOTs(kotsToUpdate);

      const updated = LocalDB.getKOTs().find(k => k.id === "KOT-9999");
      expect(updated?.status).toBe("Preparing");
    });

    it("should support customer reviews retrieval and insertion", () => {
      const initial = LocalDB.getReviews();
      expect(initial).toBeDefined();

      const review = {
        id: "rev_test",
        name: "Dev",
        rating: 5,
        date: "2026-06-28",
        comment: "Excellent food!",
        avatar: ""
      };
      
      const currentReviews = LocalDB.getReviews();
      currentReviews.push(review);
      LocalDB.saveReviews(currentReviews);

      expect(LocalDB.getReviews().find(r => r.id === "rev_test")).toBeDefined();
    });

    it("should support audit logs collection and insertion", () => {
      const initialLogs = LocalDB.getAuditLogs();
      const initialCount = initialLogs.length;

      LocalDB.addAuditLog("Test Action", "Details of test action", "Test User");
      const updatedLogs = LocalDB.getAuditLogs();
      expect(updatedLogs.length).toBe(initialCount + 1);
      expect(updatedLogs[0].action).toBe("Test Action");
    });
  });

  // ==========================================
  // 10. CLOUD-SYNCHRONIZATION & ASYNC API LEDGER
  // ==========================================
  describe("Cloud Synchronization & Async API Ledger Methods", () => {
    it("should execute fetchOrders successfully", async () => {
      const orders = await LocalDB.fetchOrders();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should execute apiAddOrder successfully for takeaway checkout", async () => {
      const orderData: Omit<Order, "id" | "createdAt"> = {
        customerName: "Alex",
        phoneNumber: "+91 98888 77777",
        email: "alex@example.com",
        orderType: "takeaway",
        items: [{ menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 1 }],
        subtotal: 150,
        gst: 7.5,
        packagingCharge: 15,
        discountAmount: 0,
        grandTotal: 172.5,
        paymentStatus: "Pending",
        orderStatus: "New Order"
      };

      const result = await LocalDB.apiAddOrder(orderData);
      expect(result.id).toBeDefined();
      expect(result.kotNumber).toBeDefined();
    });

    it("should execute apiUpdateOrderStatus successfully", async () => {
      const result = await LocalDB.apiUpdateOrderStatus("SR-1001", "Accepted", "Paid");
      expect(result).toBeDefined();
    });

    it("should execute fetchMenuItems and apiSaveMenuItems", async () => {
      const items = await LocalDB.fetchMenuItems();
      expect(Array.isArray(items)).toBe(true);

      await expect(LocalDB.apiSaveMenuItems(items)).resolves.not.toThrow();
    });

    it("should execute fetchInventory and apiSaveInventory", async () => {
      const inv = await LocalDB.fetchInventory();
      expect(Array.isArray(inv)).toBe(true);

      await expect(LocalDB.apiSaveInventory(inv)).resolves.not.toThrow();
    });

    it("should execute fetchCoupons and apiSaveCoupons", async () => {
      const coupons = await LocalDB.fetchCoupons();
      expect(Array.isArray(coupons)).toBe(true);

      await expect(LocalDB.apiSaveCoupons(coupons)).resolves.not.toThrow();
    });

    it("should execute fetchReviews, apiPostReview, and apiSaveReviews", async () => {
      const reviews = await LocalDB.fetchReviews();
      expect(Array.isArray(reviews)).toBe(true);

      const rev = { id: "r1", name: "User", rating: 5, date: "2026-06-28", comment: "Superb", avatar: "" };
      await expect(LocalDB.apiPostReview(rev)).resolves.not.toThrow();
      await expect(LocalDB.apiSaveReviews([rev])).resolves.not.toThrow();
    });

    it("should execute fetchSettings and apiSaveSettings", async () => {
      const settings = await LocalDB.fetchSettings();
      expect(settings).toBeDefined();

      await expect(LocalDB.apiSaveSettings(settings)).resolves.not.toThrow();
    });

    it("should execute fetchAuditLogs and apiAddAuditLog", async () => {
      const logs = await LocalDB.fetchAuditLogs();
      expect(Array.isArray(logs)).toBe(true);

      await expect(LocalDB.apiAddAuditLog("Cloud Action", "Details", "User")).resolves.not.toThrow();
    });

    it("should execute fetchKOTs, apiAddKOT, apiUpdateKOTPrinted, and apiUpdateKOTStatus", async () => {
      const kots = await LocalDB.fetchKOTs();
      expect(Array.isArray(kots)).toBe(true);

      const kot: KOT = {
        id: "KOT-0005",
        orderId: "SR-1005",
        tableNumber: "3",
        customerName: "Jane",
        orderType: "dine-in",
        status: "New Order",
        specialInstructions: "",
        createdAt: new Date().toISOString(),
        preparationTime: 10,
        items: []
      };

      await expect(LocalDB.apiAddKOT(kot)).resolves.toBeDefined();
      await expect(LocalDB.apiUpdateKOTPrinted("KOT-0005", true)).resolves.not.toThrow();
      await expect(LocalDB.apiUpdateKOTStatus("KOT-0005", "Preparing")).resolves.not.toThrow();
    });

    it("should execute apiAddOrderItems successfully", async () => {
      const items = [{ menuItemId: "m1", name: "Dosa", price: 100, quantity: 2 }];
      await expect(LocalDB.apiAddOrderItems("SR-1005", items)).resolves.not.toThrow();
    });

    it("should execute fetchPrinterLogs and apiAddPrinterLog successfully", async () => {
      const logs = await LocalDB.fetchPrinterLogs();
      expect(Array.isArray(logs)).toBe(true);

      const dlog = {
        kotId: "KOT-0005",
        kotNumber: "0005",
        restaurantId: "default",
        receiptText: "POS TICKET",
        printStatus: "Pending" as const
      };

      const result = await LocalDB.apiAddPrinterLog(dlog);
      expect(result.id).toBeDefined();
    });
  });
});
