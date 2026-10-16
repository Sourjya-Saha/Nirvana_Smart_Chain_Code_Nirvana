"use client";

import React, { useEffect } from "react";
import WholesalerTopNav from "@/components/WholesalerTopNav";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";

export default function WholesalerLayout({
  title,
  subtitle,
  badge = "Wholesaler Depot",
  children,
}) {
  const { userId, logout, isReady } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();

  useEffect(() => {
    if (isReady && !userId) {
      router.push("/auth/login/wholesaler");
    }
  }, [isReady, userId, router]);

  const handleInstantSignOut = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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

    logout();
    router.push("/auth/login");
  };

  return (
    <div
      className={`min-h-screen ${
        isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"
      } flex flex-col relative overflow-hidden transition-colors duration-200`}
    >
      <WholesalerTopNav />

      <main className="relative z-10 flex-1 w-full max-w-[1450px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 space-y-8 sm:space-y-10">
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b ${
            isLight ? "border-neutral-200" : "border-neutral-800/80"
          } pb-6`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-[12px] font-medium tracking-normal px-3 py-1 rounded-full ${
                  isLight
                    ? "bg-sky-50 text-sky-800 border-sky-200"
                    : "bg-[#0e1622] text-sky-300 border-sky-700/60"
                } border`}
              >
                {badge}
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

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Link
              href="/auth/login"
              className={`h-9 sm:h-10 px-4 sm:px-5 rounded-full border text-xs sm:text-[14px] font-medium flex items-center gap-1.5 transition-all ${
                isLight
                  ? "border-neutral-300 hover:border-black text-neutral-800 bg-transparent"
                  : "border-neutral-700 hover:border-neutral-400 text-neutral-300 hover:text-white bg-transparent"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Portals
            </Link>
            <button
              type="button"
              onClick={handleInstantSignOut}
              className={`h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs sm:text-[14px] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isLight
                  ? "bg-neutral-900 hover:bg-black text-white"
                  : "bg-white hover:bg-neutral-200 text-black"
              }`}
              title="Sign Out immediately"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
