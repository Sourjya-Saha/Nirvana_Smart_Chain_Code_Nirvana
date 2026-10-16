"use client";

import React, { useState } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { Truck, Search, Thermometer, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const SHIPMENTS = [
  {
    id: "W-OUT-501",
    batch: "B-2026-9921",
    product: "Lipitor 20mg",
    destination: "Nirvana Central Dispensary",
    carrier: "ColdLogix Fleet #12",
    volume: "1,500 units",
    temp: "4.2°C",
    status: "In Transit",
    hash: "0x7a3f...d891",
  },
  {
    id: "W-OUT-502",
    batch: "B-2026-8812",
    product: "Humira 40mg",
    destination: "Metro Health Pharmacy",
    carrier: "BioCourier Node #04",
    volume: "250 units",
    temp: "3.7°C",
    status: "Delivered",
    hash: "0x3c99...e21a",
  },
  {
    id: "W-OUT-503",
    batch: "B-2026-5510",
    product: "Metformin 500mg",
    destination: "St. Jude Clinic Dispensary",
    carrier: "Regional Transit #19",
    volume: "5,000 units",
    temp: "Ambient",
    status: "Delivered",
    hash: "0x11ab...aa09",
  },
];

export default function WholesalerShipmentsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = SHIPMENTS.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <WholesalerLayout
      title="Dispensary Consignment Shipments"
      subtitle="Track outward consignments to pharmacies, verify IoT cold-chain transit, and review smart contract delivery seals."
      badge="Outbound Deliveries"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by shipment, destination, or batch..."
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
            href="/wholesaler/addtransaction"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all"
          >
            <Truck className="w-4 h-4" /> Create Dispensary Shipment
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
                  <th className="py-3.5 px-4 font-medium">Consignment</th>
                  <th className="py-3.5 px-4 font-medium">Formulation & Batch</th>
                  <th className="py-3.5 px-4 font-medium">Retail Destination</th>
                  <th className="py-3.5 px-4 font-medium">Carrier & Temp</th>
                  <th className="py-3.5 px-4 font-medium">Transit Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Proof</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-sky-400">{s.id}</div>
                      <div className="text-[11px] text-neutral-500">{s.volume}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>{s.product}</div>
                      <div className="text-[11px] font-mono text-neutral-400">{s.batch}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300">{s.destination}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-neutral-400">{s.carrier}</div>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-400">
                        <Thermometer className="w-3 h-3" /> {s.temp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          s.status === "Delivered"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                      >
                        {s.status === "Delivered" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono text-xs text-sky-400 hover:text-sky-300 cursor-pointer inline-flex items-center gap-1">
                        {s.hash} <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WholesalerLayout>
  );
}
