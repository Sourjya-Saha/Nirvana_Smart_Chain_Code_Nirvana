"use client";

import React, { useState, useEffect } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";
import {
  Building2,
  PackageCheck,
  CheckCircle2,
  Clock,
  ThermometerSnowflake,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Plus,
  Truck,
} from "lucide-react";
import Link from "next/link";

const DEPOT_INVENTORY = [
  { id: "W-SKU-001", batch: "B-2026-9921", product: "Lipitor (Atorvastatin) 20mg", manufacturer: "Alpha BioLabs Genesis", inStock: 8500, allocated: 3200, temp: "4.1°C", status: "Available" },
  { id: "W-SKU-002", batch: "B-2026-8812", product: "Humira (Adalimumab) 40mg", manufacturer: "Apex BioPharma", inStock: 1800, allocated: 900, temp: "3.6°C", status: "Reserved" },
  { id: "W-SKU-003", batch: "B-2026-7734", product: "Keytruda 100mg/4mL", manufacturer: "GeneVault Labs", inStock: 640, allocated: 600, temp: "4.8°C", status: "Critical Low" },
  { id: "W-SKU-004", batch: "B-2026-5510", product: "Metformin HCl 500mg", manufacturer: "Alpha BioLabs Genesis", inStock: 22000, allocated: 11500, temp: "Ambient", status: "Available" },
  { id: "W-SKU-005", batch: "B-2026-4409", product: "Eliquis (Apixaban) 5mg", manufacturer: "Zenith BioPharma", inStock: 6200, allocated: 2100, temp: "Ambient", status: "Available" },
];

export default function WholesalerDashboardPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [inventory] = useState(DEPOT_INVENTORY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [userId]);

  const filtered = inventory.filter(
    (item) =>
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <WholesalerLayout
      title="Wholesaler Depot Console"
      subtitle="Verify inbound pharmaceutical consignments, maintain cold-chain custody, and allocate stock to licensed retail dispensaries."
      badge="Wholesaler Depot"
    >
      {loading ? (
        <RoleDashboardSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Inbound Consignments
            </span>
            <div className={`font-editorial text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              18 Received
            </div>
            <p className="text-xs text-neutral-400">Authenticated from certified manufacturing nodes</p>
          </div>

          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Cold-Chain Integrity
            </span>
            <div className={`font-editorial text-4xl font-light text-cyan-400`}>
              4.4°C Mean
            </div>
            <p className="text-xs text-neutral-400">Within WHO 2°C – 8°C optimal biologic corridor</p>
          </div>

          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Dispensary Allocations
            </span>
            <div className={`font-editorial text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              42 Pharmacies
            </div>
            <p className="text-xs text-neutral-400">Active retail replenishment channels</p>
          </div>
        </div>

        {/* Quick Handover Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-sky-900/20 to-transparent border border-sky-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-editorial text-lg text-white">Receive Manufacturer Consignment</h4>
              <p className="text-xs text-neutral-400">Inspect inbound carrier batch & sign cryptographic handover.</p>
            </div>
            <Link
              href="/wholesaler/receive"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shrink-0"
            >
              <PackageCheck className="w-4 h-4" /> Receive
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-editorial text-lg text-white">Dispatch to Retail Dispensaries</h4>
              <p className="text-xs text-neutral-400">Assign courier fleet and broadcast delivery smart contract.</p>
            </div>
            <Link
              href="/wholesaler/shipments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shrink-0"
            >
              <Truck className="w-4 h-4" /> Ship
            </Link>
          </div>
        </div>

        {/* Depot Inventory Table */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-8 space-y-6`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <h2 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Depot Stock Reserves
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Custody-verified pharmaceutical stock held under wholesaler node {userId || "current operator"}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search stock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-600"
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={`border-b ${
                  isLight ? "border-neutral-200 text-neutral-500" : "border-neutral-800 text-neutral-400"
                } text-xs uppercase tracking-[0.96px]`}
              >
                <tr>
                  <th className="py-3 px-4 font-medium">Batch / SKU</th>
                  <th className="py-3 px-4 font-medium">Formulation & Manufacturer</th>
                  <th className="py-3 px-4 font-medium">In Stock</th>
                  <th className="py-3 px-4 font-medium">Allocated</th>
                  <th className="py-3 px-4 font-medium">Vault Temp</th>
                  <th className="py-3 px-4 font-medium text-right">Allocation</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-sky-400">
                      {item.batch}
                      <div className="text-[11px] text-neutral-500">{item.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{item.product}</div>
                      <div className="text-[11px] text-neutral-400">{item.manufacturer}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-neutral-200">
                      {item.inStock.toLocaleString()} units
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {item.allocated.toLocaleString()} units
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                        {item.temp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/wholesaler/shipments"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
                      >
                        Allocate <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
    </WholesalerLayout>
  );
}
