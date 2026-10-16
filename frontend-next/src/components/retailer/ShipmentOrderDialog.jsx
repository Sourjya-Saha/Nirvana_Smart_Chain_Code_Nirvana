"use client";

import React, { useState } from "react";
import { Factory, Building2, X, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function ShipmentOrderDialog({ product, isOpen, onClose, onConfirm }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleOrderType = async (orderType) => {
    setLoading(true);
    setError(null);

    try {
      if (orderType === "manufacturer") {
        const manufacturersResponse = await fetch(`${API_BASE}/get_manufacturer_users`);
        if (!manufacturersResponse.ok) throw new Error("Failed to fetch manufacturers registry");
        const manufacturersList = await manufacturersResponse.json();

        const allProducts = [];
        for (let [manufacturerName, manufacturerId] of Object.entries(manufacturersList)) {
          try {
            const response = await fetch(`${API_BASE}/getProductsManu`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: manufacturerId }),
            });
            if (response.ok) {
              const products = await response.json();
              allProducts.push(...products.map((p) => ({ ...p, manufacturerId, manufacturerName })));
            }
          } catch (e) {
            console.warn("Manufacturer products fetch warning:", e);
          }
        }

        const matchedProduct = allProducts.find(
          (p) => (p.name || p.product_name || "").toLowerCase().trim() === (product?.name || "").toLowerCase().trim()
        );

        if (matchedProduct) {
          onConfirm({
            orderType: "manufacturer",
            preSelectedManufacturer: { id: matchedProduct.manufacturerId, name: matchedProduct.manufacturerName },
            preSelectedProduct: {
              name: matchedProduct.name || matchedProduct.product_name,
              price: matchedProduct.price_per_unit || matchedProduct.price,
              product_id: matchedProduct.product_id || matchedProduct.id,
            },
          });
          onClose();
        } else {
          setError(`No registered manufacturer currently has "${product?.name || "this medicine"}" in their catalog.`);
        }
      } else {
        const wholesalersResponse = await fetch(`${API_BASE}/get_wholesaler_users`);
        if (!wholesalersResponse.ok) throw new Error("Failed to fetch wholesalers registry");
        const wholesalersList = await wholesalersResponse.json();

        const allProducts = [];
        for (let [wholesalerName, wholesalerId] of Object.entries(wholesalersList)) {
          try {
            const response = await fetch(`${API_BASE}/getProductsWhole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: wholesalerId }),
            });
            if (response.ok) {
              const products = await response.json();
              allProducts.push(...products.map((p) => ({ ...p, wholesalerId, wholesalerName })));
            }
          } catch (e) {
            console.warn("Wholesaler products fetch warning:", e);
          }
        }

        const matchedProduct = allProducts.find(
          (p) => (p.name || p.product_name || "").toLowerCase().trim() === (product?.name || "").toLowerCase().trim()
        );

        if (matchedProduct) {
          onConfirm({
            orderType: "wholesaler",
            preSelectedWholesaler: { id: matchedProduct.wholesalerId, name: matchedProduct.wholesalerName },
            preSelectedProduct: {
              name: matchedProduct.name || matchedProduct.product_name,
              price: matchedProduct.price_per_unit || matchedProduct.price,
              product_id: matchedProduct.product_id || matchedProduct.id,
            },
          });
          onClose();
        } else {
          setError(`No registered wholesaler currently has "${product?.name || "this medicine"}" in stock.`);
        }
      }
    } catch (err) {
      console.error("Supplier lookup error:", err);
      setError(err.message || "Failed to query registered supplier network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border ${
          isLight
            ? "bg-white border-neutral-200 text-neutral-900 shadow-2xl"
            : "bg-[#0d0e12] border-neutral-800/90 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        } p-6 sm:p-8 space-y-6 relative overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-4 border-b ${isLight ? "border-neutral-200" : "border-neutral-800/80"} pb-5`}>
          <div className="space-y-1.5">
            <span className={`inline-block text-[12px] font-medium tracking-normal px-3 py-1 rounded-full border ${
              isLight
                ? "text-neutral-800 bg-neutral-100 border-neutral-200"
                : "bg-[#16171d] text-neutral-200 border-neutral-700/60"
            }`}>
              Reorder Stock
            </span>
            <h3 className={`font-editorial text-2xl sm:text-3xl font-light tracking-[-0.02em] ${isLight ? "text-neutral-900" : "text-white"}`}>
              {product?.name || "Select Medicine"}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-normal">
              Current stock:{" "}
              <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                {product?.quantity_of_uom ?? product?.quantity ?? 0} units
              </span>
              {product?.shelf_num ? (
                <>
                  {" "}&bull; Shelf:{" "}
                  <span className={`font-medium ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                    {String(product.shelf_num).toLowerCase().includes("shelf") ? product.shelf_num : `Shelf ${product.shelf_num}`}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isLight
                ? "border-neutral-200 hover:border-neutral-400 text-neutral-600 hover:text-black hover:bg-neutral-100"
                : "border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white hover:bg-[#16171d]"
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
            isLight ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-rose-950/40 border-rose-800/60 text-rose-300"
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5">
          <div className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
            Where would you like to order from?
          </div>

          <button
            onClick={() => handleOrderType("manufacturer")}
            disabled={loading}
            className={`w-full p-4.5 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
              isLight
                ? "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 hover:border-neutral-300 shadow-sm"
                : "bg-[#121318] hover:bg-[#181a22] border-neutral-800 hover:border-neutral-700 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${
                isLight ? "bg-white text-neutral-900 border-neutral-300 shadow-sm" : "bg-[#1a1b24] text-white border-neutral-700/70"
              }`}>
                <Factory className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className={`font-semibold text-sm sm:text-base transition-colors ${
                  isLight ? "text-neutral-900 group-hover:text-black" : "text-white group-hover:text-cyan-400"
                }`}>
                  Order Direct from Manufacturer
                </div>
                <div className="text-xs text-neutral-400 leading-relaxed">
                  Order directly from the pharmaceutical factory
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-neutral-500 transition-all shrink-0 ${
              isLight ? "group-hover:text-black group-hover:translate-x-1" : "group-hover:text-white group-hover:translate-x-1"
            }`} />
          </button>

          <button
            onClick={() => handleOrderType("wholesaler")}
            disabled={loading}
            className={`w-full p-4.5 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
              isLight
                ? "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 hover:border-neutral-300 shadow-sm"
                : "bg-[#121318] hover:bg-[#181a22] border-neutral-800 hover:border-neutral-700 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${
                isLight ? "bg-white text-neutral-900 border-neutral-300 shadow-sm" : "bg-[#1a1b24] text-white border-neutral-700/70"
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className={`font-semibold text-sm sm:text-base transition-colors ${
                  isLight ? "text-neutral-900 group-hover:text-black" : "text-white group-hover:text-cyan-400"
                }`}>
                  Order from Wholesaler
                </div>
                <div className="text-xs text-neutral-400 leading-relaxed">
                  Order from a regional wholesale warehouse for fast delivery
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-neutral-500 transition-all shrink-0 ${
              isLight ? "group-hover:text-black group-hover:translate-x-1" : "group-hover:text-white group-hover:translate-x-1"
            }`} />
          </button>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isLight ? "border-neutral-200" : "border-neutral-800/80"}`}>
          {loading ? (
            <div className={`flex items-center gap-2 text-xs py-2 font-medium ${
              isLight ? "text-neutral-800" : "text-neutral-200"
            }`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finding available suppliers...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`h-9 sm:h-10 px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                isLight
                  ? "bg-neutral-900 hover:bg-black text-white"
                  : "bg-white hover:bg-neutral-200 text-black"
              }`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
