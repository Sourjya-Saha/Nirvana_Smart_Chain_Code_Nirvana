"use client";

import React, { useState } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { Truck, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function ManufacturerShipmentPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    batchId: "B-2026-9921",
    wholesalerAddress: "0x8fa91283e7208d320984",
    quantity: "5000",
    carrierFleet: "Apex BioPharma Logistics",
    tempAlertMin: "2.0",
    tempAlertMax: "8.0",
    shippingManifest: "GEN-WH-9921-DISPATCH",
  });
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.wholesalerAddress || !formData.batchId || !formData.quantity) {
      setStatus({ type: "error", message: "Please complete all mandatory wholesale consignment fields." });
      return;
    }

    setStatus({
      type: "success",
      message: `Consignment for batch ${formData.batchId} successfully sealed and dispatched to Wholesaler ${formData.wholesalerAddress.slice(0, 10)}...`,
    });
  };

  return (
    <ManufacturerLayout
      title="Wholesale Consignment Dispatch"
      subtitle="Dispatch pharmaceutical consignments to licensed wholesale depots with automated smart contract escrow."
      badge="Dispatch Terminal"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/manufacturer/allshipments"
            className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.96px] ${
              isLight ? "text-neutral-500 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" /> View All Shipments
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
            ESCROW-DISPATCH
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
                Pharmaceutical Batch *
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
                <option value="B-2026-9921">B-2026-9921 (Lipitor 20mg)</option>
                <option value="B-2026-8812">B-2026-8812 (Humira 40mg)</option>
                <option value="B-2026-7734">B-2026-7734 (Keytruda 100mg)</option>
                <option value="B-2026-5510">B-2026-5510 (Metformin 500mg)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Quantity to Dispatch *
              </label>
              <input
                type="number"
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
                Wholesaler Recipient Address *
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={formData.wholesalerAddress}
                onChange={(e) => setFormData({ ...formData, wholesalerAddress: e.target.value })}
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
                Approved Logistics Fleet
              </label>
              <select
                value={formData.carrierFleet}
                onChange={(e) => setFormData({ ...formData, carrierFleet: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              >
                <option value="Apex BioPharma Logistics">Apex BioPharma Logistics</option>
                <option value="ColdLogix Transport Network">ColdLogix Transport Network</option>
                <option value="SafeRx Secure Courier">SafeRx Secure Courier</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                IoT Sensor Telemetry Threshold
              </label>
              <input
                type="text"
                value="2.0°C to 8.0°C (Alert Trigger)"
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-800 bg-[#13141a]/50 text-neutral-400 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            >
              <Truck className="w-4 h-4" /> Dispatch Consignment
            </button>
          </div>
        </form>
      </div>
    </ManufacturerLayout>
  );
}
