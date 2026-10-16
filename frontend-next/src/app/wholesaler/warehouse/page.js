"use client";

import React from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { Building2, Thermometer, Droplets, ShieldCheck, Box } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const BAYS = [
  {
    name: "Depot Cold Vault #1",
    temp: "4.3°C",
    humidity: "41%",
    status: "Optimal",
    occupancy: "68%",
    items: "Biologic Injections & Vaccines",
    badge: "2°C - 8°C Biologics",
  },
  {
    name: "Depot Cold Vault #2",
    temp: "3.9°C",
    humidity: "38%",
    status: "Optimal",
    occupancy: "54%",
    items: "Insulin & Blood Products",
    badge: "2°C - 8°C Biologics",
  },
  {
    name: "Ambient Rack Zone Alpha",
    temp: "21.2°C",
    humidity: "46%",
    status: "Optimal",
    occupancy: "82%",
    items: "Tablets, Capsules, Suspensions",
    badge: "Ambient Warehouse",
  },
  {
    name: "Inbound Quarantine & Stage Bay",
    temp: "20.0°C",
    humidity: "44%",
    status: "Active Inspection",
    occupancy: "31%",
    items: "Awaiting Seal Verification",
    badge: "Dock Intake",
  },
];

export default function WholesalerWarehousePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <WholesalerLayout
      title="Wholesale Depot Storage Facilities"
      subtitle="Real-time multi-vault climate monitoring, automated excursion detection, and cold storage bin status."
      badge="Depot Vaults"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Active Vaults
            </span>
            <div className="font-editorial text-3xl font-light text-white">4 Depot Bays</div>
            <p className="text-xs text-neutral-400">Continuous IoT telemetry</p>
          </div>

          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Pallet Capacity
            </span>
            <div className="font-editorial text-3xl font-light text-white">65.2%</div>
            <p className="text-xs text-neutral-400">1,304 / 2,000 pallets in vault</p>
          </div>

          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Temp Excursions
            </span>
            <div className="font-editorial text-3xl font-light text-emerald-400">0 Incidents</div>
            <p className="text-xs text-neutral-400">Last 30 days 100% compliant</p>
          </div>

          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Inbound Stage
            </span>
            <div className="font-editorial text-3xl font-light text-sky-400">2 Consignments</div>
            <p className="text-xs text-neutral-400">Dock receipt in progress</p>
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
                  <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">{bay.badge}</span>
                  <h3 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                    {bay.name}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    bay.status === "Optimal"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-sky-500/10 text-sky-400 border-sky-500/20"
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
                    <Box className="w-3 h-3 text-sky-400" /> Storage
                  </div>
                  <div className="text-sm font-mono font-medium text-white">{bay.occupancy}</div>
                </div>
              </div>

              <div className="text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">Monitored Classes:</span> {bay.items}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WholesalerLayout>
  );
}
