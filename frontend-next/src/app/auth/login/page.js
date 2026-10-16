"use client";

import React from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Factory, Building2, Store, Truck, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const roles = [
  {
    type: "manufacturer",
    title: "Manufacturer",
    icon: Factory,
    desc: "Create and register new medicine batches directly into the system, generate authenticity records, and safely dispatch shipments.",
    loginHref: "/auth/login/manufacturer",
    signupHref: "/auth/signup/manufacturer",
  },
  {
    type: "wholesaler",
    title: "Wholesaler",
    icon: Building2,
    desc: "Receive medicine shipments from factories, verify their genuineness and storage conditions, and supply verified stocks to local pharmacies.",
    loginHref: "/auth/login/wholesaler",
    signupHref: "/auth/signup/wholesaler",
  },
  {
    type: "retailer",
    title: "Retailer & Pharmacy",
    icon: Store,
    desc: "Inspect medicine packs before selling them to customers, record sales safely, and report any suspicious or damaged products.",
    loginHref: "/auth/login/retailer",
    signupHref: "/auth/signup/retailer",
  },
  {
    type: "distributor",
    title: "Logistics Distributor",
    icon: Truck,
    desc: "Safely transport medicines between facilities, monitor live shipment temperatures, and confirm timely handoffs.",
    loginHref: "/auth/login/distributor",
    signupHref: "/auth/signup/distributor",
  },
];

export default function LoginSelectionPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen ${
        isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"
      } flex flex-col relative overflow-hidden transition-colors duration-200`}
    >
      <TopNav />

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-[1200px] w-full mx-auto px-6 lg:px-12 pt-20 sm:pt-28 pb-16 sm:pb-24 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1
            className={`font-editorial text-4xl sm:text-5xl lg:text-6xl font-light tracking-[-0.03em] leading-[1.05] ${
              isLight ? "text-neutral-900" : "text-white"
            }`}
          >
            Select your authorized portal
          </h1>
          <p
            className={`text-base font-normal tracking-[0.16px] leading-relaxed ${
              isLight ? "text-neutral-600" : "text-neutral-400"
            }`}
          >
            Choose your role to access your dashboard, verify genuine medicines, and manage supplies.
          </p>
        </div>

        {/* 4 Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.type}
                className={`relative ${
                  isLight
                    ? "bg-white border-neutral-200 hover:border-neutral-300 shadow-sm"
                    : "bg-[#0d0e12] border-neutral-800/90 hover:border-neutral-700 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
                } border rounded-2xl p-8 sm:p-10 transition-all flex flex-col justify-between space-y-8 group`}
              >
                {/* Header Row */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2
                      className={`font-editorial text-2xl sm:text-3xl font-light tracking-[-0.02em] ${
                        isLight ? "text-neutral-900" : "text-white"
                      }`}
                    >
                      {role.title}
                    </h2>
                    <div
                      className={`w-10 h-10 rounded-xl ${
                        isLight
                          ? "bg-neutral-100 border-neutral-200 text-neutral-700"
                          : "bg-[#16171d] border-neutral-700/60 text-neutral-200"
                      } border flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <p
                    className={`text-sm font-normal leading-relaxed ${
                      isLight ? "text-neutral-600" : "text-neutral-400"
                    }`}
                  >
                    {role.desc}
                  </p>
                </div>

                {/* CTAs */}
                <div
                  className={`flex items-center gap-3 pt-6 border-t ${
                    isLight ? "border-neutral-100" : "border-neutral-800/80"
                  }`}
                >
                  <Link
                    href={role.loginHref}
                    className={`h-10 px-6 rounded-full ${
                      isLight
                        ? "bg-neutral-900 hover:bg-black text-white"
                        : "bg-white hover:bg-neutral-200 text-black"
                    } text-[14px] font-semibold flex items-center gap-2 transition-all shadow-sm`}
                  >
                    Authenticate
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={role.signupHref}
                    className={`h-10 px-5 rounded-full border ${
                      isLight
                        ? "border-neutral-300 hover:border-neutral-800 text-neutral-800"
                        : "border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white"
                    } text-[14px] font-medium flex items-center transition-all bg-transparent`}
                  >
                    Enroll
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
