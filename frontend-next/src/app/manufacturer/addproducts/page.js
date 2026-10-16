"use client";

import React, { useState, useEffect } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { Plus, ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function ManufacturerAddProductPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    productName: "",
    batchId: "B-2026-9042",
    quantity: "",
    price: "",
    molecularFormula: "",
    tempRange: "2°C - 8°C",
    expiryMonths: "24",
    labCertification: "ISO-17025 Compliant",
  });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      batchId: `B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity || !formData.price) {
      setStatus({ type: "error", message: "Please fill out all required synthesis parameters." });
      return;
    }

    setStatus({
      type: "success",
      message: `Genesis batch ${formData.batchId} successfully minted to CardTransactionRegistry smart contract.`,
    });
  };

  return (
    <ManufacturerLayout
      title="Genesis Batch Minting"
      subtitle="Register a new synthesized pharmaceutical batch on-chain with laboratory certification and thermal constraints."
      badge="Batch Synthesis"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/manufacturer/products"
            className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.96px] ${
              isLight ? "text-neutral-500 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
            MINT-GENESIS-PROTOCOL
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
                placeholder="e.g. Pembrolizumab Injectable 100mg"
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
                Auto-Generated Batch ID
              </label>
              <input
                type="text"
                value={formData.batchId}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-800 bg-[#13141a]/50 text-purple-400 font-mono text-sm outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Manufactured Volume (Doses) *
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
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
                Wholesale Price per Unit ($) *
              </label>
              <input
                type="text"
                placeholder="e.g. 45.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                Cold Chain Thermal Bounds
              </label>
              <select
                value={formData.tempRange}
                onChange={(e) => setFormData({ ...formData, tempRange: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              >
                <option value="2°C - 8°C">Cold Vault (2°C - 8°C)</option>
                <option value="-20°C">Freezer (-20°C)</option>
                <option value="-80°C">Ultra-Low Cryo (-80°C)</option>
                <option value="15°C - 25°C">Controlled Room Temp (15°C - 25°C)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Shelf Stability (Months)
              </label>
              <input
                type="number"
                value={formData.expiryMonths}
                onChange={(e) => setFormData({ ...formData, expiryMonths: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            >
              <ShieldCheck className="w-4 h-4" /> Mint Batch to Blockchain
            </button>
          </div>
        </form>
      </div>
    </ManufacturerLayout>
  );
}
