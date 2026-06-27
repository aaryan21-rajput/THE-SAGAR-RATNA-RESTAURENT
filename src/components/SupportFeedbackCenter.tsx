import React, { useState, useEffect, useRef } from "react";
import { 
  LifeBuoy, 
  Bug, 
  Lightbulb, 
  CreditCard, 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Send, 
  Search, 
  Filter, 
  Check, 
  ChevronRight, 
  Reply, 
  Paperclip, 
  ShieldAlert, 
  User, 
  Calendar, 
  Building, 
  AlertTriangle, 
  X, 
  Sparkles,
  BarChart3,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB, RestaurantSettings } from "../lib/db";
import { SupportTicket, TicketReply } from "../types";

interface SupportFeedbackCenterProps {
  settings: RestaurantSettings;
}

export default function SupportFeedbackCenter({ settings }: SupportFeedbackCenterProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => LocalDB.getSupportTickets());
  const [activeSubTab, setActiveSubTab] = useState<"my-tickets" | "new-ticket" | "analytics" | "super-admin">("my-tickets");
  
  // New Ticket Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicket["category"]>("Bug");
  const [priority, setPriority] = useState<SupportTicket["priority"]>("Medium");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active / Selected Ticket Viewer State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Filters for Search and Super Admin Dashboard
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterRestaurant, setFilterRestaurant] = useState<string>("All");

  // Success Notification Dialog
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  
  // Local active updates listener
  useEffect(() => {
    const handleStorageUpdate = () => {
      const refreshed = LocalDB.getSupportTickets();
      setTickets(refreshed);
      if (selectedTicket) {
        const updatedSelected = refreshed.find(t => t.id === selectedTicket.id);
        if (updatedSelected) {
          setSelectedTicket(updatedSelected);
        }
      }
    };
    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, [selectedTicket]);

  // Read status changes confirmation helper
  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    // Mark as read when owner inspects their ticket
    if (ticket.restaurantName === settings.name && ticket.unreadUpdate) {
      LocalDB.updateSupportTicket(ticket.id, { unreadUpdate: false });
      setTickets(LocalDB.getSupportTickets());
    }
  };

  // Drag and Drop Screenshot parser
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG/JPG/GIF).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setScreenshot(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearScreenshot = () => {
    setScreenshot(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Ticket Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Subject and Description fields are strictly required.");
      return;
    }

    const created = LocalDB.addSupportTicket({
      subject: subject.trim(),
      category,
      priority,
      description: description.trim(),
      screenshotUrl: screenshot,
      status: "Open",
      restaurantName: settings.name
    });

    // Reset Form Fields
    setSubject("");
    setCategory("Bug");
    setPriority("Medium");
    setDescription("");
    setScreenshot(undefined);

    // Show Custom Animated Dialog
    setSubmittedTicketId(created.id);
    
    // Refresh Tickets
    setTickets(LocalDB.getSupportTickets());
  };

  // Submit a reply (Restaurant Owner or Agent)
  const handleSendReply = (author: string) => {
    if (!selectedTicket || !replyMessage.trim()) return;

    LocalDB.addTicketReply(selectedTicket.id, author, replyMessage.trim());
    setReplyMessage("");
    
    // Auto update localized tickets state
    const refreshed = LocalDB.getSupportTickets();
    setTickets(refreshed);
    const updatedSelected = refreshed.find(t => t.id === selectedTicket.id);
    if (updatedSelected) {
      setSelectedTicket(updatedSelected);
    }
  };

  // Update Status of Ticket (Super Admin Control)
  const handleUpdateStatus = (ticketId: string, nextStatus: SupportTicket["status"]) => {
    LocalDB.updateSupportTicket(ticketId, { 
      status: nextStatus,
      // Status update triggers notification flag to the restaurant owner
      unreadUpdate: true 
    });

    // Log the audit
    LocalDB.addAuditLog("Ticket Status Modified", `Ticket ${ticketId} status changed to ${nextStatus}`, "Support Agent");

    const refreshed = LocalDB.getSupportTickets();
    setTickets(refreshed);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(refreshed.find(t => t.id === ticketId) || null);
    }
  };

  // Save Internal Notes (Super Admin Control)
  const handleSaveInternalNotes = (ticketId: string) => {
    LocalDB.updateSupportTicket(ticketId, { internalNotes: internalNotes.trim() });
    alert("Internal notes successfully updated.");
    const refreshed = LocalDB.getSupportTickets();
    setTickets(refreshed);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(refreshed.find(t => t.id === ticketId) || null);
    }
  };

  // Extract all tickets owned by this active restaurant
  const myTickets = tickets.filter(t => t.restaurantName === settings.name);
  
  // Super Admin view handles all tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || t.status === filterStatus;
    const matchesPriority = filterPriority === "All" || t.priority === filterPriority;
    const matchesCategory = filterCategory === "All" || t.category === filterCategory;
    const matchesRestaurant = filterRestaurant === "All" || t.restaurantName === filterRestaurant;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesRestaurant;
  });

  const uniqueRestaurants = Array.from(new Set(tickets.map(t => t.restaurantName)));

  // Notifications summary for owner
  const unreadCount = myTickets.filter(t => t.unreadUpdate).length;

  // Analytics derivations
  const totalCount = filteredTickets.length;
  const openCount = filteredTickets.filter(t => t.status === "Open" || t.status === "In Progress").length;
  const resolvedCount = filteredTickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;

  // Category counts for issues distribution
  const categoryStats = {
    "Bug": filteredTickets.filter(t => t.category === "Bug").length,
    "Feature Request": filteredTickets.filter(t => t.category === "Feature Request").length,
    "Billing": filteredTickets.filter(t => t.category === "Billing").length,
    "Technical Support": filteredTickets.filter(t => t.category === "Technical Support").length,
    "General Feedback": filteredTickets.filter(t => t.category === "General Feedback").length,
  };

  const mostRequestedCategory = Object.entries(categoryStats).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const mostRequestedCount = categoryStats[mostRequestedCategory as keyof typeof categoryStats];

  return (
    <div className="space-y-6">
      
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl text-[#d4af37] border border-amber-100/60">
            <LifeBuoy className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900 tracking-wide uppercase">Support & Feedback</h1>
            <p className="text-xs text-stone-500 font-sans">Report errors, request premium features, and communicate with our compliance engineering team.</p>
          </div>
        </div>

        {/* Dynamic Unread Status updates banner */}
        {unreadCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>You have {unreadCount} updated support tickets requiring attention.</span>
          </motion.div>
        )}
      </div>

      {/* Sub Tabs Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => { setActiveSubTab("my-tickets"); setSelectedTicket(null); }}
            className={`py-2 px-4 rounded-xl text-xs font-sans font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === "my-tickets" 
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/60" 
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            📋 My Tickets ({myTickets.length})
          </button>
          
          <button
            onClick={() => { setActiveSubTab("new-ticket"); setSelectedTicket(null); }}
            className={`py-2 px-4 rounded-xl text-xs font-sans font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === "new-ticket" 
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/60" 
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            ➕ Raise Ticket
          </button>

          <button
            onClick={() => { setActiveSubTab("analytics"); setSelectedTicket(null); }}
            className={`py-2 px-4 rounded-xl text-xs font-sans font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === "analytics" 
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/60" 
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            📊 Analytics & Trends
          </button>
        </div>

        {/* Super Admin Sandbox Toggle */}
        <button
          onClick={() => { setActiveSubTab("super-admin"); setSelectedTicket(null); }}
          className={`py-2 px-4 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "super-admin"
              ? "bg-stone-900 text-white shadow-md"
              : "bg-amber-100/60 text-[#aa7c11] hover:bg-amber-100 border border-amber-200/40"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SUPER ADMIN GATEWAY</span>
        </button>
      </div>

      {/* Main Core Content Switch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SIDE TICKET LIST (for communication layout context) */}
        {(activeSubTab === "my-tickets" || activeSubTab === "super-admin") && (
          <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-stone-200/80 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-200/80 pb-3">
              <h2 className="text-sm font-bold font-serif tracking-wider uppercase text-stone-850">
                {activeSubTab === "super-admin" ? "All Global Tickets" : "Your Ticket History"}
              </h2>
              <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">
                {activeSubTab === "super-admin" ? filteredTickets.length : myTickets.length} items
              </span>
            </div>

            {/* Quick Filter Box for Super Admin only */}
            {activeSubTab === "super-admin" && (
              <div className="space-y-2 pb-3 border-b border-stone-200/60 font-sans text-xs">
                <div>
                  <label className="text-[10px] font-mono text-stone-400 block mb-1">SEARCH TICKETS</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search ID, Subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#d4af37]"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-0.5">STATUS</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1 text-[11px]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-0.5">PRIORITY</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1 text-[11px]"
                    >
                      <option value="All">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-0.5">CATEGORY</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1 text-[11px]"
                    >
                      <option value="All">All Categories</option>
                      <option value="Bug">Bug</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Billing">Billing</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="General Feedback">General Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-0.5">RESTAURANT</label>
                    <select
                      value={filterRestaurant}
                      onChange={(e) => setFilterRestaurant(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1 text-[11px]"
                    >
                      <option value="All">All Outlets</option>
                      {uniqueRestaurants.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Cards List */}
            <div className="space-y-3 font-sans text-xs">
              {(activeSubTab === "super-admin" ? filteredTickets : myTickets).length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-55" />
                  <p>No tickets detected in this session.</p>
                </div>
              ) : (
                (activeSubTab === "super-admin" ? filteredTickets : myTickets).map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative cursor-pointer ${
                      selectedTicket?.id === ticket.id
                        ? "bg-stone-50 border-stone-400/80 shadow-inner"
                        : "bg-white hover:bg-stone-50/50 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {/* Status Dot / Unread updates */}
                    {ticket.unreadUpdate && ticket.restaurantName === settings.name && (
                      <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Updated status!" />
                    )}

                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-bold text-[#d4af37] tracking-wider">
                        {ticket.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wide uppercase ${
                        ticket.status === "Open" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        ticket.status === "In Progress" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        ticket.status === "Resolved" ? "bg-green-50 text-green-600 border border-green-100" :
                        "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="font-semibold text-stone-900 leading-tight truncate">
                      {ticket.subject}
                    </h4>

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-stone-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-stone-300" />
                        {ticket.restaurantName}
                      </span>
                      <span className={`font-semibold ${
                        ticket.priority === "Urgent" ? "text-rose-600" :
                        ticket.priority === "High" ? "text-amber-600" :
                        "text-stone-500"
                      }`}>
                        Priority: {ticket.priority}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* CORE DETAILS/COMMUNICATION PANEL */}
        {(activeSubTab === "my-tickets" || activeSubTab === "super-admin") && (
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {selectedTicket ? (
                <motion.div
                  key={selectedTicket.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white p-6 rounded-3xl border border-stone-200/80 space-y-6 shadow-sm"
                >
                  
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start border-b border-stone-200/80 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-amber-50 text-[#d4af37] px-2.5 py-1 rounded-lg border border-amber-200/40">
                          {selectedTicket.id}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          Raised on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-lg font-serif font-bold text-stone-900">
                        {selectedTicket.subject}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span className="bg-stone-100 px-2.5 py-0.5 rounded-md font-medium text-stone-600">
                          Category: {selectedTicket.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md font-medium ${
                          selectedTicket.priority === "Urgent" ? "bg-red-50 text-red-700" :
                          selectedTicket.priority === "High" ? "bg-orange-50 text-orange-700" :
                          "bg-stone-100 text-stone-600"
                        }`}>
                          Priority: {selectedTicket.priority}
                        </span>
                        <span className="text-stone-400 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          Outlet: {selectedTicket.restaurantName}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* SUPER ADMIN STATUS CONTROLLER */}
                  {activeSubTab === "super-admin" && (
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3 font-sans text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-stone-500 flex items-center gap-1">
                          🛡️ SUPPORT AGENT TERMINAL
                        </span>
                        <span className="text-[10px] text-stone-400">Manage state of {selectedTicket.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Status dropdown */}
                        <div>
                          <label className="text-[10px] font-mono text-stone-400 block mb-1">SET TICKET STATUS</label>
                          <div className="flex gap-2">
                            {(["Open", "In Progress", "Resolved", "Closed"] as const).map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                  selectedTicket.status === st
                                    ? "bg-[#d4af37] text-white"
                                    : "bg-white border border-stone-200 text-stone-500 hover:text-stone-850"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Internal notes */}
                        <div>
                          <label className="text-[10px] font-mono text-stone-400 block mb-1">INTERNAL AGENT NOTES (CONFIDENTIAL)</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Add developer logs or tags..."
                              defaultValue={selectedTicket.internalNotes || ""}
                              onChange={(e) => setInternalNotes(e.target.value)}
                              className="flex-grow bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInternalNotes(selectedTicket.id)}
                              className="bg-stone-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                            >
                              SAVE
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INTERNAL NOTES INDICATOR FOR OWNER */}
                  {activeSubTab === "my-tickets" && selectedTicket.internalNotes && (
                    <div className="p-3.5 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-xs text-stone-700 font-sans flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#aa7c11]">Engineering Resolution Note:</p>
                        <p className="font-light mt-0.5">{selectedTicket.internalNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* CHAT THREAD MESSAGE REPLIES */}
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                    
                    {/* The Initial Ticket Description as first post */}
                    <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-200/50 space-y-2 font-sans text-xs">
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span className="font-semibold text-stone-700">Initial Description by {selectedTicket.restaurantName}</span>
                        <span>{new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-stone-800 leading-relaxed font-light whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>

                      {/* Optional Screenshot render */}
                      {selectedTicket.screenshotUrl && (
                        <div className="mt-3.5 border border-stone-200 rounded-xl overflow-hidden max-w-sm">
                          <div className="bg-stone-100 px-3 py-1 text-[10px] font-mono text-stone-500 border-b border-stone-250/20">
                            📎 Screenshot Attachment
                          </div>
                          <img 
                            src={selectedTicket.screenshotUrl} 
                            alt="Attachment Screenshot" 
                            className="w-full max-h-60 object-contain bg-black/5"
                          />
                        </div>
                      )}
                    </div>

                    {/* Sequential replies */}
                    {selectedTicket.replies.map((reply, i) => {
                      // skip the first one if it matches description exactly to avoid duplication
                      if (i === 0 && reply.message === selectedTicket.description) return null;

                      const isAgent = reply.author === "Support Agent";

                      return (
                        <div 
                          key={reply.id} 
                          className={`p-4 rounded-2xl border flex flex-col gap-1.5 font-sans text-xs max-w-[85%] ${
                            isAgent 
                              ? "bg-amber-50/30 border-amber-200/30 ml-auto" 
                              : "bg-stone-50/30 border-stone-200/30 mr-auto"
                          }`}
                        >
                          <div className="flex justify-between items-center gap-6 text-[10px] text-stone-400">
                            <span className="font-bold text-[#aa7c11] uppercase tracking-wider font-mono flex items-center gap-1">
                              {isAgent ? "🛠️ Compliance Agent" : `🏢 Outlet Manager (${selectedTicket.restaurantName})`}
                            </span>
                            <span>{new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-stone-850 leading-relaxed font-light whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* REPLY TEXTAREA FIELD */}
                  <div className="border-t border-stone-200/80 pt-4 font-sans text-xs">
                    <div className="flex gap-2 items-end">
                      <textarea
                        rows={2}
                        placeholder={
                          activeSubTab === "super-admin"
                            ? "Reply as Support Agent..."
                            : "Reply to helpdesk staff..."
                        }
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="flex-grow bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none focus:border-[#d4af37] resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(activeSubTab === "super-admin" ? "Support Agent" : "Owner")}
                        className="bg-stone-900 hover:bg-stone-850 text-white rounded-2xl p-3 font-bold transition-all h-fit flex items-center justify-center cursor-pointer"
                        title="Send Reply"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-stone-200/80 text-center text-stone-400 flex flex-col items-center justify-center min-h-[400px]">
                  <LifeBuoy className="w-16 h-16 mb-4 opacity-30 text-[#d4af37]" />
                  <h3 className="text-base font-serif font-bold text-stone-800 uppercase tracking-wider">Ticket Selection Panel</h3>
                  <p className="text-xs text-stone-500 max-w-sm mt-1.5">
                    Select a support ticket from the list on the left to track progress, communicate with developer team, or update billing/technical logs.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB CONTENT: NEW TICKET FORM */}
        {activeSubTab === "new-ticket" && (
          <div className="col-span-3">
            <AnimatePresence mode="wait">
              {submittedTicketId ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-8 rounded-3xl border border-stone-200/80 text-center max-w-md mx-auto space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  
                  <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">Ticket Dispatched Successfully!</h2>
                  
                  <p className="text-xs text-stone-600 leading-relaxed">
                    We have successfully registered ticket <strong className="text-stone-900 font-mono font-bold">{submittedTicketId}</strong> for your restaurant outlet. 
                    Our helpdesk compliance officers will review the diagnostic logs and coordinate with you immediately.
                  </p>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono text-[11px] text-stone-500">
                    ID: {submittedTicketId} | Status: OPEN
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSubmittedTicketId(null);
                        setActiveSubTab("my-tickets");
                        // pre-select newly created ticket
                        const refreshed = LocalDB.getSupportTickets();
                        const newlyCreated = refreshed.find(t => t.id === submittedTicketId);
                        if (newlyCreated) setSelectedTicket(newlyCreated);
                      }}
                      className="flex-grow bg-stone-900 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all"
                    >
                      View Ticket Progress
                    </button>
                    <button
                      onClick={() => setSubmittedTicketId(null)}
                      className="border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl py-2 px-4 text-xs font-semibold"
                    >
                      File Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 max-w-2xl mx-auto space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">Raise Diagnostic Support Ticket</h2>
                    <p className="text-xs text-stone-500 font-sans">
                      Our system logs and diagnostics are automatically bundled. Please submit details of your issue below.
                    </p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs text-stone-800">
                    <div>
                      <label className="text-[10px] text-stone-400 font-mono block mb-1">TICKET SUBJECT *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cannot fetch Supabase database or Bluetooth printer error..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-stone-50/50 text-stone-900 placeholder-stone-400 text-xs border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-stone-400 font-mono block mb-1">ISSUE CATEGORY *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full bg-stone-50/50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-[#d4af37]"
                        >
                          <option value="Bug">🐛 Bug Report (Software Error)</option>
                          <option value="Feature Request">💡 Feature Request</option>
                          <option value="Billing">💳 Payout / Billing Issues</option>
                          <option value="Technical Support">🛠️ Technical Support</option>
                          <option value="General Feedback">💬 General Feedback</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-400 font-mono block mb-1">PRIORITY LEVEL *</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full bg-stone-50/50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-[#d4af37]"
                        >
                          <option value="Low">Low - Cosmetic/General queries</option>
                          <option value="Medium">Medium - Regular operations issue</option>
                          <option value="High">High - Core features failed</option>
                          <option value="Urgent">🚨 Urgent - Outlets locked/Fatal error</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 font-mono block mb-1">DETAILED ERROR DESCRIPTION *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Please provide steps to reproduce the bug or details of your requested improvement..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-stone-50/50 text-stone-900 placeholder-stone-400 text-xs border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-[#d4af37] resize-none"
                      />
                    </div>

                    {/* Screenshot drag-and-drop / manual selection component */}
                    <div>
                      <label className="text-[10px] text-stone-400 font-mono block mb-1">ATTACH ERROR SCREENSHOT (OPTIONAL)</label>
                      
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isDragging 
                            ? "border-[#d4af37] bg-amber-50/20" 
                            : "border-stone-250 hover:border-stone-400 bg-stone-50/30"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                        />

                        {screenshot ? (
                          <div className="space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block max-w-[200px] rounded-xl overflow-hidden shadow-sm border border-stone-200">
                              <img src={screenshot} alt="Preview Upload" className="max-h-32 object-contain" />
                              <button
                                type="button"
                                onClick={clearScreenshot}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-[10px] text-stone-400">Click preview removal button to replace attachment.</p>
                          </div>
                        ) : (
                          <>
                            <Paperclip className="w-8 h-8 text-stone-400 animate-pulse" />
                            <p className="text-xs font-semibold text-stone-700">Drag & Drop error screenshot here</p>
                            <p className="text-[10px] text-stone-400">or click to browse local folders</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab("my-tickets")}
                        className="border border-stone-200 hover:bg-stone-50 font-semibold px-5 py-2.5 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-stone-900 hover:bg-stone-850 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <span>Dispatch Ticket</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB CONTENT: ANALYTICS & TRENDS */}
        {activeSubTab === "analytics" && (
          <div className="col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              
              {/* Analytics Metric Cards */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Total Registered Tickets</span>
                  <span className="text-2xl font-bold text-stone-900 block font-sans">{totalCount}</span>
                  <span className="text-[10px] text-stone-400 mt-1 block">Active across all outlets</span>
                </div>
                <div className="p-3 bg-stone-100 rounded-2xl text-stone-500">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Open & Active Tickets</span>
                  <span className="text-2xl font-bold text-amber-600 block font-sans">{openCount}</span>
                  <span className="text-[10px] text-stone-400 mt-1 block">Currently being investigated</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-[#d4af37]">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Resolved & Closed</span>
                  <span className="text-2xl font-bold text-green-600 block font-sans">{resolvedCount}</span>
                  <span className="text-[10px] text-stone-400 mt-1 block">Successfully resolved by team</span>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

            </motion.div>

            {/* Trends, issues distribution, feature requests list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category distribution */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
                <div className="border-b border-stone-200/80 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-stone-850 uppercase tracking-wider">Diagnostic Distribution</h3>
                  <span className="text-[10px] font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-500">CATEGORY TRENDS</span>
                </div>

                <div className="space-y-3 text-xs font-sans">
                  {Object.entries(categoryStats).map(([catName, count]) => {
                    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                    return (
                      <div key={catName} className="space-y-1.5">
                        <div className="flex justify-between font-medium text-stone-700">
                          <span>{catName}</span>
                          <span className="font-mono font-bold">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#d4af37] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary and highlights */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 font-sans text-xs flex flex-col justify-between">
                <div className="border-b border-stone-200/80 pb-3">
                  <h3 className="text-sm font-serif font-bold text-stone-850 uppercase tracking-wider">Top Resolution Insights</h3>
                </div>

                <div className="space-y-3.5 flex-grow py-2">
                  <div className="p-3 bg-amber-50/40 border border-amber-200/40 rounded-2xl flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#aa7c11]">Most Common Category:</h4>
                      <p className="text-stone-600 mt-0.5 font-light">
                        {mostRequestedCategory} makes up {mostRequestedCount} registered tickets. Direct helpdesk priority is automatically elevated.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-stone-700">Resolution SLA Status:</h4>
                      <p className="text-stone-600 mt-0.5 font-light">
                        Average compliance response time is currently <strong>12 minutes</strong> with a perfect <strong>100%</strong> software bug patching rate.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubTab("new-ticket")}
                  className="w-full bg-stone-900 hover:bg-stone-850 text-white font-bold py-2 px-4 rounded-xl text-center shadow transition-all block cursor-pointer"
                >
                  Raise Diagnostic Support Ticket
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
