"use client";

import React, { useState } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { Truck, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function WholesalerAddTransactionPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    pharmacyAddress: "",
    batchId: "B-2026-9921",
    quantity: "",
    courierFleet: "ColdLogix Fleet #12",
    tempClass: "2°C - 8°C Biologic",
    manifestNote: "",
  });
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pharmacyAddress || !formData.quantity) {
      setStatus({ type: "error", message: "Please fill out the destination pharmacy and volume." });
      return;
    }

    setStatus({
      type: "success",
      message: `Consignment transfer for batch ${formData.batchId} (${formData.quantity} units) initiated to pharmacy ${formData.pharmacyAddress.slice(0, 10)}...`,
    });
  };

  return (
    <WholesalerLayout
      title="Create Dispensary Consignment"
      subtitle="Dispatch pharmaceutical inventory from wholesale depot to licensed retail dispensaries."
      badge="Outbound Dispatch"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/wholesaler/shipments"
            className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.96px] ${
              isLight ? "text-neutral-500 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shipments
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
            DISPENSARY-ALLOCATION
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
                Depot Stock Batch *
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              >
                <option value="B-2026-9921">B-2026-9921 (Lipitor 20mg - 8,500 avail)</option>
                <option value="B-2026-8812">B-2026-8812 (Humira 40mg - 1,800 avail)</option>
                <option value="B-2026-7734">B-2026-7734 (Keytruda 100mg - 640 avail)</option>
                <option value="B-2026-5510">B-2026-5510 (Metformin 500mg - 22,000 avail)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Allocation Quantity *
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
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

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Recipient Dispensary Address / Smart Wallet *
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={formData.pharmacyAddress}
                onChange={(e) => setFormData({ ...formData, pharmacyAddress: e.target.value })}
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
                Assigned Logistics Carrier
              </label>
              <select
                value={formData.courierFleet}
                onChange={(e) => setFormData({ ...formData, courierFleet: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              >
                <option value="ColdLogix Fleet #12">ColdLogix Fleet #12</option>
                <option value="BioCourier Node #04">BioCourier Node #04</option>
                <option value="SpeedyRx Transport #08">SpeedyRx Transport #08</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Storage Constraint
              </label>
              <input
                type="text"
                value="2.0°C - 8.0°C Refrigerator"
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-800 bg-[#13141a]/50 text-neutral-400 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)]"
            >
              <Truck className="w-4 h-4" /> Authorize Consignment Transfer
            </button>
          </div>
        </form>
      </div>
    </WholesalerLayout>
  );
}
