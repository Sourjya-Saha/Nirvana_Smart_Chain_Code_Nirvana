"use client";

import React, { useState } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const CART_ITEMS = [
  { id: 1, batch: "B-2026-9921", name: "Lipitor (Atorvastatin) 20mg", qty: 1500, unitPrice: 14.20 },
  { id: 2, batch: "B-2026-8812", name: "Humira (Adalimumab) 40mg", qty: 250, unitPrice: 910.00 },
];

export default function WholesalerCartPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [items, setItems] = useState(CART_ITEMS);

  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <WholesalerLayout
      title="Dispensary Consignment Cart"
      subtitle="Staged pharmaceutical packages queued for dispatch to licensed pharmacies."
      badge="Allocation Staging"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {items.length === 0 ? (
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-12 text-center space-y-4`}
          >
            <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl font-light text-white">Consignment Cart Empty</h3>
            <p className="text-xs text-neutral-400">No stock lots are currently staged for dispensary allocation.</p>
            <Link
              href="/wholesaler/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all"
            >
              Browse Depot Products
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
                    <span className="font-mono text-xs text-sky-400">{item.batch}</span>
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
                      title="Remove item"
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
              <h3 className="font-editorial text-xl font-light text-white">Consignment Summary</h3>
              <div className="space-y-2 text-sm text-neutral-400 border-b border-neutral-800 pb-4">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="text-white font-mono">{items.length} Batches</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Freight</span>
                  <span className="text-white font-mono">$480.00</span>
                </div>
              </div>

              <div className="flex justify-between text-base">
                <span className="font-medium text-neutral-300">Total Value:</span>
                <span className="font-editorial text-2xl font-light text-sky-400">
                  ${total.toLocaleString()}
                </span>
              </div>

              <Link
                href="/wholesaler/addtransaction"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)]"
              >
                Proceed to Consignment Transfer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </WholesalerLayout>
  );
}
