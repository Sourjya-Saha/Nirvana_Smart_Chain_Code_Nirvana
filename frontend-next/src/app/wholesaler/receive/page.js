"use client";

import React, { useState } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { PackageCheck, ArrowLeft, Send, CheckCircle2, AlertCircle, Thermometer, QrCode } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function WholesalerReceivePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    consignmentId: "M-SHP-102",
    batchId: "B-2026-8812",
    manufacturer: "Apex BioPharma",
    receivedUnits: "2500",
    carrierTempRecorded: "3.6°C",
    sealVerified: true,
    inspectorRemarks: "Seals intact, RFID data logger confirmed no temperature breaches.",
  });
  const [status, setStatus] = useState(null);

  const handleReceive = (e) => {
    e.preventDefault();
    setStatus({
      type: "success",
      message: `Consignment ${formData.consignmentId} (Batch ${formData.batchId}) cryptographic receipt confirmed. Escrow funds released to manufacturer.`,
    });
  };

  return (
    <WholesalerLayout
      title="Inbound Consignment Receipt"
      subtitle="Inspect physical seals, verify IoT temperature logger data, and sign the cryptographic custody handover."
      badge="Intake Verification"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/wholesaler/dashboard"
            className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.96px] ${
              isLight ? "text-neutral-500 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
            ESCROW-RELEASE-GATEWAY
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
          onSubmit={handleReceive}
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-8 space-y-6`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Inbound Consignment ID *
              </label>
              <input
                type="text"
                value={formData.consignmentId}
                onChange={(e) => setFormData({ ...formData, consignmentId: e.target.value })}
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
                Batch Identifier *
              </label>
              <input
                type="text"
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
                Logged Transit Temperature
              </label>
              <input
                type="text"
                value={formData.carrierTempRecorded}
                onChange={(e) => setFormData({ ...formData, carrierTempRecorded: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Intake & QA Inspection Notes
              </label>
              <textarea
                rows={3}
                value={formData.inspectorRemarks}
                onChange={(e) => setFormData({ ...formData, inspectorRemarks: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)]"
            >
              <PackageCheck className="w-4 h-4" /> Sign Receipt & Unlock Escrow
            </button>
          </div>
        </form>
      </div>
    </WholesalerLayout>
  );
}
