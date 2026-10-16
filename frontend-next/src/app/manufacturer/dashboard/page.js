"use client";

import React, { useState, useEffect } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Factory,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const FALLBACK_PRODUCTS = [
  { id: "PROD-M101", name: "Lipitor (Atorvastatin) 20mg", quantity: 15000, price: "$12.50", batch: "B-2026-9921", status: "Verified & Minted" },
  { id: "PROD-M102", name: "Humira (Adalimumab) 40mg", quantity: 4200, price: "$840.00", batch: "B-2026-8812", status: "Verified & Minted" },
  { id: "PROD-M103", name: "Keytruda (Pembrolizumab) 100mg", quantity: 1850, price: "$2,400.00", batch: "B-2026-7734", status: "In Quality Review" },
  { id: "PROD-M104", name: "Metformin HCl 500mg", quantity: 38000, price: "$3.20", batch: "B-2026-5510", status: "Verified & Minted" },
  { id: "PROD-M105", name: "Eliquis (Apixaban) 5mg", quantity: 12000, price: "$45.00", batch: "B-2026-4409", status: "Verified & Minted" },
];

export default function ManufacturerDashboard() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchManufacturerData = async () => {
      setLoading(true);
      try {
        const prodRes = await fetch(`${API_BASE}/getProductsManu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) {
            setProducts(prodData);
          }
        }
      } catch (err) {
        console.warn("Backend API offline or unreachable; using local demo data.");
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturerData();
  }, [userId]);

  const filtered = products.filter(
    (p) =>
      (p.name || p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.batch || p.batch_id || p.id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ManufacturerLayout
      title="Manufacturer Production Console"
      subtitle="Genesis batch minting, synthesis certification, and wholesale consignment dispatches."
      badge="Manufacturer Node"
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
              Active Formulations
            </span>
            <div className={`font-editorial text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {products.length} Batches
            </div>
            <p className="text-xs text-neutral-400">Cryptographically minted on-chain</p>
          </div>

          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Wholesale Consignments
            </span>
            <div className={`font-editorial text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              38 Active
            </div>
            <p className="text-xs text-neutral-400">Transferred to authorized depots</p>
          </div>

          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Cold-Chain Compliance
            </span>
            <div className={`font-editorial text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              99.8%
            </div>
            <p className="text-xs text-neutral-400">Zero thermal excursions recorded</p>
          </div>
        </div>

        {/* Quick Action Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-purple-800/10 to-transparent border border-purple-500/30">
          <div className="space-y-1">
            <h3 className="font-editorial text-xl font-light text-white">Synthesize & Mint New Batch</h3>
            <p className="text-xs text-neutral-400">
              Register genesis formulation parameters, lab analysis certificates, and thermal tolerances.
            </p>
          </div>
          <Link
            href="/manufacturer/addproducts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          >
            <Plus className="w-4 h-4" /> Mint New Batch
          </Link>
        </div>

        {/* Products Table */}
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
                Pharmaceutical Batch Catalog
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                On-chain authenticated product runs registered under node {userId || "current manufacturer"}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search batches..."
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
                  <th className="py-3 px-4 font-medium">Formulation</th>
                  <th className="py-3 px-4 font-medium">Produced Units</th>
                  <th className="py-3 px-4 font-medium">Wholesale Price</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((p, idx) => (
                  <tr
                    key={idx}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-purple-400">
                      {p.batch || p.batch_id || p.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{p.name || p.product_name}</td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {(p.quantity || p.product_quantity || 0).toLocaleString()} units
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">
                      {p.price || p.product_price}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {p.status || "Minted"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/manufacturer/shipment"
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Dispatch <ArrowUpRight className="w-3 h-3" />
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
    </ManufacturerLayout>
  );
}
