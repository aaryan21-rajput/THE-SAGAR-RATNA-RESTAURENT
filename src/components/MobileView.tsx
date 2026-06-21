import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Home,
  Utensils,
  Search,
  ShoppingBag,
  User,
  MapPin,
  Phone,
  Clock,
  Star,
  Flame,
  Sparkles,
  Plus,
  Minus,
  Send,
  CheckCircle2,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  X,
  ChevronRight,
  ChevronLeft,
  Leaf,
  ThumbsUp,
  Info,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MenuItem, CartItem, Category } from "../types";
import { categories as defaultCategories } from "../data";
import { LocalDB } from "../lib/db";
import TableFloorplan from "./TableFloorplan";

interface MobileViewProps {
  menuList: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (item: MenuItem) => void;
  onRemoveEntirelyFromCart: (item: MenuItem) => void;
  onUpdateCustomization: (itemId: string, note: string) => void;
  onClearCart: () => void;
  onAdminClick: () => void;
}

export default function MobileView({
  menuList,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onRemoveEntirelyFromCart,
  onUpdateCustomization,
  onClearCart,
  onAdminClick,
}: MobileViewProps) {
  // Mobile active tab: "home" | "menu" | "search" | "cart" | "contact"
  const [activeTab, setActiveTab] = useState<
    "home" | "menu" | "search" | "cart" | "contact"
  >("home");

  // Searching & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMobileCategory, setSelectedMobileCategory] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);

  // Swipeable Review Card index
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Custom mobile review states
  const [mobileReviewName, setMobileReviewName] = useState("");
  const [mobileComment, setMobileComment] = useState("");
  const [mobileRating, setMobileRating] = useState(5);
  const [isMobileReviewSubmitted, setIsMobileReviewSubmitted] = useState(false);
  const [mobileHoveredStar, setMobileHoveredStar] = useState<number | null>(
    null,
  );

  // Quick Order dialog state for WhatsApp Floating click
  const [showQuickOrder, setShowQuickOrder] = useState(false);

  // Cart Form input states
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [isQrScannedMobile, setIsQrScannedMobile] = useState(false);
  const [address, setAddress] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmittingMobile, setIsSubmittingMobile] = useState(false);
  const [checkoutErrorMobile, setCheckoutErrorMobile] = useState<string | null>(
    null,
  );

  // Pre-fill table number from scanned table URL parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tableVal = params.get("table") || params.get("t");
      if (tableVal) {
        setTableNumber(tableVal);
        setOrderType("dine-in");
        setIsQrScannedMobile(true);
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  // OTP Verification System variables (Mobile)
  const [showOtpMobile, setShowOtpMobile] = useState(false);
  const [otpCodeMobile, setOtpCodeMobile] = useState("");
  const [generatedOtpMobile, setGeneratedOtpMobile] = useState("");
  const [otpErrorMobile, setOtpErrorMobile] = useState<string | null>(null);
  const [otpCountdownMobile, setOtpCountdownMobile] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpMobile && otpCountdownMobile > 0) {
      timer = setInterval(() => {
        setOtpCountdownMobile((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showOtpMobile, otpCountdownMobile]);

  const handleCancelOtpMobile = () => {
    setShowOtpMobile(false);
    setOtpCodeMobile("");
    setOtpErrorMobile(null);
  };

  const handleResendOtpMobile = () => {
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtpMobile(randomOtp);
    setOtpCountdownMobile(60);
    setOtpCodeMobile("");
    setOtpErrorMobile(null);
  };

  // Skeleton loading state simulated on first mount for a premium app feel
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  // WhatsApp Contact Information
  const storedSettings = LocalDB.getSettings();
  const restaurantWhatsAppNumber = storedSettings.whatsappNumber
    ? storedSettings.whatsappNumber.replace(/[^0-9]/g, "")
    : "919630013483";

  // Direct review slide intervals
  const reviewsData = [
    {
      id: "rev-m1",
      name: "Aaryan Rajput",
      comment:
        "The absolute gold standard for pure vegetarian North Indian and South Indian dining. Their Paneer Butter Masala and Masala Dosa are simply legendary!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    },
    {
      id: "rev-m2",
      name: "Rohan Mehra",
      comment:
        "Incredibly fast delivery and premium packaging. The Masala Papad was crispy and Veg Kurkure Momos were still piping hot!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    },
    {
      id: "rev-m3",
      name: "Neha Sharma",
      comment:
        "Exceptional South Indian heritage flavors. The Mysore Dosa had the perfect level of red-chili garlic spice. Highly recommended!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    },
  ];

  const [dynamicReviews, setDynamicReviews] = useState<any[]>(reviewsData);

  useEffect(() => {
    async function loadMobileReviews() {
      try {
        const fetched = await LocalDB.fetchReviews();
        if (fetched && fetched.length > 0) {
          setDynamicReviews(fetched);
        }
      } catch (err) {
        console.warn("Failed loading live reviews from Supabase:", err);
      }
    }
    loadMobileReviews();
  }, []);

  useEffect(() => {
    if (dynamicReviews.length === 0) return;
    const reviewTimer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % dynamicReviews.length);
    }, 4500);
    return () => clearInterval(reviewTimer);
  }, [dynamicReviews.length]);

  const handleMobileSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileReviewName.trim() || !mobileComment.trim()) return;

    const fresh = {
      id: `rev-m-${Date.now()}`,
      name: mobileReviewName.trim(),
      comment: mobileComment.trim(),
      rating: mobileRating,
      date: "Today",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    };

    setDynamicReviews((prev) => [fresh, ...prev]);

    try {
      await LocalDB.apiPostReview({
        id: fresh.id,
        name: fresh.name,
        comment: fresh.comment,
        rating: fresh.rating,
        date: new Date().toISOString(),
        avatar: fresh.avatar,
      });
      console.log(
        "[Supabase Mobile Review Success] Sent review to guest ledger.",
      );
    } catch (err) {
      console.error(
        "[Supabase Mobile Review Save Fail] Offline but saved locally:",
        err,
      );
    }

    setMobileReviewName("");
    setMobileComment("");
    setMobileRating(5);
    setIsMobileReviewSubmitted(true);

    setTimeout(() => {
      setIsMobileReviewSubmitted(false);
    }, 4000);
  };

  // Derived calculations
  const totalItems = useMemo(
    () => cart.reduce((count, item) => count + item.quantity, 0),
    [cart],
  );
  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [cart],
  );
  const gst = Math.round(subtotal * 0.05);
  const packagingCharge = orderType === "dine-in" ? 0 : 25;
  const grandTotal = subtotal + gst + packagingCharge;

  const chefSpecialsList = useMemo(() => {
    return menuList.filter((item) => item.isChefSpecial);
  }, [menuList]);

  // Dynamic filter lists
  const filteredMenuList = useMemo(() => {
    return menuList.filter((item) => {
      // Category mapping
      if (selectedMobileCategory !== "all") {
        if (selectedMobileCategory === "south-indian") {
          if (!["idli", "uttapam", "dosa"].includes(item.category))
            return false;
        } else if (selectedMobileCategory === "drinks") {
          if (
            !["milkshakes", "mocktails", "tea-coffee", "refreshers"].includes(
              item.category,
            )
          )
            return false;
        } else {
          if (item.category !== selectedMobileCategory) return false;
        }
      }

      // Search matching
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Veg Toggles
      if (vegOnly && !item.isVeg) return false;

      // Bestseller toggles
      if (bestsellerOnly && !item.isBestseller) return false;

      return true;
    });
  }, [selectedMobileCategory, searchQuery, vegOnly, bestsellerOnly, menuList]);

  // Mobile categories specification matching instructions:
  // 🍕 Pizza, 🥟 Momos, 🍔 Burgers, 🥘 Main Course, 🥤 Drinks, 🥞 South Indian, 🥢 Chinese
  const mobileCategoryChips = [
    { id: "all", label: "✨ All", emoji: "✨" },
    { id: "south-indian", label: "🥞 South Indian", emoji: "🥞" },
    { id: "momos", label: "🥟 Momos", emoji: "🥟" },
    { id: "burgers", label: "🍔 Burgers", emoji: "🍔" },
    { id: "pizza", label: "🍕 Pizza", emoji: "🍕" },
    { id: "main-course", label: "🥘 Main Course", emoji: "🥘" },
    { id: "drinks", label: "🥤 Drinks", emoji: "🥤" },
    { id: "chinese", label: "🥢 Chinese", emoji: "🥢" },
  ];

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    if (!showOtpMobile) {
      // Step 1: generate OTP and trigger verification screen
      const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtpMobile(randomOtp);
      setOtpCountdownMobile(60);
      setOtpCodeMobile("");
      setOtpErrorMobile(null);
      setShowOtpMobile(true);
      return;
    }

    if (otpCodeMobile !== generatedOtpMobile) {
      setOtpErrorMobile(
        "Incorrect One-Time Passcode. Please check the simulator bypass code.",
      );
      return;
    }

    setIsSubmittingMobile(true);
    setCheckoutErrorMobile(null);
    setOtpErrorMobile(null);

    try {
      const orderData = {
        customerName: userName.trim(),
        phoneNumber: phoneNumber.trim() || "+91-11-4560-4560",
        email: `${userName.toLowerCase().trim().replace(/\s+/g, "")}@sagarratna-guest.com`,
        orderType: orderType,
        tableNumber: orderType === "dine-in" ? tableNumber : undefined,
        address: orderType === "delivery" ? address : undefined,
        items: cart.map((ci) => ({
          menuItemId: ci.menuItem.id,
          name: ci.menuItem.name,
          price: ci.menuItem.price,
          quantity: ci.quantity,
          customization: ci.customization,
        })),
        subtotal: subtotal,
        gst: gst,
        packagingCharge: packagingCharge,
        discountAmount: 0,
        grandTotal: grandTotal,
        orderStatus: "New Order" as const,
        paymentStatus: "Pending" as const,
        paymentMethod: "Cash on Delivery",
        totalAmount: grandTotal,
      };

      const savedOrder = await LocalDB.apiAddOrder(orderData);

      // Build the WhatsApp message link
      let message = `*🍽️ NEW ORDER - SAGAR RATNA RESTAURANT*\n`;
      message += `==============================\n\n`;
      message += `🆔 *Order ID:* ${savedOrder.id}\n`;
      message += `👤 *Name:* ${userName}\n`;
      if (phoneNumber) message += `📞 *Phone:* ${phoneNumber}\n`;
      message += `📍 *Order Type:* ${orderType.toUpperCase()}\n`;

      if (orderType === "dine-in" && tableNumber) {
        message += `🪑 *Table Number:* ${tableNumber}\n`;
      } else if (orderType === "delivery" && address) {
        message += `🏠 *Delivery Address:* ${address}\n`;
      }

      message += `\n*🛒 ITEMS ORDERED:*\n`;
      message += `------------------------------\n`;
      cart.forEach((item) => {
        message += `• *${item.quantity}x* ${item.menuItem.name} *(₹${item.menuItem.price})*\n`;
        if (item.customization) {
          message += `  └ _Note: ${item.customization}_\n`;
        }
      });
      message += `------------------------------\n`;
      message += `Subtotal: ₹${subtotal}\n`;
      message += `GST (5%): ₹${gst}\n`;
      if (packagingCharge > 0)
        message += `Packaging/Delivery: ₹${packagingCharge}\n`;
      message += `*🔥 GRAND TOTAL: ₹${grandTotal}*\n\n`;
      message += `🛋️ _Sent via Sagar Ratna Mobile Portal_`;

      const encodedText = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${restaurantWhatsAppNumber}?text=${encodedText}`;

      window.open(whatsappUrl, "_blank");

      setOrderPlaced(true);
      setShowOtpMobile(false);
      setOtpCodeMobile("");
      setGeneratedOtpMobile("");
      setTimeout(() => {
        setOrderPlaced(false);
        onClearCart();
        setActiveTab("home");
      }, 4000);
    } catch (err: any) {
      console.error(err);
      setCheckoutErrorMobile(
        err.message || "Failed to finalize order checkout structure.",
      );
    } finally {
      setIsSubmittingMobile(false);
    }
  };

  const handleQuickWhatsAppQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const targetQuery = `Hello Sagar Ratna, I would like to inquire about direct delivery slots and pure vegetarian catering prices.`;
    const encoded = encodeURIComponent(targetQuery);
    window.open(
      `https://wa.me/${restaurantWhatsAppNumber}?text=${encoded}`,
      "_blank",
    );
    setShowQuickOrder(false);
  };

  return (
    <div
      className="bg-[#FAF9F5] text-stone-850 min-h-screen flex flex-col font-sans select-none antialiased relative pb-24"
      id="mobile-viewport"
    >
      {/* 100% Pure Veg Top Pill banner / Status bar */}
      <div className="bg-stone-900 text-[10px] font-mono font-medium text-[#d4af37] border-b border-[#d4af37]/10 py-2.5 text-center tracking-wider uppercase flex items-center justify-center gap-1.5 px-4 sticky top-0 z-40">
        <Sparkles className="w-3.5 h-3.5 text-[#d4af37] animate-pulse" />
        <span>100% Pure Vegetarian Sagar Ratna</span>
        <span>•</span>
        <span className="text-white font-sans">Delivering Pure Memories</span>
      </div>

      {animateContainer(isLoading, activeTab, {
        home: (
          <div className="space-y-8 animate-fade-in pb-12">
            {/* Elegant Mobile Hero Section */}
            <div
              className="relative overflow-hidden rounded-3xl mx-4 mt-4 h-[340px] bg-cover bg-center shadow-[0_12px_40px_rgba(40,30,10,0.12)]"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800')",
              }}
            >
              {/* Glassmorphic border lines */}
              <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none" />

              {/* Floating badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-800 text-[10px] font-semibold text-amber-400 flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.8 Rating</span>
                </div>
                <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-800 text-[10px] font-semibold text-white flex items-center gap-1 shadow-lg">
                  <Clock className="w-3 h-3 text-[#d4af37]" />
                  <span>25-35 Mins</span>
                </div>
              </div>

              {/* Logo icon representation */}
              <div className="absolute top-4 right-4 bg-black/85 backdrop-blur-md p-2 rounded-2xl border border-gray-800/80 shadow-md">
                <span className="text-sm font-serif font-extrabold text-[#d4af37]">
                  SR
                </span>
              </div>

              {/* Hero Content Bottom */}
              <div className="absolute bottom-6 left-6 right-6 space-y-3">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#d4af37] uppercase font-bold">
                  ESTD 2004 • NEW DELHI
                </span>
                <h1 className="text-3xl font-serif font-extrabold text-white leading-tight tracking-wide">
                  Sagar Ratna
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-xl font-medium mt-0.5">
                    Premium Vegetarian Dining
                  </span>
                </h1>
                <p className="text-xs text-gray-300 font-sans tracking-wide italic font-light opacity-90">
                  &ldquo;Taste That Brings You Back&rdquo;
                </p>

                {/* Floating Action Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab("menu")}
                  className="mt-2 w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_10px_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
                >
                  <Utensils className="w-4 h-4" />
                  Order Now
                </motion.button>
              </div>
            </div>

            {/* Quick Promo Ribbon */}
            <div className="mx-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-[#d4af37] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Free Delivery Coupon
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Auto-applies above ₹400 orders
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#aa7c11] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-bold">
                SRFREE
              </span>
            </div>

            {/* Chef's Signature Specials Carousel Section */}
            <div className="space-y-4">
              <div className="px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">
                    Chef&apos;s Specials
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  Swipe Left
                </span>
              </div>

              {/* Horizontal Scroll wrapper */}
              <div className="overflow-x-auto pb-4 px-4 flex gap-4 scrollbar-none snap-x snap-mandatory">
                {chefSpecialsList.map((item) => {
                  const qty =
                    cart.find((ci) => ci.menuItem.id === item.id)?.quantity ||
                    0;
                  return (
                    <div
                      key={item.id}
                      className="w-[280px] flex-shrink-0 bg-white border border-stone-200/85 rounded-3xl overflow-hidden snap-start shadow-[0_8px_30px_rgba(40,30,10,0.04)] flex flex-col justify-between"
                    >
                      <div className="relative h-44 w-full bg-stone-105">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover brightness-[0.93]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-black/10" />
                        <span className="absolute top-3 left-3 bg-[#aa7c11] text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 fill-current" /> Popular
                        </span>
                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-stone-200/80 flex items-center gap-1 text-[10px] text-stone-800 shadow-sm">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-serif font-bold text-stone-900 line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-stone-550 line-clamp-2 leading-relaxed font-light">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <span className="text-sm font-mono text-[#aa7c11] font-semibold">
                            ₹{item.price}
                          </span>

                          {qty > 0 ? (
                            <div className="flex items-center gap-2 bg-[#d4af37] rounded-xl p-0.5 border border-[#d4af37]">
                              <button
                                onClick={() => onRemoveFromCart(item)}
                                className="w-6 h-6 rounded-lg bg-stone-900 text-[#d4af37] flex items-center justify-center active:bg-stone-850"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-black font-mono font-bold text-xs w-4 text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => onAddToCart(item)}
                                className="w-6 h-6 rounded-lg bg-stone-900 text-[#d4af37] flex items-center justify-center active:bg-stone-850"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onAddToCart(item)}
                              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-805 text-[10px] font-bold tracking-wider text-white rounded-lg border border-stone-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-[#d4af37]" /> ADD
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Menu Browsing Trigger Cards (Bento-grid styled highlights) */}
            <div className="px-4 space-y-4">
              <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">
                Popular Flavors
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    setSelectedMobileCategory("south-indian");
                    setActiveTab("menu");
                  }}
                  className="relative h-24 rounded-2xl overflow-hidden cursor-pointer group shadow-[0_8px_25px_rgba(40,30,10,0.05)]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=300"
                    className="w-full h-full object-cover brightness-[0.7] group-hover:scale-105 transition-all duration-300"
                    alt="South Indian"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-serif font-bold text-white">
                    🥞 South Indian
                  </span>
                </div>
                <div
                  onClick={() => {
                    setSelectedMobileCategory("chinese");
                    setActiveTab("menu");
                  }}
                  className="relative h-24 rounded-2xl overflow-hidden cursor-pointer group shadow-[0_8px_25px_rgba(40,30,10,0.05)]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=300"
                    className="w-full h-full object-cover brightness-[0.7] group-hover:scale-105 transition-all duration-300"
                    alt="Chinese"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-serif font-bold text-white">
                    🥢 Chinese Wok
                  </span>
                </div>
                <div
                  onClick={() => {
                    setSelectedMobileCategory("main-course");
                    setActiveTab("menu");
                  }}
                  className="relative h-24 rounded-2xl overflow-hidden cursor-pointer group shadow-[0_8px_25px_rgba(40,30,10,0.05)]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=300"
                    className="w-full h-full object-cover brightness-[0.7] group-hover:scale-105 transition-all duration-300"
                    alt="Indian Main Course"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-serif font-bold text-white">
                    🥘 Indian Mains
                  </span>
                </div>
                <div
                  onClick={() => {
                    setSelectedMobileCategory("pizza");
                    setActiveTab("menu");
                  }}
                  className="relative h-24 rounded-2xl overflow-hidden cursor-pointer group shadow-[0_8px_25px_rgba(40,30,10,0.05)]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300"
                    className="w-full h-full object-cover brightness-[0.7] group-hover:scale-105 transition-all duration-300"
                    alt="Pizza"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-serif font-bold text-white">
                    🍕 Pizza & Italian
                  </span>
                </div>
              </div>
            </div>

            {/* Swipeable Testimonials Section */}
            <div className="px-4 space-y-4">
              <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">
                Guest Ledger Feedback
              </h2>
              <div className="bg-white p-5 rounded-3xl border border-stone-250/80 shadow-[0_8px_30px_rgba(40,30,10,0.03)] relative overflow-hidden min-h-[160px] flex flex-col justify-between">
                <span className="absolute right-6 top-4 text-7xl font-serif text-stone-100 select-none pointer-events-none">
                  &ldquo;
                </span>

                {(() => {
                  const activeReview =
                    dynamicReviews[currentReviewIndex] ||
                    dynamicReviews[0] ||
                    reviewsData[0];
                  if (!activeReview) return null;
                  return (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < activeReview.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-stone-605 italic font-sans leading-relaxed font-light">
                          &ldquo;{activeReview.comment}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                        <img
                          src={
                            activeReview.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                          }
                          alt={activeReview.name}
                          className="w-8 h-8 rounded-full border border-[#d4af37]/30 object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">
                            {activeReview.name}
                          </h4>
                          <span className="text-[10px] text-stone-400 font-mono">
                            Diner Experiencing
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Custom Review Form inside Mobile View Home tab */}
            <div className="px-4 pb-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-250/80 shadow-[0_8px_30px_rgba(40,30,10,0.03)] relative">
                <h3 className="text-xs font-serif font-bold text-stone-850 tracking-widest uppercase mb-4">
                  Share Your Experience
                </h3>

                <AnimatePresence mode="wait">
                  {isMobileReviewSubmitted ? (
                    <motion.div
                      key="mobile-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-6 text-center text-green-650 font-sans text-xs flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-50 border border-green-500/20 flex items-center justify-center text-green-650 mb-2 shadow-sm animate-pulse">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Review Submitted!</span>
                      <span className="text-[10px] text-stone-400">
                        Thank you for your valuable feedback.
                      </span>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="mobile-form"
                      onSubmit={handleMobileSubmitReview}
                      className="space-y-4"
                    >
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name (e.g., Aaryan Rajput)"
                          required
                          value={mobileReviewName}
                          onChange={(e) => setMobileReviewName(e.target.value)}
                          className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 text-xs rounded-xl p-3 border border-stone-200 focus:outline-none focus:border-[#d4af37] transition-all font-sans"
                        />
                      </div>

                      {/* Interactive Rating bar selection */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 font-sans mr-2">
                          Your Rating:
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setMobileRating(star)}
                              onMouseEnter={() => setMobileHoveredStar(star)}
                              onMouseLeave={() => setMobileHoveredStar(null)}
                              className="focus:outline-none cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 transition-colors ${
                                  star <= (mobileHoveredStar ?? mobileRating)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-stone-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <textarea
                          placeholder="How was your experience? Dosa or Paneer?"
                          required
                          rows={3}
                          value={mobileComment}
                          onChange={(e) => setMobileComment(e.target.value)}
                          className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 text-xs rounded-xl p-3 border border-stone-200 focus:outline-none focus:border-[#d4af37] transition-all font-sans resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-stone-900 text-[#d4af37] hover:bg-[#aa7c11] text-xs font-bold tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all focus:outline-none"
                      >
                        <Send className="w-3.5 h-3.5 stroke-[2]" />
                        SUBMIT TESTIMONIAL
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ),
        menu: (
          <div className="animate-fade-in pb-12">
            {/* Sticky/Fixed-style Search Bar & Veg Toggles for fast food-app browsing */}
            <div className="bg-[#FAF9F5]/98 backdrop-blur-xl sticky top-11 z-30 px-4 py-3.5 space-y-3.5 border-b border-stone-200/65 shadow-[0_4px_20px_rgba(40,30,10,0.015)]">
              {/* Premium Culinary Search Track */}
              <div className="relative bg-white rounded-xl border border-stone-200 shadow-[0_2px_12px_rgba(40,30,10,0.01)] flex items-center transition-all duration-300 focus-within:border-[#aa7c11] focus-within:ring-2 focus-within:focus-within:ring-[#aa7c11]/10 px-3 py-1.5">
                <Search className="h-4 w-4 text-[#aa7c11] mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search pure savory starters, dosas, shakes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-stone-900 placeholder-stone-400 focus:outline-none text-[11px] font-sans font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center justify-center p-1 rounded-full hover:bg-stone-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                )}
              </div>

              {/* Toggles bar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[10px] uppercase tracking-widest font-bold font-mono transition-all duration-300 border cursor-pointer ${
                    vegOnly
                      ? "bg-green-500/8 text-green-700 border-green-300 shadow-inner"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex items-center justify-center border ${vegOnly ? "border-green-600 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "border-stone-400 bg-stone-150"}`}
                  >
                    <span
                      className="w-1 h-1 rounded-full bg-current"
                      style={{ display: vegOnly ? "block" : "none" }}
                    />
                  </span>
                  PURE VEG
                </button>

                <button
                  type="button"
                  onClick={() => setBestsellerOnly(!bestsellerOnly)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[10px] uppercase tracking-widest font-bold font-mono transition-all duration-300 border cursor-pointer ${
                    bestsellerOnly
                      ? "bg-amber-500/8 text-[#aa7c11] border-amber-300 shadow-inner"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <ThumbsUp
                    className={`w-3.5 h-3.5 ${bestsellerOnly ? "text-[#aa7c11] fill-current" : "text-stone-400"}`}
                  />
                  BESTSELLERS
                </button>
              </div>

              {/* Horizontal Category Chips */}
              <div className="relative">
                <div className="overflow-x-auto pb-1 flex gap-1.5 scrollbar-none scroll-smooth">
                  {mobileCategoryChips.map((chip) => {
                    const isSelected = selectedMobileCategory === chip.id;
                    return (
                      <motion.button
                        key={chip.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMobileCategory(chip.id)}
                        className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-bold tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer relative ${
                          isSelected
                            ? "bg-[#aa7c11] text-white shadow-md shadow-[#aa7c11]/10 border border-[#aa7c11]"
                            : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <span className="text-[11px]">{chip.emoji}</span>
                        <span className="font-sans text-[10px] uppercase tracking-wider">
                          {chip.label.replace(chip.emoji, "").trim()}
                        </span>
                        {isSelected && (
                          <motion.span
                            layoutId="mobileActiveIndicator"
                            className="absolute -bottom-0.5 left-1/4 right-1/4 h-[2px] bg-white rounded-full"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Menu Cards List */}
            <div className="px-4 py-4 space-y-4">
              {filteredMenuList.length === 0 ? (
                <div className="py-16 text-center max-w-xs mx-auto">
                  <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#aa7c11] mx-auto mb-3">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    No Dishes Found
                  </h4>
                  <p className="text-xs text-stone-500 font-light mt-1.5">
                    Savor another search term or select a broader category!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMenuList.map((item) => {
                    const qty =
                      cart.find((ci) => ci.menuItem.id === item.id)?.quantity ||
                      0;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(40,30,10,0.02)] p-3 flex gap-3 relative"
                      >
                        {/* Shading, Badge & Image */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-105 flex-shrink-0 relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/5" />

                          {/* Pure Veg square green dot */}
                          <div className="absolute top-1 left-1 bg-white/90 p-0.5 rounded border border-stone-200/80">
                            <div className="w-2.5 h-2.5 border border-green-600 p-[1px] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                            </div>
                          </div>
                        </div>

                        {/* Text & Cart controls */}
                        <div className="flex-grow flex flex-col justify-between min-w-0">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="text-xs font-serif font-bold text-stone-900 line-clamp-1">
                                {item.name}
                              </h3>
                              {item.isBestseller && (
                                <span className="text-[7px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded uppercase font-bold flex-shrink-0">
                                  Bestseller
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 font-sans leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-1">
                            <span className="text-xs font-mono font-bold text-[#aa7c11]">
                              ₹{item.price}
                            </span>

                            {qty > 0 ? (
                              <div className="flex items-center gap-2 bg-[#d4af37] rounded-lg p-0.5">
                                <button
                                  onClick={() => onRemoveFromCart(item)}
                                  className="w-5.5 h-5.5 rounded bg-stone-900 text-[#d4af37] flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-black font-mono font-black text-xs w-4 text-center">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => onAddToCart(item)}
                                  className="w-5.5 h-5.5 rounded bg-stone-900 text-[#d4af37] flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onAddToCart(item)}
                                className="px-3 py-1 bg-stone-900 border border-stone-800 text-[9px] font-mono font-bold text-white rounded-lg flex items-center gap-1 hover:border-[#aa7c11] cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5 text-[#d4af37]" />{" "}
                                ADD
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ),
        search: (
          <div className="px-4 py-6 animate-fade-in pb-12 space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <Search className="w-5 h-5 text-[#aa7c11]" /> Direct Instant
              Search
            </h2>

            <div className="relative bg-white rounded-xl border border-stone-200 shadow-[0_2px_12px_rgba(40,30,10,0.01)] flex items-center transition-all duration-300 focus-within:border-[#aa7c11] focus-within:ring-2 focus-within:ring-[#aa7c11]/10 px-3 py-2">
              <Search className="h-4 w-4 text-[#aa7c11] mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Type name, category or tag (e.g. Dosa, Soup, Paneer)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[#2c2c2c] placeholder-stone-400 focus:outline-none text-[11px] font-sans font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center justify-center p-1 rounded-full hover:bg-stone-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-stone-500" />
                </button>
              )}
            </div>

            {searchQuery ? (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-stone-500 uppercase">
                  Search Results ({filteredMenuList.length})
                </h3>
                {filteredMenuList.map((item) => {
                  const qty =
                    cart.find((ci) => ci.menuItem.id === item.id)?.quantity ||
                    0;
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-xl border border-stone-200/95 flex gap-3 shadow-[0_4px_15px_rgba(40,30,10,0.02)]"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover bg-stone-105"
                      />
                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-stone-500 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-mono text-[#aa7c11] font-semibold">
                            ₹{item.price}
                          </span>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-[#d4af37] rounded p-0.5">
                              <button
                                onClick={() => onRemoveFromCart(item)}
                                className="w-5 h-5 bg-stone-900 text-[#d4af37] rounded flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-[10px] text-black font-mono font-bold w-3 text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => onAddToCart(item)}
                                className="w-5 h-5 bg-stone-900 text-[#d4af37] rounded flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onAddToCart(item)}
                              className="text-[9px] font-mono bg-stone-900 border border-stone-800 text-white px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                            >
                              + ADD
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4 max-w-xs mx-auto">
                <p className="text-xs text-stone-500">Popular hot searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Masala Dosa",
                    "Veg Kurkure Momos",
                    "Paneer Butter Masala",
                    "Chilli Paneer",
                    "Cold Coffee",
                    "Chana Masala",
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 bg-white border border-stone-200 text-[10px] text-stone-600 rounded-lg hover:border-[#aa7c11] hover:text-stone-900 transition-all cursor-pointer shadow-sm"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
        cart: (
          <div className="animate-fade-in pb-12">
            <div className="px-4 py-5 border-b border-stone-200/85 flex items-center justify-between bg-white shadow-sm">
              <h2 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#aa7c11]" /> Luxury Basket
              </h2>
              <span className="text-xs font-mono text-stone-550">
                ({totalItems} Items)
              </span>
            </div>

            {orderPlaced ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-[#aa7c11] animate-bounce" />
                <h3 className="mt-4 text-lg font-serif font-bold text-stone-900 uppercase tracking-wide">
                  Order Dispatched!
                </h3>
                <p className="mt-2 text-xs text-stone-550 leading-relaxed font-sans max-w-xs">
                  We have loaded your receipt and items directly to WhatsApp.
                  Click send in chat to start cooking!
                </p>
                <span className="mt-4 text-[10px] font-mono bg-stone-50 border border-stone-150 px-3 py-1 rounded text-stone-505">
                  Connecting kitchen...
                </span>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-xs mx-auto">
                <div className="w-14 h-14 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 mx-auto shadow-sm">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">
                  Your Plate is Empty
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-[200px] mx-auto">
                  Browse through our menu categories and add pure veg dishes to
                  order.
                </p>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-4 py-2 bg-[#aa7c11] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="flex flex-col">
                {/* Cart Items */}
                <div className="px-4 py-4 space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="bg-white p-3.5 rounded-xl border border-stone-250 flex flex-col gap-2.5 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          className="w-12 h-12 rounded-lg object-cover bg-stone-105"
                        />
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between">
                            <h4 className="text-xs font-bold text-stone-900 truncate font-sans">
                              {item.menuItem.name}
                            </h4>
                            <span className="text-xs font-mono font-bold text-[#aa7c11]">
                              ₹{item.menuItem.price * item.quantity}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">
                            ₹{item.menuItem.price} each
                          </span>
                        </div>
                      </div>

                      {/* Customization Note per item inside cart */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <input
                          type="text"
                          placeholder="No onion, extra spicy etc..."
                          value={item.customization || ""}
                          onChange={(e) =>
                            onUpdateCustomization(
                              item.menuItem.id,
                              e.target.value,
                            )
                          }
                          className="text-[10px] bg-stone-50 text-stone-850 placeholder-stone-400 rounded p-1.5 focus:outline-none border border-stone-200 w-32 font-sans font-light"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-stone-50 p-0.5 rounded border border-stone-200">
                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(item.menuItem)}
                              className="w-5 h-5 text-stone-500 hover:text-stone-950 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-[11px] font-mono text-stone-900 font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAddToCart(item.menuItem)}
                              className="w-5 h-5 text-stone-500 hover:text-stone-950 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveEntirelyFromCart(item.menuItem)
                            }
                            className="text-stone-400 hover:text-red-500 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-stone-200"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Billing */}
                <div className="bg-white m-4 p-4 rounded-2xl border border-stone-250 space-y-4 shadow-sm">
                  {showOtpMobile ? (
                    <div className="space-y-4 font-sans text-left">
                      <div className="flex items-center gap-2 text-[#aa7c11]">
                        <svg
                          className="w-5 h-5 animate-pulse"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#aa7c11]">
                          OTP Security Gate
                        </span>
                      </div>

                      <p className="text-stone-500 text-xs leading-relaxed font-sans">
                        To reserve your kitchen service and complete checkout, a
                        simulated 4-digit code has been dispatched via cellular
                        gateway to:{" "}
                        <strong className="text-stone-900">
                          {phoneNumber || "+91 11-4560-4560"}
                        </strong>
                        .
                      </p>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-stone-550 font-mono block">
                          ENTER 4-DIGIT VERIFICATION CODE
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          placeholder="••••"
                          value={otpCodeMobile}
                          onChange={(e) =>
                            setOtpCodeMobile(e.target.value.replace(/\D/g, ""))
                          }
                          className="w-full text-center tracking-[0.8em] font-mono font-bold bg-white text-stone-900 placeholder-stone-300 text-base border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-[#aa7c11]"
                        />
                        {otpErrorMobile && (
                          <p className="text-[10px] text-red-650 font-sans mt-1">
                            {otpErrorMobile}
                          </p>
                        )}
                      </div>

                      {/* Developer manual override key */}
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[9px] text-stone-750 font-mono flex items-center justify-between">
                        <span>🛡️ OTP SANDBOX BYPASS:</span>
                        <strong className="text-xs font-bold text-[#aa7c11] tracking-wide font-mono">
                          {generatedOtpMobile}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={handleCancelOtpMobile}
                          className="text-stone-500 hover:text-stone-750 font-medium underline cursor-pointer"
                        >
                          Modify Details
                        </button>

                        {otpCountdownMobile > 0 ? (
                          <span className="text-stone-400 font-mono text-[10px]">
                            Resend in {otpCountdownMobile}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtpMobile}
                            className="text-[#aa7c11] hover:text-[#aa7c11]/80 font-bold underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Diner & Service Details
                      </h4>

                      {/* Dine-in vs Takeaway selector */}
                      <div className="grid grid-cols-2 gap-2 bg-stone-105 p-1 rounded-lg border border-stone-200">
                        {(["dine-in", "takeaway"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setOrderType(type)}
                            className={`py-1.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                              orderType === type
                                ? "bg-[#d4af37] text-black shadow-sm"
                                : "text-stone-500 hover:text-stone-800"
                            }`}
                          >
                            {type.replace("-", " ")}
                          </button>
                        ))}
                      </div>

                      {/* Form inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] text-stone-550 font-mono block mb-1">
                            YOUR NAME *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Aaryan Rajput"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full bg-white text-stone-850 placeholder-stone-400 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#aa7c11]"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-stone-550 font-mono block mb-1">
                            PHONE NUMBER (OPTIONAL)
                          </label>
                          <input
                            type="tel"
                            placeholder="+91-11-XXXX-XXXX"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-white text-stone-850 placeholder-stone-400 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#aa7c11]"
                          />
                        </div>

                        {orderType === "dine-in" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] text-stone-550 font-mono block mb-1 font-bold">
                                TABLE NUMBER *
                              </label>
                              {isQrScannedMobile && (
                                <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-xl text-[10px] text-[#aa7c11] font-sans flex items-center gap-1.5 mb-1.5 shadow-xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  <span>
                                    Table #{tableNumber} pre-filled via dining
                                    QR code!
                                  </span>
                                </div>
                              )}
                              <input
                                type="text"
                                required
                                placeholder="e.g., Table No. 4"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full bg-white text-stone-850 placeholder-stone-400 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#aa7c11]"
                              />
                            </div>
                          </div>
                        )}

                        {orderType === "delivery" && (
                          <div>
                            <label className="text-[9px] text-stone-550 font-mono block mb-1">
                              DELIVERY ADDRESS *
                            </label>
                            <textarea
                              required
                              placeholder="Write address, landmarks, sector codes..."
                              rows={2}
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="w-full bg-white text-stone-850 placeholder-stone-400 text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#aa7c11] resize-none"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Subtotal & Call-To-Action sticky button */}
                <div className="bg-white border-t border-stone-205 p-4 space-y-3 pb-8 shadow-[0_-8px_30px_rgba(40,30,10,0.02)]">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-500">
                      <span>Plates Price</span>
                      <span className="font-mono">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Service tax GST (5%)</span>
                      <span className="font-mono">₹{gst}</span>
                    </div>
                    {packagingCharge > 0 && (
                      <div className="flex justify-between text-stone-500">
                        <span>Convenience Packing</span>
                        <span className="font-mono font-medium">
                          ₹{packagingCharge}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-900 text-base font-bold pt-2 border-t border-stone-105">
                      <span className="font-serif italic font-medium">
                        Total Price
                      </span>
                      <span className="font-mono text-[#aa7c11]">
                        ₹{grandTotal}
                      </span>
                    </div>
                  </div>

                  {checkoutErrorMobile && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs text-center font-sans">
                      {checkoutErrorMobile}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingMobile}
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Send
                      className={`w-4 h-4 text-white fill-current ${isSubmittingMobile ? "animate-bounce" : ""}`}
                    />
                    {isSubmittingMobile
                      ? "RESERVING DISHES..."
                      : showOtpMobile
                        ? "VERIFY OTP & CONFIRM"
                        : "Send Order on WhatsApp"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ),
        contact: (
          <div className="px-4 py-6 animate-fade-in pb-12 space-y-6">
            <h2 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-5 h-5 text-[#aa7c11]" /> Contact & Reach Us
            </h2>

            {/* Quick action buttons row */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:+911145604560"
                className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#aa7c11]" />
                </div>
                <span className="text-xs font-bold text-stone-900">
                  Call Kitchen
                </span>
                <span className="text-[10px] text-stone-500">
                  +91-11-45604560
                </span>
              </a>

              <a
                href={`https://wa.me/${restaurantWhatsAppNumber}`}
                target="_blank"
                rel="noreferrer"
                className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-bold text-stone-900">
                  WhatsApp Direct
                </span>
                <span className="text-[10px] text-stone-500">
                  Live Delivery
                </span>
              </a>
            </div>

            {/* Timings and details list */}
            <div className="bg-white border border-stone-200 p-5 rounded-3xl space-y-4 shadow-sm">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-[#aa7c11] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Operating Hours
                  </h4>
                  <p className="text-xs text-stone-555 mt-1">
                    Open 7 days a week
                  </p>
                  <p className="text-[10px] font-mono text-[#aa7c11] mt-0.5 font-bold">
                    11:00 AM - 11:30 PM DAILY
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-[#aa7c11] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Restaurant Address
                  </h4>
                  <p className="text-xs text-stone-555 mt-1 font-light leading-relaxed">
                    A-15, Subhash Nagar, Ring Road,
                    <br />
                    Opposite Metro Pillar 122,
                    <br />
                    New Delhi, Delhi 110027, India
                  </p>
                </div>
              </div>
            </div>

            {/* Location Map Embedding with premium light design overlay */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-stone-500 uppercase">
                Find on Google Maps
              </h3>
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-stone-200 bg-[#FAF9F5] flex items-center justify-center relative shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.0772718136367!2d77.1082!3d28.6322!2m3!1f0!2f0!3f0!3m2!1i1248!2i786!4m2!3m1!1s0x0%3A0x0!2zMjgmdW5pcXVl!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  title="Sagar Ratna Restaurant Location Map"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="opacity-90 focus:outline-none"
                ></iframe>

                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-250 text-[10px] font-bold uppercase tracking-wider text-stone-900 shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-[#aa7c11]" /> Directions
                </a>
              </div>
            </div>

            {/* Social icons list */}
            <div className="flex justify-center items-center gap-5 pt-4">
              <a
                href="https://facebook.com"
                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#aa7c11] shadow-sm"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#aa7c11] shadow-sm"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#aa7c11] shadow-sm"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>

            {/* Extremely Small Minimalist elegant admin login link requested */}
            <div className="text-center pt-8 border-t border-stone-200">
              <button
                onClick={onAdminClick}
                className="px-3 py-1.5 bg-stone-50 border border-stone-250 text-[10px] text-stone-500 hover:text-[#aa7c11] rounded-lg tracking-wider uppercase font-semibold cursor-pointer"
                id="mobile-admin-btn"
              >
                🔐 Staff Admin Dashboard
              </button>
            </div>
          </div>
        ),
      })}

      {/* Slide-Up WhatsApp quick query helper requested */}
      <AnimatePresence>
        {showQuickOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickOrder(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[80%] rounded-t-3xl bg-white border-t border-stone-200/80 z-50 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#aa7c11]">
                  <MessageSquare className="w-5 h-5 fill-current text-green-600" />
                  <h3 className="font-serif font-bold text-stone-900 uppercase tracking-wide text-sm">
                    WhatsApp Fast Inquiry
                  </h3>
                </div>
                <button
                  onClick={() => setShowQuickOrder(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-250 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed font-light">
                Directly chat with Sagar Ratna kitchen chefs to inquire about
                special requests, catering pricing, or allergen parameters.
              </p>

              <form onSubmit={handleQuickWhatsAppQuery} className="space-y-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" /> Open
                  WhatsApp Chat
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Thumb-Friendly Sticky Floating WhatsApp Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowQuickOrder(true)}
        className="fixed bottom-24 right-5 z-45 bg-[#25d366] text-white p-3 rounded-full shadow-lg border border-green-400/20 cursor-pointer flex items-center justify-center"
        aria-label="Direct WhatsApp Delivery Query"
        id="floating-whatsapp-trigger"
      >
        <MessageSquare className="w-6 h-6 fill-current text-white" />
      </motion.button>

      {/* Floating Bottom Menu Cart Basket Trigger when Cart has items */}
      <AnimatePresence>
        {totalItems > 0 && activeTab !== "cart" && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={() => setActiveTab("cart")}
            className="fixed bottom-20 left-4 right-4 z-40 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-amber-950 font-bold p-3.5 rounded-xl shadow-xl border border-yellow-300/30 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 stroke-[2]" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {totalItems}
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold pr-1">
                Total Plates in Basket
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black">
              <span>₹{grandTotal}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5] bg-black/10 rounded-full" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Navigation Bar requested in requirements */}
      {/* Home, Menu, Search, Cart, Profile / Contact */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 z-50 py-2.5 px-4 flex justify-between items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        {[
          { tab: "home" as const, label: "Home", icon: Home },
          { tab: "menu" as const, label: "Menu", icon: Utensils },
          { tab: "search" as const, label: "Search", icon: Search },
          {
            tab: "cart" as const,
            label: "Cart",
            icon: ShoppingBag,
            badge: totalItems,
          },
          { tab: "contact" as const, label: "Profile", icon: User },
        ].map(({ tab, label, icon: Icon, badge }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center w-16 relative py-1 focus:outline-none transition-colors duration-250 cursor-pointer ${
                isActive
                  ? "text-[#aa7c11]"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <div className="relative font-sans">
                <Icon
                  className={`w-5 h-5 stroke-[2] transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
                />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium mt-1 leading-none tracking-wide font-sans">
                {label}
              </span>

              {/* Highlight bar indicator */}
              {isActive && (
                <motion.div
                  layoutId="indicator"
                  className="absolute bottom-0 w-8 h-[2px] bg-[#aa7c11] rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Simulated App Skeleton Loading Screen for high-end mobile experience
function MobileSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6 animate-pulse">
      <div className="h-[340px] bg-stone-200/60 rounded-3xl w-full" />
      <div className="h-16 bg-stone-200/60 rounded-2xl w-full" />
      <div className="space-y-3">
        <div className="h-5 bg-stone-200/60 rounded w-1/3" />
        <div className="flex gap-4 overflow-hidden">
          <div className="h-44 bg-stone-200/60 rounded-3xl w-60 flex-shrink-0" />
          <div className="h-44 bg-stone-200/60 rounded-3xl w-60 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

// Router switcher with animated keyframes
function animateContainer(
  isLoading: boolean,
  activeTab: string,
  views: { [key: string]: React.ReactNode },
) {
  if (isLoading) return <MobileSkeleton />;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="flex-grow"
      >
        {views[activeTab]}
      </motion.div>
    </AnimatePresence>
  );
}
