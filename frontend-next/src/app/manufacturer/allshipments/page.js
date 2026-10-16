"use client";

import React, { useState } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { Package, Search, Truck, CheckCircle2, Clock, Thermometer, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

const SHIPMENTS = [
  {
    id: "M-SHP-101",
    batch: "B-2026-9921",
    product: "Lipitor 20mg",
    destination: "GeneVault Wholesale Hub",
    volume: "10,000 units",
    temp: "4.1°C",
    status: "Delivered",
    escrow: "Released",
    hash: "0x7a3f...d891",
  },
  {
    id: "M-SHP-102",
    batch: "B-2026-8812",
    product: "Humira 40mg",
    destination: "Apex Biopharma Depot",
    volume: "2,500 units",
    temp: "3.5°C",
    status: "In Transit",
    escrow: "Locked",
    hash: "0x3c99...e21a",
  },
  {
    id: "M-SHP-103",
    batch: "B-2026-7734",
    product: "Keytruda 100mg",
    destination: "Zenith Central Wholesaler",
    volume: "1,200 units",
    temp: "4.9°C",
    status: "Customs Hold",
    escrow: "Locked",
    hash: "0x99ea...f44b",
  },
];

export default function ManufacturerAllShipmentsPage() {
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
    <ManufacturerLayout
      title="All Dispatched Consignments"
      subtitle="Complete ledger of factory outbound pharmaceutical consignments and smart contract escrow states."
      badge="Outbound Shipments"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by shipment ID, batch, product, or destination..."
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
            href="/manufacturer/shipment"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all"
          >
            <Truck className="w-4 h-4" /> New Consignment
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
                  <th className="py-3.5 px-4 font-medium">Wholesale Depot</th>
                  <th className="py-3.5 px-4 font-medium">Thermal Telematics</th>
                  <th className="py-3.5 px-4 font-medium">Escrow State</th>
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
                      <div className="font-mono text-xs font-semibold text-purple-400">{s.id}</div>
                      <div className="text-[11px] text-neutral-500">{s.volume}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>{s.product}</div>
                      <div className="text-[11px] font-mono text-neutral-400">{s.batch}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300">{s.destination}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                        <Thermometer className="w-3.5 h-3.5" /> {s.temp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          s.escrow === "Released"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                      >
                        {s.escrow === "Released" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {s.escrow}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono text-xs text-purple-400 hover:text-purple-300 cursor-pointer inline-flex items-center gap-1">
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
    </ManufacturerLayout>
  );
}
