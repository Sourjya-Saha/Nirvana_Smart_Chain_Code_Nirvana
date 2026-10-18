"use client";

import React, { useState, useEffect } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const DEFAULT_UOMS = [
  { uom_id: 1, uom_name: "Tablets / Capsules" },
  { uom_id: 2, uom_name: "Bottles / Syrups" },
  { uom_id: 3, uom_name: "Injections / Vials" },
  { uom_id: 4, uom_name: "Ointments / Tubes" },
  { uom_id: 5, uom_name: "Strips / Blisters" },
  { uom_id: 6, uom_name: "Boxes / Kits" },
];

export default function ManufacturerAddProductPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();

  const [product, setProduct] = useState({
    name: "",
    category: "",
    exp_date: "",
    price_per_unit: "",
    quantity_of_uom: "",
    shelf_num: "",
    uom_id: 1,
    picture_of_the_prod: null,
    description: "",
    user_id: "",
  });

  const [uoms, setUoms] = useState(DEFAULT_UOMS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch UOM list from backend
  useEffect(() => {
    const fetchUOMs = async () => {
      try {
        const res = await fetch(`${API_BASE}/getUOM`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setUoms(data);
            setProduct((prev) => ({ ...prev, uom_id: data[0].uom_id }));
          }
        }
      } catch (e) {
        console.warn("Could not fetch UOMs from backend; using default units.");
      }
    };
    fetchUOMs();
  }, []);

  // Cleanup Blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]:
        name === "quantity_of_uom" || name === "price_per_unit" || name === "uom_id"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleImageFile = (file) => {
    if (!file) return;

    // Validate size (up to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Selected image exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    // Revoke previous preview URL to prevent memory leaks
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    // Native browser Blob URL
    const blobUrl = URL.createObjectURL(file);
    setImagePreview(blobUrl);
    setProduct((prev) => ({ ...prev, picture_of_the_prod: file }));
    setErrorMessage("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    handleImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file);
    } else {
      setErrorMessage("Please drop a valid image file (PNG, JPG, WEBP).");
    }
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setProduct((prev) => ({ ...prev, picture_of_the_prod: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!product.name.trim()) {
      setErrorMessage("Product name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!product.price_per_unit || Number(product.price_per_unit) < 0) {
      setErrorMessage("Please enter a valid price per unit.");
      setIsSubmitting(false);
      return;
    }
    if (product.quantity_of_uom === "" || Number(product.quantity_of_uom) < 0) {
      setErrorMessage("Please specify stock quantity.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: product.name.trim(),
      category: product.category.trim() || "Prescription Drug",
      exp_date: product.exp_date || "",
      expiry_date: product.exp_date || "",
      price_per_unit: Number(product.price_per_unit),
      quantity_of_uom: Number(product.quantity_of_uom),
      shelf_num: product.shelf_num.trim() || "A1",
      uom_id: Number(product.uom_id) || 1,
      description: product.description.trim(),
      user_id: userId || product.user_id,
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    if (product.picture_of_the_prod instanceof File || product.picture_of_the_prod instanceof Blob) {
      formData.append("image", product.picture_of_the_prod, product.picture_of_the_prod.name || "product.jpg");
    }

    try {
      const response = await fetch(`${API_BASE}/insertProductManu`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage("Product added to manufacturing inventory successfully!");
        setProduct({
          name: "",
          category: "",
          exp_date: "",
          price_per_unit: "",
          quantity_of_uom: "",
          shelf_num: "",
          uom_id: uoms[0]?.uom_id || 1,
          picture_of_the_prod: null,
          description: "",
          user_id: userId,
        });
        removeImage();
        setTimeout(() => {
          router.push("/manufacturer/products");
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.error || errorData.message || "Failed to add product. Please check your inputs.");
      }
    } catch (error) {
      setErrorMessage("Network error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManufacturerLayout
      title="Add New Medicine SKU"
      subtitle="Register a new verified pharmaceutical batch and upload product image blob to manufacturing storage."
      badge="Stock Intake"
    >
      <div className="space-y-6">
        {/* Top Back Action Bar */}
        <div>
          <Link
            href="/manufacturer/products"
            className={`inline-flex items-center text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              isLight
                ? "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300"
                : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-300 border-neutral-800"
            }`}
          >
            Back to Inventory
          </Link>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Responsive Card Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Basic Information */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4">
              <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                Basic Information
              </h2>
              <p className="text-xs text-neutral-400">
                General identification, category, and clinical notes for this formulation.
              </p>
            </div>

            <div className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400 block">
                  Product / Drug Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                  value={product.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                      : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400 block">
                  Therapeutic Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  placeholder="e.g. Antibiotics, Analgesics, Cardiology, Respiratory"
                  value={product.category}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                      : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400 block">
                  Batch Expiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="exp_date"
                    value={product.exp_date}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400 block">
                  Clinical Description & Dosage Notes
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Specify clinical composition, prescribed usage, storage instructions, or warnings..."
                  value={product.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all resize-none ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                      : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Storage & Image Blob Upload */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="space-y-6">
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4">
                <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Pricing, Storage & Image
                </h2>
                <p className="text-xs text-neutral-400">
                  Stock capacity, unit measurements, manufacturing rack location, and product photo.
                </p>
              </div>

              {/* Row 1: Price and Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Price per Unit (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_per_unit"
                    placeholder="0.00"
                    value={product.price_per_unit}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity_of_uom"
                    placeholder="0"
                    value={product.quantity_of_uom}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: UOM and Shelf No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Unit of Measurement (UOM)
                  </label>
                  <select
                    name="uom_id"
                    value={product.uom_id}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all cursor-pointer ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  >
                    {uoms.map((u) => (
                      <option key={u.uom_id} value={u.uom_id}>
                        {u.uom_name || `Unit #${u.uom_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Shelf / Bay No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shelf_num"
                    placeholder="e.g. A1, Shelf B4"
                    value={product.shelf_num}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>
              </div>

              {/* Product Image Blob Upload Zone */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 block">
                  Product Image (Binary Blob)
                </label>

                {imagePreview ? (
                  <div
                    className={`relative rounded-2xl border p-4 flex flex-col items-center justify-center gap-3 ${
                      isLight ? "bg-neutral-50 border-neutral-300" : "bg-[#14151a] border-neutral-800"
                    }`}
                  >
                    <div className="relative group max-w-full">
                      <img
                        src={imagePreview}
                        alt="Product Preview"
                        className="max-h-48 w-auto object-contain rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-800/60"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-neutral-900 hover:bg-black text-white flex items-center justify-center shadow-lg transition-all cursor-pointer text-xs"
                        title="Remove Image"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Attached: {product.picture_of_the_prod?.name || "image.jpg"}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="product-image-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-500/5"
                        : isLight
                        ? "border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 hover:bg-neutral-100/50"
                        : "border-neutral-800 bg-[#121318]/50 hover:border-neutral-700 hover:bg-[#15161d]"
                    }`}
                  >
                    <span className={`text-xs font-medium ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                      Click to upload or drag & drop product image
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-1">
                      PNG, JPG, or WEBP up to 10MB (stored as binary Blob in DB)
                    </span>
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800/80">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full h-11 sm:h-12 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                } ${isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"}`}
              >
                {isSubmitting ? "Registering SKU in Database..." : "Save Product to Inventory"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ManufacturerLayout>
  );
}
