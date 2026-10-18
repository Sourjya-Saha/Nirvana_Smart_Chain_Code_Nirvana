"use client";

import React, { useState, useEffect, useMemo } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import TablePagination from "@/components/retailer/TablePagination";
import { TableSkeletonRows } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ShoppingCart,
  QrCode,
  Eye,
  Trash2,
  Search,
  Download,
  X,
  Plus,
  Package,
  Layers,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
  Store,
  Factory,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Boxes,
} from "lucide-react";
import ProductPreviewModal from "@/components/retailer/ProductPreviewModal";
import { getProductImageUrl } from "@/lib/imageBlobUtils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const ITEMS_PER_PAGE = 6;

// Helper to normalize items from tuple arrays [product_id, name, price, quantity, total] or objects
function normalizeCartItem(p, availableProducts = []) {
  if (!p) return { id: "—", name: "Unknown Item", price: 0, quantity: 0, subtotal: 0 };

  // If p is an array/tuple: [product_id, name, price_per_unit, quantity, total_price]
  if (Array.isArray(p)) {
    const id = p[0] != null ? String(p[0]) : "—";
    let name = p[1];
    const price = Number(p[2] || 0);
    const quantity = Number(p[3] || 0);
    const subtotal = p[4] != null ? Number(p[4]) : price * quantity;

    const found = availableProducts.find(
      (prod) => String(prod.id ?? prod.product_id) === id
    );

    const productName =
      name && name !== "N/A" && name !== "undefined"
        ? name
        : found?.name || `Product #${id}`;

    const category = found?.category || "General Medicine";
    const shelf = found?.shelf_num
      ? String(found.shelf_num).toLowerCase().startsWith("shelf")
        ? found.shelf_num
        : `Shelf ${found.shelf_num}`
      : "Dispensary Storage";
    const imageSource = found?.picture_of_the_prod || found?.picture || null;
    const expDate = found?.exp_date ? String(found.exp_date).slice(0, 10) : null;
    const unitLabel = found?.uom_name || "units";
    const inStock = Number(found?.quantity_of_uom ?? 0);
    const description =
      found?.description ||
      `${productName} is a high-grade ${category.toLowerCase()} formulation curated for clinical safety and efficacy. Verified on-chain across the smart distribution registry.`;

    return {
      id,
      name: productName,
      price,
      quantity,
      subtotal: subtotal || price * quantity,
      category,
      shelf,
      image: imageSource,
      expDate,
      unitLabel,
      inStock,
      description,
      rawProduct: found || {
        id,
        name: productName,
        category,
        shelf_num: shelf,
        picture: imageSource,
        exp_date: expDate,
        uom_name: unitLabel,
        price_per_unit: price,
        description,
      },
    };
  }

  // If p is an object: { product_id, quantity, price_per_unit, order_id, name, ... }
  if (typeof p === "object") {
    const id = p.product_id ?? p.id ?? "—";
    let name = p.name || p.product_name;
    const price = Number(p.price_per_unit ?? p.price ?? 0);
    const quantity = Number(p.quantity ?? p.qty ?? 0);
    const subtotal = Number(p.total_price ?? (price * quantity) ?? 0);

    const found = availableProducts.find(
      (prod) => String(prod.id ?? prod.product_id) === String(id)
    );

    const productName =
      name && name !== "N/A" && name !== "undefined"
        ? name
        : found?.name || `Product #${id}`;

    const category = found?.category || "General Medicine";
    const shelf = found?.shelf_num
      ? String(found.shelf_num).toLowerCase().startsWith("shelf")
        ? found.shelf_num
        : `Shelf ${found.shelf_num}`
      : "Dispensary Storage";
    const imageSource = found?.picture_of_the_prod || found?.picture || null;
    const expDate = found?.exp_date ? String(found.exp_date).slice(0, 10) : null;
    const unitLabel = found?.uom_name || "units";
    const inStock = Number(found?.quantity_of_uom ?? 0);
    const description =
      found?.description ||
      `${productName} is a high-grade ${category.toLowerCase()} formulation curated for clinical safety and efficacy. Verified on-chain across the smart distribution registry.`;

    return {
      id: String(id),
      name: productName,
      price,
      quantity,
      subtotal: subtotal || price * quantity,
      category,
      shelf,
      image: imageSource,
      expDate,
      unitLabel,
      inStock,
      description,
      rawProduct: found || {
        id: String(id),
        name: productName,
        category,
        shelf_num: shelf,
        picture: imageSource,
        exp_date: expDate,
        uom_name: unitLabel,
        price_per_unit: price,
        description,
      },
    };
  }

  return { id: "—", name: "Unknown Item", price: 0, quantity: 0, subtotal: 0 };
}

export default function ManufacturerCartPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();

  // Data state
  const [cartData, setCartData] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("cards"); // 'cards' | 'table'

  // Modals & Forms
  const [selectedCart, setSelectedCart] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrError, setQrError] = useState("");

  const [qrFormData, setQrFormData] = useState({
    cart_id: "",
    receivers_addressM: "",
    receivers_addressW: "",
    receivers_addressR: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Toasts
  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "" }), 4500);
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, cartsRes] = await Promise.all([
        axios.post(`${API_BASE}/getProductsManu`, { user_id: userId }).catch(() => ({ data: [] })),
        axios.post(`${API_BASE}/getCartsManu`, { user_id: userId }).catch(() => ({ data: [] })),
      ]);
      setAvailableProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCartData(Array.isArray(cartsRes.data) ? cartsRes.data : []);
    } catch (err) {
      console.error("Cart data fetch error:", err);
      showToast("Error retrieving carts manifest", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCart = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Cart #${id}?`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/deleteCartManu/${id}`, {
        params: { user_id: userId },
      });
      if (res.status === 200 && res.data?.success) {
        setCartData((prev) => prev.filter((c) => c.cart_id !== id));
        showToast(`Cart #${id} deleted successfully.`, "success");
      } else {
        showToast(`Failed to delete Cart #${id}.`, "error");
      }
    } catch (err) {
      console.error("Delete cart error:", err);
      showToast(`Error deleting Cart #${id}`, "error");
    }
  };

  const handleViewCart = async (id) => {
    try {
      const res = await axios.post(`${API_BASE}/get_cart/${id}`, { user_id: userId });
      const backendProducts = Array.isArray(res.data?.products) ? res.data.products : [];
      if (backendProducts.length > 0) {
        setSelectedCart({
          cart_id: id,
          products: backendProducts,
        });
      } else {
        const cached = cartData.find((c) => String(c.cart_id) === String(id));
        setSelectedCart({
          cart_id: id,
          products: cached?.products || [],
        });
      }
      setIsViewModalOpen(true);
    } catch (err) {
      console.warn("View cart error, falling back to cached cart:", err);
      const cached = cartData.find((c) => String(c.cart_id) === String(id));
      if (cached) {
        setSelectedCart({
          cart_id: id,
          products: cached.products || [],
        });
        setIsViewModalOpen(true);
      } else {
        showToast("Failed to fetch cart details", "error");
      }
    }
  };

  const handleOpenQrModal = async (cart) => {
    setQrError("");
    setQrImage(null);
    setQrFormData({
      cart_id: cart.cart_id,
      receivers_addressM: "",
      receivers_addressW: "",
      receivers_addressR: "",
      date: new Date().toISOString().split("T")[0],
    });

    try {
      const res = await axios.post(`${API_BASE}/get_meta_add_for_qr`, {
        cart_id: cart.cart_id,
      });
      setQrFormData((prev) => ({
        ...prev,
        receivers_addressM: res.data?.manufacturer || "",
        receivers_addressW: res.data?.wholesaler || "",
        receivers_addressR: res.data?.retailer || "",
      }));
    } catch (err) {
      console.warn("Failed to prefill addresses:", err);
    }
    setIsQrModalOpen(true);
  };

  const handleGenerateQr = async (e) => {
    e.preventDefault();
    setQrError("");

    const addresses = [
      qrFormData.receivers_addressM,
      qrFormData.receivers_addressW,
      qrFormData.receivers_addressR,
    ].filter((a) => a && a.trim());

    const hasDuplicates = addresses.some(
      (a, i) => addresses.slice(0, i).concat(addresses.slice(i + 1)).includes(a)
    );

    if (hasDuplicates) {
      setQrError("Each stakeholder wallet address must be unique.");
      return;
    }

    setQrLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/generate_qr`,
        {
          ...qrFormData,
          receivers_addressM: qrFormData.receivers_addressM?.trim() || null,
          receivers_addressW: qrFormData.receivers_addressW?.trim() || null,
          receivers_addressR: qrFormData.receivers_addressR?.trim() || null,
        },
        { responseType: "blob" }
      );

      if (res.status === 200) {
        setQrImage(URL.createObjectURL(new Blob([res.data], { type: "image/png" })));
      } else {
        setQrError("Unexpected response from server during QR generation.");
      }
    } catch (err) {
      console.error("Generate QR error:", err);
      setQrError("Failed to generate encrypted QR code. Verify backend service.");
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `cart_${qrFormData.cart_id}_qrcode.png`;
    link.click();
  };

  // Filter & Pagination
  const filteredCarts = useMemo(() => {
    const reversed = [...cartData].reverse();
    if (!searchQuery.trim()) return reversed;
    return reversed.filter((c) =>
      c.cart_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cartData, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCarts.length / ITEMS_PER_PAGE));
  const paginatedCarts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCarts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCarts, currentPage]);

  // Statistics
  const totalBundlesCount = cartData.length;
  const totalUnitsInCarts = useMemo(() => {
    return cartData.reduce((sum, c) => {
      const items = (c.products || []).reduce((s, p) => {
        const norm = normalizeCartItem(p, availableProducts);
        return s + (norm.quantity || 0);
      }, 0);
      return sum + items;
    }, 0);
  }, [cartData, availableProducts]);

  const totalManifestValue = useMemo(() => {
    return cartData.reduce((sum, c) => {
      const val = (c.products || []).reduce((s, p) => {
        const norm = normalizeCartItem(p, availableProducts);
        return s + (norm.subtotal || 0);
      }, 0);
      return sum + val;
    }, 0);
  }, [cartData, availableProducts]);

  return (
    <ManufacturerLayout
      title="Consignment Carts"
      subtitle="Bundle pharmaceutical products into verified batch shipments and generate cryptographically bound QR codes."
      badge="Consignment Packaging"
      actions={
        <Link
          href="/manufacturer/allshipments"
          className={`h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            isLight
              ? "bg-black hover:bg-neutral-800 text-white"
              : "bg-white hover:bg-neutral-200 text-black"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Create from Shipments
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage.text && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in ${
              toastMessage.type === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "error" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage({ text: "", type: "" })}
              className="hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3 Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Total Bundles */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Prepared Consignment Bundles
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#181920] border-neutral-700/60 text-neutral-300"
                }`}
              >
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-editorial text-3xl sm:text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {loading ? "—" : totalBundlesCount}
            </div>
            <p className="text-xs text-neutral-500">Active consignment packages</p>
          </div>

          {/* Card 2: Total Units Packaged */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Total Units Packaged
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-600"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-light text-emerald-500">
              {loading ? "—" : totalUnitsInCarts.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-neutral-500">Aggregated formulation units</p>
          </div>

          {/* Card 3: Total Manifest Value */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Gross Manifest Worth
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#181920] border-neutral-700/60 text-neutral-300"
                }`}
              >
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-editorial text-3xl sm:text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {loading ? "—" : `₹${totalManifestValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-neutral-500">Combined batch market value</p>
          </div>
        </div>

        {/* Main Container Card */}
        <div
          className={`rounded-2xl border p-5 sm:p-8 space-y-6 transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          {/* Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  Prepared Consignment Bundles
                </h2>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    isLight
                      ? "bg-neutral-100 text-neutral-700"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {filteredCarts.length} bundles
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Multi-stakeholder consignment packages waiting for on-chain dispatch.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Switcher */}
              <div
                className={`p-1 rounded-full border flex items-center ${
                  isLight ? "bg-neutral-100 border-neutral-200" : "bg-[#14161f] border-neutral-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("cards")}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === "cards"
                      ? isLight
                        ? "bg-white text-black shadow-sm"
                        : "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("table")}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === "table"
                      ? isLight
                        ? "bg-white text-black shadow-sm"
                        : "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Table
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isLight ? "text-neutral-400" : "text-neutral-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search Cart ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white"
                      : "bg-[#14161f] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          {loading ? (
            activeTab === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border space-y-4 animate-pulse ${
                      isLight ? "bg-white border-neutral-200" : "bg-[#14161f]/80 border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <div className={`w-28 h-5 rounded-md ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                      <div className={`w-16 h-5 rounded-full ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                    </div>
                    <div className="py-2 space-y-2">
                      <div className={`w-full h-4 rounded ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                      <div className={`w-3/4 h-4 rounded ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                    </div>
                    <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center gap-2">
                      <div className={`flex-1 h-9 rounded-full ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                      <div className={`w-9 h-9 rounded-lg ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                      <div className={`w-9 h-9 rounded-lg ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                  <thead
                    className={`border-b text-[10px] sm:text-[11px] font-semibold ${
                      isLight
                        ? "bg-neutral-50/80 text-neutral-500 border-neutral-200"
                        : "bg-[#14151a] text-neutral-400 border-neutral-800"
                    }`}
                  >
                    <tr>
                      <th className="py-3.5 px-4">Cart ID</th>
                      <th className="py-3.5 px-4">Distinct SKUs</th>
                      <th className="py-3.5 px-4">Total Quantity</th>
                      <th className="py-3.5 px-4">Total Value</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                    <TableSkeletonRows rows={4} columns={5} isLight={isLight} />
                  </tbody>
                </table>
              </div>
            )
          ) : filteredCarts.length === 0 ? (
            <div className="p-16 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-neutral-400 mb-3 stroke-[1.5]" />
              <p className={`font-semibold text-base ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                {searchQuery ? `No carts match "${searchQuery}"` : "No consignment carts created yet."}
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "Try searching for a different Cart ID string."
                  : "Navigate to Shipment Orders to bundle buyer orders into a new dispatch cart."}
              </p>
              <Link
                href="/manufacturer/allshipments"
                className={`inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full text-xs font-semibold ${
                  isLight ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                <span>Browse Shipment Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : activeTab === "cards" ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCarts.map((cart) => {
                const normProducts = (cart.products || []).map((p) =>
                  normalizeCartItem(p, availableProducts)
                );
                const totalItems = normProducts.reduce((s, p) => s + (p.quantity || 0), 0);
                const totalCost = normProducts.reduce((s, p) => s + (p.subtotal || 0), 0);

                return (
                  <div
                    key={cart.cart_id}
                    className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                      isLight
                        ? "bg-white border-neutral-200 shadow-sm hover:border-black"
                        : "bg-[#14161f]/80 border-neutral-800/90 shadow-md hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isLight ? "bg-neutral-100 text-neutral-800" : "bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                          #{cart.cart_id}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          isLight ? "bg-neutral-100 text-neutral-700 border-neutral-200" : "bg-neutral-800 text-neutral-300 border-neutral-700"
                        }`}
                      >
                        {cart.products?.length || 0} SKUs
                      </span>
                    </div>

                    <div className="py-4 space-y-2 text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Total Units:</span>
                        <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>{totalItems} units</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Consignment Value:</span>
                        <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenQrModal(cart)}
                        className={`flex-1 py-2 px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isLight
                            ? "bg-neutral-900 hover:bg-black text-white border-black"
                            : "bg-white hover:bg-neutral-200 text-black border-white"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewCart(cart.cart_id)}
                        className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isLight
                            ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                            : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                        }`}
                        title="Inspect Cart Contents"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCart(cart.cart_id)}
                        className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isLight
                            ? "bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border-neutral-200 hover:border-rose-200"
                            : "bg-[#14151a] hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border-neutral-800 hover:border-rose-500/30"
                        }`}
                        title="Delete Cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
              <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                <thead
                  className={`border-b text-[10px] sm:text-[11px] font-semibold ${
                    isLight
                      ? "bg-neutral-50/80 text-neutral-500 border-neutral-200"
                      : "bg-[#14151a] text-neutral-400 border-neutral-800"
                  }`}
                >
                  <tr>
                    <th className="py-3.5 px-4">Cart ID</th>
                    <th className="py-3.5 px-4">Distinct SKUs</th>
                    <th className="py-3.5 px-4">Total Quantity</th>
                    <th className="py-3.5 px-4">Total Value</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-neutral-100" : "divide-neutral-800/60"
                  }`}
                >
                  {paginatedCarts.map((cart) => {
                    const normProducts = (cart.products || []).map((p) =>
                      normalizeCartItem(p, availableProducts)
                    );
                    const totalItems = normProducts.reduce((s, p) => s + (p.quantity || 0), 0);
                    const totalCost = normProducts.reduce((s, p) => s + (p.subtotal || 0), 0);

                    return (
                      <tr
                        key={cart.cart_id}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                : "bg-[#181920] text-neutral-200 border-neutral-700/60"
                            }`}
                          >
                            #{cart.cart_id}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-xs ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                          {cart.products?.length || 0} Products
                        </td>
                        <td className={`py-3.5 px-4 text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          {totalItems} units
                        </td>
                        <td className={`py-3.5 px-4 text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenQrModal(cart)}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isLight
                                  ? "bg-neutral-900 hover:bg-black text-white border-black"
                                  : "bg-white hover:bg-neutral-200 text-black border-white"
                              }`}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR Code</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewCart(cart.cart_id)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="View Products"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCart(cart.cart_id)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border-neutral-200 hover:border-rose-200"
                                  : "bg-[#14151a] hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border-neutral-800 hover:border-rose-500/30"
                              }`}
                              title="Delete Cart"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredCarts.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            isLight={isLight}
          />
        </div>
      </div>

      {/* View Cart Contents Modal */}
      {isViewModalOpen && selectedCart && (() => {
        const normalizedItems = (selectedCart.products || []).map((p) =>
          normalizeCartItem(p, availableProducts)
        );
        const modalTotalQuantity = normalizedItems.reduce((s, p) => s + p.quantity, 0);
        const modalTotalWorth = normalizedItems.reduce((s, p) => s + p.subtotal, 0);

        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => {
              setIsViewModalOpen(false);
              setSelectedCart(null);
            }}
          >
            <div
              className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] ${
                isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#0f1016] border-neutral-800 text-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="p-6 border-b border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-neutral-400">
                    Consignment Manifest
                  </span>
                  <h3 className="font-editorial text-2xl font-light mt-0.5">
                    Cart #{selectedCart.cart_id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedCart(null);
                  }}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isLight
                      ? "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                      : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                  }`}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Product Details with Images */}
              <div className="p-6 overflow-y-auto space-y-5">
                {normalizedItems.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No products found in this cart manifest.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {normalizedItems.map((item, idx) => {
                      const imageUrl = getProductImageUrl(item.image);
                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border overflow-hidden transition-all ${
                            isLight
                              ? "bg-white border-neutral-200 shadow-sm"
                              : "bg-[#141620] border-neutral-800/90 shadow-md"
                          }`}
                        >
                          {/* Image Presentation Area (Matching ProductPreviewModal) */}
                          <div
                            className={`relative w-full flex flex-col justify-between p-4 ${
                              isLight
                                ? "bg-neutral-50/70 border-b border-neutral-200/60"
                                : "bg-gradient-to-b from-[#181a24] to-[#12131b] border-b border-neutral-800/80"
                            }`}
                          >
                            <div className="w-full flex items-center justify-between mb-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                  isLight
                                    ? "bg-white text-neutral-800 border-neutral-200"
                                    : "bg-[#1f212d] text-neutral-200 border-neutral-700/60"
                                }`}
                              >
                                {item.category}
                              </span>

                              <span
                                className="px-3 py-1 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              >
                                {item.quantity.toLocaleString("en-IN")} {item.unitLabel} in cart
                              </span>
                            </div>

                            {/* Centered Image Presentation Area */}
                            <div className="w-full h-40 flex items-center justify-center py-2">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.name}
                                  className="max-h-36 max-w-[240px] object-contain drop-shadow-xl rounded-xl transition-transform duration-300 hover:scale-105"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-center space-y-2">
                                  <div
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                                      isLight
                                        ? "bg-white border-neutral-200 text-neutral-600"
                                        : "bg-[#1f212d] border-neutral-700/60 text-emerald-400"
                                    }`}
                                  >
                                    <Package className="w-8 h-8" />
                                  </div>
                                  <span className="text-[11px] font-normal text-neutral-400">
                                    Verified On-Chain Inventory
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Details Content Sheet */}
                          <div className="p-5 space-y-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="font-editorial text-2xl font-light leading-snug">
                                  {item.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setPreviewProduct(item.rawProduct)}
                                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    isLight
                                      ? "border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                                      : "border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                                  }`}
                                  title="Expand full product specs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Full specs</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                    isLight
                                      ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                      : "bg-[#181a22] text-neutral-300 border-neutral-800"
                                  }`}
                                >
                                  {item.category}
                                </span>
                                <span>&bull;</span>
                                <span className="font-mono">ID: #{item.id}</span>
                                <span>&bull;</span>
                                <span>{item.shelf}</span>
                                {item.expDate && (
                                  <>
                                    <span>&bull;</span>
                                    <span>Exp: {item.expDate}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Description block */}
                            <div className="space-y-1 pt-1">
                              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
                                Description
                              </div>
                              <p className={`text-xs leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
                                {item.description}
                              </p>
                            </div>

                            {/* Pricing & Units Breakdown */}
                            <div
                              className={`p-3.5 rounded-xl border grid grid-cols-3 gap-3 text-center ${
                                isLight
                                  ? "bg-neutral-50/80 border-neutral-200"
                                  : "bg-[#111218] border-neutral-800/80"
                              }`}
                            >
                              <div>
                                <span className="block text-[11px] text-neutral-400 font-medium">Quantity</span>
                                <span className={`text-xs sm:text-sm font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                                  {item.quantity.toLocaleString("en-IN")} {item.unitLabel}
                                </span>
                              </div>

                              <div className="border-x border-neutral-200/60 dark:border-neutral-800/60">
                                <span className="block text-[11px] text-neutral-400 font-medium">Price / Unit</span>
                                <span className={`text-xs sm:text-sm font-semibold ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                                  ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[11px] text-neutral-400 font-medium">Item Subtotal</span>
                                <span className={`text-xs sm:text-sm font-bold ${isLight ? "text-neutral-900" : "text-emerald-400"}`}>
                                  ₹{item.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total Consignment Worth Summary */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
                    isLight ? "bg-neutral-50/70 border-neutral-200/80" : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-neutral-400">Total Consignment Worth</span>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {modalTotalQuantity.toLocaleString("en-IN")} total units across {normalizedItems.length} SKU{normalizedItems.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className="font-editorial text-2xl font-light text-neutral-900 dark:text-white">
                    ₹
                    {modalTotalWorth.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Modal Footer with "Close" button */}
              <div
                className="p-5 border-t border-neutral-200/60 dark:border-neutral-800/80 flex justify-end"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedCart(null);
                  }}
                  className={`px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    isLight ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Generate QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsQrModalOpen(false)}>
          <div
            className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#0f1016] border-neutral-800 text-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 border-b border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-neutral-400">
                  Cryptographic QR Code
                </span>
                <h3 className="font-editorial text-2xl font-light mt-0.5">
                  Generate Cart QR #{qrFormData.cart_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                    : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {qrError && (
                <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{qrError}</span>
                </div>
              )}

              {qrImage ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-neutral-300 shadow-xl">
                    <img src={qrImage} alt="Cart QR Code" className="w-56 h-56 object-contain" />
                  </div>
                  <p className="text-xs text-neutral-400 text-center max-w-xs">
                    This encrypted QR code encapsulates the cart ID and participating stakeholder wallet addresses.
                  </p>
                  <button
                    type="button"
                    onClick={downloadQrCode}
                    className={`px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                      isLight
                        ? "bg-black hover:bg-neutral-800 text-white"
                        : "bg-white hover:bg-neutral-200 text-black"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG QR Code</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGenerateQr} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Manufacturer Wallet (M)
                    </label>
                    <input
                      type="text"
                      placeholder="0x... (Manufacturer Metamask)"
                      value={qrFormData.receivers_addressM}
                      onChange={(e) =>
                        setQrFormData((prev) => ({ ...prev, receivers_addressM: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Wholesaler Wallet (W)
                    </label>
                    <input
                      type="text"
                      placeholder="0x... (Wholesaler Metamask)"
                      value={qrFormData.receivers_addressW}
                      onChange={(e) =>
                        setQrFormData((prev) => ({ ...prev, receivers_addressW: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Retailer Wallet (R)
                    </label>
                    <input
                      type="text"
                      placeholder="0x... (Retailer Metamask)"
                      value={qrFormData.receivers_addressR}
                      onChange={(e) =>
                        setQrFormData((prev) => ({ ...prev, receivers_addressR: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Packaging Date
                    </label>
                    <input
                      type="date"
                      required
                      value={qrFormData.date}
                      onChange={(e) =>
                        setQrFormData((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={qrLoading}
                      className={`w-full py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                        isLight
                          ? "bg-black hover:bg-neutral-800 text-white"
                          : "bg-white hover:bg-neutral-200 text-black"
                      } ${qrLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {qrLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Encoding QR Code...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>Generate QR Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div
              className="p-5 border-t border-neutral-200/60 dark:border-neutral-800/80 flex justify-end"
            >
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className={`px-5 py-2.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                  isLight ? "border-neutral-300 text-neutral-800 hover:border-black bg-white" : "border-neutral-700 text-neutral-300 hover:border-white bg-[#14151a]"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          isLight={isLight}
          onAction={null}
        />
      )}
    </ManufacturerLayout>
  );
}
