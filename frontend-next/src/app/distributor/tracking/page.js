"use client";

import React, { useState } from "react";
import DistributorLayout from "@/components/DistributorLayout";
import { Compass, MapPin, Thermometer, ShieldCheck, Truck, Clock, Navigation, AlertTriangle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const ACTIVE_NODES = [
  {
    shipment: "DIST-TR-801",
    driver: "Marcus Vance",
    vehicle: "Reefer Sprinter #12",
    product: "Lipitor 20mg (1,500 units)",
    currentCoords: "37.7749° N, 122.4194° W",
    speed: "58 mph",
    temp: "4.2°C",
    tempStatus: "Optimal",
    humidity: "42%",
    vibration: "0.02g (Smooth)",
    battery: "94%",
    dest: "Nirvana Central Dispensary",
    eta: "45 mins",
    progress: 78,
  },
  {
    shipment: "DIST-TR-802",
    driver: "Elena Rostova",
    vehicle: "Heavy Cold Van #04",
    product: "Humira 40mg (250 units)",
    currentCoords: "37.7833° N, 122.4167° W",
    speed: "18 mph",
    temp: "3.8°C",
    tempStatus: "Optimal",
    humidity: "39%",
    vibration: "0.04g (City Transit)",
    battery: "88%",
    dest: "Metro Health Pharmacy",
    eta: "10 mins",
    progress: 92,
  },
  {
    shipment: "DIST-TR-803",
    driver: "Devon Reed",
    vehicle: "BioCourier Node #08",
    product: "Keytruda 100mg (120 units)",
    currentCoords: "37.8044° N, 122.2712° W",
    speed: "64 mph",
    temp: "-20.1°C",
    tempStatus: "Optimal",
    humidity: "15%",
    vibration: "0.01g (Smooth)",
    battery: "99%",
    dest: "St. Jude Clinic Dispensary",
    eta: "2 hrs 15 mins",
    progress: 42,
  },
];

export default function DistributorTrackingPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedNode, setSelectedNode] = useState(ACTIVE_NODES[0]);

  return (
    <DistributorLayout
      title="Live Telematics & GPS Fleet Radar"
      subtitle="Real-time satellite coordinates, dynamic cold-chain telemetry curves, and automated tamper detection."
      badge="Telematics Center"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Loads Selector */}
          <div className="space-y-4">
            <h3 className="font-editorial text-xl font-light text-white">Active Telematics Units</h3>
            {ACTIVE_NODES.map((node) => (
              <div
                key={node.shipment}
                onClick={() => setSelectedNode(node)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedNode.shipment === node.shipment
                    ? "border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : isLight
                    ? "bg-white border-neutral-200 hover:border-neutral-300"
                    : "bg-[#0d0e12] border-neutral-800/90 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-emerald-400">{node.shipment}</span>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    {node.temp}
                  </span>
                </div>
                <div className="text-sm font-medium text-white">{node.driver}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{node.product}</div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                    <span>Route Completion</span>
                    <span className="font-mono text-white">{node.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Telematics Radar */}
          <div className="lg:col-span-2 space-y-6">
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-6 sm:p-8 space-y-6`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider">Live Telematics Signal</span>
                  </div>
                  <h3 className="font-editorial text-2xl font-light text-white mt-1">
                    {selectedNode.vehicle} &bull; {selectedNode.driver}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Destination</div>
                  <div className="text-sm font-medium text-white">{selectedNode.dest}</div>
                </div>
              </div>

              {/* Simulated Map / Sensor Grid */}
              <div className="relative rounded-2xl bg-[#08090b] border border-neutral-800/80 p-6 overflow-hidden min-h-[220px] flex flex-col justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono text-neutral-400">GPS SatFix</span>
                    <div className="font-mono text-sm text-emerald-300 font-semibold">{selectedNode.currentCoords}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-neutral-400">Telemetry ETA</span>
                    <div className="font-editorial text-xl text-white font-light">{selectedNode.eta}</div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-4 border-t border-neutral-800/60">
                  <div className="space-y-1">
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Temperature
                    </div>
                    <div className="text-base font-mono text-cyan-400 font-semibold">{selectedNode.temp}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Ground Speed
                    </div>
                    <div className="text-base font-mono text-white font-semibold">{selectedNode.speed}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-neutral-400">Humidity</div>
                    <div className="text-base font-mono text-blue-400 font-semibold">{selectedNode.humidity}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-neutral-400">Vibration G-Force</div>
                    <div className="text-base font-mono text-purple-400 font-semibold">{selectedNode.vibration}</div>
                  </div>
                </div>
              </div>

              {/* Hardware Certification Status */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hardware IoT Logger: Calibrated & Cryptographically Bound</span>
                </div>
                <span className="font-mono text-neutral-400">Battery: {selectedNode.battery}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DistributorLayout>
  );
}
