"use client";

import React, { useState } from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { Search, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const INITIAL_TRANSACTIONS = [
  {
    txHash: "0x8fa91283e7208d320984",
    block: "19,842,012",
    type: "Manufacturer Inward Receipt",
    parties: "From: Apex BioPharma -> To: Wholesaler Depot",
    batch: "B-2026-9921",
    amount: "5,000 Units",
    status: "Confirmed",
    time: "42 mins ago",
  },
  {
    txHash: "0x33cc491823901bca0921",
    block: "19,841,920",
    type: "Dispensary Consignment Release",
    parties: "Wholesaler Depot -> Nirvana Central Dispensary",
    batch: "B-2026-8812",
    amount: "1,500 Units",
    status: "Confirmed",
    time: "3 hours ago",
  },
  {
    txHash: "0x77ee9128374981123490",
    block: "19,840,412",
    type: "Custody Handover Escrow",
    parties: "ColdLogix Fleet -> Wholesaler Cold Vault",
    batch: "B-2026-5510",
    amount: "10,000 Units",
    status: "Confirmed",
    time: "1 day ago",
  },
];

export default function WholesalerTransactionsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions] = useState(INITIAL_TRANSACTIONS);

  const filtered = transactions.filter(
    (t) =>
      t.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.parties.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <WholesalerLayout
      title="Wholesaler Smart Contract Ledger"
      subtitle="Immutable registry of inbound batch receipts, custody handovers, and pharmacy dispatches on CardTransactionRegistry."
      badge="Depot Ledger"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by transaction hash, type, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
                isLight
                  ? "bg-white border-neutral-200 text-neutral-900 focus:border-neutral-900"
                  : "bg-[#0d0e12] border-neutral-800 text-white focus:border-neutral-600"
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              CardTransactionRegistry @ Sepolia
            </span>
          </div>
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
                  <th className="py-3.5 px-4 font-medium">Tx Hash & Block</th>
                  <th className="py-3.5 px-4 font-medium">Operation</th>
                  <th className="py-3.5 px-4 font-medium">Parties Flow</th>
                  <th className="py-3.5 px-4 font-medium">Batch & Volume</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Age</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((t, idx) => (
                  <tr
                    key={idx}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1 font-semibold">
                        {t.txHash.slice(0, 10)}...{t.txHash.slice(-4)}
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                      <div className="text-[11px] text-neutral-500">Block #{t.block}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-neutral-200">{t.type}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">{t.parties}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-neutral-300">{t.batch}</div>
                      <div className="text-[11px] text-neutral-500">{t.amount}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-500 text-right">{t.time}</td>
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
