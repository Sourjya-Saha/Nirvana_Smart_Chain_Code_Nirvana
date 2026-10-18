"use client";

import React from "react";
import AdminTopNav from "@/components/AdminTopNav";
import { useTheme } from "@/context/ThemeContext";

export default function AdminLayout({
  title = "Token Administration",
  subtitle = "Manage stakeholder whitelist permissions, track live smart contract metrics, and execute reserve token allocations with automated gas handling.",
  badge = "NSC Governance Node",
  actions,
  activeTab = "dashboard",
  setActiveTab,
  tabs = [],
  walletAddress,
  connectWallet,
  disconnectWallet,
  networkInfo,
  children,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen ${
        isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"
      } flex flex-col relative overflow-hidden transition-colors duration-200`}
    >
      {/* Stakeholder Topbar — Floating Glass Nav */}
      <AdminTopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        networkInfo={networkInfo}
      />

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
                className={`text-[12px] font-medium tracking-normal px-3.5 py-1 rounded-full transition-all border ${
                  isLight
                    ? "bg-neutral-100 text-neutral-800 border-neutral-200/80"
                    : "bg-[#14151a] text-neutral-200 border-neutral-800"
                }`}
              >
                <span className="font-semibold text-neutral-900 dark:text-white">Admin Protocol</span>
                <span className="mx-1.5 text-neutral-400">&bull;</span>
                <span className="text-neutral-500 dark:text-neutral-400">{badge}</span>
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

          {/* Quick Actions Header: Actions & Disconnect Button */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {actions}
            {walletAddress && (
              <button
                type="button"
                onClick={disconnectWallet}
                className={`h-9 sm:h-10 px-5 sm:px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
                title="Disconnect Wallet"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>


        {/* Dashboard Content */}
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
