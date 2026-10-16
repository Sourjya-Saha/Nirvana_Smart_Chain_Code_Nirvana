"use client";

import React, { useState } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { Plus, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function WholesalerAddProductsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    productName: "",
    batchId: "",
    manufacturer: "",
    quantity: "",
    wholesalePrice: "",
    coldChainMin: "2.0",
    coldChainMax: "8.0",
  });
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.batchId || !formData.quantity) {
      setStatus({ type: "error", message: "Please fill out all required inventory intake fields." });
      return;
    }

    setStatus({
      type: "success",
      message: `Batch ${formData.batchId} (${formData.productName}) registered in depot stock ledger.`,
    });
  };

  return (
    <WholesalerLayout
      title="Register Stock Intake"
      subtitle="Manually index verified pharmaceutical batches into the wholesale warehouse depot ledger."
      badge="Stock Registration"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/wholesaler/products"
            className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.96px] ${
              isLight ? "text-neutral-500 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
            DEPOT-REGISTRATION
          </span>
        </div>

        {status && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm border ${
              status.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-8 space-y-6`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Formulation / Drug Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Humira (Adalimumab) 40mg"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Batch Identifier *
              </label>
              <input
                type="text"
                placeholder="e.g. B-2026-8812"
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Origin Manufacturer
              </label>
              <input
                type="text"
                placeholder="e.g. Apex BioPharma"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Received Units *
              </label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Depot Resale Price ($)
              </label>
              <input
                type="text"
                placeholder="e.g. 890.00"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Cold Chain Class
              </label>
              <select
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              >
                <option>Cold Vault (2°C - 8°C)</option>
                <option>Deep Freezer (-20°C)</option>
                <option>Controlled Room Temperature</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)]"
            >
              <Plus className="w-4 h-4" /> Add to Depot Inventory
            </button>
          </div>
        </form>
      </div>
    </WholesalerLayout>
  );
}
