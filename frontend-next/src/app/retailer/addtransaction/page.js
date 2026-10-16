"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Factory,
  Warehouse,
  Plus,
  Trash2,
  Printer,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Phone,
  User,
  CreditCard,
  ArrowLeft,
  Package,
  Loader2,
  IndianRupee,
  Layers,
  ArrowRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function AddTransactionContent() {
  const { userId, userName } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const searchParams = useSearchParams();

  // Navigation / Query parameters
  const queryOrderType = searchParams.get("orderType") || "manufacturer";
  const queryManuId = searchParams.get("manuId");
  const queryManuName = searchParams.get("manuName");
  const queryWholeId = searchParams.get("wholeId");
  const queryWholeName = searchParams.get("wholeName");
  const queryProductId = searchParams.get("productId");
  const queryProductName = searchParams.get("productName");
  const queryPrice = searchParams.get("price");

  // Active section tab: 'manufacturer' | 'wholesaler'
  const [activeSection, setActiveSection] = useState(
    queryOrderType === "wholesaler" ? "wholesaler" : "manufacturer"
  );

  // Order state
  const [order, setOrder] = useState({
    customerName: "",
    customerPhoneNumber: "",
    dateTime: new Date().toISOString().slice(0, 16),
    products: [
      {
        product: queryProductName || "",
        quantity: 1,
        rate: queryPrice ? parseFloat(queryPrice) : 0,
        totalPrice: queryPrice ? parseFloat(queryPrice) : 0,
        product_id: queryProductId || null,
      },
    ],
    status: "unpaid",
    manufacturerId: queryManuId || "",
    manufacturerName: queryManuName || "",
    wholesalerId: queryWholeId || "",
    wholesalerName: queryWholeName || "",
  });

  const [productsData, setProductsData] = useState([]);
  const [manufacturersList, setManufacturersList] = useState({});
  const [wholesalersList, setWholesalersList] = useState({});
  const [loadingStakeholders, setLoadingStakeholders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Notification banners
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage("");
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage("");
  };

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 10000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 10000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // Fetch Retailer Customer Name
  useEffect(() => {
    if (!userId) return;

    const fetchRetailerName = async () => {
      try {
        const response = await fetch(`${API_BASE}/get_name_of_retailer_by_user_id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (response.ok) {
          const data = await response.json();
          setOrder((prev) => ({
            ...prev,
            customerName: data.user_id || userName || "",
          }));
        } else {
          setOrder((prev) => ({
            ...prev,
            customerName: userName || "",
          }));
        }
      } catch (error) {
        console.warn("Could not fetch retailer name:", error);
        setOrder((prev) => ({
          ...prev,
          customerName: userName || "",
        }));
      }
    };

    fetchRetailerName();
  }, [userId, userName]);

  // Fetch Manufacturer List
  useEffect(() => {
    if (activeSection !== "manufacturer") return;

    const fetchManufacturers = async () => {
      setLoadingStakeholders(true);
      try {
        const response = await fetch(`${API_BASE}/get_manufacturer_users`);
        if (response.ok) {
          const data = await response.json();
          setManufacturersList(data || {});

          // If query pre-selected manufacturer exists
          if (queryManuName && data[queryManuName]) {
            setOrder((prev) => ({
              ...prev,
              manufacturerName: queryManuName,
              manufacturerId: data[queryManuName],
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
        showError("Failed to fetch manufacturer list from server.");
      } finally {
        setLoadingStakeholders(false);
      }
    };

    fetchManufacturers();
  }, [activeSection, queryManuName]);

  // Fetch Wholesaler List
  useEffect(() => {
    if (activeSection !== "wholesaler") return;

    const fetchWholesalers = async () => {
      setLoadingStakeholders(true);
      try {
        const response = await fetch(`${API_BASE}/get_wholesaler_users`);
        if (response.ok) {
          const data = await response.json();
          setWholesalersList(data || {});

          if (queryWholeName && data[queryWholeName]) {
            setOrder((prev) => ({
              ...prev,
              wholesalerName: queryWholeName,
              wholesalerId: data[queryWholeName],
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching wholesalers:", error);
        showError("Failed to fetch wholesaler list from server.");
      } finally {
        setLoadingStakeholders(false);
      }
    };

    fetchWholesalers();
  }, [activeSection, queryWholeName]);

  // Fetch Products when supplierId changes
  useEffect(() => {
    const supplierId = activeSection === "manufacturer" ? order.manufacturerId : order.wholesalerId;
    if (!supplierId) {
      setProductsData([]);
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const endpoint =
          activeSection === "manufacturer"
            ? `${API_BASE}/getProductsManu`
            : `${API_BASE}/getProductsWhole`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: supplierId }),
        });

        if (response.ok) {
          const data = await response.json();
          setProductsData(Array.isArray(data) ? data : []);

          // Preselect product if query passed
          if (queryProductName) {
            const matched = Array.isArray(data) && data.find((p) => p.name === queryProductName);
            if (matched) {
              setOrder((prev) => ({
                ...prev,
                products: [
                  {
                    product: matched.name,
                    quantity: 1,
                    rate: matched.price_per_unit,
                    totalPrice: matched.price_per_unit,
                    product_id: matched.product_id,
                  },
                ],
              }));
            }
          }
        } else {
          setProductsData([]);
        }
      } catch (error) {
        console.error("Error fetching supplier products:", error);
        setProductsData([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [order.manufacturerId, order.wholesalerId, activeSection, queryProductName]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleManufacturerChange = (e) => {
    const selectedName = e.target.value;
    const entry = Object.entries(manufacturersList).find(
      ([mName]) => mName === selectedName
    );

    if (entry) {
      const [name, mId] = entry;
      setOrder((prev) => ({
        ...prev,
        manufacturerName: name,
        manufacturerId: mId,
        products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
      }));
    } else {
      setOrder((prev) => ({
        ...prev,
        manufacturerName: "",
        manufacturerId: "",
        products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
      }));
    }
  };

  const handleWholesalerChange = (e) => {
    const selectedName = e.target.value;
    const entry = Object.entries(wholesalersList).find(
      ([wName]) => wName === selectedName
    );

    if (entry) {
      const [name, wId] = entry;
      setOrder((prev) => ({
        ...prev,
        wholesalerName: name,
        wholesalerId: wId,
        products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
      }));
    } else {
      setOrder((prev) => ({
        ...prev,
        wholesalerName: "",
        wholesalerId: "",
        products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
      }));
    }
  };

  const handleProductChange = (e, index) => {
    const selectedProductName = e.target.value;
    const selectedProduct = productsData.find((p) => p.name === selectedProductName);

    const updated = [...order.products];
    updated[index] = {
      ...updated[index],
      product: selectedProduct ? selectedProduct.name : "",
      rate: selectedProduct ? Number(selectedProduct.price_per_unit || 0) : 0,
      product_id: selectedProduct ? selectedProduct.product_id : null,
      totalPrice: selectedProduct
        ? Number(selectedProduct.price_per_unit || 0) * (updated[index].quantity || 1)
        : 0,
    };

    setOrder((prev) => ({ ...prev, products: updated }));
  };

  const handleQuantityChange = (e, index) => {
    const parsed = parseInt(e.target.value, 10);
    const quantity = isNaN(parsed) || parsed < 1 ? 1 : parsed;

    const updated = [...order.products];
    const rate = updated[index].rate || 0;
    updated[index] = {
      ...updated[index],
      quantity,
      totalPrice: rate * quantity,
    };
    setOrder((prev) => ({ ...prev, products: updated }));
  };

  const handleAddProduct = () => {
    setOrder((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null },
      ],
    }));
  };

  const handleRemoveProduct = (index) => {
    if (order.products.length <= 1) {
      setOrder((prev) => ({
        ...prev,
        products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
      }));
      return;
    }
    const updated = [...order.products];
    updated.splice(index, 1);
    setOrder((prev) => ({ ...prev, products: updated }));
  };

  const calculateOverallTotal = () => {
    return order.products.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const calculateOverallQuantity = () => {
    return order.products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // Submit Order
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      showError("User session expired. Please log in again.");
      return;
    }

    if (activeSection === "manufacturer" && !order.manufacturerId) {
      showError("Please select a target Manufacturer first.");
      return;
    }

    if (activeSection === "wholesaler" && !order.wholesalerId) {
      showError("Please select a target Wholesaler first.");
      return;
    }

    const validDetails = order.products
      .filter((item) => item.product_id !== null && item.product)
      .map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.rate,
      }));

    if (validDetails.length === 0) {
      showError("Please select at least one valid product line with a non-zero quantity.");
      return;
    }

    const baseOrder = {
      user_id: userId,
      customer_name: order.customerName || userName,
      phone_num: order.customerPhoneNumber,
      status: order.status,
      order_details: validDetails,
    };

    const endpoint =
      activeSection === "manufacturer"
        ? `${API_BASE}/insert_transaction`
        : `${API_BASE}/insert_transaction_retailer_to_wholesaler`;

    const orderData =
      activeSection === "manufacturer"
        ? { ...baseOrder, manu_id: order.manufacturerId }
        : { ...baseOrder, whole_id: order.wholesalerId };

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok || (typeof data === "object" && data.error)) {
        const msg = data.error || data.message || "Failed to create shipment order.";
        showError(`Order Placement Failed: ${msg}`);
      } else {
        const orderIdDisplay = typeof data === "number" || typeof data === "string" ? `#${data}` : "";
        showSuccess(
          `Procurement Order ${orderIdDisplay} placed successfully with ${
            activeSection === "manufacturer" ? order.manufacturerName : order.wholesalerName
          }! You can now generate the verifiable PDF invoice.`
        );

        // Reset product table and phone
        setOrder((prev) => ({
          ...prev,
          customerPhoneNumber: "",
          dateTime: new Date().toISOString().slice(0, 16),
          products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
          status: "unpaid",
          manufacturerId: "",
          manufacturerName: "",
          wholesalerId: "",
          wholesalerName: "",
        }));
      }
    } catch (error) {
      console.error("Order submit error:", error);
      showError(`Network Error: ${error.message || "Unable to reach server."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print PDF Invoice with QR Code
  const handlePrint = async () => {
    const validProducts = order.products.filter((p) => p.product && p.product_id);
    if (validProducts.length === 0) {
      showError("Please add at least one product before generating the invoice.");
      return;
    }

    setIsPrinting(true);
    try {
      const doc = new jsPDF();

      // Title & Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 25);
      doc.text("NIRVANA SMART CHAIN", 20, 22);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 110, 120);
      doc.text("Pharma Logistics & Procurement Invoice", 20, 29);

      // Meta Box
      doc.setDrawColor(230, 230, 235);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(20, 36, 170, 36, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 60);
      doc.setFont("helvetica", "bold");
      doc.text("Retailer Node:", 25, 45);
      doc.setFont("helvetica", "normal");
      doc.text(String(order.customerName || "N/A"), 55, 45);

      doc.setFont("helvetica", "bold");
      doc.text("Contact:", 25, 52);
      doc.setFont("helvetica", "normal");
      doc.text(String(order.customerPhoneNumber || "N/A"), 55, 52);

      doc.setFont("helvetica", "bold");
      doc.text("Supplier:", 25, 59);
      doc.setFont("helvetica", "normal");
      const supplierName =
        activeSection === "manufacturer"
          ? `Manufacturer: ${order.manufacturerName || "N/A"}`
          : `Wholesaler: ${order.wholesalerName || "N/A"}`;
      doc.text(supplierName, 55, 59);

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 25, 66);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(order.dateTime).toLocaleString(), 55, 66);

      // Generate Verification QR Code
      const qrPayload = JSON.stringify({
        type: "PROCUREMENT_ORDER",
        retailer: order.customerName,
        phone: order.customerPhoneNumber,
        supplierType: activeSection,
        supplier: activeSection === "manufacturer" ? order.manufacturerName : order.wholesalerName,
        total: calculateOverallTotal(),
        status: order.status,
        timestamp: order.dateTime,
      });

      try {
        const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
          margin: 1,
          width: 140,
        });
        doc.addImage(qrCodeUrl, "PNG", 148, 38, 32, 32);
      } catch (qrErr) {
        console.warn("QR code generation fallback:", qrErr);
      }

      // Products Table via autoTable
      const tableRows = validProducts.map((p, idx) => [
        idx + 1,
        p.product,
        `Rs. ${Number(p.rate).toFixed(2)}`,
        p.quantity,
        `Rs. ${Number(p.totalPrice).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 80,
        head: [["#", "Product Description", "Rate (Unit)", "Qty", "Total (INR)"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [17, 18, 24],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, halign: "right" },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 38, halign: "right" },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 12;

      // Summary Row
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 25);
      doc.text(
        `Total Bill Amount: Rs. ${calculateOverallTotal().toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        120,
        finalY
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 110);
      doc.text(`Payment Settlement Status: ${order.status.toUpperCase()}`, 120, finalY + 6);

      doc.save(`order-shipment-${Date.now()}.pdf`);
      showSuccess("Order PDF invoice generated and downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      showError("Failed to generate PDF invoice.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <RetailerLayout
      title="Order Shipment"
      subtitle="Dispatch procurement orders to Manufacturers or Wholesalers with live pricing, dynamic itemization, and cryptographic QR invoicing."
      badge="Procurement Order"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/retailer/transactions"
            className={`inline-flex items-center gap-2 h-9 sm:h-10 px-5 sm:px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
              isLight
                ? "bg-neutral-900 hover:bg-black text-white"
                : "bg-white hover:bg-neutral-200 text-black"
            }`}
          >
            <span>My Shipments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Floating Top Alert Banners */}
        {errorMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 break-words ${
              isLight
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-rose-950/40 text-rose-200 border-rose-900/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Notification / Reason</span>
                <span className="font-normal opacity-90 leading-relaxed block">{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer p-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-2 shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 break-words ${
              isLight
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-emerald-950/40 text-emerald-200 border-emerald-900/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Operation Succeeded</span>
                <span className="font-normal opacity-90 leading-relaxed block">{successMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-500 hover:text-emerald-700 text-xs cursor-pointer p-1 rounded-lg hover:bg-emerald-500/10 transition-colors ml-2 shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Supplier Category Segmented Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex items-center p-1.5 rounded-full bg-neutral-100 dark:bg-[#14151e] border border-neutral-200 dark:border-neutral-800 shadow-sm w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveSection("manufacturer");
                setOrder((prev) => ({
                  ...prev,
                  wholesalerId: "",
                  wholesalerName: "",
                  products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
                }));
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                activeSection === "manufacturer"
                  ? isLight
                    ? "bg-neutral-900 hover:bg-black text-white shadow-sm"
                    : "bg-white hover:bg-neutral-200 text-black shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-black bg-transparent"
                  : "text-neutral-400 hover:text-white bg-transparent"
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Order from Manufacturer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection("wholesaler");
                setOrder((prev) => ({
                  ...prev,
                  manufacturerId: "",
                  manufacturerName: "",
                  products: [{ product: "", quantity: 1, rate: 0, totalPrice: 0, product_id: null }],
                }));
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                activeSection === "wholesaler"
                  ? isLight
                    ? "bg-neutral-900 hover:bg-black text-white shadow-sm"
                    : "bg-white hover:bg-neutral-200 text-black shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-black bg-transparent"
                  : "text-neutral-400 hover:text-white bg-transparent"
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Order from Wholesaler</span>
            </button>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected Channel:{" "}
            <span className="font-semibold text-neutral-900 dark:text-white uppercase">
              {activeSection}
            </span>
          </div>
        </div>

        {/* 2. Order Placement Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={`border rounded-2xl p-6 sm:p-7 space-y-6 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0c0d11] border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.6)]"
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
              <div>
                <h3 className="font-editorial text-xl font-light text-neutral-900 dark:text-white">
                  Consignment & Supplier Parameters
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Specify routing endpoint, recipient contact, and billing schedule
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                {activeSection === "manufacturer" ? "MFG-ORDER" : "WHL-ORDER"}
              </span>
            </div>

            {/* Top Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Select Supplier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  {activeSection === "manufacturer" ? (
                    <Factory className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <Warehouse className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>{activeSection === "manufacturer" ? "Select Manufacturer *" : "Select Wholesaler *"}</span>
                </label>
                {activeSection === "manufacturer" ? (
                  <select
                    value={order.manufacturerName}
                    onChange={handleManufacturerChange}
                    required
                    disabled={loadingStakeholders}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-sans transition-all outline-none ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900 focus:bg-white"
                        : "bg-[#13141b] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#161722]"
                    }`}
                  >
                    <option value="">-- Choose Manufacturer --</option>
                    {Object.keys(manufacturersList).map((mName) => (
                      <option key={mName} value={mName}>
                        {mName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={order.wholesalerName}
                    onChange={handleWholesalerChange}
                    required
                    disabled={loadingStakeholders}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-sans transition-all outline-none ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900 focus:bg-white"
                        : "bg-[#13141b] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#161722]"
                    }`}
                  >
                    <option value="">-- Choose Wholesaler --</option>
                    {Object.keys(wholesalersList).map((wName) => (
                      <option key={wName} value={wName}>
                        {wName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer / Retailer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Retailer / Dispensary Node</span>
                </label>
                <input
                  type="text"
                  value={order.customerName}
                  onChange={handleChange}
                  name="customerName"
                  required
                  readOnly
                  placeholder="Dispensary Name"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all outline-none cursor-not-allowed opacity-90 ${
                    isLight
                      ? "bg-neutral-100 border-neutral-200 text-neutral-700"
                      : "bg-[#161720] border-neutral-800 text-neutral-300"
                  }`}
                />
              </div>

              {/* Customer Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Contact Phone Number *</span>
                </label>
                <input
                  type="tel"
                  value={order.customerPhoneNumber}
                  onChange={handleChange}
                  name="customerPhoneNumber"
                  required
                  placeholder="+91 9876543210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900 focus:bg-white"
                      : "bg-[#13141b] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#161722]"
                  }`}
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Order Timestamp</span>
                </label>
                <input
                  type="datetime-local"
                  value={order.dateTime}
                  onChange={handleChange}
                  name="dateTime"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono transition-all outline-none ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900 focus:bg-white"
                      : "bg-[#13141b] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#161722]"
                  }`}
                />
              </div>

              {/* Payment Settlement Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Initial Payment State</span>
                </label>
                <select
                  value={order.status}
                  onChange={handleChange}
                  name="status"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-sans transition-all outline-none ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900 focus:bg-white"
                      : "bg-[#13141b] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#161722]"
                  }`}
                >
                  <option value="unpaid">Unpaid (Settle upon delivery verification)</option>
                  <option value="paid">Paid (Pre-settled)</option>
                </select>
              </div>

              {/* Supplier Status Pill */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <div
                  className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    (activeSection === "manufacturer" && order.manufacturerId) ||
                    (activeSection === "wholesaler" && order.wholesalerId)
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-neutral-100 dark:bg-[#14151e] border-neutral-200 dark:border-neutral-800 text-neutral-500"
                  }`}
                >
                  <span>Supplier Selection</span>
                  <span className="font-semibold">
                    {(activeSection === "manufacturer" && order.manufacturerName) ||
                      (activeSection === "wholesaler" && order.wholesalerName) ||
                      "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Dynamic Products Table Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-neutral-500" />
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Ordered Pharmaceutical Items
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                    {order.products.length} line{order.products.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  className={`inline-flex items-center gap-1.5 h-9 sm:h-10 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all shadow-sm cursor-pointer ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Line</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr
                      className={`border-b text-xs font-semibold ${
                        isLight
                          ? "border-neutral-200 text-neutral-600 bg-neutral-50/80"
                          : "border-neutral-800 text-neutral-300 bg-[#121318]"
                      }`}
                    >
                      <th className="py-3 px-4 min-w-[240px]">Product / Formulation</th>
                      <th className="py-3 px-4 min-w-[120px]">Unit Rate</th>
                      <th className="py-3 px-4 min-w-[110px]">Quantity</th>
                      <th className="py-3 px-4 min-w-[130px]">Line Total</th>
                      <th className="py-3 px-4 text-right w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80 font-sans">
                    {order.products.map((productOrder, index) => {
                      const isSupplierChosen =
                        activeSection === "manufacturer"
                          ? Boolean(order.manufacturerId)
                          : Boolean(order.wholesalerId);

                      return (
                        <tr
                          key={index}
                          className={`transition-colors ${
                            isLight ? "hover:bg-neutral-50/50" : "hover:bg-[#14151f]/50"
                          }`}
                        >
                          {/* Product Dropdown */}
                          <td className="py-3 px-4">
                            <select
                              value={productOrder.product}
                              onChange={(e) => handleProductChange(e, index)}
                              required
                              disabled={!isSupplierChosen || loadingProducts}
                              className={`w-full px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all outline-none ${
                                isLight
                                  ? "bg-white border-neutral-300 text-neutral-900 focus:border-neutral-900"
                                  : "bg-[#161722] border-neutral-700 text-white focus:border-neutral-500"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <option value="">
                                {!isSupplierChosen
                                  ? activeSection === "manufacturer"
                                    ? "Select a Manufacturer First"
                                    : "Select a Wholesaler First"
                                  : loadingProducts
                                  ? "Loading catalog..."
                                  : productsData.length === 0
                                  ? "No products listed by this supplier"
                                  : "-- Select Product --"}
                              </option>
                              {productsData.map((prod) => (
                                <option key={prod.product_id} value={prod.name}>
                                  {prod.name} (Rs. {prod.price_per_unit}/unit)
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Unit Rate */}
                          <td className="py-3 px-4 font-mono font-medium text-neutral-800 dark:text-neutral-200">
                            Rs. {Number(productOrder.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          {/* Quantity Input */}
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="1"
                              value={productOrder.quantity}
                              onChange={(e) => handleQuantityChange(e, index)}
                              required
                              className={`w-24 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-mono transition-all outline-none ${
                                isLight
                                  ? "bg-white border-neutral-300 text-neutral-900 focus:border-neutral-900"
                                  : "bg-[#161722] border-neutral-700 text-white focus:border-neutral-500"
                              }`}
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-3 px-4 font-mono font-semibold text-neutral-900 dark:text-white">
                            Rs. {Number(productOrder.totalPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          {/* Remove Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              title="Remove item line"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Order Totals & Summary Card */}
              <div
                className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#121319] border-neutral-800/80"
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    Consignment Volume & Pricing Summary
                  </div>
                  <div className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                    Total Units: <span className="font-bold">{calculateOverallQuantity()} units</span> &bull; Channels:{" "}
                    <span className="font-semibold capitalize">{activeSection}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-neutral-400">Total Purchase Bill</div>
                  <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                    Rs. {calculateOverallTotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Actions: Submit & Print */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting || order.products.length === 0}
                  className={`w-full sm:w-auto h-10 sm:h-11 px-6 rounded-full text-xs sm:text-[14px] font-semibold border flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                    isLight
                      ? "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800 shadow-xs"
                      : "bg-[#181a24] hover:bg-[#222432] border-neutral-700 text-neutral-200"
                  }`}
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Print PDF Invoice</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto h-10 sm:h-11 px-7 rounded-full text-xs sm:text-[14px] font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Order...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Shipment Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </RetailerLayout>
  );
}

export default function RetailerAddTransactionPage() {
  return (
    <Suspense
      fallback={
        <RetailerLayout title="Order Shipment" subtitle="Loading..." badge="Procurement">
          <div className="p-12 text-center text-xs text-neutral-400">Loading order interface...</div>
        </RetailerLayout>
      }
    >
      <AddTransactionContent />
    </Suspense>
  );
}
