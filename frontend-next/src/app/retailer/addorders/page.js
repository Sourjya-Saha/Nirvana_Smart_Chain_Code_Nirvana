"use client";

import React, { useState, useEffect, useMemo } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import { Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProductImageUrl } from "@/lib/imageBlobUtils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function RetailerAddOrderPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { userId, userName } = useAuth();
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    dateTime: new Date().toISOString().slice(0, 16),
    paymentMethod: "online", // "online" | "cod"
    status: "unpaid",
  });

  // Inventory & Cart State
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load Razorpay Script dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Fetch dispensary products
  useEffect(() => {
    if (!userId) return;

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/getProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setProducts(data);
            if (data.length > 0) setSelectedProductId(String(data[0].product_id));
          }
        }
      } catch (err) {
        console.error("Products load error:", err);
        setError("Failed to load dispensary inventory.");
      }
    };

    fetchProducts();
  }, [userId]);

  // Read cart items from warehouse kiosk session if passed
  useEffect(() => {
    try {
      const activeCart = sessionStorage.getItem("active_order_cart");
      if (activeCart) {
        const parsed = JSON.parse(activeCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((item) => ({
            product_id: item.product_id ?? item.id,
            name: item.name || item.product_name || "Medication",
            price_per_unit: Number(item.price_per_unit || 0),
            quantity: Number(item.quantity || 1),
            picture_of_the_prod: item.picture_of_the_prod || null,
            category: item.category || "General",
            shelf_num: item.shelf_num || "A1",
            uom_name: item.uom_name || "each",
          }));
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCartItems(formatted);
          sessionStorage.removeItem("active_order_cart");
        }
      }
    } catch (e) {
      console.warn("Session cart note:", e);
    }
  }, []);

  // Live Cart Calculations
  const subTotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price_per_unit || 0) * Number(item.quantity || 1),
      0
    );
  }, [cartItems]);

  const grandTotal = subTotal;

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
      status: method === "cod" ? "paid" : "unpaid",
    }));
  };

  // Add selected product into cart with strict stock checking
  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => String(p.product_id) === String(selectedProductId));
    if (!prod) return;

    const availableStock = Number(prod.quantity_of_uom ?? prod.quantity ?? 0);
    if (availableStock <= 0) {
      setError(`"${prod.name}" is currently out of stock.`);
      return;
    }

    const qtyToAdd = Math.max(1, Number(selectedQuantity) || 1);
    const existing = cartItems.find((i) => i.product_id === prod.product_id);
    const currentInCart = existing ? existing.quantity : 0;

    if (currentInCart + qtyToAdd > availableStock) {
      setError(
        `Cannot add ${qtyToAdd} unit(s). Only ${availableStock} in stock (${currentInCart} already in order cart).`
      );
      return;
    }

    if (existing) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.product_id === prod.product_id
            ? { ...i, quantity: i.quantity + qtyToAdd }
            : i
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          product_id: prod.product_id,
          name: prod.name,
          price_per_unit: Number(prod.price_per_unit || 0),
          quantity: qtyToAdd,
          picture_of_the_prod: prod.picture_of_the_prod || null,
          category: prod.category || "General",
          shelf_num: prod.shelf_num || "A1",
          uom_name: prod.uom_name || "each",
        },
      ]);
    }
    setSelectedQuantity(1);
    setError("");
  };

  const handleUpdateQuantity = (pid, newQty) => {
    const prod = products.find((p) => p.product_id === pid);
    const availableStock = prod ? Number(prod.quantity_of_uom ?? prod.quantity ?? 0) : 9999;
    const qty = Math.max(1, Number(newQty) || 1);

    if (qty > availableStock) {
      setError(`Cannot exceed available inventory of ${availableStock} units for "${prod?.name || 'this medicine'}".`);
      return;
    }
    setError("");
    setCartItems((prev) =>
      prev.map((i) => (i.product_id === pid ? { ...i, quantity: qty } : i))
    );
  };

  const handleRemoveItem = (pid) => {
    setCartItems((prev) => prev.filter((i) => i.product_id !== pid));
  };

  // Check live stock availability
  const checkStockAvailability = async () => {
    const res = await fetch(`${API_BASE}/getProducts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error("Failed to verify stock on server.");
    const currentInventory = await res.json();

    for (const item of cartItems) {
      const live = currentInventory.find((p) => p.product_id === item.product_id);
      if (!live) {
        throw new Error(`Medication "${item.name}" is no longer available in catalog.`);
      }
      const availableStock = Number(live.quantity_of_uom || 0);
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.name}". Requested: ${item.quantity}, Available: ${availableStock} ${live.uom_name || "units"}.`
        );
      }
    }
    return true;
  };

  // ----------------------------------------------------
  // Order Submission Handlers
  // ----------------------------------------------------
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.customerName.trim()) {
      setError("Please provide the patient/customer name.");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Please provide a contact phone number.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Please add at least one medication to the prescription cart.");
      return;
    }

    if (formData.paymentMethod === "cod") {
      await handleCODOrder();
    } else {
      await handleOnlineRazorpayOrder();
    }
  };

  // COD Order
  const handleCODOrder = async () => {
    setIsLoading(true);
    try {
      await checkStockAvailability();

      const orderPayload = {
        customer_name: formData.customerName,
        phone_num: formData.phoneNumber,
        date_time: formData.dateTime,
        payment_method: "cod",
        status: "paid",
        user_id: userId,
        order_details: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch(`${API_BASE}/insertOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create prescription order.");
      }

      setSuccess("Prescription order confirmed! Cash settlement recorded as Paid.");
      try {
        localStorage.removeItem("pharmakiosk_cart");
        sessionStorage.removeItem("active_order_cart");
      } catch (e) {
        // ignore
      }

      setTimeout(() => {
        router.push("/retailer/orders");
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to place COD order.");
    } finally {
      setIsLoading(false);
    }
  };

  // Online Razorpay Order
  const handleOnlineRazorpayOrder = async () => {
    setIsLoading(true);
    try {
      await checkStockAvailability();

      const createResponse = await fetch(`${API_BASE}/create_razorpay_order_website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: {
            customer_name: formData.customerName,
            phone_num: formData.phoneNumber,
            date_time: formData.dateTime,
            payment_method: "online",
            status: "unpaid",
            order_details: cartItems.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
          },
          user_id: userId,
        }),
      });

      if (!createResponse.ok) {
        const errData = await createResponse.json();
        throw new Error(errData.error || "Failed to initialize payment gateway.");
      }

      const orderData = await createResponse.json();

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please verify internet connection.");
      }

      const options = {
        key: "rzp_test_2EpPSCTb8XHFCk",
        amount: orderData.total_amount * 100,
        currency: "INR",
        name: userName || "Maa Tara Store",
        description: "Dispensary Prescription Payment",
        order_id: orderData.razorpay_order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE}/confirm_order_payment_website`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                temp_order_data: orderData.temp_order_data,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed on server.");
            }

            const verifyResult = await verifyRes.json();

            // Mark order status as paid
            await fetch(`${API_BASE}/update_order_status_website`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id: verifyResult.order_id }),
            });

            setSuccess("Payment confirmed and prescription order settled successfully!");
            try {
              localStorage.removeItem("pharmakiosk_cart");
              sessionStorage.removeItem("active_order_cart");
            } catch (e) {
              // ignore
            }

            setTimeout(() => {
              router.push("/retailer/orders");
            }, 1200);
          } catch (err) {
            setError("Payment verified failed. Please contact dispensary support.");
          }
        },
        prefill: {
          name: formData.customerName,
          contact: formData.phoneNumber,
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setError(`Payment failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Online payment initiation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RetailerLayout
      title="Create Prescription Order"
      subtitle="Issue patient medication disbursements, configure line items, and process online/COD payments."
      badge="Point of Sale"
    >
      <div className="space-y-6 pb-16">
        {/* Top Back Action Bar (Matching Add Product clean pill buttons) */}
        <div className="flex items-center justify-between">
          <Link
            href="/retailer/orders"
            className={`inline-flex items-center text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              isLight
                ? "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300 shadow-sm"
                : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-300 border-neutral-800"
            }`}
          >
            Back to Orders
          </Link>

          <Link
            href="/retailer/warehouse"
            className={`inline-flex items-center text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              isLight
                ? "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300 shadow-sm"
                : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-300 border-neutral-800"
            }`}
          >
            Browse Storage Kiosk
          </Link>
        </div>

        {/* Notifications */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT 7 COLS: PATIENT DETAILS & CART BUILDER */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Patient / Customer Information Card (Add Product Theme) */}
            <div
              className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              }`}
            >
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4">
                <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Patient & Fulfillment Details
                </h2>
                <p className="text-xs text-neutral-400">
                  Customer contact details and prescription timestamp for this record.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400 block">
                      Customer / Patient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                      }
                      className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                        isLight
                          ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                          : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400 block">
                      Contact Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                      }
                      className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                        isLight
                          ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                          : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Prescription Datetime
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dateTime: e.target.value }))
                    }
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                        : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 2. Medication Selector & Inventory Adder Card (Add Product Theme) */}
            <div
              className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              }`}
            >
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Add Medication to Order
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Select formulations from dispensary inventory and adjust dispensing quantity.
                  </p>
                </div>
                <span className="text-xs text-neutral-400">
                  {products.length} formulations available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Select Formulation / SKU
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                        : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                    }`}
                  >
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.name} &bull; ₹{Number(p.price_per_unit || 0).toFixed(2)} (Stock:{" "}
                        {p.quantity_of_uom ?? 0} {p.uom_name || "each"})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selProd = products.find((p) => String(p.product_id) === String(selectedProductId));
                  const selStock = selProd ? Number(selProd.quantity_of_uom ?? selProd.quantity ?? 0) : 0;
                  const inCartItem = cartItems.find((i) => i.product_id === selProd?.product_id);
                  const inCartQty = inCartItem ? inCartItem.quantity : 0;
                  const remainingAllowed = Math.max(0, selStock - inCartQty);
                  const cannotAdd = selStock <= 0 || remainingAllowed <= 0;

                  return (
                    <>
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400 block flex items-center justify-between">
                          <span>Qty</span>
                          <span className="text-[10px] text-neutral-500">Max: {remainingAllowed}</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={remainingAllowed}
                          value={selectedQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > remainingAllowed) {
                              setSelectedQuantity(remainingAllowed > 0 ? remainingAllowed : 1);
                            } else {
                              setSelectedQuantity(e.target.value);
                            }
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-center border outline-none transition-all ${
                            isLight
                              ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                              : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={cannotAdd}
                          className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            cannotAdd
                              ? "opacity-40 cursor-not-allowed bg-neutral-600 text-white"
                              : isLight
                              ? "bg-neutral-900 hover:bg-black text-white cursor-pointer"
                              : "bg-white hover:bg-neutral-200 text-black shadow-sm cursor-pointer"
                          }`}
                        >
                          {selStock <= 0 ? "Out" : remainingAllowed <= 0 ? "Max" : "+ Add"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 3. Prescription Cart Table Card (Add Product Theme) */}
            <div
              className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              }`}
            >
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Order Items ({cartItems.length})
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Itemized list of prescription medications in this order.
                  </p>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
                  <div>No medications added to this order yet.</div>
                  <div className="text-[11px] text-neutral-500">
                    Select a product from the dropdown above or import from storage kiosk.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/80">
                  {cartItems.map((item) => {
                    const price = Number(item.price_per_unit || 0);
                    const lineTotal = price * item.quantity;
                    const imgUrl = getProductImageUrl(item.picture_of_the_prod);
                    const prod = products.find((p) => p.product_id === item.product_id);
                    const availableStock = prod ? Number(prod.quantity_of_uom ?? prod.quantity ?? 0) : 9999;
                    const isMaxReached = item.quantity >= availableStock;

                    return (
                      <div
                        key={item.product_id}
                        className="py-3.5 flex items-center gap-3.5 transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-black p-1 flex items-center justify-center shrink-0 border border-neutral-200/80 dark:border-neutral-800">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-neutral-400">No img</span>
                          )}
                        </div>

                        {/* Title & Shelf */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4
                            className={`font-semibold text-xs sm:text-sm truncate ${
                              isLight ? "text-neutral-900" : "text-white"
                            }`}
                          >
                            {item.name}
                          </h4>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                            <span>Shelf {item.shelf_num || "A1"} &bull; ₹{price.toFixed(2)} / {item.uom_name || "each"}</span>
                            {isMaxReached && (
                              <span className="text-amber-500 font-semibold text-[10px]">(Max: {availableStock})</span>
                            )}
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer ${
                              isLight
                                ? "border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                                : "border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold w-7 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                              isMaxReached
                                ? "opacity-30 cursor-not-allowed bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                                : isLight
                                ? "border-neutral-300 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                                : "border-neutral-700 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                            }`}
                            title={isMaxReached ? `Max stock (${availableStock}) reached` : "Increase"}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right w-20">
                          <div className="text-xs font-semibold text-emerald-500">
                            ₹{lineTotal.toFixed(2)}
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT 5 COLS: PAYMENT SELECTION & BILL SUMMARY */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Payment Method Card (Add Product Theme - Minimal, No Childish Icons) */}
            <div
              className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              }`}
            >
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4">
                <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Payment Method
                </h2>
                <p className="text-xs text-neutral-400">
                  Select payment mode for this prescription transaction.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Online / UPI option */}
                <div
                  onClick={() => handlePaymentMethodChange("online")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === "online"
                      ? isLight
                        ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                        : "bg-white text-black border-white shadow-sm"
                      : isLight
                      ? "bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100"
                      : "bg-[#14151c] text-neutral-300 border-neutral-800 hover:bg-[#1a1c26]"
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm">Online / UPI</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      formData.paymentMethod === "online"
                        ? isLight
                          ? "text-neutral-300"
                          : "text-neutral-600"
                        : "text-neutral-400"
                    }`}
                  >
                    Razorpay gateway
                  </div>
                </div>

                {/* Cash on Delivery option */}
                <div
                  onClick={() => handlePaymentMethodChange("cod")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === "cod"
                      ? isLight
                        ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                        : "bg-white text-black border-white shadow-sm"
                      : isLight
                      ? "bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100"
                      : "bg-[#14151c] text-neutral-300 border-neutral-800 hover:bg-[#1a1c26]"
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm">Cash on Delivery</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      formData.paymentMethod === "cod"
                        ? isLight
                          ? "text-neutral-300"
                          : "text-neutral-600"
                        : "text-neutral-400"
                    }`}
                  >
                    Auto-marks Paid
                  </div>
                </div>
              </div>

              {formData.paymentMethod === "cod" && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  Cash on Delivery orders are instantly marked as &apos;Paid&apos; upon disbursement.
                </div>
              )}
            </div>

            {/* 2. Order Bill Summary Card (Add Product Theme) */}
            <div
              className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              }`}
            >
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4">
                <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Bill Breakdown
                </h2>
                <p className="text-xs text-neutral-400">
                  Computed line item total, duties, and handling charges.
                </p>
              </div>

              <div className="space-y-3 text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span>Prescription Subtotal</span>
                  <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    ₹{subTotal.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/80 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs text-neutral-400">Total Bill Payable</span>
                    <div className="text-[11px] text-neutral-500">Based on verified dispensed items</div>
                  </div>
                  <div className={`text-2xl font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    ₹{grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Submit CTA (Matching Add Product submit button) */}
              <button
                type="submit"
                disabled={isLoading || cartItems.length === 0}
                className={`w-full py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer ${
                  cartItems.length === 0
                    ? "opacity-50 cursor-not-allowed bg-neutral-400 text-white"
                    : isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                }`}
              >
                {isLoading
                  ? "Processing Order..."
                  : formData.paymentMethod === "cod"
                  ? `Confirm Cash on Delivery Order (₹${grandTotal.toFixed(2)})`
                  : `Pay Now via Razorpay (₹${grandTotal.toFixed(2)})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </RetailerLayout>
  );
}
