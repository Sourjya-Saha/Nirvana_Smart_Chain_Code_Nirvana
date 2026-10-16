"use client";

import React, { useState } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const CART_ITEMS = [
  { id: 1, batch: "B-2026-9921", name: "Lipitor (Atorvastatin) 20mg", qty: 2500, unitPrice: 12.50 },
  { id: 2, batch: "B-2026-8812", name: "Humira (Adalimumab) 40mg", qty: 500, unitPrice: 840.00 },
];

export default function ManufacturerCartPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [items, setItems] = useState(CART_ITEMS);

  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <ManufacturerLayout
      title="Wholesale Allocation Cart"
      subtitle="Staged pharmaceutical consignments queued for multi-sig batch cryptographic release."
      badge="Staging Terminal"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {items.length === 0 ? (
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-12 text-center space-y-4`}
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl font-light text-white">Consignment Cart Empty</h3>
            <p className="text-xs text-neutral-400">No drug batches are currently staged for dispatch.</p>
            <Link
              href="/manufacturer/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all"
            >
              Browse Formulations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`${
                    isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
                  } border rounded-2xl p-5 flex items-center justify-between gap-4`}
                >
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-purple-400">{item.batch}</span>
                    <h4 className="font-medium text-white text-sm">{item.name}</h4>
                    <div className="text-xs text-neutral-400">
                      {item.qty.toLocaleString()} units @ ${item.unitPrice.toFixed(2)} / unit
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-editorial text-lg text-white font-light">
                        ${(item.qty * item.unitPrice).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Remove from staging"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-6 space-y-5 h-fit`}
            >
              <h3 className="font-editorial text-xl font-light text-white">Dispatch Summary</h3>
              <div className="space-y-2 text-sm text-neutral-400 border-b border-neutral-800 pb-4">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="text-white font-mono">{items.length} Batches</span>
                </div>
                <div className="flex justify-between">
                  <span>Smart Contract Gas</span>
                  <span className="text-emerald-400 font-mono">0.0035 ETH</span>
                </div>
              </div>

              <div className="flex justify-between text-base">
                <span className="font-medium text-neutral-300">Valuation:</span>
                <span className="font-editorial text-2xl font-light text-purple-400">
                  ${total.toLocaleString()}
                </span>
              </div>

              <Link
                href="/manufacturer/shipment"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)]"
              >
                Proceed to Dispatch <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </ManufacturerLayout>
  );
}
