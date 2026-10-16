"use client";

import React from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { Factory, Thermometer, Droplets, ShieldCheck, Box } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const BAYS = [
  {
    name: "Production Silo A - Active Synthesis",
    temp: "18.2°C",
    humidity: "35%",
    status: "Operational",
    occupancy: "88%",
    items: "API Bulk Granulation",
    badge: "Cleanroom Class 100",
  },
  {
    name: "Cold Vault Alpha - Finished Biologics",
    temp: "4.0°C",
    humidity: "40%",
    status: "Optimal",
    occupancy: "74%",
    items: "Monoclonal Antibodies & Injectables",
    badge: "2°C - 8°C Cold Chain",
  },
  {
    name: "Ultra-Low Cryo Bay",
    temp: "-78.5°C",
    humidity: "10%",
    status: "Optimal",
    occupancy: "42%",
    items: "mRNA Frozen Concentrates",
    badge: "Deep Cryo Storage",
  },
  {
    name: "Quarantine & Quality Control Hold",
    temp: "20.1°C",
    humidity: "42%",
    status: "Inspection",
    occupancy: "19%",
    items: "Batches Under Spectrometry Testing",
    badge: "QC Lab Hold",
  },
];

export default function ManufacturerWarehousePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <ManufacturerLayout
      title="Manufacturing Plant Storage & Cold Silos"
      subtitle="Real-time environmental telematics for finished pharmaceutical inventory, cryo-vaults, and QC quarantine holds."
      badge="Plant Facility"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Cleanroom Silos
            </span>
            <div className="font-editorial text-3xl font-light text-white">4 Plant Bays</div>
            <p className="text-xs text-neutral-400">ISO Class 5/7 verified</p>
          </div>

          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Finished Drug Reserves
            </span>
            <div className="font-editorial text-3xl font-light text-white">128,400 Units</div>
            <p className="text-xs text-neutral-400">Ready for wholesale dispatch</p>
          </div>

          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Thermal Excursion Alerts
            </span>
            <div className="font-editorial text-3xl font-light text-emerald-400">0 Faults</div>
            <p className="text-xs text-neutral-400">All cold vaults nominal</p>
          </div>

          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Spectrometry QC
            </span>
            <div className="font-editorial text-3xl font-light text-purple-400">Pass 100%</div>
            <p className="text-xs text-neutral-400">Batch purity certified</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BAYS.map((bay, idx) => (
            <div
              key={idx}
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-6 space-y-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">{bay.badge}</span>
                  <h3 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                    {bay.name}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    bay.status === "Optimal" || bay.status === "Operational"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}
                >
                  {bay.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
                <div className="space-y-1">
                  <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-cyan-400" /> Temperature
                  </div>
                  <div className="text-sm font-mono font-medium text-white">{bay.temp}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                  </div>
                  <div className="text-sm font-mono font-medium text-white">{bay.humidity}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <Box className="w-3 h-3 text-purple-400" /> Capacity
                  </div>
                  <div className="text-sm font-mono font-medium text-white">{bay.occupancy}</div>
                </div>
              </div>

              <div className="text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">Active Content:</span> {bay.items}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ManufacturerLayout>
  );
}
