"use client";

import React, { useState } from "react";
import DistributorLayout from "@/components/DistributorLayout";
import { Users, Search, Truck, Plus, CheckCircle2, ShieldCheck, Thermometer } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const DRIVERS = [
  { id: "DRV-01", name: "Marcus Vance", phone: "+1 (555) 234-8901", vehicle: "Reefer Sprinter #12", license: "CDL-A-9921", status: "Active", experience: "8 yrs", tempLog: "4.2°C" },
  { id: "DRV-02", name: "Elena Rostova", phone: "+1 (555) 345-9012", vehicle: "Heavy Cold Van #04", license: "CDL-A-8812", status: "Active", experience: "6 yrs", tempLog: "3.8°C" },
  { id: "DRV-03", name: "Devon Reed", phone: "+1 (555) 456-0123", vehicle: "BioCourier Node #08", license: "CDL-A-7734", status: "Active", experience: "11 yrs", tempLog: "-20.1°C" },
  { id: "DRV-04", name: "Amara Patel", phone: "+1 (555) 567-1234", vehicle: "EcoTransport #19", license: "CDL-B-5510", status: "Standby", experience: "4 yrs", tempLog: "Ambient" },
  { id: "DRV-05", name: "Liam O'Connor", phone: "+1 (555) 678-2345", vehicle: "CryoExpress Unit #02", license: "CDL-A-3321", status: "Active", experience: "9 yrs", tempLog: "-78.0°C" },
];

export default function DistributorFleetPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = DRIVERS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DistributorLayout
      title="Driver Fleet & Logistics Personnel"
      subtitle="Certified cold-chain transport drivers, vehicle telematics assignments, and cryptographic dispatch authorization."
      badge="Driver Fleet"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search driver by name, vehicle, or CDL license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
                isLight
                  ? "bg-white border-neutral-200 text-neutral-900 focus:border-neutral-900"
                  : "bg-[#0d0e12] border-neutral-800 text-white focus:border-neutral-600"
              }`}
            />
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all">
            <Plus className="w-4 h-4" /> Register New Driver
          </button>
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
                  <th className="py-3.5 px-4 font-medium">Driver & ID</th>
                  <th className="py-3.5 px-4 font-medium">License / CDL</th>
                  <th className="py-3.5 px-4 font-medium">Assigned Reefer Unit</th>
                  <th className="py-3.5 px-4 font-medium">Logged Temp</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Contact</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{d.name}</div>
                      <div className="font-mono text-[11px] text-emerald-400">{d.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">{d.license}</td>
                    <td className="py-3.5 px-4 text-xs text-neutral-200">{d.vehicle}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Thermometer className="w-3 h-3" /> {d.tempLog}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          d.status === "Active"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs font-mono text-neutral-400">{d.phone}</td>
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
