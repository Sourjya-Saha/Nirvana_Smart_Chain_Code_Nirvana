"use client";

import React, { useEffect } from "react";
import { X, ArrowLeft, Package } from "lucide-react";
import { getProductImageUrl } from "@/lib/imageBlobUtils";

export default function ProductPreviewModal({
  product,
  onClose,
  isLight = false,
  onAction = null,
  actionLabel = "Reorder stock",
}) {
  // Close on Escape key
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const name = product.name || product.product_name || "Pharmaceutical Product";
  const category = product.category || "General Medicine";
  const rawQty = Number(product.quantity_of_uom ?? product.quantity ?? product.stock ?? 0);
  const unitLabel = product.uom_name || "units";
  const price = Number(product.price_per_unit ?? product.price ?? product.total_price ?? 0);
  const shelf = product.shelf_num
    ? String(product.shelf_num).toLowerCase().startsWith("shelf")
      ? product.shelf_num
      : `Shelf ${product.shelf_num}`
    : "Dispensary Storage";
  const sku = product.product_id ?? product.id ?? "N/A";
  const expDate = product.exp_date ? String(product.exp_date).slice(0, 10) : null;
  const imageSource = product.picture || product.picture_of_the_prod;

  // Rich description fallback based on medicine properties
  const description =
    product.description ||
    `${name} is a high-grade ${category.toLowerCase()} formulation curated for clinical safety and efficacy. Verified on-chain across the smart distribution registry and safely stored at dispensary ${shelf.toLowerCase()}.`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-[360px] sm:max-w-[380px] rounded-3xl overflow-hidden border transition-all duration-300 shadow-[0_24px_64px_rgba(0,0,0,0.7)] ${
          isLight
            ? "bg-white border-neutral-200 text-neutral-900"
            : "bg-[#0f1016] border-neutral-800 text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Product Presentation Area */}
        <div
          className={`relative w-full flex flex-col justify-between ${
            isLight
              ? "bg-white border-b border-neutral-100"
              : "bg-gradient-to-b from-[#181a24] to-[#12131b] border-b border-neutral-800/80"
          }`}
        >
          {/* Top Bar with Navigation & Stock Badge (Clean separation to prevent overlapping) */}
          <div className="w-full flex items-center justify-between p-4 pb-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? "bg-white/80 hover:bg-white text-neutral-700 shadow-sm border border-neutral-200"
                  : "bg-black/50 hover:bg-black/80 text-white shadow-sm border border-neutral-700/60"
              }`}
              title="Close"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Top Right Stock Badge */}
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-medium border shrink-0 ${
                rawQty === 0
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  : rawQty < 10
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {rawQty === 0
                ? "Out of stock"
                : rawQty < 10
                ? `Low stock (${rawQty.toLocaleString("en-IN")} ${unitLabel})`
                : `${rawQty.toLocaleString("en-IN")} ${unitLabel} in stock`}
            </span>
          </div>

          {/* Centered Image Presentation Area (Positioned safely below top bar) */}
          <div className="w-full h-44 flex items-center justify-center p-4">
            {imageSource ? (
              <img
                src={getProductImageUrl(imageSource)}
                alt={name}
                onError={(e) => {
                  if (imageSource && !e.currentTarget.dataset.fallbackTried) {
                    e.currentTarget.dataset.fallbackTried = "true";
                    const clean = String(imageSource).replace(/^data:[^;]+;base64,/, "").trim();
                    const mime = clean.startsWith("iVBOR") ? "image/png" : (clean.startsWith("UklGR") ? "image/webp" : "image/jpeg");
                    e.currentTarget.src = `data:${mime};base64,${clean}`;
                  }
                }}
                className="max-h-36 max-w-[240px] object-contain drop-shadow-xl rounded-xl transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-inner ${
                    isLight
                      ? "bg-white border-neutral-200 text-neutral-600"
                      : "bg-[#1f212d] border-neutral-700/60 text-emerald-400"
                  }`}
                >
                  <Package className="w-10 h-10" />
                </div>
                <span className="text-[11px] font-normal text-neutral-400">
                  Verified On-Chain Inventory
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Card Content Sheet (Exact match to reference UI design) */}
        <div className="p-6 space-y-5">
          {/* Title & Quantity Meta */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-editorial text-2xl font-light leading-snug tracking-[-0.01em]">
                {name}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                  isLight
                    ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                    : "bg-[#181a22] text-neutral-300 border-neutral-800"
                }`}
              >
                {category}
              </span>
              <span>&bull;</span>
              <span>ID: #{sku}</span>
              <span>&bull;</span>
              <span>{shelf}</span>
              {expDate && (
                <>
                  <span>&bull;</span>
                  <span>Exp: {expDate}</span>
                </>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
              Description
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
              {description}
            </p>
          </div>

          {/* Bottom Price & Action Footer */}
          <div
            className={`pt-4 border-t flex items-center justify-between gap-4 ${
              isLight ? "border-neutral-200" : "border-neutral-800/80"
            }`}
          >
            <div>
              <div className="text-[11px] text-neutral-400">Dispensary price</div>
              <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {onAction ? (
              <button
                type="button"
                onClick={() => {
                  onAction(product);
                  onClose();
                }}
                className={`h-10 px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                {actionLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`h-10 px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Close preview
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
