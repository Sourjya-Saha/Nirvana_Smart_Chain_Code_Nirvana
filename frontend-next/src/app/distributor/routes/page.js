"use client";

import React, { useState } from "react";
import DistributorLayout from "@/components/DistributorLayout";
import { Compass, MapPin, Clock, Truck, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const ROUTES = [
  {
    code: "RT-CORRIDOR-01",
    title: "Metro Bay Priority Corridor",
    stops: 6,
    distance: "142 miles",
    avgDuration: "3h 45m",
    assignedFleet: "Reefer Sprinter #12",
    riskProfile: "Low (Direct Highway)",
    status: "Active Today",
  },
  {
    code: "RT-CORRIDOR-02",
    title: "Regional Cryo Expressway",
    stops: 4,
    distance: "310 miles",
    avgDuration: "5h 20m",
    assignedFleet: "BioCourier Node #08",
    riskProfile: "Monitored (Deep Cryo)",
    status: "Active Today",
  },
  {
    code: "RT-CORRIDOR-03",
    title: "Urban Dispensary Last-Mile",
    stops: 12,
    distance: "48 miles",
    avgDuration: "4h 10m",
    assignedFleet: "EcoTransport #19",
    riskProfile: "Moderate (City Traffic)",
    status: "Scheduled Tomorrow",
  },
];

export default function DistributorRoutesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <DistributorLayout
      title="Logistics Transit Corridors & Delivery Routes"
      subtitle="Optimized cold-chain transit lanes, dispensary cluster drop-offs, and risk-rated transit corridors."
      badge="Transit Corridors"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROUTES.map((route) => (
            <div
              key={route.code}
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-6 space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400">{route.code}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {route.status}
                </span>
              </div>

              <div>
                <h3 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                  {route.title}
                </h3>
                <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" /> {route.assignedFleet}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-center">
                <div>
                  <div className="text-[11px] text-neutral-400">Stops</div>
                  <div className="font-mono text-sm text-white font-semibold">{route.stops}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-400">Distance</div>
                  <div className="font-mono text-sm text-white font-semibold">{route.distance}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-400">Duration</div>
                  <div className="font-mono text-sm text-white font-semibold">{route.avgDuration}</div>
                </div>
              </div>

              <div className="text-xs text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-800">
                <span>Profile: <span className="text-neutral-300">{route.riskProfile}</span></span>
                <span className="text-emerald-400 hover:text-emerald-300 cursor-pointer inline-flex items-center gap-1">
                  Optimize <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DistributorLayout>
  );
}
