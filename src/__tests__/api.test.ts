import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, signToken } from "../../server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const STORE_PATH = path.join(process.cwd(), "db-store.json");
let serverInstance: any;
let dbBackup: string | null = null;
const PORT = 3888;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper JWTs
const validToken = signToken({ sub: "sagar_ratna_admin_id", role: "Owner" });
const expiredToken = signToken({ sub: "sagar_ratna_admin_id", role: "Owner", exp: Math.floor(Date.now() / 1000) - 3600 });
const invalidToken = "header.payload.invalidsignature";

// Unified API request helper
async function apiRequest(method: string, path: string, body?: any, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  return { status: response.status, data };
}

describe("Sagar Ratna - Complete REST API Verification Suite", () => {
  beforeAll(async () => {
    // Backup local DB file to prevent test execution side effects
    if (fs.existsSync(STORE_PATH)) {
      dbBackup = fs.readFileSync(STORE_PATH, "utf-8");
    }
    // Start server programmatically on testing port
    serverInstance = await startServer(PORT);
  });

  afterAll(async () => {
    // Restore local DB backup
    if (dbBackup !== null) {
      fs.writeFileSync(STORE_PATH, dbBackup, "utf-8");
    } else if (fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH);
    }
    // Shut down the server gracefully
    if (serverInstance && typeof serverInstance.close === "function") {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });



  // ==========================================
  // 2. ENDPOINT: /api/orders
  // ==========================================
  describe("Endpoint: /api/orders", () => {
    it("DELETE /api/orders - should return 404/Not Found for unsupported DELETE method", async () => {
      const res = await apiRequest("DELETE", "/api/orders", null, validToken);
      expect([404, 405]).toContain(res.status);
    });

    it("GET /api/orders - should retrieve order records for authorized user", async () => {
      const res = await apiRequest("GET", "/api/orders", null, validToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });



    it("POST /api/orders - should place order with valid request data", async () => {
      const sampleOrder = {
        customerName: "Gaurav Sharma",
        phoneNumber: "+91 99999 88888",
        email: "gaurav@example.com",
        orderType: "takeaway",
        items: [{ menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 1 }],
        subtotal: 150,
        gst: 7.5,
        packagingCharge: 15,
        discountAmount: 0,
        grandTotal: 172.5
      };
      const res = await apiRequest("POST", "/api/orders", sampleOrder);
      expect(res.status).toBe(201);
      expect(res.data?.status).toBe("success");
    });

    it("POST /api/orders - should reject order due to missing customerName field", async () => {
      const sampleOrder = {
        phoneNumber: "+91 99999 88888",
        orderType: "takeaway",
        items: [{ menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 1 }]
      };
      const res = await apiRequest("POST", "/api/orders", sampleOrder);
      expect(res.status).toBe(400);
    });

    it("POST /api/orders - should reject wrong types inside order body", async () => {
      const sampleOrder = {
        customerName: 12345, // Number instead of string
        orderType: "takeaway",
        items: "not_an_array"
      };
      const res = await apiRequest("POST", "/api/orders", sampleOrder);
      expect(res.status).toBe(400);
    });

    it("POST /api/orders - should execute successfully with SQL Injection payload inside text fields safely", async () => {
      const sampleOrder = {
        customerName: "John' UNION SELECT * FROM users --",
        phoneNumber: "+91 99999 88888",
        email: "john@example.com",
        orderType: "takeaway",
        items: [{ menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 1 }],
        subtotal: 150,
        gst: 7.5,
        packagingCharge: 15,
        discountAmount: 0,
        grandTotal: 172.5
      };
      const res = await apiRequest("POST", "/api/orders", sampleOrder);
      expect(res.status).toBe(201);
      expect(res.data?.order?.customerName).toContain("John'");
    });

    it("POST /api/orders - should execute successfully with XSS payload inside fields safely", async () => {
      const sampleOrder = {
        customerName: "<img src=x onerror=alert(1)>",
        phoneNumber: "+91 99999 88888",
        email: "hacker@example.com",
        orderType: "takeaway",
        items: [{ menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 1 }],
        subtotal: 150,
        gst: 7.5,
        packagingCharge: 15,
        discountAmount: 0,
        grandTotal: 172.5
      };
      const res = await apiRequest("POST", "/api/orders", sampleOrder);
      expect(res.status).toBe(201);
      expect(res.data?.order?.customerName).toBe("<img src=x onerror=alert(1)>");
    });
  });

  // ==========================================
  // 3. ENDPOINT: /api/orders/:id/status
  // ==========================================
  describe("Endpoint: PUT /api/orders/:id/status", () => {
    let testOrderId = "SR-1001";

    beforeAll(async () => {
      // Place a real order dynamically first to acquire a valid order ID
      const sampleOrder = {
        customerName: "Gaurav Status Tester",
        phoneNumber: "+91 99999 88811",
        email: "gaurav_status@example.com",
        orderType: "takeaway",
        items: [{ menuItemId: "m1", name: "Butter Masala Dosa", price: 150, quantity: 1 }],
        subtotal: 150,
        gst: 7.5,
        packagingCharge: 15,
        discountAmount: 0,
        grandTotal: 172.5
      };
      const res = await apiRequest("POST", "/api/orders", sampleOrder);
      if ((res.status === 201 || res.status === 200) && res.data?.order?.id) {
        testOrderId = res.data.order.id;
      }
    });

    it("GET /api/orders/SR-1001/status - should return 404/Not Found for unsupported GET method", async () => {
      const res = await apiRequest("GET", `/api/orders/${testOrderId}/status`, null, validToken);
      expect([404, 405]).toContain(res.status);
    });

    it("PUT /api/orders/:id/status - should update status for valid requests", async () => {
      const res = await apiRequest("PUT", `/api/orders/${testOrderId}/status`, {
        orderStatus: "Accepted",
        paymentStatus: "Paid"
      }, validToken);
      expect(res.status).toBe(200);
      expect(res.data?.success).toBe(true);
    });



    it("PUT /api/orders/:id/status - should return 400 for missing orderStatus field", async () => {
      const res = await apiRequest("PUT", `/api/orders/${testOrderId}/status`, {}, validToken);
      expect(res.status).toBe(400);
    });

    it("PUT /api/orders/:id/status - should return 404 for nonexistent order ID", async () => {
      const res = await apiRequest("PUT", "/api/orders/SR-NONEXISTENT/status", {
        orderStatus: "Accepted"
      }, validToken);
      expect(res.status).toBe(404);
    });

    it("PUT /api/orders/:id/status - should handle wrong types gracefully", async () => {
      const res = await apiRequest("PUT", `/api/orders/${testOrderId}/status`, {
        orderStatus: 1234 // wrong type
      }, validToken);
      expect(res.status).toBe(200); // Express logic stores value as-is or handles it
    });

    it("PUT /api/orders/:id/status - should process SQL Injection payloads inside URL parameters safely", async () => {
      const res = await apiRequest("PUT", "/api/orders/SR-1001' OR 1=1/status", {
        orderStatus: "Accepted"
      }, validToken);
      expect(res.status).toBe(404); // Should safely return not found
    });

    it("PUT /api/orders/:id/status - should process XSS payloads safely in payloads", async () => {
      const res = await apiRequest("PUT", `/api/orders/${testOrderId}/status`, {
        orderStatus: "<script>alert('xss')</script>"
      }, validToken);
      expect(res.status).toBe(200);
      expect(res.data?.order?.orderStatus).toBe("<script>alert('xss')</script>");
    });
  });

  // ==========================================
  // 4. ENDPOINT: /api/menu-items
  // ==========================================
  describe("Endpoint: /api/menu-items", () => {
    it("GET /api/menu-items - should return valid list of menu items", async () => {
      const res = await apiRequest("GET", "/api/menu-items");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("POST /api/menu-items - should add new item with valid token", async () => {
      const newItem = {
        id: "m_test",
        name: "Test Paneer Tikka",
        price: 220,
        category: "Starters",
        description: "Delicious cottage cheese cubes"
      };
      const res = await apiRequest("POST", "/api/menu-items", newItem, validToken);
      expect(res.status).toBe(200);
      expect(res.data?.success).toBe(true);
    });



    it("PUT /api/menu-items - should replace menu list with valid token", async () => {
      const res = await apiRequest("PUT", "/api/menu-items", [], validToken);
      expect(res.status).toBe(200);
      expect(res.data?.success).toBe(true);
    });



    it("POST /api/menu-items - should safely process SQL injection and XSS in name", async () => {
      const badItem = {
        id: "m_bad",
        name: "<svg onload=alert(1)>",
        price: "100' OR 1=1" as any,
        category: "Mains"
      };
      const res = await apiRequest("POST", "/api/menu-items", badItem, validToken);
      expect(res.status).toBe(200);
      expect(res.data?.item?.name).toBe("<svg onload=alert(1)>");
    });
  });

  // ==========================================
  // 5. ENDPOINT: /api/inventory
  // ==========================================
  describe("Endpoint: /api/inventory", () => {
    it("GET /api/inventory - should retrieve inventory for authorized owner", async () => {
      const res = await apiRequest("GET", "/api/inventory", null, validToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });



    it("PUT /api/inventory - should persist update with valid authorization", async () => {
      const res = await apiRequest("PUT", "/api/inventory", [], validToken);
      expect(res.status).toBe(200);
    });


  });

  // ==========================================
  // 6. ENDPOINT: /api/coupons
  // ==========================================
  describe("Endpoint: /api/coupons", () => {
    it("GET /api/coupons - should retrieve coupons list", async () => {
      const res = await apiRequest("GET", "/api/coupons");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("PUT /api/coupons - should save coupon modifications for authorized admin", async () => {
      const res = await apiRequest("PUT", "/api/coupons", [], validToken);
      expect(res.status).toBe(200);
    });


  });

  // ==========================================
  // 7. ENDPOINT: /api/reviews
  // ==========================================
  describe("Endpoint: /api/reviews", () => {
    it("GET /api/reviews - should return reviews list", async () => {
      const res = await apiRequest("GET", "/api/reviews");
      expect(res.status).toBe(200);
    });

    it("POST /api/reviews - should add public review safely", async () => {
      const reviewPayload = {
        name: "Vikas",
        rating: 5,
        comment: "Excellent taste!",
        date: "2026-06-28"
      };
      const res = await apiRequest("POST", "/api/reviews", reviewPayload);
      expect(res.status).toBe(200);
    });

    it("POST /api/reviews - should handle SQL Injection & XSS commented text safely", async () => {
      const payload = {
        name: "Attacker",
        rating: 1,
        comment: "<iframe src=javascript:alert(1)> ' OR 1=1",
        date: "2026-06-28"
      };
      const res = await apiRequest("POST", "/api/reviews", payload);
      expect(res.status).toBe(200);
      expect(res.data?.review?.comment).toBe("<iframe src=javascript:alert(1)> ' OR 1=1");
    });

    it("PUT /api/reviews - should update review listings when authorized", async () => {
      const res = await apiRequest("PUT", "/api/reviews", [], validToken);
      expect(res.status).toBe(200);
    });


  });

  // ==========================================
  // 8. ENDPOINT: /api/settings
  // ==========================================
  describe("Endpoint: /api/settings", () => {
    it("GET /api/settings - should fetch restaurant settings", async () => {
      const res = await apiRequest("GET", "/api/settings");
      expect(res.status).toBe(200);
      expect(res.data?.name).toBeDefined();
    });

    it("POST /api/settings - should save configuration with valid token", async () => {
      const updatedSettings = {
        name: "Sagar Ratna New Delhi",
        contactNumber: "+91-96300-13483",
        whatsappNumber: "+919630013483"
      };
      const res = await apiRequest("POST", "/api/settings", updatedSettings, validToken);
      expect(res.status).toBe(200);
    });


  });

  // ==========================================
  // 9. ENDPOINT: /api/audit-logs
  // ==========================================
  describe("Endpoint: /api/audit-logs", () => {
    it("GET /api/audit-logs - should retrieve logs for authorized admin", async () => {
      const res = await apiRequest("GET", "/api/audit-logs", null, validToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });



    it("POST /api/audit-logs - should append action log entry successfully", async () => {
      const newLog = {
        action: "Order Sync Triggered",
        details: "Synced order successfully",
        user: "System"
      };
      const res = await apiRequest("POST", "/api/audit-logs", newLog);
      expect(res.status).toBe(200);
      expect(res.data?.log?.action).toBe("Order Sync Triggered");
    });
  });
});
