"use client";

import React, { useState } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { Plus, Search, Filter, ArrowUpRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const PRODUCTS = [
  { id: "PROD-M101", name: "Lipitor (Atorvastatin) 20mg", quantity: 15000, price: "$12.50", batch: "B-2026-9921", status: "Verified & Minted", shelfLife: "36 Months", formula: "C33H35FN2O5" },
  { id: "PROD-M102", name: "Humira (Adalimumab) 40mg", quantity: 4200, price: "$840.00", batch: "B-2026-8812", status: "Verified & Minted", shelfLife: "24 Months", formula: "C6428H9912N1694O1987S46" },
  { id: "PROD-M103", name: "Keytruda (Pembrolizumab) 100mg", quantity: 1850, price: "$2,400.00", batch: "B-2026-7734", status: "In Quality Review", shelfLife: "24 Months", formula: "C6504H10004N1716O2036S42" },
  { id: "PROD-M104", name: "Metformin HCl 500mg", quantity: 38000, price: "$3.20", batch: "B-2026-5510", status: "Verified & Minted", shelfLife: "48 Months", formula: "C4H11N5·HCl" },
  { id: "PROD-M105", name: "Eliquis (Apixaban) 5mg", quantity: 12000, price: "$45.00", batch: "B-2026-4409", status: "Verified & Minted", shelfLife: "36 Months", formula: "C25H25N5O4" },
];

export default function ManufacturerProductsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ManufacturerLayout
      title="Synthesized Formulations Catalog"
      subtitle="Comprehensive registry of chemical formulations, lab certificates, batch sizes, and on-chain genesis hashes."
      badge="Formulation Catalog"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter by drug name, chemical formula, or batch ID..."
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
            href="/manufacturer/addproducts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all"
          >
            <Plus className="w-4 h-4" /> Mint New Drug Batch
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
                  <th className="py-3.5 px-4 font-medium">Batch / SKU</th>
                  <th className="py-3.5 px-4 font-medium">Formulation Details</th>
                  <th className="py-3.5 px-4 font-medium">Stock Reserves</th>
                  <th className="py-3.5 px-4 font-medium">Wholesale Price</th>
                  <th className="py-3.5 px-4 font-medium">Verification Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-purple-400">{p.batch}</div>
                      <div className="text-[11px] text-neutral-500">{p.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>{p.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">{p.formula}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-neutral-200 font-medium">{p.quantity.toLocaleString()} units</div>
                      <div className="text-[11px] text-neutral-500">Stability: {p.shelfLife}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">{p.price}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/manufacturer/shipment"
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                      >
                        Create Consignment <ArrowUpRight className="w-3 h-3" />
                      </Link>
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
