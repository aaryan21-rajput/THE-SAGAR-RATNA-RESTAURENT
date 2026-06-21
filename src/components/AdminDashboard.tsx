import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, ShoppingCart, Utensils, Users, Landmark, Ticket, 
  MessageSquare, Package, ShieldCheck, Settings, LogOut, Check, X,
  Search, Plus, Filter, Download, Info, Trash2, Edit2, AlertCircle, 
  Activity, Star, Sparkles, Volume2, VolumeX, Printer, CheckCircle, QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB, Order, Coupon, InventoryItem, AuditLog, RestaurantSettings } from "../lib/db";
import { MenuItem, RestaurantTable } from "../types";
import KitchenDashboard from "./KitchenDashboard";
import WaiterDashboard from "./WaiterDashboard";
import SupabaseDiagnostics from "../pages/admin/SupabaseDiagnostics";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "orders" | "menu" | "customers" | "revenue" | "coupons" | "reviews" | "logs" | "settings" | "kitchen" | "waiter" | "tables" | "supabase"
  >("analytics");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Local sync states
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>(() => LocalDB.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [newTableNo, setNewTableNo] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [newArea, setNewArea] = useState("Main Dining Hall");
  const [showAddTable, setShowAddTable] = useState(false);

  // Sound selection
  const [soundEnabled, setSoundEnabled] = useState(true);

  // New Order floating alert/toast list
  const [activeAlerts, setActiveAlerts] = useState<Order[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showBillPrint, setShowBillPrint] = useState<Order | null>(null);

  // Inactivity tracking: 10 minutes auto-logout
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes
  
  // Tab-specific interactive states
  const [orderFilter, setOrderFilter] = useState<string>("All");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [menuSearch, setMenuSearch] = useState<string>("");
  const [menuFilterCategory, setMenuFilterCategory] = useState<string>("All");
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Modals for ADDING/EDITING MENU
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);

  // Modals for ADDING/EDITING COUPON
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);

  // Modals for INVENTORY RESTOCK
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Load state from server/localStorage on boot and poll periodically
  useEffect(() => {
    refreshAllData();

    // Listen to background checkout events
    const handleNewOrderEvent = (e: Event) => {
      const order = (e as CustomEvent).detail as Order;
      refreshAllData();
      setActiveAlerts(prev => [order, ...prev]);
    };

    window.addEventListener("new_order", handleNewOrderEvent);
    return () => {
      window.removeEventListener("new_order", handleNewOrderEvent);
    };
  }, []);

  // Auto-select first table for preview
  useEffect(() => {
    if (tables.length > 0 && !selectedTableForQr) {
      setSelectedTableForQr(tables[0]);
    }
  }, [tables, selectedTableForQr]);

  // background-polling interval for cross-session/cross-device synchronicity
  useEffect(() => {
    const handleServerPolling = async () => {
      try {
        const freshOrders = await LocalDB.fetchOrders();
        
        // Detect if there is any brand new order ID
        const existingIds = new Set(orders.map(o => o.id));
        const newOrders = freshOrders.filter(o => !existingIds.has(o.id));
        
        if (newOrders.length > 0) {
          // Play standard chime sequence!
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
          } catch (_) {}

          setActiveAlerts(prev => [...newOrders, ...prev]);
          setOrders(freshOrders);
        }
      } catch (err) {
        // Fail-safe
      }
    };

    // Every 2 seconds
    const pollTimer = setInterval(handleServerPolling, 2000);
    return () => clearInterval(pollTimer);
  }, [orders]);

  const refreshAllData = async () => {
    try {
      const ords = await LocalDB.fetchOrders();
      setOrders(ords);
    } catch (_) {
      setOrders(LocalDB.getOrders());
    }
    try {
      const items = await LocalDB.fetchMenuItems();
      setMenuItems(items);
    } catch (_) {
      setMenuItems(LocalDB.getMenuItems());
    }
    try {
      const inv = await LocalDB.fetchInventory();
      setInventory(inv);
    } catch (_) {
      setInventory(LocalDB.getInventory());
    }
    try {
      const cps = await LocalDB.fetchCoupons();
      setCoupons(cps);
    } catch (_) {
      setCoupons(LocalDB.getCoupons());
    }
    try {
      const revs = await LocalDB.fetchReviews();
      setReviews(revs);
    } catch (_) {
      setReviews(LocalDB.getReviews());
    }
    try {
      const sts = await LocalDB.fetchSettings();
      setSettings(sts);
    } catch (_) {
      setSettings(LocalDB.getSettings());
    }
    try {
      const logs = await LocalDB.fetchAuditLogs();
      setAuditLogs(logs);
    } catch (_) {
      setAuditLogs(LocalDB.getAuditLogs());
    }
    try {
      setTables(LocalDB.getTables());
    } catch (_) {
      // safe fallback
    }
  };

  // Keep countdown timer for inactive auto logout
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          LocalDB.addAuditLog("Auto Logout", "Session terminated due to 10 minutes of inactivity", "Secure Gate");
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset countdown on active events
    const resetTimer = () => {
      setSecondsRemaining(600);
    };

    const debounceEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    debounceEvents.forEach(evt => window.addEventListener(evt, resetTimer));

    return () => {
      clearInterval(timer);
      debounceEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [onLogout]);

  // Derived settings and stats
  const formatTimeRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // CALCULATE SECTIONS
  // 1. Orders sub-breakdowns
  const orderStats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
    
    const revenueSum = orders
      .filter(o => o.orderStatus !== "Cancelled")
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const todayRevenue = todayOrders
      .filter(o => o.orderStatus !== "Cancelled")
      .reduce((sum, o) => sum + o.grandTotal, 0);

    return {
      today: todayOrders.length,
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === "New Order").length,
      preparing: orders.filter(o => o.orderStatus === "Preparing").length,
      delivering: orders.filter(o => o.orderStatus === "Out For Delivery").length,
      completed: orders.filter(o => o.orderStatus === "Delivered").length,
      cancelled: orders.filter(o => o.orderStatus === "Cancelled").length,
      revenue: revenueSum,
      todayRevenue: todayRevenue
    };
  }, [orders]);

  // Aggregate Customer Data
  const customerAnalytics = useMemo(() => {
    const groups: { [emailOrPhone: string]: { name: string; phone: string; email: string; totalSpend: number; count: number; lastDate: string } } = {};
    
    orders.forEach(o => {
      const key = o.email || o.phoneNumber || o.customerName;
      if (!groups[key]) {
        groups[key] = {
          name: o.customerName,
          phone: o.phoneNumber,
          email: o.email || "walk-in@sagarratna.com",
          totalSpend: 0,
          count: 0,
          lastDate: o.createdAt
        };
      }
      
      if (o.orderStatus !== "Cancelled") {
        groups[key].totalSpend += o.grandTotal;
      }
      groups[key].count += 1;
      if (new Date(o.createdAt) > new Date(groups[key].lastDate)) {
        groups[key].lastDate = o.createdAt;
      }
    });

    return Object.values(groups);
  }, [orders]);

  // Best selling menu items logic
  const bestSellersStats = useMemo(() => {
    const tally: { [id: string]: { name: string; category: string; count: number; earnings: number } } = {};
    orders.forEach(o => {
      if (o.orderStatus !== "Cancelled") {
        o.items.forEach(itm => {
          if (!tally[itm.menuItemId]) {
            tally[itm.menuItemId] = { name: itm.name, category: "All", count: 0, earnings: 0 };
          }
          tally[itm.menuItemId].count += itm.quantity;
          tally[itm.menuItemId].earnings += itm.price * itm.quantity;
        });
      }
    });
    return Object.values(tally).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  // Categories stats
  const categoriesSales = useMemo(() => {
    const data: { [cat: string]: number } = {};
    orders.forEach(o => {
      if (o.orderStatus !== "Cancelled") {
        o.items.forEach(itm => {
          const itemDef = menuItems.find(m => m.id === itm.menuItemId);
          const cat = itemDef?.category || "other";
          data[cat] = (data[cat] || 0) + itm.quantity;
        });
      }
    });
    return Object.entries(data).map(([cat, qty]) => ({ name: cat.toUpperCase(), quantity: qty }));
  }, [orders, menuItems]);

  // Low stock inventory alert list
  const lowStockItems = useMemo(() => {
    return inventory.filter(i => i.stock <= i.minAlertLevel);
  }, [inventory]);

  // EXPORT UTILS
  const handleExportCSV = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    LocalDB.addAuditLog("Data Backup Export", `Exported document file: ${filename}.csv`, "Admin");
  };

  const exportCustomersCSV = () => {
    let csv = "Customer Name,Phone Number,Email,Total Spending,Orders Placed,Last Order Date\n";
    customerAnalytics.forEach(c => {
      csv += `"${c.name}","${c.phone}","${c.email}",₹${c.totalSpend},${c.count},"${new Date(c.lastDate).toLocaleDateString()}"\n`;
    });
    handleExportCSV("SagarRatna_Customers", csv);
  };

  const exportRevenueCSV = () => {
    let csv = "Order ID,Customer,Amount,Status,Date & Time,Type,Coupon,GST\n";
    orders.forEach(o => {
      csv += `${o.id},"${o.customerName}",₹${o.grandTotal},${o.orderStatus},"${new Date(o.createdAt).toLocaleString()}",${o.orderType},"${o.appliedCoupon || ""}",₹${o.gst}\n`;
    });
    handleExportCSV("SagarRatna_RevenueReport", csv);
  };

  // SOUND/CHIME FOR DEVELOPERS
  const triggerReviewChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); // C#5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (_) {}
  };

  // OPERATIONS MODIFIERS
  // 1. Order Status Updates
  const updateOrderStatus = async (orderId: string, status: Order["orderStatus"]) => {
    try {
      await LocalDB.apiUpdateOrderStatus(orderId, status);
      await refreshAllData();
      triggerReviewChime();
    } catch (err: any) {
      alert(err.message || "Failed to update status on server.");
    }
  };

  // 2. Menu Item modifications
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem?.name || !editingMenuItem?.price) return;

    let updatedList = [...menuItems];
    if (editingMenuItem.id) {
      // Edit mode
      updatedList = updatedList.map(item => item.id === editingMenuItem.id ? (editingMenuItem as MenuItem) : item);
      await LocalDB.apiAddAuditLog("Menu Item Edited", `Pricing/Details modified for dish: ${editingMenuItem.name}`);
    } else {
      // Create mode
      const newItem: MenuItem = {
        id: `s_item_${Date.now()}`,
        name: editingMenuItem.name,
        price: Number(editingMenuItem.price),
        category: editingMenuItem.category || "soups",
        description: editingMenuItem.description || "",
        isVeg: editingMenuItem.isVeg || true,
        isBestseller: !!editingMenuItem.isBestseller,
        isChefSpecial: !!editingMenuItem.isChefSpecial,
        image: editingMenuItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
        spiciness: Number(editingMenuItem.spiciness || 0),
        rating: 4.8,
        ratingCount: 15
      };
      updatedList.unshift(newItem);
      await LocalDB.apiAddAuditLog("Menu Item Created", `New dish added: ${newItem.name} (₹${newItem.price})`);
    }

    try {
      await LocalDB.apiSaveMenuItems(updatedList);
      await refreshAllData();
      setShowMenuModal(false);
      setEditingMenuItem(null);
    } catch (err: any) {
      alert("Failed to save menu items: " + err.message);
    }
  };

  const handleDeleteMenuItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete: ${itemName}?`)) {
      const updated = menuItems.filter(item => item.id !== itemId);
      try {
        await LocalDB.apiSaveMenuItems(updated);
        await LocalDB.apiAddAuditLog("Menu Item Deleted", `Permanently wiped: ${itemName}`);
        await refreshAllData();
      } catch (err: any) {
        alert("Failed to delete menu item: " + err.message);
      }
    }
  };

  // 3. Coupon modifications
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon?.value) return;

    let list = [...coupons];
    const isEdit = list.some(c => c.code === editingCoupon.code);

    if (isEdit) {
      list = list.map(c => c.code === editingCoupon.code ? (editingCoupon as Coupon) : c);
      await LocalDB.apiAddAuditLog("Coupon Updated", `Code: ${editingCoupon.code} modified parameters`);
    } else {
      const newC: Coupon = {
        code: editingCoupon.code.toUpperCase(),
        type: editingCoupon.type || "percentage",
        value: Number(editingCoupon.value),
        expiryDate: editingCoupon.expiryDate || "2200-12-31",
        cursor: "pointer",
        usageLimit: Number(editingCoupon.usageLimit || 100),
        usageCount: 0,
        minOrderAmount: Number(editingCoupon.minOrderAmount || 0)
      } as any;
      list.unshift(newC);
      await LocalDB.apiAddAuditLog("Coupon Created", `New reward code launched: ${newC.code}`);
    }

    try {
      await LocalDB.apiSaveCoupons(list);
      await refreshAllData();
      setShowCouponModal(false);
      setEditingCoupon(null);
    } catch (err: any) {
      alert("Failed to save coupons: " + err.message);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (window.confirm(`Delete coupon code: ${code}?`)) {
      const updated = coupons.filter(c => c.code !== code);
      try {
        await LocalDB.apiSaveCoupons(updated);
        await LocalDB.apiAddAuditLog("Coupon Suspended", `Deactivated coupon: ${code}`);
        await refreshAllData();
      } catch (err: any) {
        alert("Failed to delete coupon: " + err.message);
      }
    }
  };

  // 4. Inventory restock trigger
  const handleRestockSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;

    const updated = inventory.map(item => {
      if (item.id === selectedInventoryItem.id) {
        const newStock = Number(item.stock) + Number(restockAmount);
        return { ...item, stock: newStock, lastRestocked: new Date().toISOString().split("T")[0] };
      }
      return item;
    });

    try {
      await LocalDB.apiSaveInventory(updated);
      await LocalDB.apiAddAuditLog("Inventory Restocked", `Brought in +${restockAmount} ${selectedInventoryItem.unit} of ${selectedInventoryItem.name}`);
      await refreshAllData();
      setShowRestockModal(false);
      setSelectedInventoryItem(null);
    } catch (err: any) {
      alert("Failed to restock layout: " + err.message);
    }
  };

  // 5. Review Approvals
  const toggleReviewApproval = async (reviewId: string, currentStatus: boolean) => {
    const updated = reviews.map(r => r.id === reviewId ? { ...r, approved: !currentStatus } : r);
    try {
      await LocalDB.apiSaveReviews(updated);
      await LocalDB.apiAddAuditLog("Review Moderated", `Approved status toggled for review #${reviewId}`);
      await refreshAllData();
      triggerReviewChime();
    } catch (err: any) {
      alert("Failed to alter review approval: " + err.message);
    }
  };

  const toggleReviewFeatured = async (reviewId: string, currentFeatured: boolean) => {
    const updated = reviews.map(r => r.id === reviewId ? { ...r, featured: !currentFeatured } : r);
    try {
      await LocalDB.apiSaveReviews(updated);
      await LocalDB.apiAddAuditLog("Review Moderated", `Featured tag toggled for review ${reviewId}`);
      await refreshAllData();
      triggerReviewChime();
    } catch (err: any) {
      alert("Failed to feature review: " + err.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Permanently wipe this review from Guest book?")) {
      const updated = reviews.filter(r => r.id !== reviewId);
      try {
        await LocalDB.apiSaveReviews(updated);
        await LocalDB.apiAddAuditLog("Review Deleted", `Wiped review ledger id ${reviewId}`);
        await refreshAllData();
      } catch (err: any) {
        alert("Failed to delete review: " + err.message);
      }
    }
  };

  // 6. Settings Updates
  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LocalDB.apiSaveSettings(settings);
      await LocalDB.apiAddAuditLog("Settings Adjusted", `Restaurant operating variables synchronized`);
      await refreshAllData();
      alert("Sagar Ratna Settings Saved successfully. Your public footer and headers are updated in real time!");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    }
  };

  // 7. Table QR Management Handlers
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNo) return;
    
    // Check if tableNumber already exists
    if (tables.some(t => t.tableNumber === newTableNo)) {
      alert(`Table ${newTableNo} already exists! Please use a unique number.`);
      return;
    }

    const newTbl: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      tableNumber: newTableNo,
      capacity: newCapacity,
      seatingArea: newArea,
      status: "Available"
    };

    const updated = [...tables, newTbl];
    LocalDB.saveTables(updated);
    setTables(updated);
    setSelectedTableForQr(newTbl);
    
    // Reset fields
    setNewTableNo("");
    setNewCapacity(4);
    setShowAddTable(false);

    try {
      LocalDB.addAuditLog("Table Created", `Added restaurant Table #${newTbl.tableNumber} with capacity of ${newTbl.capacity}`, "Admin Panel");
    } catch (_) {
      // safe fallback if addAuditLog differs
    }
  };

  const handleUpdateTableStatus = (tableId: string, status: "Available" | "Occupied" | "Reserved") => {
    const updated = tables.map(t => t.id === tableId ? { ...t, status } : t);
    LocalDB.saveTables(updated);
    setTables(updated);
    if (selectedTableForQr?.id === tableId) {
      setSelectedTableForQr({ ...selectedTableForQr, status });
    }
    try {
      LocalDB.addAuditLog("Table Status Updated", `Updated Table ID ${tableId} status to ${status}`, "Admin Panel");
    } catch (_) {
      // safe fallback
    }
  };

  const handleDeleteTable = (tableId: string) => {
    const tableToDelete = tables.find(t => t.id === tableId);
    if (!tableToDelete) return;
    if (!confirm(`Are you sure you want to delete Table #${tableToDelete.tableNumber}?`)) return;

    const updated = tables.filter(t => t.id !== tableId);
    LocalDB.saveTables(updated);
    setTables(updated);
    
    if (selectedTableForQr?.id === tableId) {
      setSelectedTableForQr(updated[0] || null);
    }
    try {
      LocalDB.addAuditLog("Table Deleted", `Removed Table #${tableToDelete.tableNumber} from table list`, "Admin Panel");
    } catch (_) {
      // safe fallback
    }
  };

  // INTERACTIVE FILTERS
  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderFilter === "All" || o.orderStatus === orderFilter;
      const term = orderSearch.toLowerCase();
      const matchesSearch = !term || 
        o.customerName.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term) ||
        o.phoneNumber.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const categoryMatch = menuFilterCategory === "All" || item.category === menuFilterCategory;
      const query = menuSearch.toLowerCase();
      const searchMatch = !query || 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [menuItems, menuFilterCategory, menuSearch]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-850 flex flex-col font-sans select-none overflow-hidden" id="admin-hub-system">
      
      {/* Dynamic Floating Global Alerts for New Orders */}
      <div className="fixed top-5 right-5 z-50 space-y-3 max-w-sm w-full font-sans">
        <AnimatePresence>
          {activeAlerts.map((alertItem) => (
            <motion.div
              key={alertItem.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xl text-stone-900 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#aa7c11]" />
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  <span className="text-xs font-mono text-[#aa7c11] font-semibold">🚨 LIVE ORDER RECEIVED</span>
                </div>
                <button 
                  onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alertItem.id))}
                  className="text-stone-400 hover:text-stone-850 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-sm font-semibold truncate leading-tight font-sans">{alertItem.customerName}</h4>
              <p className="text-xs text-stone-500 mt-1">Placed order {alertItem.id} worth <strong className="text-stone-900">₹{alertItem.grandTotal}</strong></p>
              <div className="mt-3.5 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedOrderDetails(alertItem);
                    setActiveAlerts(prev => prev.filter(a => a.id !== alertItem.id));
                  }}
                  className="px-3.5 py-1.5 bg-[#aa7c11] text-white font-semibold text-[10px] rounded-lg tracking-wider uppercase hover:bg-[#aa7c11]/90 cursor-pointer"
                >
                  Inspect details
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(alertItem.id, "Accepted");
                    setActiveAlerts(prev => prev.filter(a => a.id !== alertItem.id));
                  }}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-[10px] rounded-lg tracking-wider uppercase border border-stone-200 cursor-pointer"
                >
                  Accept Order
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Professional Control Strip */}
      <header className="bg-white border-b border-stone-200/80 py-2.5 md:py-3.5 px-4 md:px-6 flex items-center justify-between relative z-30 shadow-xs">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-lg md:rounded-xl flex items-center justify-center text-[#aa7c11] flex-shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-serif font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1">
              <span className="hidden sm:inline">Sagar Ratna</span> <span className="sm:hidden inline">SR</span> <span className="text-[#aa7c11]">Admin</span>
              <span className="text-[8px] md:text-[9px] font-mono text-[#aa7c11] bg-amber-50 border border-amber-250/50 px-1 md:px-1.5 py-0.2 md:py-0.5 rounded font-bold">PRO</span>
            </h1>
            <p className="text-[8px] md:text-[10px] text-stone-400 font-mono tracking-wide uppercase mt-0.5">Control Center</p>
          </div>
        </div>

        {/* Diagnostic controls and countdown */}
        <div className="flex items-center gap-2 md:gap-4 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 text-stone-500 bg-stone-50 px-3 py-1.5 border border-stone-200 rounded-lg">
            <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>DB Server: <span className="text-green-600 font-bold">Live</span></span>
          </div>

          {/* Sound settings */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 md:p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-500 hover:text-stone-950 transition-colors cursor-pointer"
            title={soundEnabled ? "Disable audio alerts" : "Enable audio alerts"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#aa7c11]" /> : <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-400" />}
          </button>

          {/* Timeout alarm */}
          <div className="text-stone-600 bg-stone-50 px-20 py-1.5 border border-stone-200 rounded-lg flex items-center gap-1.5 text-[10px] sm:text-xs">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
            <span>⏱️ <strong className="text-stone-900">{formatTimeRemaining(secondsRemaining)}</strong></span>
          </div>

          <button
            onClick={() => {
              LocalDB.addAuditLog("Admin Logout", "Authorized admin logout triggered manually", "Admin");
              onLogout();
            }}
            className="p-1.5 md:px-3.5 md:py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Grid Work Space */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar Nav rail */}
        <aside className="w-64 bg-white border-r border-stone-200/80 hidden lg:flex flex-col p-4 justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono text-stone-400 tracking-widest uppercase pl-3.5 mb-2.5">MANAGEMENT SHEETS</p>
            
            <SidebarBtn icon={<BarChart3 />} label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
            <SidebarBtn icon={<ShoppingCart />} label="Order Management" active={activeTab === "orders"} count={orders.filter(o => o.orderStatus === "New Order").length} onClick={() => setActiveTab("orders")} />
            <SidebarBtn icon={<Utensils />} label="Menu Catalog" active={activeTab === "menu"} onClick={() => setActiveTab("menu")} />
            <SidebarBtn icon={<Users />} label="Customer Directory" active={activeTab === "customers"} onClick={() => setActiveTab("customers")} />
            <SidebarBtn icon={<Landmark />} label="Revenue Insights" active={activeTab === "revenue"} onClick={() => setActiveTab("revenue")} />
            <SidebarBtn icon={<Ticket />} label="Promo Coupons" active={activeTab === "coupons"} onClick={() => setActiveTab("coupons")} />
            <SidebarBtn icon={<MessageSquare />} label="Guest Reviews" active={activeTab === "reviews"} count={reviews.filter(r => !r.approved).length} onClick={() => setActiveTab("reviews")} />
            <SidebarBtn icon={<QrCode />} label="Table QR Codes" active={activeTab === "tables"} onClick={() => setActiveTab("tables")} />
            
            <p className="text-[10px] font-mono text-stone-400 tracking-widest uppercase pl-3.5 pt-6 pb-2.5">OPERATOR VIEWS & KOT</p>
            <SidebarBtn icon={<Utensils />} label="Kitchen Display (KDS)" active={activeTab === "kitchen"} onClick={() => setActiveTab("kitchen")} />
            <SidebarBtn icon={<Users />} label="Waiter Service" active={activeTab === "waiter"} onClick={() => setActiveTab("waiter")} />

            <p className="text-[10px] font-mono text-stone-400 tracking-widest uppercase pl-3.5 pt-6 pb-2.5">SECURITY & PARAMS</p>
            <SidebarBtn icon={<ShieldCheck />} label="Audit Log Ledger" active={activeTab === "logs"} onClick={() => setActiveTab("logs")} />
            <SidebarBtn icon={<Settings />} label="Portal Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
            <SidebarBtn icon={<Activity />} label="Supabase Cloud Audit" active={activeTab === "supabase"} onClick={() => setActiveTab("supabase")} />
          </div>

          {/* Quick legal credentials */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-250/30 text-[10px] font-mono text-stone-500 space-y-1">
            <p className="text-[#aa7c11] font-bold uppercase text-[9px] tracking-widest">ENCRYPTION PROTOCOL</p>
            <p>Algorithm: HMAC SHA256</p>
            <p>Session State: Memory-Sync</p>
            <p>IP Address: 127.0.0.1</p>
          </div>
        </aside>

        {/* Small screen mobile dropdown select terminal */}
        <div className="lg:hidden bg-stone-50/50 px-4 py-2.5 border-b border-stone-200 select-none flex-shrink-0 z-20">
          <div className="flex items-center justify-between bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(40,30,10,0.01)] rounded-xl p-2">
            <div className="flex items-center gap-2">
              <span className="text-[#aa7c11] bg-amber-50 p-1.5 rounded-lg border border-amber-100 flex items-center justify-center">
                {activeTab === "analytics" && <BarChart3 className="w-4 h-4" />}
                {activeTab === "orders" && <ShoppingCart className="w-4 h-4" />}
                {activeTab === "menu" && <Utensils className="w-4 h-4" />}
                {activeTab === "customers" && <Users className="w-4 h-4" />}
                {activeTab === "revenue" && <Landmark className="w-4 h-4" />}
                {activeTab === "coupons" && <Ticket className="w-4 h-4" />}
                {activeTab === "reviews" && <MessageSquare className="w-4 h-4" />}
                {activeTab === "logs" && <ShieldCheck className="w-4 h-4" />}
                {activeTab === "settings" && <Settings className="w-4 h-4" />}
                {activeTab === "kitchen" && <Utensils className="w-4 h-4" />}
                {activeTab === "waiter" && <Users className="w-4 h-4" />}
                {activeTab === "tables" && <QrCode className="w-4 h-4" />}
                {activeTab === "supabase" && <Activity className="w-4 h-4" />}
              </span>
              <div>
                <span className="text-[8px] text-stone-400 font-mono uppercase block leading-none">CURRENT BOARD</span>
                <span className="text-xs font-bold text-[#2a2a2a] uppercase font-sans tracking-wide">
                  {activeTab === "analytics" && "Overview Metrics"}
                  {activeTab === "orders" && `Active Orders (${orders.filter(o => o.orderStatus === "New Order").length})`}
                  {activeTab === "menu" && "Menu Manager"}
                  {activeTab === "customers" && "Guest Directory"}
                  {activeTab === "revenue" && "Financial Audits"}
                  {activeTab === "coupons" && "Promotion Codes"}
                  {activeTab === "reviews" && "Review Approvals"}
                  {activeTab === "logs" && "Audit Security Ledger"}
                  {activeTab === "settings" && "Portal Settings"}
                  {activeTab === "kitchen" && "Kitchen Tickets (KDS)"}
                  {activeTab === "waiter" && "Waiter Service"}
                  {activeTab === "tables" && "Table QR Codes Manager"}
                  {activeTab === "supabase" && "Supabase Connectivity Audit"}
                </span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[10px] bg-stone-900 hover:bg-stone-850 text-white font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-all border border-stone-900"
            >
              <span>{isMobileMenuOpen ? "CLOSE" : "SHEETS"}</span>
              <span className="text-[8px]">{isMobileMenuOpen ? "▲" : "▼"}</span>
            </button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1.5"
              >
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/95 grid grid-cols-2 sm:grid-cols-3 gap-2 shadow-lg max-h-56 overflow-y-auto">
                  <MobileGridBtn id="analytics" label="Overview" active={activeTab === "analytics"} icon={<BarChart3 />} onClick={() => { setActiveTab("analytics"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="orders" label="Orders Queue" active={activeTab === "orders"} icon={<ShoppingCart />} count={orders.filter(o => o.orderStatus === "New Order").length} onClick={() => { setActiveTab("orders"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="menu" label="Menu Catalog" active={activeTab === "menu"} icon={<Utensils />} onClick={() => { setActiveTab("menu"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="customers" label="Guests" active={activeTab === "customers"} icon={<Users />} onClick={() => { setActiveTab("customers"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="revenue" label="Earnings" active={activeTab === "revenue"} icon={<Landmark />} onClick={() => { setActiveTab("revenue"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="coupons" label="Promo Cards" active={activeTab === "coupons"} icon={<Ticket />} onClick={() => { setActiveTab("coupons"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="reviews" label="Reviews" active={activeTab === "reviews"} count={reviews.filter(r => !r.approved).length} icon={<MessageSquare />} onClick={() => { setActiveTab("reviews"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="logs" label="Audit Logs" active={activeTab === "logs"} icon={<ShieldCheck />} onClick={() => { setActiveTab("logs"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="settings" label="Portal Config" active={activeTab === "settings"} icon={<Settings />} onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="kitchen" label="Kitchen KDS" active={activeTab === "kitchen"} icon={<Utensils />} onClick={() => { setActiveTab("kitchen"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="waiter" label="Waiter Desk" active={activeTab === "waiter"} icon={<Users />} onClick={() => { setActiveTab("waiter"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="tables" label="Table QRs" active={activeTab === "tables"} icon={<QrCode />} onClick={() => { setActiveTab("tables"); setIsMobileMenuOpen(false); }} />
                  <MobileGridBtn id="supabase" label="Supa Audit" active={activeTab === "supabase"} icon={<Activity />} onClick={() => { setActiveTab("supabase"); setIsMobileMenuOpen(false); }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Core Main Sheet Content Scroll area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#FAF9F5]">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* TAB CONTENT: ANALYTICS DASHBOARD OVERVIEW */}
            {activeTab === "analytics" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Header title */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Administration Overview</h2>
                  <p className="text-xs text-stone-500">Live culinary insights and customer ordering records for Sagar Ratna Restaurant.</p>
                </div>

                {/* Grid stats overview cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <AnalyticsStatCard title="Today's Orders" count={orderStats.today} change="+12.5% vs yesterday" />
                  <AnalyticsStatCard title="Total Bills" count={orderStats.total} change="Over past 30 days" />
                  <AnalyticsStatCard title="Pending Review" count={orderStats.pending} change="Actions required!" badgeColor="bg-yellow-50 text-[#C67C4E]" />
                  <AnalyticsStatCard title="Preparing State" count={orderStats.preparing} change="Kitchen active" badgeColor="bg-blue-50 text-blue-600" />
                  <AnalyticsStatCard title="Out for Courier" count={orderStats.delivering} change="Transit fleet" badgeColor="bg-purple-50 text-purple-600" />
                  <AnalyticsStatCard title="Finished Orders" count={orderStats.completed} change="Successful dining" badgeColor="bg-green-50 text-green-600" />
                  <AnalyticsStatCard title="Refunds / Cancelled" count={orderStats.cancelled} change="Review cancellation log" badgeColor="bg-red-50 text-red-650" />
                  <AnalyticsStatCard title="Current Hub Revenue" count={`₹${orderStats.revenue.toLocaleString()}`} change={`₹${orderStats.todayRevenue} earned today`} highlight={true} />
                </div>

                {/* Bento Grid Analytics Charts */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Revenue Growth chart (Tailwind Custom SVG Chart) */}
                  <div className="md:col-span-8 bg-white border border-stone-200/80 p-5 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider font-sans font-bold">Revenue & Sales Weekly Chart</h3>
                      <span className="text-[10px] text-[#aa7c11] bg-amber-50 px-20 py-0.5 rounded border border-amber-200 font-mono font-bold">30 Days Log</span>
                    </div>

                    {/* Highly polished custom styled SVG Chart matching guidelines */}
                    <div className="h-64 flex items-end justify-between gap-2.5 pt-8 px-2 font-mono relative">
                      {/* Grid vertical lines helper */}
                      <div className="absolute inset-x-0 bottom-4 border-b border-stone-100" />
                      <div className="absolute inset-x-0 bottom-1/3 border-b border-stone-100" />
                      <div className="absolute inset-x-0 bottom-2/3 border-b border-stone-100" />
                      <div className="absolute inset-x-0 top-8 border-b border-stone-100/60" />

                      {/* Display Bars dynamically matching simulated revenue distributions */}
                      {[
                        { day: "Wk 1", sales: 4200, height: "h-[35%]" },
                        { day: "Wk 2", sales: 7400, height: "h-[62%]" },
                        { day: "Wk 3", sales: 11000, height: "h-[92%]" },
                        { day: "Wk 4", sales: 8500, height: "h-[71%]" },
                        { day: "Current", sales: 2900, height: "h-[25%]", active: true }
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 bg-stone-900 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                            Earning: ₹{item.sales}
                          </div>
                          
                          {/* Colored bar */}
                          <div className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 cursor-pointer ${item.height} ${item.active ? "bg-gradient-to-t from-[#C67C4E] to-[#D4AF37] shadow-[0_4px_12px_rgba(198,124,78,0.15)]" : "bg-stone-100 hover:bg-stone-200"}`} />
                          <span className={`text-[10px] uppercase font-bold ${item.active ? "text-[#C67C4E]" : "text-stone-400"}`}>{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Selling Items Side panel */}
                  <div className="md:col-span-4 bg-[#FAF6F0] border border-stone-250/40 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-sans mb-4">Top Culinary Sellers</h3>
                      <div className="space-y-3.5">
                        {bestSellersStats.length === 0 ? (
                           <div className="py-12 text-center text-xs text-stone-400 font-sans">No order records recorded.</div>
                        ) : (
                          bestSellersStats.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs font-sans">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 bg-white border border-stone-200 rounded flex items-center justify-center text-[#aa7c11] font-bold text-[10px]">{idx+1}</span>
                                <span className="text-stone-800 truncate font-semibold">{item.name}</span>
                              </div>
                              <span className="text-[#C67C4E] bg-orange-50 font-semibold px-20 py-0.5 rounded border border-orange-100 font-sans ml-2 text-[10px]">{item.count} sold</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Slogan */}
                    <div className="border-t border-stone-200/80 pt-4 mt-6 text-center text-[10px] font-mono text-stone-400">
                      Culinary popularity statistics recalculate live.
                    </div>
                  </div>

                </div>

                {/* Categories & Customer Growth metrics row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Orders categorizations summary list */}
                  <div className="bg-white border border-stone-200/85 p-5 rounded-2xl space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-stone-850 uppercase tracking-wider font-sans">Hottest Menu Categories</h3>
                    
                    <div className="space-y-3">
                      {categoriesSales.slice(0, 5).map((cat, idx) => (
                        <div key={idx} className="space-y-1.5 font-sans text-xs">
                          <div className="flex justify-between items-baseline text-stone-600">
                            <span className="font-semibold text-stone-800">{cat.name}</span>
                            <span className="text-stone-500 font-mono">{cat.quantity} units requested</span>
                          </div>
                          {/* Custom Progress Bar */}
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60 font-sans">
                            <div className="h-full bg-[#d4af37] rounded-full" style={{ width: `${Math.min(100, (cat.quantity * 10))}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock alerts and quick diagnostics panel */}
                  <div className="bg-white border border-stone-200/85 p-5 rounded-2xl space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-stone-850 uppercase tracking-wider font-sans">Active Low Inventory Alerts</h3>
                    
                    <div className="space-y-2.5">
                      {lowStockItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-green-650 font-sans flex flex-col items-center gap-2">
                           <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
                           All ingredients fully stocked to safety levels!
                        </div>
                      ) : (
                        lowStockItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs font-sans bg-amber-50 border border-amber-250/40 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-[#C67C4E]" />
                              <span className="text-stone-800 font-bold">{item.name}</span>
                            </div>
                            <span className="text-[#C67C4E] font-black">{item.stock} {item.unit} left (Alert &lt; {item.minAlertLevel})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: ORDERS LIST */}
            {activeTab === "orders" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Header title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Kitchen Order Dispatcher</h2>
                    <p className="text-xs text-stone-500">Track pending, preparing, and active out-for-delivery dining cycles.</p>
                  </div>
                  
                  {/* Status categories switch filter pill row */}
                  <div className="flex flex-wrap gap-1.5 select-none font-sans">
                    {["All", "New Order", "Accepted", "Preparing", "Ready", "Out For Delivery", "Delivered", "Cancelled"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setOrderFilter(st)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${orderFilter === st ? "bg-[#d4af37] border-[#d4af37] text-white" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-850"}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search bar inside orders */}
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by ID, guest name, or telephone number..."
                    className="w-full bg-white border border-stone-200 pl-11 pr-4 py-2.5 text-xs rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#d4af37] font-mono shadow-xs"
                  />
                </div>

                {/* Main Orders ledger list Table */}
                <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-sans text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-left text-[10px]">
                          <th className="p-3.5">ID</th>
                          <th className="p-3.5">Client & Contact</th>
                          <th className="p-3.5">Mode</th>
                          <th className="p-3.5">Billing Sum</th>
                          <th className="p-3.5">Status Check</th>
                          <th className="p-3.5 text-right">Dispatch Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-stone-400 font-light font-sans">
                              No client order records match current filter parameters.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-stone-50/40 transition-colors">
                              <td className="p-3.5 font-bold text-stone-900 text-xs font-mono">{o.id}</td>
                              <td className="p-3.5 space-y-0.5">
                                <div className="font-semibold text-stone-900 font-sans">{o.customerName}</div>
                                <div className="text-stone-400 text-[11px] font-mono">{o.phoneNumber}</div>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  o.orderType === "dine-in" ? "bg-teal-50 text-teal-700 border border-teal-100" :
                                  o.orderType === "takeaway" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                  "bg-blue-50 text-blue-700 border border-blue-105"
                                }`}>
                                  {o.orderType} {o.tableNumber ? `(T-${o.tableNumber})` : ""}
                                </span>
                              </td>
                              <td className="p-3.5 text-xs text-[#C67C4E] font-bold">₹{o.grandTotal}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  o.orderStatus === "New Order" ? "bg-red-50 text-red-650 border border-red-100" :
                                  o.orderStatus === "Accepted" ? "bg-orange-50 text-[#C67C4E] border border-orange-100" :
                                  o.orderStatus === "Preparing" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                  o.orderStatus === "Ready" ? "bg-amber-50 text-amber-850 border border-amber-150" :
                                  o.orderStatus === "Out For Delivery" ? "bg-purple-50 text-purple-650 border border-purple-100" :
                                  o.orderStatus === "Delivered" ? "bg-green-50 text-green-700 border border-green-100" :
                                  "bg-stone-50 text-stone-500 border border-stone-200"
                                }`}>
                                  {o.orderStatus}
                                </span>
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedOrderDetails(o)}
                                  className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-stone-600 hover:text-stone-900"
                                  title="Inspect full details"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setShowBillPrint(o)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded text-blue-600"
                                  title="Print official receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                
                                {o.orderStatus === "New Order" && (
                                  <>
                                    <button 
                                      onClick={() => updateOrderStatus(o.id, "Accepted")}
                                      className="p-1 bg-green-50 hover:bg-green-150 text-green-650 border border-green-200 rounded font-bold" 
                                      title="Accept Order"
                                    >
                                      ✓
                                    </button>
                                    <button 
                                      onClick={() => updateOrderStatus(o.id, "Cancelled")}
                                      className="p-1 bg-red-50 hover:bg-red-150 text-[#C67C4E] border border-red-200 rounded font-bold" 
                                      title="Reject/Cancel"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}

                                {o.orderStatus === "Accepted" && (
                                  <button onClick={() => updateOrderStatus(o.id, "Preparing")} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-650 border border-blue-200 rounded font-bold uppercase text-[9px]">
                                    Prep
                                  </button>
                                )}

                                {o.orderStatus === "Preparing" && (
                                  <button onClick={() => updateOrderStatus(o.id, "Ready")} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-200 rounded font-bold uppercase text-[9px]">
                                    Ready
                                  </button>
                                )}

                                {o.orderStatus === "Ready" && (
                                  <button onClick={() => updateOrderStatus(o.id, o.orderType === "delivery" ? "Out For Delivery" : "Delivered")} className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-650 border border-purple-200 rounded font-bold uppercase text-[9px]">
                                    {o.orderType === "delivery" ? "Transit" : "Serve"}
                                  </button>
                                )}

                                {o.orderStatus === "Out For Delivery" && (
                                  <button onClick={() => updateOrderStatus(o.id, "Delivered")} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded font-bold uppercase text-[9px]">
                                    Done
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: MENU MANAGEMENT */}
            {activeTab === "menu" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Header & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Dishes & Menu Catalog</h2>
                    <p className="text-xs text-stone-500">Insert new dishes, edit pricing structures, disable stock availability.</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingMenuItem({});
                      setShowMenuModal(true);
                    }}
                    className="px-4 py-2.5 bg-[#d4af37] hover:bg-[#C67C4E] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer focus:outline-none shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Recipe Card
                  </button>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Category switcher */}
                  <select
                    value={menuFilterCategory}
                    onChange={(e) => setMenuFilterCategory(e.target.value)}
                    className="bg-white border border-stone-200 px-3 py-2.5 text-xs rounded-xl text-stone-700 focus:outline-none focus:border-[#d4af37] shadow-xs"
                  >
                    <option value="All">All Food Categories</option>
                    <option value="soups">Soups</option>
                    <option value="papad-snacks">Salads & Snacks</option>
                    <option value="milkshakes">Desserts & Milkshakes</option>
                    <option value="momos">Momos Dumplings</option>
                    <option value="burgers">Burgers</option>
                    <option value="pizza">Pizza</option>
                    <option value="dosa">Dosa Heritage</option>
                    <option value="chinese">Chinese Wok</option>
                    <option value="main-course">Indian Main Course</option>
                  </select>

                  {/* Search query */}
                  <div className="relative group sm:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37] transition-colors" />
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search culinary items by name, ingredients, descriptions..."
                      className="w-full bg-white border border-stone-200 pl-11 pr-4 py-2.5 text-xs rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#d4af37] shadow-xs"
                    />
                  </div>

                </div>

                {/* Menu items grid */}
                <div className="bg-[#FAF6F0] border border-stone-250/30 rounded-2xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredMenuItems.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-xs font-mono text-stone-400">
                        No recipe item catalog matches criteria. Customize searches or launch a new recipe!
                      </div>
                    ) : (
                      filteredMenuItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 flex flex-col justify-between group hover:border-[#d4af37]/50 hover:shadow-md transition-all shadow-xs">
                          
                          <div className="space-y-2">
                            {/* Food Image and quick tags */}
                            <div className="w-full h-32 rounded-lg bg-stone-50 overflow-hidden relative border border-stone-150">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                              <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${item.isVeg ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-250"}`}>
                                {item.isVeg ? "VEG" : "NON-VEG"}
                              </span>
                              
                              <div className="absolute top-2 right-2 flex gap-1">
                                {item.isChefSpecial && <span className="bg-[#d4af37] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs">CHEF</span>}
                                {item.isBestseller && <span className="bg-[#C67C4E] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs">BEST</span>}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-stone-900 leading-tight font-sans truncate">{item.name}</h4>
                              <p className="text-[10px] text-stone-550 mt-1 line-clamp-2 font-sans font-normal leading-relaxed">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                            <span className="text-sm font-sans font-bold text-[#C67C4E]">₹{item.price}</span>
                            
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingMenuItem({ ...item });
                                  setShowMenuModal(true);
                                }}
                                className="p-1.5 bg-stone-50 hover:bg-stone-100 rounded text-stone-500 hover:text-[#d4af37] border border-stone-200 transition-colors"
                                title="Edit Item parameters"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id, item.name)}
                                className="p-1.5 bg-stone-50 hover:bg-red-50 rounded text-stone-500 hover:text-red-500 border border-stone-200 transition-colors"
                                title="Delete dish item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: CUSTOMER DIRECTORY */}
            {activeTab === "customers" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Title & Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Client Directory & Spending</h2>
                    <p className="text-xs text-stone-500">Track returning guests, overall spending logs, and last-visited timelines.</p>
                  </div>

                  <button
                    onClick={exportCustomersCSV}
                    className="px-3.5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer focus:outline-none shadow-sm"
                  >
                    <Download className="w-4 h-4 text-[#C67C4E]" />
                    Backup Client List (.CSV)
                  </button>
                </div>

                {/* Filters */}
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search client index profiles by name, phone or email..."
                    className="w-full bg-white border border-stone-200 pl-11 pr-4 py-2.5 text-xs rounded-xl focus:outline-none text-stone-900 focus:border-[#d4af37] font-sans"
                  />
                </div>

                {/* Directory table */}
                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-sans text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-left text-[10px]">
                          <th className="p-3.5">Guest Identity</th>
                          <th className="p-3.5">Phone Number</th>
                          <th className="p-3.5">Email Address</th>
                          <th className="p-3.5">Visits / Bills</th>
                          <th className="p-3.5">Total Purchases</th>
                          <th className="p-3.5">Last Visit Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700">
                        {customerAnalytics
                          .filter(c => {
                            const term = customerSearch.toLowerCase();
                            return !term || 
                              c.name.toLowerCase().includes(term) ||
                              c.phone.includes(term) ||
                              c.email.toLowerCase().includes(term);
                          })
                          .map((client, idx) => (
                            <tr key={idx} className="hover:bg-stone-50/40 transition-colors">
                              <td className="p-3.5 font-bold text-stone-900 font-sans">{client.name}</td>
                              <td className="p-3.5 text-stone-500 font-mono">{client.phone}</td>
                              <td className="p-3.5 text-stone-400 font-mono lowercase">{client.email}</td>
                              <td className="p-3.5 font-semibold text-center">{client.count}</td>
                              <td className="p-3.5 text-[#C67C4E] font-bold">₹{client.totalSpend}</td>
                              <td className="p-3.5 text-xs text-stone-500">{new Date(client.lastDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: REVENUE MANAGEMENT */}
            {activeTab === "revenue" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Header & CSV export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Accounting & Revenue Analytics</h2>
                    <p className="text-xs text-stone-500">View tax allocations, GST summaries, profits margins, and export logs.</p>
                  </div>

                  <button
                    onClick={exportRevenueCSV}
                    className="px-3.5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer focus:outline-none shadow-sm"
                  >
                    <Download className="w-4 h-4 text-[#C67C4E]" />
                    Export GST/Sales Ledger (.CSV)
                  </button>
                </div>

                {/* Profit metrics breakdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-sans text-stone-400 font-bold uppercase tracking-widest block">Accumulated Surcharge GST (5%)</span>
                    <span className="text-xl font-bold font-sans text-amber-600">₹{Math.round(orderStats.revenue * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-sans text-stone-400 font-bold uppercase tracking-widest block">Net Savor Profit (65% margin)</span>
                    <span className="text-xl font-bold font-sans text-green-600">₹{Math.round(orderStats.revenue * 0.65).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-sans text-stone-400 font-bold uppercase tracking-widest block">Average Ticket Size</span>
                    <span className="text-xl font-bold font-sans text-[#C67C4E]">
                      ₹{orderStats.total > 0 ? Math.round(orderStats.revenue / orderStats.total) : 0}
                    </span>
                  </div>
                </div>

                {/* Sub-revenue time allocations list */}
                <div className="bg-[#FAF6F0] border border-stone-250/30 rounded-2xl p-6 space-y-6 shadow-xs">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-sans">Simulated Business Period Ledger</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans text-center">
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                      <p className="text-stone-400 font-bold mb-1 uppercase text-[10px]">Today's Revenue</p>
                      <p className="text-sm font-bold text-[#C67C4E]">₹{orderStats.todayRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                      <p className="text-stone-400 font-bold mb-1 uppercase text-[10px]">Weekly Period (Weighted)</p>
                      <p className="text-sm font-bold text-teal-600">₹{Math.round(orderStats.revenue * 0.35).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                      <p className="text-stone-400 font-bold mb-1 uppercase text-[10px]">Monthly Period Sum</p>
                      <p className="text-sm font-bold text-blue-600">₹{orderStats.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                      <p className="text-stone-400 font-bold mb-1 uppercase text-[10px]">Yearly Forecast (Projection)</p>
                      <p className="text-sm font-bold text-green-600">₹{Math.round(orderStats.revenue * 12.4).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: COUPONS */}
            {activeTab === "coupons" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Header & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Discount Coupon Codes</h2>
                    <p className="text-xs text-stone-500">Configure client discount promos, expiration dates, and usage limits.</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCoupon({});
                      setShowCouponModal(true);
                    }}
                    className="px-4 py-2.5 bg-[#C67C4E] hover:bg-[#aa7c11] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer focus:outline-none shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Coupon Code
                  </button>
                </div>

                {/* Promo list table */}
                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {coupons.map((c, idx) => (
                      <div key={idx} className="bg-[#FAF6F0] border border-stone-200/80 p-4 rounded-xl flex flex-col justify-between gap-4 relative group shadow-sm">
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm font-bold font-mono tracking-widest text-[#C67C4E] bg-[#FAF6F0] border border-[#C67C4E]/20 px-2.5 py-1.5 rounded-lg font-black">
                              {c.code}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">Limit: {c.usageCount}/{c.usageLimit}</span>
                          </div>

                          <div className="pt-2 text-xs font-sans">
                            <p className="text-stone-900 font-bold">{c.type === "percentage" ? `${c.value}% Direct Off` : `₹${c.value} Fixed Discount`}</p>
                            {c.minOrderAmount && <p className="text-stone-500 text-[10px] mt-0.5">Min Basket: ₹{c.minOrderAmount}</p>}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-stone-200 text-[10px] font-sans">
                          <span className="text-stone-505">Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="text-stone-400 hover:text-red-505 cursor-pointer"
                            title="Delete this coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: GUEST REVIEWS */}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Header list */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Guest Book Moderation</h2>
                  <p className="text-xs text-stone-500 font-sans">Approve new customer testimonials, remove spam, feature star reviews on pages.</p>
                </div>

                {/* Review ledger box */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  {reviews.length === 0 ? (
                    <div className="py-12 text-center text-xs font-sans text-stone-400">No review logs available in our ledger database.</div>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="bg-[#FAF6F0] rounded-xl border border-stone-250/50 p-4.5 flex flex-col md:flex-row justify-between gap-4">
                        
                        <div className="space-y-2 max-w-2xl">
                          <div className="flex items-center gap-3">
                            <img src={r.avatar} alt={r.name} className="w-9 h-9 rounded-full object-cover border border-stone-200" />
                            <div>
                              <h4 className="text-xs font-bold text-stone-900 font-sans">{r.name}</h4>
                              <p className="text-[10px] text-stone-405 font-mono mt-0.5">{r.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[#D4AF37] py-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#D4AF37]" : "text-stone-200"}`} />
                            ))}
                          </div>

                          <p className="text-xs text-stone-605 font-sans italic leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                        </div>

                        <div className="flex flex-row md:flex-col justify-end gap-2 text-[10px] font-sans">
                          
                          {/* Approve toggle */}
                          <button
                            onClick={() => toggleReviewApproval(r.id, !!r.approved)}
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${r.approved ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-650 border-red-200"}`}
                          >
                            {r.approved ? "✓ APPROVED" : "PENDING APPROVAL"}
                          </button>

                          {/* Feature toggle */}
                          <button
                            onClick={() => toggleReviewFeatured(r.id, !!r.featured)}
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${r.featured ? "bg-amber-50 text-[#aa7c11] border-amber-200" : "bg-stone-50 text-stone-500 border-stone-200"}`}
                          >
                            {r.featured ? "★ FEATURED" : "STANDARD"}
                          </button>

                          {/* Delete review */}
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="px-3 py-1.5 bg-stone-50 text-stone-500 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer font-bold"
                          >
                            DELETE TESTIMONIAL
                          </button>

                        </div>

                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: SECURITY AUDIT LOGS */}
            {activeTab === "logs" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider">Gateway Audit Security Logs</h2>
                  <p className="text-xs text-stone-500 font-sans">Trace admin permission changes, pricing mod logs, logins, order cancellations.</p>
                </div>

                {/* Logs terminal box */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 font-sans text-xs text-stone-600 space-y-3 shadow-inner max-h-[500px] overflow-y-auto">
                  <div className="flex items-center gap-2 text-emerald-600 border-b border-stone-100 pb-3 mb-2 font-bold uppercase tracking-wider text-[10px] font-mono">
                    <ShieldCheck className="w-4 h-4 animate-pulse" />
                    AUTHORIZED AUDIT FEED ACTIVE
                  </div>
                  
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-[#FAF6F0] rounded-xl border border-stone-200/60 space-y-1.5 hover:border-stone-300 transition-colors font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-bold text-stone-400 font-mono">
                        <span>TIMESTAMP: {new Date(log.timestamp).toISOString()}</span>
                        <span className="text-[#C67C4E]">IP ADDRESS: {log.ipAddress}</span>
                      </div>
                      
                      <div className="text-xs text-stone-800">
                        User [ <strong className="text-blue-600 font-bold">{log.user}</strong> ] triggered action: 
                        <span className="font-bold underline text-[#C67C4E] ml-1.5">{log.action}</span>
                      </div>
                      
                      <p className="text-[11px] text-stone-505 font-sans font-light italic leading-relaxed">
                        Details: &ldquo;{log.details}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === "settings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wider text-left">operating portal parameters</h2>
                  <p className="text-xs text-stone-500 font-sans">Adjust delivery charges, WhatsApp targets, and address details.</p>
                </div>

                {/* Form parameters */}
                <form onSubmit={handleSettingsSave} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block">RESTAURANT LEGAL NAME</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#d4af37] text-stone-900 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block">TELEPHONE SUPPORT LINE</label>
                      <input
                        type="text"
                        value={settings.contactNumber}
                        onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#d4af37] text-stone-900 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block">WHATSAPP DISPATCH TARGET NUMBER</label>
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#d4af37] text-stone-900 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block">PACKAGING / DELIVERY SURCHARGES (₹)</label>
                      <input
                        type="number"
                        value={settings.deliveryCharges}
                        onChange={(e) => setSettings({ ...settings, deliveryCharges: Number(e.target.value) })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2.5 text-xs rounded-xl focus:outline-[#d4af37] focus:outline-none text-stone-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-[#C67C4E] uppercase tracking-widest block">COOP GOVERNMENT GST TAX (%)</label>
                      <input
                        type="number"
                        value={settings.gstPercentage}
                        onChange={(e) => setSettings({ ...settings, gstPercentage: Number(e.target.value) })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#d4af37] text-stone-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-[#C67C4E] uppercase tracking-widest block">BUSINESS SERVICE TIMINGS</label>
                      <input
                        type="text"
                        value={settings.businessHours}
                        onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#d4af37] text-stone-900 font-sans"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block">GEOLOCATION POSTAL ADDRESS</label>
                      <textarea
                        rows={2}
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        className="w-full bg-[#FAF6F0]/60 border border-stone-200 p-4 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 resize-none font-sans"
                      />
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="px-5 py-3 bg-[#e2935c] hover:bg-[#C67C4E] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer focus:outline-none shadow-sm"
                  >
                    AUTHORIZE SAVE CONFIG
                  </button>
                </form>

              </motion.div>
            )}

            {/* TAB CONTENT: KITCHEN DISPLAY */}
            {activeTab === "kitchen" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                <KitchenDashboard />
              </motion.div>
            )}

            {/* TAB CONTENT: WAITER DISPLAY */}
            {activeTab === "waiter" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                <WaiterDashboard />
              </motion.div>
            )}

            {/* TAB CONTENT: TABLES & QR CODES */}
            {activeTab === "tables" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                
                {/* Descriptive Top Panel Card */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">Table QR Self-Ordering Engine</h3>
                    <p className="text-xs text-stone-500 font-sans font-light leading-relaxed max-w-2xl">
                      Generate unique, secure table QR codes. Guests simply scan their table's code, which automatically opens the digital menu, locks their table location, and enables direct checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddTable(true);
                    }}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-mono font-semibold text-[11px] tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto border border-stone-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deploy New Table</span>
                  </button>
                </div>

                {/* Main Two-Column split Workspace */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left Column (7/12 widths): Table Floorplan list */}
                  <div className="xl:col-span-7 bg-white p-5 rounded-2xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Active Table Directory ({tables.length})</h4>
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-105 px-2 py-0.5 rounded-full">
                        {tables.filter(t => t.status === "Available").length} Ready For Seating
                      </span>
                    </div>

                    {/* Table Bento List */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {tables.map((table) => {
                        const isSelected = selectedTableForQr?.id === table.id;
                        return (
                          <div
                            key={table.id}
                            onClick={() => setSelectedTableForQr(table)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 relative flex flex-col justify-between ${
                              isSelected
                                ? "border-[#d4af37] bg-amber-50/20 shadow-sm"
                                : "border-stone-200 hover:border-stone-300 bg-stone-50/20"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                                  table.status === "Available"
                                    ? "bg-green-50 text-green-700 border-green-100"
                                    : table.status === "Occupied"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-stone-50 text-stone-500 border-stone-200"
                                }`}>
                                  {table.status}
                                </span>
                                <span className="text-[9px] font-mono text-stone-400">
                                  🪑 {table.capacity} Pax
                                </span>
                              </div>
                              <h5 className="font-serif font-bold text-stone-900 text-base mt-2">
                                Table #{table.tableNumber}
                              </h5>
                              <p className="text-[10px] text-stone-400 font-sans truncate">
                                {table.seatingArea}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-2">
                              {/* Status Quick changer */}
                              <select
                                value={table.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdateTableStatus(table.id, e.target.value as any)}
                                className="text-[9px] bg-transparent text-stone-600 border border-stone-200 rounded p-1"
                              >
                                <option value="Available">Available</option>
                                <option value="Occupied">Occupied</option>
                                <option value="Reserved">Reserved</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTable(table.id);
                                }}
                                className="p-1 hover:text-red-500 hover:bg-red-50 text-stone-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete Table"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column (5/12 width): Table QR Code Viewer & Frame Stand Generator */}
                  <div className="xl:col-span-5 flex flex-col gap-6">
                    {selectedTableForQr ? (
                      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5 text-center flex flex-col items-center">
                        <div className="border-b border-stone-100 pb-3 w-full text-left flex items-center justify-between">
                          <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">QR Framing Stand</h4>
                          <span className="text-[10px] font-mono bg-stone-950 text-stone-100 px-2 py-0.5 rounded-md uppercase">
                            Premium Stand
                          </span>
                        </div>

                        {/* Interactive URL frame code value generator */}
                        {(() => {
                          const tableNoStr = selectedTableForQr.tableNumber;
                          const qrLink = `${window.location.origin}${window.location.pathname}?table=${encodeURIComponent(tableNoStr)}`;
                          const googleQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrLink)}&qzone=1`;

                          return (
                            <div className="w-full flex flex-col items-center gap-4">
                              
                              {/* Decorative Table Stand Mockup Frame */}
                              <div className="bg-[#FAF9F5] border-4 border-stone-900 rounded-3xl p-5 w-full max-w-[280px] shadow-lg flex flex-col items-center space-y-4 relative">
                                <span className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-stone-900 rounded-full"></span>
                                
                                <div className="text-stone-900 font-serif font-extrabold uppercase text-xs tracking-wider border-b border-stone-200 pb-1.5 w-full text-center">
                                  Sagar Ratna Vegetarian
                                </div>

                                <div className="p-3 bg-white rounded-2xl border-2 border-stone-900/10 shadow-inner flex items-center justify-center">
                                  <img
                                    src={googleQrApi}
                                    alt={`Table ${tableNoStr} QR Code`}
                                    referrerPolicy="no-referrer"
                                    className="w-40 h-40 object-contain"
                                  />
                                </div>

                                <div className="space-y-1 text-center">
                                  <div className="text-[10px] font-mono text-amber-800 tracking-widest font-bold uppercase">
                                    DINE-IN ORDERING PORTAL
                                  </div>
                                  <div className="font-serif font-black text-2xl text-stone-950 uppercase">
                                    Table #{tableNoStr}
                                  </div>
                                  <p className="text-[9px] text-stone-500 leading-normal max-w-[190px] mx-auto font-sans">
                                    Scan QR with your smartphone camera to browse menu, select dishes, & order instantly!
                                  </p>
                                </div>
                              </div>

                              {/* Action Items for QR Stand */}
                              <div className="w-full space-y-2 mt-2">
                                <div className="p-3 bg-stone-50 rounded-xl text-left border border-stone-250/50 font-mono space-y-1">
                                  <span className="text-[8px] text-stone-400 block uppercase font-bold">Encrypted Web Address:</span>
                                  <span className="text-[10px] text-stone-700 block select-all break-all leading-tight bg-white p-1.5 rounded border border-stone-150">
                                    {qrLink}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <a
                                    href={googleQrApi}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-mono font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-stone-900"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download QR</span>
                                  </a>
                                  <button
                                    onClick={() => {
                                      // Native print trigger of QR Stand iframe block context
                                      const printWin = window.open("", "_blank");
                                      if (printWin) {
                                        printWin.document.write(`
                                          <html>
                                            <head>
                                              <title>Print Stand - Table ${tableNoStr}</title>
                                              <style>
                                                body { font-family: 'Georgia', serif; text-align: center; padding: 40px; background: #fff; }
                                                .stand { border: 8px solid #000; border-radius: 40px; padding: 30px; display: inline-block; max-width: 400px; background: #faf9f5; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                                                .header { text-transform: uppercase; font-size: 16px; font-weight: bold; margin-bottom: 25px; border-bottom: 3px solid #000; padding-bottom: 10px; }
                                                .qr-container { padding: 20px; background: #fff; border-radius: 20px; border: 3px solid #000; display: inline-block; margin-bottom: 25px; }
                                                .qr { width: 250px; height: 250px; }
                                                .sub { font-size: 12px; color: #b45309; letter-spacing: 2px; font-weight: bold; margin-bottom: 5px; }
                                                .table-num { font-size: 36px; font-weight: 900; margin: 10px 0; }
                                                .desc { font-size: 11px; color: #555; max-width: 300px; margin: 0 auto; line-height: 1.5; }
                                              </style>
                                            </head>
                                            <body>
                                              <div class="stand">
                                                <div class="header">SAGAR RATNA VEGETARIAN</div>
                                                <div class="qr-container">
                                                  <img class="qr" src="${googleQrApi}" />
                                                </div>
                                                <div class="sub">DINE-IN ORDERING PORTAL</div>
                                                <div class="table-num">TABLE #${tableNoStr}</div>
                                                <p class="desc">Scan this QR code with your smartphone camera to browse menu, select delicacies and order directly to your table!</p>
                                              </div>
                                              <script>
                                                window.onload = function() { window.print(); window.close(); }
                                              </script>
                                            </body>
                                          </html>
                                        `);
                                        printWin.document.close();
                                      }
                                    }}
                                    className="px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-stone-50 border border-stone-250 text-stone-850 font-mono font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>Print Stand</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="bg-stone-50 p-12 text-center rounded-2xl border border-stone-205 text-stone-400 font-sans font-light">
                        Select a table to review and download its dynamic self-ordering QR sheet or stand cardboard mockup.
                      </div>
                    )}
                  </div>
                </div>

                {/* Deploy New Table Modal Popup dialog */}
                <AnimatePresence>
                  {showAddTable && (
                    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full overflow-hidden"
                      >
                        <div className="bg-stone-900 text-white p-4 font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-between">
                          <span>DEPLOY NEW RESTAURANT TABLE</span>
                          <button
                            onClick={() => setShowAddTable(false)}
                            className="text-stone-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <form onSubmit={handleAddTable} className="p-5 space-y-4">
                          <div>
                            <label className="text-[10px] text-stone-450 font-mono block mb-1 font-bold">TABLE IDENTIFIER/NUMBER *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., 9"
                              value={newTableNo}
                              onChange={(e) => setNewTableNo(e.target.value)}
                              className="w-full bg-white text-stone-950 placeholder-stone-400 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-900 transition-all font-sans"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-450 font-mono block mb-1 font-bold">SEATING CAPACITY *</label>
                            <select
                              value={newCapacity}
                              onChange={(e) => setNewCapacity(Number(e.target.value))}
                              className="w-full bg-white text-stone-950 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-900 transition-all font-sans"
                            >
                              <option value="2">2 Guests (Couple Seating)</option>
                              <option value="4">4 Guests (Standard Box)</option>
                              <option value="6">6 Guests (Family Table)</option>
                              <option value="8">8 Guests (Large VIP Sofa)</option>
                              <option value="12">12 Guests (Feast Suite)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-450 font-mono block mb-1 font-bold">DINING AREA SECTION *</label>
                            <select
                              value={newArea}
                              onChange={(e) => setNewArea(e.target.value)}
                              className="w-full bg-white text-stone-950 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-stone-900 transition-all font-sans"
                            >
                              <option value="Main Dining Hall">Main Dining Hall</option>
                              <option value="Window Alcove">Window Alcove</option>
                              <option value="Family Suite">Family Suite</option>
                              <option value="VIP Lounge">VIP Lounge</option>
                              <option value="Balcony Area">Balcony Area</option>
                              <option value="Courtyard Garden">Courtyard Garden</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-[#d4af37] hover:bg-amber-600 text-stone-950 font-mono font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer border border-[#d4af37]"
                          >
                            AUTHORIZE AND LAUNCH TABLE
                          </button>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {/* TAB CONTENT: SUPABASE DIAGNOSTICS */}
            {activeTab === "supabase" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                <SupabaseDiagnostics />
              </motion.div>
            )}

          </div>
        </main>

      </div>

      {/* DETAIL MODAL: ORDER FULL VIEWER */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrderDetails(null)} className="fixed inset-0 bg-[#0c0a09]/40 z-40 backdrop-blur-xs" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 max-w-lg mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-50 shadow-2xl overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start border-b border-stone-200 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">Inspect Invoice Details</h3>
                  <p className="text-[10px] font-mono text-[#C67C4E] mt-0.5 font-bold">Order ID: {selectedOrderDetails.id}</p>
                </div>
                <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer">✕</button>
              </div>

              <div className="space-y-4 font-sans text-xs">
                
                {/* Customer specs */}
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200/80 space-y-1 text-stone-600">
                  <p className="text-stone-900 font-bold text-sm mb-1.5">{selectedOrderDetails.customerName}</p>
                  <p className="text-[11px]">CONTACT: <span className="text-stone-850 font-bold font-mono">{selectedOrderDetails.phoneNumber}</span></p>
                  <p className="text-[11px]">EMAIL: <span className="text-stone-850 font-mono lowercase">{selectedOrderDetails.email}</span></p>
                  <p className="text-[11px]">ORDER TYPE: <span className="text-stone-850 font-bold uppercase">{selectedOrderDetails.orderType}</span></p>
                  {selectedOrderDetails.tableNumber && <p className="text-[11px]">TABLE ALLOCATION: <span className="text-[#C67C4E] font-bold">Table #{selectedOrderDetails.tableNumber}</span></p>}
                  {selectedOrderDetails.address && <p className="text-[11px]">SHIPPING TARGET: <span className="text-stone-800 font-medium">{selectedOrderDetails.address}</span></p>}
                </div>

                {/* Items ledger */}
                <div>
                  <p className="text-[10px] text-stone-404 font-bold uppercase tracking-wider mb-2 font-mono">CULINARY ITEMS ORDERED</p>
                  <div className="space-y-2">
                    {selectedOrderDetails.items.map((itm, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 flex justify-between items-center shadow-xs">
                        <div>
                          <div className="text-stone-900 font-bold">{itm.name} <span className="text-[#C67C4E] font-bold">x{itm.quantity}</span></div>
                          {itm.customization && <div className="text-[10px] text-stone-400 mt-0.5 italic font-sans font-medium">Notes: {itm.customization}</div>}
                        </div>
                        <span className="text-stone-750 font-bold font-mono">₹{itm.price * itm.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200/80 space-y-1.5 text-stone-605 font-sans">
                  <div className="flex justify-between text-xs">
                    <span>Subtotal Basket</span>
                    <span className="font-semibold text-stone-800 font-mono">₹{selectedOrderDetails.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>GST (5%) Surcharge</span>
                    <span className="font-semibold text-stone-800 font-mono">₹{selectedOrderDetails.gst}</span>
                  </div>
                  {selectedOrderDetails.packagingCharge > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>Packaging Surcharge</span>
                      <span className="font-semibold text-stone-800 font-mono">₹{selectedOrderDetails.packagingCharge}</span>
                    </div>
                  )}
                  {selectedOrderDetails.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Coupon Discount ({selectedOrderDetails.appliedCoupon})</span>
                      <span className="font-bold font-mono">-₹{selectedOrderDetails.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-stone-250/60 pt-2 font-bold text-stone-900 text-sm">
                    <span className="text-[#C67C4E]">GRAND DISPATCH TOTAL</span>
                    <span className="text-[#C67C4E] font-mono">₹{selectedOrderDetails.grandTotal}</span>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    setShowBillPrint(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-750 text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-[#C67C4E]" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 bg-[#C67C4E] hover:bg-[#aa7c11] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Close panel
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL: BILLING RECEIPTS & PRINTING COMPONENT */}
      <AnimatePresence>
        {showBillPrint && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowBillPrint(null)} className="fixed inset-0 bg-[#0c0a09]/40 z-40 backdrop-blur-xs" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-y-12 max-w-sm mx-auto h-fit bg-white text-black p-6 z-50 shadow-2xl overflow-y-auto rounded-xl border border-stone-200">
              
              {/* Receipt Body */}
              <div className="font-mono text-xs space-y-4 select-text">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black uppercase text-black">SAGAR RATNA RESTAURANT</h4>
                  <p className="text-[10px] text-stone-500 font-sans tracking-wide font-bold">AUTHENTIC PURE VEGETARIAN DINING</p>
                  <p className="text-[9px] text-stone-500 font-sans">{settings.address}</p>
                  <p className="text-[9px] text-stone-500">Ph: {settings.contactNumber}</p>
                </div>

                <div className="border-t border-b border-stone-200 py-2 space-y-1 text-[10px]">
                  <p><strong>INVOICE NO:</strong> {showBillPrint.id}</p>
                  <p><strong>DATE & TIME:</strong> {new Date(showBillPrint.createdAt).toLocaleString()}</p>
                  <p><strong>CUSTOMER:</strong> {showBillPrint.customerName}</p>
                  <p><strong>CONTACT:</strong> {showBillPrint.phoneNumber}</p>
                  <p><strong>TYPE:</strong> {showBillPrint.orderType.toUpperCase()} {showBillPrint.tableNumber ? `(TABLE #${showBillPrint.tableNumber})` : ""}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between border-b border-stone-200 pb-1 font-bold text-[10px]">
                    <span className="w-1/2 text-left">ITEM NAME</span>
                    <span className="w-1/4 text-center">QTY</span>
                    <span className="w-1/4 text-right">PRICE</span>
                  </div>

                  {showBillPrint.items.map((itm, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] py-0.5 text-stone-700">
                      <span className="w-1/2 truncate font-bold text-left text-stone-900">{itm.name}</span>
                      <span className="w-1/4 text-center">x{itm.quantity}</span>
                      <span className="w-1/3 text-right">₹{itm.price * itm.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 pt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Amount:</span>
                    <span>₹{showBillPrint.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Government GST ({settings.gstPercentage}%):</span>
                    <span>₹{showBillPrint.gst}</span>
                  </div>
                  {showBillPrint.packagingCharge > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Packaging/Delivery:</span>
                      <span>₹{showBillPrint.packagingCharge}</span>
                    </div>
                  )}
                  {showBillPrint.discountAmount > 0 && (
                    <div className="flex justify-between font-bold text-stone-600">
                      <span>Promo Discount ({showBillPrint.appliedCoupon}):</span>
                      <span>-₹{showBillPrint.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs border-t border-dashed border-stone-300 pt-1">
                    <span className="text-stone-900">GRAND NET RECEIPT</span>
                    <span className="text-stone-900">₹{showBillPrint.grandTotal}</span>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-3 text-center space-y-1 font-sans text-[10px]">
                  <p className="font-bold text-stone-800">Payment Mode: {showBillPrint.paymentStatus === "Paid" ? "Online Complete" : "Cash On Delivery (COD)"}</p>
                  <p className="italic text-stone-500">&ldquo;Taste That Brings You Back.&rdquo;</p>
                  <p className="text-[9px] text-stone-400 font-mono">Digitally generated receipt via Control Hub</p>
                </div>
              </div>

              <div className="mt-6 flex gap-2 no-print font-sans">
                <button
                  onClick={() => {
                    window.print();
                    LocalDB.addAuditLog("Receipt Printed", `Bill slip printed for Order: ${showBillPrint.id}`, "Admin");
                  }}
                  className="w-1/2 py-2.5 bg-stone-900 text-white hover:bg-stone-850 rounded-lg text-xs font-bold tracking-wider cursor-pointer"
                >
                  Print Slip
                </button>
                <button
                  onClick={() => setShowBillPrint(null)}
                  className="w-1/2 py-2.5 bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Dismiss Receipt
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL: MENU ITEM ADD/EDIT WORKBENCH */}
      <AnimatePresence>
        {showMenuModal && editingMenuItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowMenuModal(false)} className="fixed inset-0 bg-[#0c0a09]/45 z-40 backdrop-blur-xs" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 max-w-lg mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-50 shadow-2xl overflow-y-auto max-h-[85vh]">
              
              <div className="flex justify-between items-start border-b border-stone-200 pb-4 mb-4 select-none">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">
                    {editingMenuItem.id ? "Edit Culinary Item Properties" : "Introduce New Dish Recipe"}
                  </h3>
                  <p className="text-xs text-stone-500 font-sans">Modify menus rendered in the client storefront.</p>
                </div>
                <button onClick={() => setShowMenuModal(false)} className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs font-sans text-stone-700">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block">DISH NAME</label>
                  <input
                    required
                    type="text"
                    value={editingMenuItem.name || ""}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                    className="w-full bg-[#FAF6F0]/60 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block">PRICE AMOUNT (₹)</label>
                    <input
                      required
                      type="number"
                      value={editingMenuItem.price || ""}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: Number(e.target.value) })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-sans"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#C67C4E] uppercase tracking-widest block">CATALOG CATEGORY</label>
                    <select
                      value={editingMenuItem.category || "soups"}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-700 font-sans"
                    >
                      <option value="soups">Soups</option>
                      <option value="papad-snacks">Salads & Snacks</option>
                      <option value="milkshakes">Desserts & Milkshakes</option>
                      <option value="momos">Momos Dumplings</option>
                      <option value="burgers">Burgers</option>
                      <option value="pizza">Pizza</option>
                      <option value="dosa">Dosa Heritage</option>
                      <option value="chinese">Chinese Wok</option>
                      <option value="main-course">Indian Main Course</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block font-sans">SPICINESS LEVEL (0 - 3)</label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={editingMenuItem.spiciness || 0}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, spiciness: Number(e.target.value) })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-sans font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block font-sans">DISH IMAGE URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editingMenuItem.image || ""}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image: e.target.value })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block">DISH RECIPE DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={editingMenuItem.description || ""}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                    className="w-full bg-[#FAF6F0]/65 border border-stone-200 p-3 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 resize-none font-sans"
                  />
                </div>

                {/* Switch toggles */}
                <div className="flex flex-wrap gap-4 select-none pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-stone-600 cursor-pointer font-sans font-semibold">
                    <input
                      type="checkbox"
                      checked={editingMenuItem.isVeg !== false}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isVeg: e.target.checked })}
                      className="accent-[#C67C4E] w-4 h-4 rounded"
                    />
                    Pure Vegetarian Item
                  </label>
                  
                  <label className="flex items-center gap-2.5 text-xs text-stone-600 cursor-pointer font-sans font-semibold">
                    <input
                      type="checkbox"
                      checked={!!editingMenuItem.isBestseller}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isBestseller: e.target.checked })}
                      className="accent-[#C67C4E] w-4 h-4 rounded"
                    />
                    Mark Bestseller
                  </label>
 
                  <label className="flex items-center gap-2.5 text-xs text-stone-600 cursor-pointer font-sans font-semibold">
                    <input
                      type="checkbox"
                      checked={!!editingMenuItem.isChefSpecial}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isChefSpecial: e.target.checked })}
                      className="accent-[#C67C4E] w-4 h-4 rounded"
                    />
                    Mark Chef Selection
                  </label>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-4 select-none font-sans">
                  <button
                    type="button"
                    onClick={() => setShowMenuModal(false)}
                    className="px-4 py-2 bg-stone-50 border border-stone-200 text-stone-550 rounded-xl hover:text-stone-900 hover:bg-stone-100 cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C67C4E] text-white font-bold rounded-xl hover:bg-[#aa7c11] cursor-pointer shadow-sm"
                  >
                    Authorize Changes
                  </button>
                </div>

              </form>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL: COUPON CODE ADD/EDIT */}
      <AnimatePresence>
        {showCouponModal && editingCoupon && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowCouponModal(false)} className="fixed inset-0 bg-[#0c0a09]/45 z-40 backdrop-blur-xs" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 max-w-sm mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-50 shadow-2xl">
              
              <div className="flex justify-between items-start border-b border-stone-200 pb-4 mb-4 select-none">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">Configure Coupon Promo</h3>
                  <p className="text-xs text-stone-500 font-sans font-medium">Design customer reward coupons.</p>
                </div>
                <button onClick={() => setShowCouponModal(false)} className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-sans text-stone-700">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block">COUPON CODE (UPPERCASE)</label>
                  <input
                    required
                    type="text"
                    value={editingCoupon.code || ""}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="E.G. FESTIVE50"
                    className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#C67C4E] uppercase tracking-widest block font-sans">TYPE</label>
                    <select
                      value={editingCoupon.type || "percentage"}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as any })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-700 font-sans"
                    >
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Sum Off</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block font-sans">REWARD VALUE</label>
                    <input
                      required
                      type="number"
                      value={editingCoupon.value || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                      placeholder="E.G. 20 for 20%"
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block font-sans font-bold">USAGE LIMIT</label>
                    <input
                      type="number"
                      value={editingCoupon.usageLimit || 100}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, usageLimit: Number(e.target.value) })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-mono font-bold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block font-sans font-bold">MIN AMOUNT VALUE (₹)</label>
                    <input
                      type="number"
                      value={editingCoupon.minOrderAmount || 0}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderAmount: Number(e.target.value) })}
                      className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest block font-sans font-bold">EXPIRATION DATE</label>
                  <input
                    type="date"
                    value={editingCoupon.expiryDate || ""}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, expiryDate: e.target.value })}
                    className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-sans text-left"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 select-none font-sans">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="px-4 py-2 bg-stone-50 border border-stone-200 text-stone-550 rounded-xl hover:text-stone-900 hover:bg-stone-100 cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C67C4E] text-white font-bold rounded-xl hover:bg-[#aa7c11] cursor-pointer shadow-sm"
                  >
                    Authorize Promo
                  </button>
                </div>

              </form>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL: STOCK RESTOCK DIALOG */}
      <AnimatePresence>
        {showRestockModal && selectedInventoryItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowRestockModal(false)} className="fixed inset-0 bg-[#0c0a09]/45 z-40 backdrop-blur-xs" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 max-w-sm mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-50 shadow-2xl">
              
              <div className="flex justify-between items-start border-b border-stone-200 pb-4 mb-4 select-none">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">Refill Inventory Allocation</h3>
                  <p className="text-xs text-stone-500 font-sans">Record supplier restock quantities.</p>
                </div>
                <button onClick={() => setShowRestockModal(false)} className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleRestockSave} className="space-y-4 text-xs font-sans text-stone-700">
                
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200 text-center font-sans">
                  <p className="text-stone-400 uppercase text-[10px] font-bold tracking-widest font-sans">CURRENT STOCK POSITION</p>
                  <p className="text-sm font-bold text-stone-900 mt-1">{selectedInventoryItem.name}</p>
                  <p className="text-base font-bold text-[#C67C4E] mt-1.5 font-mono">{selectedInventoryItem.stock} {selectedInventoryItem.unit} left</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-stone-450 uppercase tracking-widest block">QUANTITY TO DISPENSE ({selectedInventoryItem.unit})</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                    className="w-full bg-[#FAF6F0]/65 border border-stone-200 px-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 font-mono font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 select-none font-sans">
                  <button
                    type="button"
                    onClick={() => setShowRestockModal(false)}
                    className="px-4 py-2 bg-stone-50 border border-stone-200 text-stone-500 rounded-xl hover:text-stone-900 hover:bg-stone-100 cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C67C4E] text-white font-bold rounded-xl hover:bg-[#aa7c11] cursor-pointer shadow-sm"
                  >
                    Confirm Refill
                  </button>
                </div>

              </form>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sidebar Button component helper to keep views modular & pretty
interface SidebarBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  count?: number;
  alertColor?: string;
  onClick: () => void;
}

function SidebarBtn({ icon, label, active, count, alertColor = "bg-red-500", onClick }: SidebarBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-xs font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer select-none focus:outline-none ${active ? "bg-[#aa7c11] text-white shadow-[0_4px_15px_rgba(170,124,17,0.15)]" : "text-stone-605 hover:text-stone-900 hover:bg-stone-100"}`}
    >
      <div className="flex items-center gap-2.5">
        {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
        <span>{label}</span>
      </div>
      
      {count !== undefined && count > 0 && (
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full text-white font-black animate-pulse ${alertColor}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// Mobile Grid Navigation Button helper
interface MobileGridBtnProps {
  id: string;
  label: string;
  active?: boolean;
  icon: React.ReactNode;
  count?: number;
  alertColor?: string;
  onClick: () => void;
}

function MobileGridBtn({ id, label, active, icon, count, alertColor = "bg-red-500", onClick }: MobileGridBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.8 border rounded-lg text-[9px] font-sans font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
        active 
          ? "bg-[#aa7c11] text-white border-[#aa7c11] shadow-[0_2px_8px_rgba(170,124,17,0.2)]" 
          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-100"
      }`}
    >
      <div className="flex items-center gap-1.5 truncate">
        {React.cloneElement(icon as React.ReactElement, { className: "w-3 h-3 flex-shrink-0" })}
        <span className="truncate">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className={`text-[8px] font-mono px-1 py-0.2 rounded-full text-white font-black ml-1.5 ${alertColor}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// Stat Card helper layout
function AnalyticsStatCard({ title, count, change, highlight = false, badgeColor = "bg-stone-100 text-stone-500" }: { title: string; count: any; change: string; highlight?: boolean; badgeColor?: string }) {
  return (
    <div className={`p-4.5 rounded-2xl border transition-colors ${highlight ? "bg-gradient-to-br from-white to-amber-50/40 border-amber-300/30 shadow-md" : "bg-white border-stone-200 hover:border-stone-300 shadow-xs"}`}>
      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">{title}</span>
      <h3 className={`text-xl sm:text-2xl font-mono font-bold mt-1.5 ${highlight ? "text-[#aa7c11]" : "text-stone-900"}`}>{count}</h3>
      <span className={`inline-block text-[9px] font-mono mt-1 px-1.5 py-0.5 rounded ${badgeColor}`}>{change}</span>
    </div>
  );
}
