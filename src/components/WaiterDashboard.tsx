import { useState, useEffect, useMemo } from "react";
import { KOT, KOTStatus } from "../types";
import { LocalDB } from "../lib/db";
import { 
  Soup, Clock, Bell, LogIn, ChevronRight, User, AlertTriangle, 
  HelpCircle, Sparkles, RefreshCw, Layers, CheckCircle, Flame, Grid, List
} from "lucide-react";

export default function WaiterDashboard() {
  const [kots, setKots] = useState<KOT[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [viewStyle, setViewStyle] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [pickupAlertsPlay, setPickupAlertsPlay] = useState<boolean>(true);

  // Load KOTs
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const dbKots = await LocalDB.fetchKOTs();
      // Check if we have newly READY food to alert the waiter
      if (pickupAlertsPlay && kots.length > 0) {
        const preReadyCount = kots.filter(k => k.status === "Ready").length;
        const postReadyCount = dbKots.filter(k => k.status === "Ready").length;
        if (postReadyCount > preReadyCount) {
          playWaiterAlert();
        }
      }
      setKots(dbKots);
    } catch (err) {
      console.error("Waiter loading error:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Dual tone waiter pickup alert synthesizer
  const playWaiterAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc2.frequency.setValueAtTime(987.77, audioCtx.currentTime + 0.1); // B5
      
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData(true);
    window.addEventListener("storage", handleSync);
    window.addEventListener("kots_updated", handleSync);
    window.addEventListener("new_order", () => {
      setTimeout(() => loadData(true), 300);
    });

    const timer = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("kots_updated", handleSync);
      clearInterval(timer);
    };
  }, [kots.length]);

  // Tables list state
  const tables = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      list.push(`Table ${i}`);
    }
    return list;
  }, []);

  // Map tables to active items
  const tableStatusMap = useMemo(() => {
    const map: { [key: string]: KOT[] } = {};
    kots.forEach(k => {
      const tb = k.tableNumber;
      if (tb && tb !== "Takeaway") {
        if (!map[tb]) map[tb] = [];
        map[tb].push(k);
      }
    });
    return map;
  }, [kots]);

  // Filter out any other custom takeaway/delivery trackers
  const nonTableKots = useMemo(() => {
    return kots.filter(k => !k.tableNumber || k.tableNumber === "Takeaway" || k.tableNumber === "none");
  }, [kots]);

  // Trigger mark served
  const handleMarkServed = async (kotId: string) => {
    try {
      await LocalDB.apiUpdateKOTStatus(kotId, "Served");
      await loadData(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Realtime indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-wide uppercase">Waiter Service Dashboard</h1>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
            </span>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">Track tables 1-20, incoming kitchen food pickup alarms, and update active service tickets.</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => {
              setPickupAlertsPlay(!pickupAlertsPlay);
              if (!pickupAlertsPlay) playWaiterAlert();
            }}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
              pickupAlertsPlay 
                ? "bg-amber-50 text-amber-700 border-amber-200" 
                : "bg-stone-55 text-stone-500 border-stone-200"
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${pickupAlertsPlay ? "animate-swing" : ""}`} />
            Ready Sound: {pickupAlertsPlay ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() => loadData()}
            className="flex items-center gap-1.5 bg-white border border-stone-200 hover:border-[#d4af37] text-stone-700 text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer hover:shadow-xs active:scale-95"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#d4af37]" : ""}`} />
            Check Orders
          </button>
        </div>
      </div>

      {/* Grid vs tabular bento section split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Tables Grid or Selection view */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-sans font-bold text-stone-850 uppercase tracking-wide flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#d4af37]" />
                Dine-In Tables Floorplan (1 - 20)
              </h2>
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewStyle("grid")}
                  title="Grid visual layout"
                  className={`p-1.5 rounded-lg transition-all ${viewStyle === "grid" ? "bg-white text-stone-800 shadow-xs" : "text-stone-400"}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewStyle("list")}
                  title="List tracking view"
                  className={`p-1.5 rounded-lg transition-all ${viewStyle === "list" ? "bg-white text-stone-800 shadow-xs" : "text-stone-400"}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {viewStyle === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                {tables.map((table) => {
                  const activeKots = tableStatusMap[table] || [];
                  // filter out complete ones
                  const pendingKots = activeKots.filter(k => k.status !== "Served" && k.status !== "Cancelled");
                  const hasReady = pendingKots.some(k => k.status === "Ready");
                  const hasPreparing = pendingKots.some(k => k.status === "Preparing" || k.status === "Accepted");
                  
                  let tableBg = "bg-stone-50 border-stone-100 text-stone-700 hover:bg-stone-100";
                  let borderStyle = "border";
                  if (pendingKots.length > 0) {
                    if (hasReady) {
                      tableBg = "bg-green-50 border-green-200 text-green-800 hover:bg-green-100 animate-pulse";
                      borderStyle = "border-2 border-green-500";
                    } else if (hasPreparing) {
                      tableBg = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
                      borderStyle = "border border-amber-300";
                    } else {
                      tableBg = "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100";
                      borderStyle = "border border-blue-305";
                    }
                  }

                  const isSelected = selectedTable === table;

                  return (
                    <button
                      key={table}
                      type="button"
                      onClick={() => setSelectedTable(table)}
                      className={`h-20 rounded-2xl flex flex-col justify-center items-center gap-1 transition-all text-center cursor-pointer select-none active:scale-95 ${tableBg} ${borderStyle} ${
                        isSelected ? "ring-2 ring-[#d4af37] ring-offset-2 scale-98" : ""
                      }`}
                    >
                      <span className="text-xs font-mono font-bold">{table}</span>
                      {pendingKots.length > 0 ? (
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          hasReady ? "text-green-600" : hasPreparing ? "text-amber-600" : "text-blue-600"
                        }`}>
                          {hasReady ? "PICKUP READY" : `${pendingKots.length} Active`}
                        </span>
                      ) : (
                        <span className="text-[9px] text-stone-400">Available</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {tables.map((table) => {
                  const activeKots = tableStatusMap[table] || [];
                  const pendingKots = activeKots.filter(k => k.status !== "Served" && k.status !== "Cancelled");
                  
                  return (
                    <div 
                      key={table}
                      onClick={() => setSelectedTable(table)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer hover:bg-stone-50 transition-all ${
                        selectedTable === table ? "border-[#d4af37] bg-stone-50" : "border-stone-150"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full ${pendingKots.some(k => k.status === "Ready") ? "bg-green-500 animate-ping" : pendingKots.length > 0 ? "bg-amber-500" : "bg-stone-300"}`} />
                        <span className="text-xs font-bold text-stone-800">{table}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {pendingKots.length > 0 ? (
                          <span className="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                            {pendingKots.length} ticket{pendingKots.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">No orders</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Non dine-in / Takeaway log list */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200">
            <h2 className="text-sm font-sans font-bold text-stone-850 uppercase tracking-wide mb-3">
              Takeaway & Delivery Active Trackers ({nonTableKots.filter(k => k.status !== "Served" && k.status !== "Cancelled").length})
            </h2>
            <div className="space-y-3">
              {nonTableKots.filter(k => k.status !== "Served" && k.status !== "Cancelled").length === 0 ? (
                <p className="text-xs text-stone-400 italic">No pending takeaways/deliveries at this second.</p>
              ) : (
                nonTableKots.filter(k => k.status !== "Served" && k.status !== "Cancelled").map((kot) => (
                  <div key={kot.id} className="flex justify-between items-center bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-850 font-mono">{kot.id}</span>
                        <span className="text-[9px] uppercase bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono font-bold tracking-widest">{kot.orderType}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-sans block mt-0.5">Guest: {kot.customerName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded-lg ${
                        kot.status === "Ready" ? "bg-green-100 text-green-700 border border-green-200 animate-pulse" : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}>
                        {kot.status}
                      </span>
                      {kot.status === "Ready" && (
                        <button
                          type="button"
                          onClick={() => handleMarkServed(kot.id)}
                          className="bg-[#d4af37] hover:bg-[#aa7c11] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl cursor-pointer"
                        >
                          Deliver Item
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table Detail Inspector panel */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sticky top-6 space-y-4">
            <h2 className="text-sm font-sans font-bold text-stone-850 uppercase tracking-wide border-b border-stone-100 pb-3">
              Table Service Inspector
            </h2>

            {selectedTable ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#d4af37]/5 border border-[#d4af37]/15 p-3 rounded-2xl">
                  <div>
                    <span className="text-xs text-stone-400 block font-sans">Active Selection</span>
                    <span className="text-base font-bold font-mono text-stone-800">{selectedTable}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null)}
                    className="text-[10px] bg-white border border-stone-200 hover:border-red-300 text-stone-400 hover:text-red-500 px-2 py-1 rounded-lg"
                  >
                    Clear Select
                  </button>
                </div>

                {/* Orders under this group */}
                <div className="space-y-3">
                  {(!tableStatusMap[selectedTable] || tableStatusMap[selectedTable].filter(k => k.status !== "Served" && k.status !== "Cancelled").length === 0) ? (
                    <div className="py-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl">
                      <Soup className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-stone-500 block">No Active Orders</span>
                      <p className="text-[10px] text-stone-400 max-w-[200px] mx-auto mt-1">Ready for seating. Customers can order dining directly online from their smart menus.</p>
                    </div>
                  ) : (
                    tableStatusMap[selectedTable]
                      .filter(k => k.status !== "Served" && k.status !== "Cancelled")
                      .map((kot) => (
                        <div key={kot.id} className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3">
                          <div className="flex justify-between items-start border-b border-stone-150 pb-2.5">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono font-bold text-stone-700">{kot.id}</span>
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  kot.status === "Ready" ? "bg-green-100 border-green-200 text-green-700 animate-pulse" : "bg-amber-100 border-amber-200 text-amber-700"
                                }`}>
                                  {kot.status}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 font-sans block mt-0.5">Guest: {kot.customerName}</span>
                            </div>
                            
                            {kot.status === "Ready" && (
                              <button
                                type="button"
                                onClick={() => handleMarkServed(kot.id)}
                                className="bg-[#d4af37] hover:bg-[#aa7c11] text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                              >
                                Mark Served
                              </button>
                            )}
                          </div>

                          {/* Food details */}
                          <div className="space-y-1.5">
                            {kot.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-stone-700 font-medium">{it.name}</span>
                                <span className="font-bold text-stone-900 font-mono">x{it.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {kot.specialInstructions && kot.specialInstructions !== "None" && (
                            <div className="bg-white p-2 border border-stone-200 rounded-lg text-[10px] italic text-stone-500 font-light font-sans">
                              * Note: {kot.specialInstructions}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl">
                <Soup className="w-10 h-10 text-[#d4af37]/40 mx-auto mb-2.5 animate-bounce" />
                <span className="text-xs font-semibold text-stone-700 block">Select a table</span>
                <p className="text-[10px] text-stone-400 max-w-[200px] mx-auto mt-1.5 leading-relaxed">
                  Click on any table in the floorplan layout on the left to see active food courses, cooking timelines, and kitchen pickup statuses.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
