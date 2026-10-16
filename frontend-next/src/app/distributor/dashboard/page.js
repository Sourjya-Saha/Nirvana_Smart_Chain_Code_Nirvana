"use client";

import React, { useState, useEffect } from "react";
import DistributorLayout from "@/components/DistributorLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Truck,
  Users,
  Compass,
  CheckCircle2,
  Clock,
  Thermometer,
  Search,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const FLEET_DRIVERS = [
  { id: "DRV-01", name: "Marcus Vance", vehicle: "Reefer Sprinter #12", route: "Metro North - Dispensary Loop", loads: 3, temp: "4.2°C", status: "In Transit", location: "Sector 4 Hwy 101" },
  { id: "DRV-02", name: "Elena Rostova", vehicle: "Heavy Cold Van #04", route: "Central Depot Express", loads: 5, temp: "3.8°C", status: "Delivering", location: "402 Medical Blvd" },
  { id: "DRV-03", name: "Devon Reed", vehicle: "BioCourier Node #08", route: "Inter-State Cryo Corridors", loads: 2, temp: "-20.1°C", status: "In Transit", location: "Turnpike Mile 84" },
  { id: "DRV-04", name: "Amara Patel", vehicle: "EcoTransport #19", route: "Dispensary Last-Mile South", loads: 4, temp: "Ambient", status: "Available", location: "Logistics Hub East" },
];

export default function DistributorDashboardPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState(FLEET_DRIVERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDrivers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/fetch_drivers_for_distributor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driver_org_actual: userId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDrivers(data);
          }
        }
      } catch (err) {
        console.warn("Backend API offline; displaying default fleet data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [userId]);

  const filtered = drivers.filter(
    (d) =>
      (d.name || d.driver_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.vehicle || d.vehicle_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DistributorLayout
      title="Logistics Fleet & Dispatch Console"
      subtitle="Coordinate carrier vehicles, monitor real-time cold-chain telematics, and manage smart contract custody transitions."
      badge="Distributor Logistics"
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
              Active Fleet Drivers
            </span>
            <div className={`font-editorial text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {drivers.length} Units Online
            </div>
            <p className="text-xs text-neutral-400">Equipped with certified IoT data loggers</p>
          </div>

          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Active Transits
            </span>
            <div className={`font-editorial text-4xl font-light text-emerald-400`}>
              14 Shipments
            </div>
            <p className="text-xs text-neutral-400">En route to wholesale depots & dispensaries</p>
          </div>

          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 space-y-2`}
          >
            <span className="text-[12px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Fleet Thermal Integrity
            </span>
            <div className={`font-editorial text-4xl font-light text-cyan-400`}>
              4.1°C Avg
            </div>
            <p className="text-xs text-neutral-400">100% compliance across cold corridors</p>
          </div>
        </div>

        {/* Quick Link Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-transparent border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-editorial text-lg text-white">Live Route & Telematics Tracking</h4>
              <p className="text-xs text-neutral-400">GPS location, thermal curves, and vibration telemetry.</p>
            </div>
            <Link
              href="/distributor/tracking"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shrink-0"
            >
              <Compass className="w-4 h-4" /> Track Map
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-editorial text-lg text-white">Manage Transit Shipments</h4>
              <p className="text-xs text-neutral-400">Reassign couriers and sign custody state transitions.</p>
            </div>
            <Link
              href="/distributor/shipments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold uppercase tracking-[0.96px] transition-all shrink-0"
            >
              <Truck className="w-4 h-4" /> Shipments
            </Link>
          </div>
        </div>

        {/* Fleet Driver Roster */}
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
                Fleet Drivers & Assigned Vehicles
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Active telematics telemetry for logistics operator {userId || "current distributor"}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search drivers or vehicles..."
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
                  <th className="py-3 px-4 font-medium">Driver & Unit</th>
                  <th className="py-3 px-4 font-medium">Assigned Vehicle</th>
                  <th className="py-3 px-4 font-medium">Active Corridor</th>
                  <th className="py-3 px-4 font-medium">Cargo Temp</th>
                  <th className="py-3 px-4 font-medium">Status & Location</th>
                  <th className="py-3 px-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filtered.map((d, idx) => (
                  <tr
                    key={idx}
                    className={`${isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]/60"} transition-colors`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{d.name || d.driver_name}</div>
                      <div className="font-mono text-[11px] text-emerald-400">{d.id || `DRV-0${idx + 1}`}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300">
                      {d.vehicle || d.vehicle_number || "Reefer Unit"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">{d.route || "Dispensary Dispatch"}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Thermometer className="w-3 h-3" /> {d.temp || "4.0°C"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> {d.status || "Operational"}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400" /> {d.location || "En Route"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/distributor/tracking"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        Live Telematics <ArrowUpRight className="w-3 h-3" />
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
    </DistributorLayout>
  );
}
