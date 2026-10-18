"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LiquidGlassButton from "@/components/ui/LiquidGlassButton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, LogOut, ChevronDown, X } from "lucide-react";

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const navbarRef = useRef(null);
  const pathname = usePathname();
  const { userId, userType, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === "light";

  return (
    <>
      {/* ===== Pull Handle (Always hangs at the top) ===== */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          className={`fixed top-2 left-1/2 -translate-x-1/2 z-[9999]
          w-16 h-6 rounded-full flex items-center justify-center cursor-pointer
          transition-all duration-300 group hover:scale-110 active:scale-95
          ${
            isLight
              ? "bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0c] border border-neutral-700/80 shadow-[0_0_6px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:shadow-[0_0_10px_rgba(0,0,0,0.25),0_3px_10px_rgba(0,0,0,0.3)]"
              : "bg-gradient-to-b from-[#ffffff] to-[#e4e4e7] border border-white/90 shadow-[0_0_14px_rgba(255,255,255,0.45),0_0_4px_rgba(255,255,255,0.8),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_0_22px_rgba(255,255,255,0.65),0_0_8px_rgba(255,255,255,0.9)]"
          }`}
          title="Open Navigation"
        >
          <div
            className={`w-7 h-[2.5px] rounded-full transition-transform duration-300 group-hover:scale-x-110 ${
              isLight ? "bg-white/80 group-hover:bg-white" : "bg-black/75 group-hover:bg-black"
            }`}
          />
        </div>
      )}

      {/* ===== DESKTOP BACKDROP (Transparent click-catcher without blurring the page) ===== */}
      <div
        className={`hidden xl:block fixed inset-0 z-[9997] ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* ===== NAVBAR WRAPPER ===== */}
      <div
        ref={navbarRef}
        className={`fixed top-0 left-0 w-full xl:h-auto h-screen z-[9998]
        transition-all duration-500
        ${open ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}
      >
        {/* Ambient Frosted Blurred Texture Strip behind topbar */}
        <div
          className={`hidden xl:block absolute top-0 left-0 w-full h-32 pointer-events-none backdrop-blur-md transition-opacity duration-300 ${
            isLight
              ? "bg-gradient-to-b from-white/70 via-white/35 to-transparent border-b border-black/[0.04]"
              : "bg-gradient-to-b from-black/70 via-black/40 to-transparent border-b border-white/[0.05]"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
          }}
        />

        {/* Mobile/Tablet Frosted Glass Backdrop */}
        <div
          className={`absolute inset-0 backdrop-blur-2xl xl:hidden transition-opacity duration-500 ${
            isLight ? "bg-black/30" : "bg-black/80"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* ===== DESKTOP NAVBAR — split floating glass pills (xl: 1280px+) ===== */}
        <div className="hidden xl:flex w-full pt-6 px-12 relative z-10 justify-center" id="navbar">
          <div className="w-full max-w-6xl flex flex-row items-center justify-between">
            
            {/* Left Pill: PORTALS, MANUFACTURER, WHOLESALER */}
            <LiquidGlassButton
              as="div"
              className={`flex flex-row items-center gap-8 !px-9 !py-3.5 !rounded-full select-none ${
                isLight
                  ? "border border-neutral-300/80 shadow-md"
                  : "border border-neutral-800/80 shadow-2xl"
              }`}
              variant={isLight ? "light" : "dark"}
              options={{ scale: -80, chroma: 0, mapBlur: 8, border: 0.08 }}
            >
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.2em] font-sans ${
                  isLight
                    ? pathname === "/auth/login" || pathname === "/login"
                      ? "text-black scale-105"
                      : "text-neutral-600 hover:text-black hover:scale-105"
                    : pathname === "/auth/login" || pathname === "/login"
                    ? "text-white scale-105"
                    : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                Portals
              </Link>
              <Link
                href="/auth/login/manufacturer"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.2em] font-sans ${
                  isLight
                    ? pathname.includes("/manufacturer")
                      ? "text-black scale-105"
                      : "text-neutral-600 hover:text-black hover:scale-105"
                    : pathname.includes("/manufacturer")
                    ? "text-white scale-105"
                    : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                Manufacturer
              </Link>
              <Link
                href="/auth/login/wholesaler"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.2em] font-sans ${
                  isLight
                    ? pathname.includes("/wholesaler")
                      ? "text-black scale-105"
                      : "text-neutral-600 hover:text-black hover:scale-105"
                    : pathname.includes("/wholesaler")
                    ? "text-white scale-105"
                    : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                Wholesaler
              </Link>
            </LiquidGlassButton>

            {/* Center Brand Emblem without Hover Popup */}
            <div className="relative flex items-center mx-6 xl:mx-10 shrink-0">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 select-none transition-transform duration-300 hover:scale-105"
              >
                {/* Emblem */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nirvana-emblem.png"
                  alt="Nirvana Emblem"
                  className="w-13 h-13 sm:w-14 sm:h-14 object-contain"
                />

                {/* Brand banner image kept exactly as it is (no invert, original colors) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nirvana-smart-chain.png"
                  alt="Nirvana Smart Chain"
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Right Pill: RETAILER, DISTRIBUTOR, THEME TOGGLE / SESSION */}
            <LiquidGlassButton
              as="div"
              className={`flex flex-row items-center gap-8 !px-9 !py-3.5 !rounded-full select-none ${
                isLight
                  ? "border border-neutral-300/80 shadow-md"
                  : "border border-neutral-800/80 shadow-2xl"
              }`}
              variant={isLight ? "light" : "dark"}
              options={{ scale: -80, chroma: 0, mapBlur: 8, border: 0.08 }}
            >
              <Link
                href="/auth/login/retailer"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.2em] font-sans ${
                  isLight
                    ? pathname.includes("/retailer")
                      ? "text-black scale-105"
                      : "text-neutral-600 hover:text-black hover:scale-105"
                    : pathname.includes("/retailer")
                    ? "text-white scale-105"
                    : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                Retailer
              </Link>
              <Link
                href="/auth/login/distributor"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.2em] font-sans ${
                  isLight
                    ? pathname.includes("/distributor")
                      ? "text-black scale-105"
                      : "text-neutral-600 hover:text-black hover:scale-105"
                    : pathname.includes("/distributor")
                    ? "text-white scale-105"
                    : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                Distributor
              </Link>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.2em] font-sans ${
                  isLight
                    ? pathname.includes("/admin")
                      ? "text-black scale-105"
                      : "text-neutral-600 hover:text-black hover:scale-105"
                    : pathname.includes("/admin")
                    ? "text-white scale-105"
                    : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                Admin
              </Link>

              {/* Theme Toggle Button inside Right Pill */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`cursor-pointer text-[11px] font-bold transition-all duration-300 flex items-center gap-1.5 uppercase tracking-[0.2em] font-sans hover:scale-110 ${
                  isLight ? "text-neutral-700 hover:text-black" : "text-white/60 hover:text-white"
                }`}
                title={isLight ? "Switch to Dark theme" : "Switch to Light theme"}
              >
                {isLight ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-neutral-800" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Light</span>
                  </>
                )}
              </button>

              {/* Sign out if authenticated */}
              {isAuthenticated() && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="cursor-pointer text-[11px] font-bold text-red-500 hover:text-red-600 hover:scale-105 transition-all duration-300 uppercase tracking-[0.2em] font-sans flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              )}
            </LiquidGlassButton>

          </div>
        </div>

        {/* ===== TABLET & MOBILE NAVBAR DRAWER (Screens < 1280px / xl) ===== */}
        <div
          className="xl:hidden w-full h-full relative z-10 flex items-center justify-center overflow-y-auto py-6 sm:py-10 px-4 sm:px-6"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md my-auto transition-all"
          >
            {/* Main Liquid Glass Container */}
            <div
              className={`w-full rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-7 md:p-8 border transition-all duration-300 flex flex-col gap-5 sm:gap-6 relative select-none backdrop-blur-2xl ${
                isLight
                  ? "bg-white/85 border-neutral-300/80 text-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(0,0,0,0.04)]"
                  : "bg-black/75 border-neutral-800/90 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${isLight ? '0.02' : '0.04'}'/%3E%3C/svg%3E")`,
              }}
            >
              {/* Header: Brand and Close Handle */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-neutral-200/60 dark:border-neutral-800/80">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 sm:gap-3 transition-transform duration-300 hover:scale-105 min-w-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/nirvana-emblem.png"
                    alt="Nirvana Emblem"
                    className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/nirvana-smart-chain.png"
                    alt="Nirvana Smart Chain"
                    className="h-7 sm:h-8 w-auto object-contain shrink-0"
                  />
                </Link>

                <LiquidGlassButton
                  as="button"
                  type="button"
                  onClick={() => setOpen(false)}
                  variant={isLight ? "light" : "dark"}
                  className="!p-2.5 !rounded-full cursor-pointer hover:scale-110 transition-transform"
                  title="Close Navigation"
                  options={{ scale: -60, chroma: 0, mapBlur: 6, border: 0.08 }}
                >
                  <X className={`w-4 h-4 ${isLight ? "text-neutral-800" : "text-white"}`} />
                </LiquidGlassButton>
              </div>

              {/* Navigation Links — Pure Typography, No Cards, No Icons */}
              <div className="flex flex-col items-center gap-4 w-full py-2 text-center font-sans">
                {[
                  { label: "Portals", href: "/auth/login" },
                  { label: "Manufacturer", href: "/auth/login/manufacturer" },
                  { label: "Wholesaler", href: "/auth/login/wholesaler" },
                  { label: "Retailer Portal", href: "/auth/login/retailer" },
                  { label: "Distributor Portal", href: "/auth/login/distributor" },
                  { label: "Admin Console", href: "/admin" },
                ].map((item) => {
                  const active = pathname === item.href || (item.href !== "/auth/login" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`w-full py-1 text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                        active
                          ? isLight
                            ? "text-black scale-105 font-extrabold"
                            : "text-white scale-105 font-extrabold"
                          : isLight
                          ? "text-neutral-500 hover:text-black"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Footer: Liquid Glass Theme Toggle & Optional Sign Out */}
              <div className={`grid ${isAuthenticated() ? "grid-cols-2" : "grid-cols-1"} gap-2.5 sm:gap-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 w-full`}>
                <LiquidGlassButton
                  as="button"
                  type="button"
                  onClick={toggleTheme}
                  variant={isLight ? "light" : "dark"}
                  className="!py-2.5 sm:!py-3 !px-4 !rounded-2xl cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  options={{ scale: -60, chroma: 0, mapBlur: 6, border: 0.08 }}
                >
                  {isLight ? (
                    <Moon className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  )}
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] font-sans">
                    {isLight ? "Dark Mode" : "Light Mode"}
                  </span>
                </LiquidGlassButton>

                {isAuthenticated() && (
                  <LiquidGlassButton
                    as="button"
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    variant={isLight ? "light" : "dark"}
                    className="!py-2.5 sm:!py-3 !px-4 !rounded-2xl cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] transition-all text-red-500 hover:text-red-400 !border-red-500/30"
                    options={{ scale: -60, chroma: 0, mapBlur: 6, border: 0.08 }}
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] font-sans text-red-500">
                      Sign Out
                    </span>
                  </LiquidGlassButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
