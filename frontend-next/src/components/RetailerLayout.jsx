"use client";

import React, { useEffect } from "react";
import RetailerTopNav from "@/components/RetailerTopNav";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, LayoutDashboard, BarChart3, Truck } from "lucide-react";

export default function RetailerLayout({
  title,
  subtitle,
  badge = "Pharmacy Store",
  actions,
  children,
}) {
  const { userId, userName, logout, isReady } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not logged in
  useEffect(() => {
    if (isReady && !userId) {
      router.push("/auth/login/retailer");
    }
  }, [isReady, userId, router]);

  // Instant 1-Click Sign Out (Identical to TopBar process)
  const handleInstantSignOut = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. Clear wallet connection state
    if (typeof window !== "undefined") {
      localStorage.removeItem("nsc_wallet_connected");
    }

    // 2. Fire-and-forget MetaMask revoke in parallel
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        })
        .catch((err) => {
          console.warn("MetaMask revocation notice:", err);
        });
    }

    // 3. Clear auth session immediately
    logout();

    // 4. Navigate immediately to /auth/login
    router.push("/auth/login");
  };

  return (
    <div
      className={`min-h-screen ${
        isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"
      } flex flex-col relative overflow-hidden transition-colors duration-200`}
    >
      {/* Stakeholder Topbar — Floating Glass Nav */}
      <RetailerTopNav />

      {/* Main Content Area (Spacious, full-width responsive without awkward side gaps) */}
      <main className="relative z-10 flex-1 w-full max-w-[1450px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 space-y-8 sm:space-y-10">
        {/* Editorial Header Band */}
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b ${
            isLight ? "border-neutral-200" : "border-neutral-800/80"
          } pb-6`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-[12px] font-medium tracking-normal px-3.5 py-1 rounded-full transition-all ${
                  isLight
                    ? "bg-neutral-100 text-neutral-800 border border-neutral-200/80"
                    : "bg-[#14151a] text-neutral-200 border border-neutral-800"
                }`}
              >
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {userName || "Maa Tara Store"}
                </span>
                {badge && (
                  <>
                    <span className="mx-1.5 text-neutral-400">&bull;</span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {badge.toLowerCase() === (userName || "Maa Tara Store").toLowerCase() ||
                      badge === "Pharmacy Store" ||
                      badge === "Dispensary Node"
                        ? "Statistics"
                        : badge}
                    </span>
                  </>
                )}
              </span>
            </div>
            <h1
              className={`font-editorial text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.03em] leading-[1.08] ${
                isLight ? "text-neutral-900" : "text-white"
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`text-sm sm:text-base font-normal tracking-[0.16px] max-w-3xl leading-relaxed ${
                  isLight ? "text-neutral-600" : "text-neutral-400"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Quick Actions Header: Notification Bell & Sign Out */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {actions}
            <button
              type="button"
              onClick={handleInstantSignOut}
              className={`h-9 sm:h-10 px-5 sm:px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                isLight
                  ? "bg-neutral-900 hover:bg-black text-white"
                  : "bg-white hover:bg-neutral-200 text-black"
              }`}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs Bar Just Below Main Header - Appears ONLY on details, deliveries, and dashboard */}
        {(pathname === "/retailer/dashboard" ||
          pathname === "/retailer/details" ||
          pathname === "/retailer/deliveries") && (
          <div
            className={`flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-none border-b ${
              isLight ? "border-neutral-200" : "border-neutral-800/80"
            }`}
          >
            <Link
              href="/retailer/dashboard"
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
                pathname === "/retailer/dashboard"
                  ? isLight
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-black shadow-sm"
                  : isLight
                  ? "bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200"
                  : "bg-[#14151a] text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-neutral-800"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/retailer/details"
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
                pathname === "/retailer/details"
                  ? isLight
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-black shadow-sm"
                  : isLight
                  ? "bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200"
                  : "bg-[#14151a] text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-neutral-800"
              }`}
            >
              Details & Sales Insights
            </Link>

            <Link
              href="/retailer/deliveries"
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
                pathname === "/retailer/deliveries"
                  ? isLight
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-black shadow-sm"
                  : isLight
                  ? "bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200"
                  : "bg-[#14151a] text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-neutral-800"
              }`}
            >
              Shipment Deliveries
            </Link>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
