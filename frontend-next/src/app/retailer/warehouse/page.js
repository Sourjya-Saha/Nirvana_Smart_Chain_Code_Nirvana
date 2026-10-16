"use client";

import React, { useState, useEffect, useMemo } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  ArrowUpRight,
  Package,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProductPreviewModal from "@/components/retailer/ProductPreviewModal";
import { getProductImageUrl } from "@/lib/imageBlobUtils";
import { WarehousePageSkeleton } from "@/components/ui/Skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function RetailerWarehousePage() {
  const { userId, userName } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();

  // Inventory state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShelf, setSelectedShelf] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cart & Modal state
  const [cart, setCart] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState("");
  const [cartWarning, setCartWarning] = useState("");
  const [ordersCount, setOrdersCount] = useState(0);

  // Pagination for catalog cards
  const [catalogPage, setCatalogPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Fetch real products and orders count from backend
  useEffect(() => {
    if (!userId) return;

    const fetchWarehouseData = async () => {
      setLoading(true);
      try {
        const [prodRes, ordersRes] = await Promise.allSettled([
          fetch(`${API_BASE}/getProducts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }),
          fetch(`${API_BASE}/getAllOrders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }),
        ]);

        if (prodRes.status === "fulfilled" && prodRes.value.ok) {
          const data = await prodRes.value.json();
          if (Array.isArray(data)) setProducts(data);
        } else {
          setProducts([]);
        }

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const orders = await ordersRes.value.json();
          if (Array.isArray(orders)) setOrdersCount(orders.length);
        }
      } catch (err) {
        console.error("Error fetching warehouse data:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseData();
  }, [userId]);

  // Load saved cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("pharmakiosk_cart");
      if (savedCart) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pharmakiosk_cart", JSON.stringify(cart));
    } catch (e) {
      // Ignore storage errors
    }
  }, [cart]);

  // Dynamic categories extracted from real products
  const dynamicCategories = useMemo(() => {
    const catMap = {};
    products.forEach((p) => {
      const c = p.category?.trim() || "General";
      if (!catMap[c]) {
        catMap[c] = { name: c, count: 0, totalStock: 0 };
      }
      catMap[c].count += 1;
      catMap[c].totalStock += Number(p.quantity_of_uom || 0);
    });

    const sorted = Object.values(catMap).sort((a, b) => b.count - a.count);
    return sorted.slice(0, 4);
  }, [products]);

  // Available shelves from real data
  const availableShelves = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const s = String(p.shelf_num || "").trim();
      if (s) set.add(s);
    });
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return arr.length > 0 ? arr : ["1", "2", "3", "4", "5"];
  }, [products]);

  // Total stock units computed from real data
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + Number(p.quantity_of_uom || 0), 0);
  }, [products]);



  // Filtered products based on Search, Shelf, and Category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = String(p.name || "").toLowerCase().includes(q);
        const matchesCat = String(p.category || "").toLowerCase().includes(q);
        const matchesShelf = String(p.shelf_num || "").toLowerCase().includes(q);
        const matchesDesc = String(p.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesShelf && !matchesDesc) return false;
      }

      // Shelf filter
      if (selectedShelf !== "all") {
        const pShelf = String(p.shelf_num || "").trim();
        if (pShelf !== selectedShelf) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        const prodCat = String(p.category || "").trim().toLowerCase();
        if (prodCat !== selectedCategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [products, searchTerm, selectedShelf, selectedCategory]);

  // Paginated catalog items
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, catalogPage]);

  // Cart operations with strict inventory limits
  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (!product) return;
    const pid = product.product_id ?? product.id;
    const availableStock = Number(product.quantity_of_uom ?? product.quantity ?? product.stock ?? 0);

    if (availableStock <= 0) {
      setCartWarning(`"${product.name || 'This item'}" is currently out of stock.`);
      setTimeout(() => setCartWarning(""), 4000);
      return;
    }

    const existing = cart.find((item) => (item.product_id ?? item.id) === pid);

    if (existing) {
      if (existing.quantity >= availableStock) {
        setCartWarning(`Cannot add more than ${availableStock} ${product.uom_name || "units"} available in inventory for "${product.name}".`);
        setTimeout(() => setCartWarning(""), 4000);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          (item.product_id ?? item.id) === pid
            ? { ...item, quantity: Math.min(item.quantity + 1, availableStock), maxStock: availableStock }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          product_id: pid,
          name: product.name || product.product_name || "Medicine",
          price_per_unit: Number(product.price_per_unit ?? product.price ?? 0),
          quantity: 1,
          maxStock: availableStock,
          description: product.description || "",
          picture_of_the_prod: product.picture_of_the_prod || null,
          category: product.category || "General",
          shelf_num: product.shelf_num || "A1",
          uom_name: product.uom_name || "each",
        },
      ]);
    }
  };

  const handleIncreaseQuantity = (pid) => {
    const item = cart.find((i) => (i.product_id ?? i.id) === pid);
    if (!item) return;

    // Resolve latest real-time available stock
    const prod = products.find((p) => (p.product_id ?? p.id) === pid);
    const availableStock = prod
      ? Number(prod.quantity_of_uom ?? prod.quantity ?? prod.stock ?? 0)
      : item.maxStock || 9999;

    if (item.quantity >= availableStock) {
      setCartWarning(`Cannot exceed available stock of ${availableStock} units for "${item.name}".`);
      setTimeout(() => setCartWarning(""), 4000);
      return;
    }

    setCart((prev) =>
      prev.map((i) =>
        (i.product_id ?? i.id) === pid
          ? { ...i, quantity: i.quantity + 1, maxStock: availableStock }
          : i
      )
    );
  };

  const handleDecreaseQuantity = (pid) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.product_id ?? item.id) === pid) {
            return item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveFromCart = (pid) => {
    setCart((prev) => prev.filter((item) => (item.product_id ?? item.id) !== pid));
  };

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price_per_unit || 0) * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Checkout navigation / order placement
  const handleCheckout = () => {
    if (cart.length === 0) return;
    try {
      sessionStorage.setItem("active_order_cart", JSON.stringify(cart));
      sessionStorage.setItem("active_order_total", String(cartTotal));
    } catch (err) {
      // ignore
    }
    setOrderSuccessMsg(`Dispensary cart prepared with ${cart.length} medications. Redirecting to checkout...`);
    setIsCartVisible(false);
    setTimeout(() => {
      router.push("/retailer/addorders");
    }, 700);
  };

  const storeDisplayName = userName || "Maa Tara Store";

  return (
    <RetailerLayout
      title="Dispensary Warehouse Kiosk"
      subtitle="Interactive storage kiosk displaying physical bay shelves and real-time inventory."
      badge="Storage Kiosk"
    >
      {loading ? (
        <WarehousePageSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-10 pb-16">
          {/* Notification Toast */}
          {orderSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{orderSuccessMsg}</span>
              </div>
              <button
                onClick={() => setOrderSuccessMsg("")}
                className="hover:underline cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. TOP COMMAND & SEARCH BAR */}
          {/* ======================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search catalog formulations, ingredients, or shelf..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCatalogPage(1);
                }}
                className={`w-full pl-11 pr-4 py-2.5 rounded-full text-xs sm:text-sm outline-none transition-all ${
                  isLight
                    ? "bg-white text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:shadow-md"
                    : "bg-[#121420] text-white placeholder:text-neutral-500 shadow-inner focus:bg-[#161928]"
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Shopping Cart Round White Icon Button with Round Badge */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsCartVisible(true)}
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-neutral-900 border border-neutral-200 dark:border-neutral-700/80 shadow-md hover:shadow-lg flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
                title={`Dispensary Cart (${cartItemCount} items)`}
              >
                <ShoppingCart className="w-5 h-5 text-neutral-900" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-black shadow-sm pointer-events-none">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. HERO KIOSK STAGE WITH PURPLISH TEXTURED SILK WAVES */}
          {/* ======================================================== */}
          <div
            className={`relative rounded-[32px] overflow-hidden p-8 sm:p-12 lg:p-16 transition-all ${
              isLight
                ? "bg-[#f7f6fd] shadow-[0_20px_50px_rgba(99,102,241,0.07)]"
                : "bg-[#0b0c16] shadow-[0_30px_70px_rgba(0,0,0,0.85)]"
            }`}
          >
            {/* ---------------------------------------------------- */}
            {/* PURPLISH FLOWING SILK WAVE TEXTURE (Matching reference photo) */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
              {/* Radial atmospheric glows */}
              <div
                className={`absolute top-1/2 right-1/4 -translate-y-1/2 w-[650px] h-[500px] rounded-full blur-[100px] ${
                  isLight
                    ? "bg-gradient-to-tr from-purple-400/25 via-indigo-400/20 to-blue-300/20"
                    : "bg-gradient-to-tr from-purple-600/35 via-indigo-600/30 to-blue-600/20"
                }`}
              />
              <div
                className={`absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl ${
                  isLight ? "bg-indigo-300/30" : "bg-indigo-700/20"
                }`}
              />

              {/* Silk fluid wave SVG curves */}
              <svg
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  isLight
                    ? "opacity-45 mix-blend-multiply"
                    : "opacity-65 mix-blend-screen"
                }`}
                viewBox="0 0 1200 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.25" />
                  </linearGradient>
                  <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.75" />
                    <stop offset="55%" stopColor="#a855f7" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
                  </linearGradient>
                  <filter id="silkBlurFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="30" />
                  </filter>
                </defs>
                <path
                  d="M-50,300 C160,160 360,450 640,240 C880,80 1040,360 1250,200 L1250,600 L-50,600 Z"
                  fill="url(#waveGrad1)"
                  filter="url(#silkBlurFilter)"
                />
                <path
                  d="M120,180 C340,60 540,360 800,140 C1000,-20 1160,220 1320,100 L1320,600 L120,600 Z"
                  fill="url(#waveGrad2)"
                  filter="url(#silkBlurFilter)"
                />
              </svg>
            </div>

            {/* ---------------------------------------------------- */}
            {/* BLURRY MEDICINE BOTTLE ARTWORK (Like the AirPods in photo) */}
            {/* ---------------------------------------------------- */}
            <div className="absolute right-4 sm:right-16 lg:right-32 top-1/2 -translate-y-1/2 w-72 sm:w-88 lg:w-[420px] h-72 sm:h-88 lg:h-[420px] pointer-events-none select-none z-[1] hidden md:block">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Purplish ethereal halo behind the bottle */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-purple-500/40 via-indigo-500/30 to-sky-400/25 blur-3xl" />
                <img
                  src="/hero_medicine_bottle.png"
                  alt="Dispensary Bottle Artistic Artwork"
                  className="w-full h-full object-contain filter blur-[2px] opacity-75 dark:opacity-65 transition-all duration-700 hover:blur-[0.5px] hover:opacity-95 transform -rotate-6 scale-105"
                />
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* HERO CONTENT: BRAND TYPOGRAPHY & DISPENSARY STATS */}
            {/* ---------------------------------------------------- */}
            <div className="relative z-10 max-w-2xl space-y-6">
              <div className="space-y-2">
                <h1
                  className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  {storeDisplayName}
                  <span
                    className={`text-xl sm:text-2xl font-light align-super ml-1.5 ${
                      isLight ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    ®
                  </span>
                  <span
                    className={`block text-xl sm:text-2xl font-light font-editorial mt-2 ${
                      isLight ? "text-indigo-600" : "text-indigo-400"
                    }`}
                  >
                    Dispensary Storage & Shelf Kiosk
                  </span>
                </h1>
                <p
                  className={`text-sm sm:text-base max-w-xl leading-relaxed ${
                    isLight ? "text-neutral-900 font-medium" : "text-neutral-300"
                  }`}
                >
                  Interactive physical bay shelf catalog displaying verified stock balances,
                  rack locations, and direct order fulfillment.
                </p>
              </div>

              {/* Actual Real-Time Data Stats Row */}
              <div className="flex flex-wrap items-center gap-6 pt-3">
                <div>
                  <div
                    className={`text-2xl sm:text-3xl font-light font-editorial ${
                      isLight ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {totalStockUnits.toLocaleString("en-IN")}
                  </div>
                  <div className={`text-[11px] ${isLight ? "text-neutral-800 font-medium" : "text-neutral-400"}`}>
                    Total Units in Stock
                  </div>
                </div>
                <div className="h-8 w-px bg-neutral-300/60 dark:bg-neutral-800" />
                <div>
                  <div
                    className={`text-2xl sm:text-3xl font-light font-editorial ${
                      isLight ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {availableShelves.length} Bays
                  </div>
                  <div className={`text-[11px] ${isLight ? "text-neutral-800 font-medium" : "text-neutral-400"}`}>
                    Active Shelves
                  </div>
                </div>
                <div className="h-8 w-px bg-neutral-300/60 dark:bg-neutral-800" />
                <div>
                  <div
                    className={`text-2xl sm:text-3xl font-light font-editorial ${
                      isLight ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {products.length} SKUs
                  </div>
                  <div className={`text-[11px] ${isLight ? "text-neutral-800 font-medium" : "text-neutral-400"}`}>
                    Catalog Formulations
                  </div>
                </div>
                <div className="h-8 w-px bg-neutral-300/60 dark:bg-neutral-800" />
                <div>
                  <div
                    className={`text-2xl sm:text-3xl font-light font-editorial ${
                      isLight ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {ordersCount}
                  </div>
                  <div className={`text-[11px] ${isLight ? "text-neutral-800 font-medium" : "text-neutral-400"}`}>
                    Dispensary Orders
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. DYNAMIC CATEGORIES (Borderless, Clean, Both Themes) */}
          {/* ======================================================== */}
          <div className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  Featured categories
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Filter by real therapeutic classes and departments in your inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedShelf("all");
                  setCatalogPage(1);
                }}
                className={`text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "text-indigo-500 hover:text-indigo-600"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span>Check All Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4 Dynamic Category Showcase Cards (Black & White Theme with pinch of purple texture) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {dynamicCategories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

                return (
                  <div
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(isSelected ? "all" : cat.name);
                      setCatalogPage(1);
                    }}
                    className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] overflow-hidden border ${
                      isSelected
                        ? isLight
                          ? "bg-white border-purple-600 ring-2 ring-purple-600/30 shadow-md"
                          : "bg-[#111218] border-purple-400 ring-2 ring-purple-400/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                        : isLight
                        ? "bg-white border-neutral-200 hover:border-purple-300/80 shadow-sm hover:shadow-md"
                        : "bg-[#0d0e12] border-neutral-800/90 hover:border-purple-500/40 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.7)]"
                    }`}
                  >
                    {/* Subtle pinch of purplish texture */}
                    <div
                      className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
                        isSelected
                          ? isLight ? "bg-purple-500/15" : "bg-purple-500/20"
                          : isLight ? "bg-purple-500/5 group-hover:bg-purple-500/10" : "bg-purple-600/10 group-hover:bg-purple-500/20"
                      }`}
                    />

                    {/* Top Row: Count Badge & Arrow */}
                    <div className="relative z-10 flex items-start justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                          isSelected
                            ? isLight
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white text-black border-white"
                            : isLight
                            ? "bg-neutral-100 text-neutral-800 border-neutral-200 group-hover:border-purple-200"
                            : "bg-[#16171f] text-neutral-300 border-neutral-800 group-hover:border-purple-900/60"
                        }`}
                      >
                        {cat.count} {cat.count === 1 ? "Item" : "Items"}
                      </span>

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? isLight
                              ? "text-neutral-900"
                              : "text-white"
                            : isLight
                            ? "text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            : "text-neutral-500 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Bottom Content: Real Title & Actual Unit Count */}
                    <div className="relative z-10 space-y-1 pt-6">
                      <h3
                        className={`font-semibold text-sm sm:text-base leading-snug ${
                          isLight ? "text-neutral-900" : "text-white"
                        }`}
                      >
                        {cat.name}
                      </h3>
                      <p
                        className={`text-xs leading-relaxed ${
                          isLight ? "text-neutral-500" : "text-neutral-400"
                        }`}
                      >
                        {cat.count} {cat.count === 1 ? "formulation" : "formulations"} &bull;{" "}
                        {cat.totalStock.toLocaleString("en-IN")} units
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. SHELF CATALOG / HOT PICKS SECTION */}
          {/* ======================================================== */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  Active Dispensary Shelves
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Filter by storage shelf bay to locate physical medications quickly.
                </p>
              </div>

              {/* Shelf Filter Tabs on Right */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShelf("all");
                    setCatalogPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                    selectedShelf === "all"
                      ? isLight
                        ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                        : "bg-white text-black border-white shadow-sm"
                      : isLight
                      ? "bg-white text-neutral-700 hover:text-black border-neutral-300 shadow-sm"
                      : "bg-[#14151a] text-neutral-300 hover:text-white border-neutral-800"
                  }`}
                >
                  All Shelves
                </button>

                {availableShelves.map((shelf) => (
                  <button
                    key={shelf}
                    type="button"
                    onClick={() => {
                      setSelectedShelf(shelf);
                      setCatalogPage(1);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                      selectedShelf === shelf
                        ? isLight
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                          : "bg-white text-black border-white shadow-sm"
                        : isLight
                        ? "bg-white text-neutral-700 hover:text-black border-neutral-300 shadow-sm"
                        : "bg-[#14151a] text-neutral-300 hover:text-white border-neutral-800"
                    }`}
                  >
                    Shelf {shelf}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid: Real Product Cards with Floating Add to Cart */}
            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {paginatedProducts.map((p, idx) => {
                  const pid = p.product_id ?? p.id ?? idx;
                  const price = Number(p.price_per_unit ?? p.price ?? 0);
                  const qty = Number(p.quantity_of_uom ?? p.quantity ?? p.stock ?? 0);
                  const isOutOfStock = qty === 0;
                  const imgUrl = getProductImageUrl(p.picture_of_the_prod);
                  const existingInCart = cart.find((item) => (item.product_id ?? item.id) === pid);
                  const isMaxInCart = existingInCart && existingInCart.quantity >= qty;
                  const cannotAddMore = isOutOfStock || isMaxInCart;

                  return (
                    <div
                      key={pid}
                      onClick={() => setSelectedProduct(p)}
                      className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border hover:shadow-md ${
                        isLight
                          ? "bg-white border-neutral-200 shadow-sm hover:border-neutral-300"
                          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:border-neutral-700"
                      }`}
                    >
                      <div>
                        {/* Top Meta: Shelf & Price */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              isOutOfStock
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : isLight
                                ? "bg-neutral-100 text-neutral-700 border-neutral-200"
                                : "bg-[#14151a] text-neutral-300 border-neutral-800"
                            }`}
                          >
                            {isOutOfStock ? "Out of Stock" : `Shelf ${p.shelf_num || "A1"}`}
                          </span>

                          <span
                            className={`font-editorial text-lg font-light ${
                              isLight ? "text-neutral-900" : "text-white"
                            }`}
                          >
                            ₹{price.toFixed(2)}
                          </span>
                        </div>

                        {/* Product Image: Clean container with Floating Add to Cart Button */}
                        <div
                          className={`relative h-36 flex items-center justify-center p-3 mb-3.5 rounded-xl border transition-all overflow-hidden ${
                            isLight
                              ? "bg-white border-neutral-100"
                              : "bg-[#14151a] border-neutral-800/60"
                          }`}
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={p.name}
                              className="max-h-28 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Package className={`w-10 h-10 ${isLight ? "text-neutral-300" : "text-neutral-600"}`} />
                          )}

                          {/* Floating Quick Add / Quantity Adjuster Stepper */}
                          {existingInCart && existingInCart.quantity > 0 ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-1.5 py-1 rounded-full text-xs font-semibold shadow-lg transition-all duration-200 border ${
                                isLight
                                  ? "bg-white text-neutral-900 border-neutral-300 shadow-neutral-900/10"
                                  : "bg-white text-black border-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecreaseQuantity(pid);
                                }}
                                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-neutral-200 text-black cursor-pointer transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>

                              <span className="min-w-[18px] text-center text-xs font-bold text-black select-none px-0.5">
                                {existingInCart.quantity}
                              </span>

                              <button
                                type="button"
                                disabled={isMaxInCart}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIncreaseQuantity(pid);
                                }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                  isMaxInCart
                                    ? "opacity-30 cursor-not-allowed text-neutral-400"
                                    : "hover:bg-neutral-200 text-black cursor-pointer"
                                }`}
                                title={isMaxInCart ? `Max stock (${qty}) reached` : "Increase quantity"}
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(p);
                              }}
                              disabled={isOutOfStock}
                              className={`absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all duration-200 ${
                                isOutOfStock
                                  ? "opacity-40 cursor-not-allowed bg-neutral-600 text-white"
                                  : isLight
                                  ? "bg-white text-neutral-900 hover:bg-neutral-100 border border-neutral-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                                  : "bg-white text-black hover:bg-neutral-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 cursor-pointer"
                              } opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-y-2 sm:group-hover:translate-y-0`}
                              title={isOutOfStock ? "Out of Stock" : "Add to Dispensary Cart"}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-black" />
                              <span>{isOutOfStock ? "Out" : "Add"}</span>
                            </button>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="space-y-1">
                          <h4
                            className={`font-semibold text-sm truncate ${
                              isLight ? "text-neutral-900" : "text-white"
                            }`}
                          >
                            {p.name || p.product_name || "Formulation"}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate">
                            {p.category || "General"} {p.description ? `• ${p.description}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Stock Status */}
                      <div
                        className={`flex items-center justify-between pt-3 mt-3 border-t text-xs ${
                          isLight
                            ? "border-neutral-100 text-neutral-500"
                            : "border-neutral-800/80 text-neutral-400"
                        }`}
                      >
                        <span className="font-medium">
                          {isOutOfStock ? (
                            <span className="text-rose-500">Restock Needed</span>
                          ) : (
                            <span className="text-emerald-500">In Stock</span>
                          )}
                        </span>

                        <span>
                          {qty.toLocaleString("en-IN")} {p.uom_name || "units"} left
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className={`p-12 rounded-3xl text-center space-y-3 ${
                  isLight ? "bg-white shadow-sm" : "bg-[#10121a] shadow-inner"
                }`}
              >
                <Package className="w-10 h-10 mx-auto text-neutral-400 opacity-60" />
                <h3 className="font-semibold text-sm">No formulations match this criteria</h3>
                <p className="text-xs text-neutral-400">
                  Try clearing the search query or selecting another shelf filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedShelf("all");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-500 text-white cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isActive = catalogPage === pNum;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCatalogPage(pNum)}
                      className={`w-8 h-8 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                        isActive
                          ? isLight
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                            : "bg-white text-black border-white shadow-sm"
                          : isLight
                          ? "bg-white text-neutral-700 hover:text-black border-neutral-300 shadow-sm"
                          : "bg-[#14151a] text-neutral-300 hover:text-white border-neutral-800"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>


        </div>
      )}

      {/* ======================================================== */}
      {/* 6. INTERACTIVE SLIDE-OVER CART DRAWER */}
      {/* ======================================================== */}
      {isCartVisible && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsCartVisible(false)}
        >
          <div
            className={`relative w-full max-w-md h-full shadow-2xl flex flex-col justify-between transition-all animate-in slide-in-from-right duration-300 ${
              isLight
                ? "bg-white text-neutral-900"
                : "bg-[#0d0e14] text-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl font-light">Dispensary Cart</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {cartItemCount} {cartItemCount === 1 ? "formulation" : "formulations"} selected
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCartVisible(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? "hover:bg-neutral-100 text-neutral-700"
                    : "hover:bg-neutral-800 text-neutral-300"
                }`}
                title="Close Cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Alert Banner inside Drawer */}
            {cartWarning && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cartWarning}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isLight
                        ? "bg-neutral-100 text-neutral-400"
                        : "bg-[#141622] text-neutral-500"
                    }`}
                  >
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-sm">Your cart is empty</h4>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    Browse the shelves and select medications to add to your dispensing cart.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const pid = item.product_id ?? item.id;
                  const itemImg = getProductImageUrl(item.picture_of_the_prod);
                  const price = Number(item.price_per_unit || 0);
                  const prod = products.find((p) => (p.product_id ?? p.id) === pid);
                  const availableStock = prod
                    ? Number(prod.quantity_of_uom ?? prod.quantity ?? prod.stock ?? 0)
                    : item.maxStock || 9999;
                  const isMaxReached = item.quantity >= availableStock;

                  return (
                    <div
                      key={pid}
                      className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all shadow-sm ${
                        isLight
                          ? "bg-neutral-50"
                          : "bg-[#13151f]"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-white dark:bg-black p-1 flex items-center justify-center shrink-0 shadow-inner">
                        {itemImg ? (
                          <img
                            src={itemImg}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>

                      {/* Info & Quantity controls */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h5
                            className={`font-semibold text-xs truncate ${
                              isLight ? "text-neutral-900" : "text-white"
                            }`}
                          >
                            {item.name}
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(pid)}
                            className="text-neutral-400 hover:text-rose-500 cursor-pointer text-xs"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                          <span>₹{price.toFixed(2)} / {item.uom_name || "each"}</span>
                          <span className="text-[10px] text-neutral-500">
                            Available: {availableStock}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQuantity(pid)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-700 shadow-sm"
                                  : "bg-[#181a26] hover:bg-[#222436] text-neutral-300"
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-semibold w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isMaxReached}
                              onClick={() => handleIncreaseQuantity(pid)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                isMaxReached
                                  ? "opacity-30 cursor-not-allowed bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                                  : isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-700 shadow-sm cursor-pointer"
                                  : "bg-[#181a26] hover:bg-[#222436] text-neutral-300 cursor-pointer"
                              }`}
                              title={isMaxReached ? `Max stock (${availableStock}) reached` : "Increase quantity"}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="font-semibold text-xs text-emerald-500">
                              ₹{(price * item.quantity).toFixed(2)}
                            </div>
                            {isMaxReached && (
                              <div className="text-[9px] text-amber-500 font-medium">
                                Max stock reached
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                <div className="space-y-1.5 text-xs text-neutral-400">
                  <div className="flex justify-between text-sm font-semibold text-neutral-900 dark:text-white">
                    <span>Total Amount</span>
                    <span className="text-emerald-500">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className={`w-full py-3 rounded-full text-xs font-semibold cursor-pointer shadow-lg transition-all ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  }`}
                >
                  Proceed to Checkout (₹{cartTotal.toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PRODUCT DETAIL PREVIEW MODAL */}
      {/* ======================================================== */}
      {selectedProduct && (() => {
        const selPid = selectedProduct.product_id ?? selectedProduct.id;
        const selQty = Number(selectedProduct.quantity_of_uom ?? selectedProduct.quantity ?? selectedProduct.stock ?? 0);
        const selCartItem = cart.find((item) => (item.product_id ?? item.id) === selPid);
        const selCannotAdd = selQty <= 0 || (selCartItem && selCartItem.quantity >= selQty);

        return (
          <ProductPreviewModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            isLight={isLight}
            onAction={selCannotAdd ? null : (p) => handleAddToCart(p)}
            actionLabel={selQty <= 0 ? "Out of Stock" : selCannotAdd ? "Max Units in Cart" : "Add to Cart"}
          />
        );
      })()}
    </RetailerLayout>
  );
}
