"use client";

import React, { useEffect } from "react";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";

export default function EditorialDashboardLayout({
  title,
  subtitle,
  badge,
  orb = "orb-lavender",
  children,
}) {
  const { userId, userType, logout, isReady } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();

  // If session is loaded and no userId exists, redirect to /login
  useEffect(() => {
    if (isReady && !userId) {
      router.push("/login");
    }
  }, [isReady, userId, router]);

  return (
    <div className={`min-h-screen ${isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"} flex flex-col relative overflow-hidden transition-colors duration-200`}>
      <TopNav />

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-[1200px] w-full mx-auto px-6 lg:px-12 pt-20 sm:pt-28 pb-16 sm:pb-24 space-y-12">
        {/* Editorial Header Band */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b ${isLight ? "border-neutral-200" : "border-neutral-800/80"} pb-8`}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-[12px] font-medium tracking-normal px-3 py-1 rounded-full ${isLight ? "bg-neutral-100 text-neutral-800 border-neutral-200" : "bg-[#16171d] text-neutral-200 border-neutral-700/60"} border`}>
                {badge || "Dashboard"}
              </span>
            </div>
            <h1 className={`font-editorial text-4xl sm:text-5xl font-light tracking-[-0.03em] leading-[1.08] ${isLight ? "text-neutral-900" : "text-white"}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-base font-normal tracking-[0.16px] max-w-2xl leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/login"
              className={`h-10 px-5 rounded-full border text-[14px] font-medium flex items-center gap-1.5 transition-all ${
                isLight
                  ? "border-neutral-300 hover:border-black text-neutral-800 bg-transparent"
                  : "border-neutral-700 hover:border-neutral-400 text-neutral-300 hover:text-white bg-transparent"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Switch Portal
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className={`h-10 px-5 rounded-full text-[14px] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isLight
                  ? "bg-neutral-900 hover:bg-black text-white"
                  : "bg-white hover:bg-neutral-200 text-black"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Slot */}
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
