"use client";

import React, { useState } from "react";
import DistributorLayout from "@/components/DistributorLayout";
import { Truck, Search, Thermometer, CheckCircle2, Clock, ArrowUpRight, Compass, MapPin } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const SHIPMENTS = [
  {
    id: "DIST-TR-801",
    batch: "B-2026-9921",
    product: "Lipitor 20mg (1,500 units)",
    origin: "GeneVault Wholesale Hub",
    destination: "Nirvana Central Dispensary",
    driver: "Marcus Vance",
    vehicle: "Reefer Sprinter #12",
    temp: "4.2°C",
    status: "In Transit",
    location: "I-95 North Mile 42",
    eta: "45 mins",
  },
  {
    id: "DIST-TR-802",
    batch: "B-2026-8812",
    product: "Humira 40mg (250 units)",
    origin: "Apex Biopharma Depot",
    destination: "Metro Health Pharmacy",
    driver: "Elena Rostova",
    vehicle: "Heavy Cold Van #04",
    temp: "3.8°C",
    status: "Delivering",
    location: "Downtown Medical Zone",
    eta: "10 mins",
  },
  {
    id: "DIST-TR-803",
    batch: "B-2026-7734",
    product: "Keytruda 100mg (120 units)",
    origin: "GeneVault Wholesale Hub",
    destination: "St. Jude Clinic Dispensary",
    driver: "Devon Reed",
    vehicle: "BioCourier Node #08",
    temp: "-20.1°C",
    status: "In Transit",
    location: "Turnpike Mile 84",
    eta: "2 hrs 15 mins",
  },
];

export default function DistributorShipmentsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = SHIPMENTS.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DistributorLayout
      title="Active Transit Shipments & Loads"
      subtitle="Monitor live freight cargo, verify driver custody handoffs, and ensure uninterrupted cold chain telemetry."
      badge="Transit Consignments"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search shipment, driver, destination, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
                isLight
                  ? "bg-white border-neutral-200 text-neutral-900 focus:border-neutral-900"
                  : "bg-[#0d0e12] border-neutral-800 text-white focus:border-neutral-600"
              }`}
            />
          </div>

          <Link
            href="/distributor/tracking"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all"
          >
            <Compass className="w-4 h-4" /> Live GPS Fleet Map
          </Link>
        </div>

        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={`border-b ${
                  isLight ? "border-neutral-200 text-neutral-500" : "border-neutral-800 text-neutral-400"
                } text-xs uppercase tracking-[0.96px]`}
              >
                <tr>
                  <th className="py-3.5 px-4 font-medium">Transit ID</th>
                  <th className="py-3.5 px-4 font-medium">Cargo & Volume</th>
                  <th className="py-3.5 px-4 font-medium">Driver & Unit</th>
                  <th className="py-3.5 px-4 font-medium">Route Path</th>
                  <th className="py-3.5 px-4 font-medium">Live Temp</th>
                  <th className="py-3.5 px-4 font-medium">Status & ETA</th>
                  <th className="py-3.5 px-4 font-medium text-right">Telematics</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-emerald-400">{s.id}</div>
                      <div className="text-[11px] text-neutral-500">{s.batch}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>{s.product}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-neutral-200 font-medium">{s.driver}</div>
                      <div className="text-[11px] text-neutral-400">{s.vehicle}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-neutral-400">To: {s.destination}</div>
                      <div className="text-[11px] text-neutral-500">From: {s.origin}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Thermometer className="w-3 h-3" /> {s.temp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          s.status === "Delivering"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                      >
                        {s.status === "Delivering" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {s.status}
                      </span>
                      <div className="text-[11px] text-neutral-500 mt-1">ETA: {s.eta}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/distributor/tracking"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        Track <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DistributorLayout>
  );
}
