"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ethers } from "ethers";
import LiquidGlassButton from "@/components/ui/LiquidGlassButton";
import CardTransactionRegistry from "@/contracts/CardTransactionRegistry.json";
import contractConfig from "@/contracts/contractAddress.json";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  LogOut,
  ChevronDown,
  Wallet,
  Sun,
  Moon,
  X,
  Truck,
  Compass,
  MapPin
} from "lucide-react";

export default function DistributorTopNav() {
  const [open, setOpen] = useState(false);
  const navbarRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [drawerDropdown, setDrawerDropdown] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleDrawerDropdown = (name) => {
    setDrawerDropdown((prev) => (prev === name ? null : name));
  };

  const contractAddress =
    process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ||
    contractConfig?.registryAddress ||
    "0x0a7Afd6846052D1C96202B72F7Bc0DF93B3912d7";

  useEffect(() => {
    checkExistingConnection();

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          localStorage.removeItem("nsc_wallet_connected");
          setWalletAddress(null);
          setContract(null);
        } else if (localStorage.getItem("nsc_wallet_connected") === "true") {
          setupWalletAndContract(accounts[0]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, []);

  const setupWalletAndContract = async (account) => {
    try {
      const checksummedAddress = ethers.getAddress(account);
      setWalletAddress(checksummedAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(checksummedAddress);
      const cardTransactionRegistry = new ethers.Contract(
        contractAddress,
        CardTransactionRegistry.abi,
        signer
      );
      setContract(cardTransactionRegistry);
    } catch (err) {
      console.warn("Wallet contract initialization error:", err);
    }
  };

  const checkExistingConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      const wasConnected = localStorage.getItem("nsc_wallet_connected") === "true";
      if (!wasConnected) {
        setWalletAddress(null);
        setContract(null);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          await setupWalletAndContract(accounts[0]);
        } else {
          localStorage.removeItem("nsc_wallet_connected");
          setWalletAddress(null);
          setContract(null);
        }
      } catch (err) {
        console.warn("Check wallet error:", err);
        setWalletAddress(null);
        setContract(null);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          localStorage.setItem("nsc_wallet_connected", "true");
          await setupWalletAndContract(accounts[0]);
        }
      } catch (err) {
        console.warn("User rejected or error connecting wallet:", err);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("MetaMask is not detected. Please install MetaMask browser extension.");
    }
  };

  const toggleDropdown = (key, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".nav-dropdown-wrapper")) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [activeDropdown]);

  const handleSignOut = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    localStorage.removeItem("nsc_wallet_connected");
    setWalletAddress(null);
    setContract(null);
    setOpen(false);

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

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isActive = (path) => pathname === path || (path === "/distributor/dashboard" && (pathname === "/dashdistributor" || pathname === "/distributer/dashboard"));

  return (
    <>
      {/* 1. TABLET PULL HANDLE */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          className={`fixed top-2 left-1/2 -translate-x-1/2 z-[9999]
          w-16 sm:w-20 h-6 sm:h-6.5 rounded-full flex items-center justify-center cursor-pointer
          transition-all duration-300 group hover:scale-110 active:scale-95
          ${
            isLight
              ? "bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0c] border border-neutral-700/80 shadow-[0_0_6px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:shadow-[0_0_10px_rgba(0,0,0,0.25),0_3px_10px_rgba(0,0,0,0.3)]"
              : "bg-gradient-to-b from-[#ffffff] to-[#e4e4e7] border border-white/90 shadow-[0_0_14px_rgba(255,255,255,0.45),0_0_4px_rgba(255,255,255,0.8),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_0_22px_rgba(255,255,255,0.65),0_0_8px_rgba(255,255,255,0.9)]"
          }`}
          title="Open Navigation"
        >
          <div
            className={`w-7 sm:w-8 h-[2.5px] rounded-full transition-transform duration-300 group-hover:scale-x-110 ${
              isLight ? "bg-white/80 group-hover:bg-white" : "bg-black/75 group-hover:bg-black"
            }`}
          />
        </div>
      )}

      {/* 2. DESKTOP BACKDROP */}
      <div
        className={`hidden xl:block fixed inset-0 z-[9997] ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => {
          setOpen(false);
          setActiveDropdown(null);
        }}
      />

      {/* 3. NAVBAR WRAPPER */}
      <div
        ref={navbarRef}
        className={`fixed top-0 left-0 w-full xl:h-auto h-screen z-[9998]
        transition-all duration-500
        ${open ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}
      >
        {/* Ambient Frosted Blurred Texture Strip */}
        <div
          className={`hidden xl:block absolute top-0 left-0 w-full h-24 xl:h-28 pointer-events-none backdrop-blur-md transition-opacity duration-300 ${
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
          onClick={() => {
            setOpen(false);
            setActiveDropdown(null);
          }}
        />

        {/* ===== DESKTOP NAVBAR (xl: 1280px+) ===== */}
        <div className="hidden xl:flex w-full pt-6 px-8 xl:px-12 relative z-10 justify-center" id="navbar">
          <div className="w-full max-w-[1550px] flex flex-row items-center justify-between gap-3 lg:gap-4 xl:gap-6">
            
            {/* LEFT PILL: Distributor Fleet */}
            <LiquidGlassButton
              as="div"
              className={`flex flex-row items-center gap-4 lg:gap-6 xl:gap-7 !px-5 lg:!px-7 xl:!px-8 !py-3 !rounded-full select-none overflow-visible ${
                isLight
                  ? "border border-neutral-300/80 shadow-md"
                  : "border border-neutral-800/80 shadow-2xl"
              }`}
              variant={isLight ? "light" : "dark"}
              options={{ scale: -80, chroma: 0, mapBlur: 8, border: 0.08 }}
            >
              {/* Dashboard */}
              <Link
                href="/distributor/dashboard"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[10px] xl:text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans ${
                  isActive("/distributor/dashboard")
                    ? isLight ? "text-black scale-105" : "text-white scale-105"
                    : isLight ? "text-neutral-600 hover:text-black hover:scale-105" : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                <span>Dashboard</span>
              </Link>

              {/* Fleet & Drivers */}
              <Link
                href="/distributor/fleet"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[10px] xl:text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans ${
                  isActive("/distributor/fleet")
                    ? isLight ? "text-black scale-105" : "text-white scale-105"
                    : isLight ? "text-neutral-600 hover:text-black hover:scale-105" : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                <span>Fleet & Drivers</span>
              </Link>

              {/* Active Shipments */}
              <Link
                href="/distributor/shipments"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[10px] xl:text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans ${
                  isActive("/distributor/shipments")
                    ? isLight ? "text-black scale-105" : "text-white scale-105"
                    : isLight ? "text-neutral-600 hover:text-black hover:scale-105" : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                <span>Active Shipments</span>
              </Link>
            </LiquidGlassButton>

            {/* CENTER: Brand Emblem */}
            <div className="relative flex items-center shrink-0 mx-6 xl:mx-10">
              <Link
                href="/distributor/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 select-none transition-transform duration-300 hover:scale-105"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nirvana-emblem.png"
                  alt="Nirvana Emblem"
                  className="w-13 h-13 sm:w-14 sm:h-14 object-contain shrink-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nirvana-smart-chain.png"
                  alt="Nirvana Smart Chain"
                  className="h-9 sm:h-10 w-auto object-contain shrink-0"
                />
              </Link>
            </div>

            {/* RIGHT PILL: Live Tracking, Route Analytics, Wallet, Theme, Exit */}
            <LiquidGlassButton
              as="div"
              className={`flex flex-row items-center gap-3 lg:gap-5 xl:gap-6 !px-5 lg:!px-7 xl:!px-8 !py-3 !rounded-full select-none overflow-visible ${
                isLight
                  ? "border border-neutral-300/80 shadow-md"
                  : "border border-neutral-800/80 shadow-2xl"
              }`}
              variant={isLight ? "light" : "dark"}
              options={{ scale: -80, chroma: 0, mapBlur: 8, border: 0.08 }}
            >
              {/* Live Tracking */}
              <Link
                href="/distributor/tracking"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[10px] xl:text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans ${
                  isActive("/distributor/tracking")
                    ? isLight ? "text-black scale-105" : "text-white scale-105"
                    : isLight ? "text-neutral-600 hover:text-black hover:scale-105" : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                <span>Live Tracking</span>
              </Link>

              {/* Route Analytics */}
              <Link
                href="/distributor/routes"
                onClick={() => setOpen(false)}
                className={`cursor-pointer text-[10px] xl:text-[11px] font-bold transition-all duration-300 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans ${
                  isActive("/distributor/routes")
                    ? isLight ? "text-black scale-105" : "text-white scale-105"
                    : isLight ? "text-neutral-600 hover:text-black hover:scale-105" : "text-white/60 hover:text-white hover:scale-105"
                }`}
              >
                <span>Routes</span>
              </Link>

              {/* Wallet */}
              {walletAddress ? (
                <button
                  type="button"
                  onClick={copyAddress}
                  className={`cursor-pointer text-[10px] xl:text-[11px] font-normal flex items-center gap-1.5 transition-all ${
                    isLight ? "text-neutral-700 hover:text-black" : "text-white/70 hover:text-white"
                  }`}
                  title="Click to copy wallet address"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{copied ? "Copied" : truncateAddress(walletAddress)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className={`cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ${
                    isLight ? "text-neutral-700 hover:text-black" : "text-white/60 hover:text-white"
                  }`}
                  title={isConnecting ? "Connecting to MetaMask..." : "Connect MetaMask Wallet"}
                  aria-label="Connect MetaMask Wallet"
                >
                  <Wallet className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isConnecting ? "animate-spin" : ""}`} />
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`cursor-pointer text-[10px] xl:text-[11px] font-bold transition-all duration-300 flex items-center gap-1 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans hover:scale-110 ${
                  isLight ? "text-neutral-700 hover:text-black" : "text-white/60 hover:text-white"
                }`}
                title={isLight ? "Switch to Dark theme" : "Switch to Light theme"}
              >
                {isLight ? <Moon className="w-3.5 h-3.5 text-neutral-800" /> : <Sun className="w-3.5 h-3.5 text-neutral-300" />}
              </button>

              {/* Exit */}
              <button
                type="button"
                onClick={handleSignOut}
                className="cursor-pointer text-[10px] xl:text-[11px] font-bold text-red-500 hover:text-red-400 hover:scale-105 transition-all duration-300 uppercase tracking-[0.14em] xl:tracking-[0.18em] font-sans flex items-center gap-1"
                title="Sign Out (revokes wallet & logs out)"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Exit</span>
              </button>
            </LiquidGlassButton>

          </div>
        </div>

        {/* ===== TABLET & MOBILE NAVBAR DRAWER ===== */}
        <div
          className="xl:hidden w-full h-full relative z-10 flex items-center justify-center overflow-y-auto py-6 sm:py-10 px-4 sm:px-6"
          onClick={() => {
            setOpen(false);
            setActiveDropdown(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md my-auto transition-all"
          >
            <div
              className={`w-full rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-7 border transition-all duration-300 flex flex-col gap-4 relative select-none backdrop-blur-2xl ${
                isLight
                  ? "bg-white/85 border-neutral-300/80 text-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(0,0,0,0.04)]"
                  : "bg-black/75 border-neutral-800/90 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${isLight ? '0.02' : '0.04'}'/%3E%3C/svg%3E")`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-neutral-200/60 dark:border-neutral-800/80">
                <Link
                  href="/distributor/dashboard"
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
                  className="!p-2.5 !rounded-full cursor-pointer hover:scale-110 transition-transform shrink-0"
                  title="Close Navigation"
                  options={{ scale: -60, chroma: 0, mapBlur: 6, border: 0.08 }}
                >
                  <X className={`w-4 h-4 ${isLight ? "text-neutral-800" : "text-white"}`} />
                </LiquidGlassButton>
              </div>

              {/* Dedicated Wallet Connection Pill */}
              <div className="flex items-center justify-center w-full py-0.5">
                {walletAddress ? (
                  <button
                    type="button"
                    onClick={copyAddress}
                    className={`cursor-pointer text-[11px] sm:text-[12px] font-normal flex items-center gap-1.5 transition-all hover:scale-105 ${
                      isLight ? "text-neutral-700 hover:text-black" : "text-white/70 hover:text-white"
                    }`}
                    title="Click to copy wallet address"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>{copied ? "Copied" : truncateAddress(walletAddress)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className={`cursor-pointer text-[11px] sm:text-[12px] font-sans font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-all hover:scale-105 ${
                      isLight ? "text-neutral-700 hover:text-black" : "text-white/60 hover:text-white"
                    }`}
                    title={isConnecting ? "Connecting to MetaMask..." : "Connect MetaMask Wallet"}
                  >
                    <Wallet className={`w-3.5 h-3.5 ${isConnecting ? "animate-spin" : ""}`} />
                    <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                  </button>
                )}
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col items-center gap-3.5 w-full py-2 text-center font-sans">
                <Link
                  href="/distributor/dashboard"
                  onClick={() => setOpen(false)}
                  className={`w-full py-1 text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                    isActive("/distributor/dashboard")
                      ? isLight ? "text-black scale-105 font-extrabold" : "text-white scale-105 font-extrabold"
                      : isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  href="/distributor/fleet"
                  onClick={() => setOpen(false)}
                  className={`w-full py-1 text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                    isActive("/distributor/fleet")
                      ? isLight ? "text-black scale-105 font-extrabold" : "text-white scale-105 font-extrabold"
                      : isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Fleet & Drivers
                </Link>

                <Link
                  href="/distributor/shipments"
                  onClick={() => setOpen(false)}
                  className={`w-full py-1 text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                    isActive("/distributor/shipments")
                      ? isLight ? "text-black scale-105 font-extrabold" : "text-white scale-105 font-extrabold"
                      : isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Active Shipments
                </Link>

                <Link
                  href="/distributor/tracking"
                  onClick={() => setOpen(false)}
                  className={`w-full py-1 text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                    isActive("/distributor/tracking")
                      ? isLight ? "text-black scale-105 font-extrabold" : "text-white scale-105 font-extrabold"
                      : isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Live Tracking
                </Link>

                <Link
                  href="/distributor/routes"
                  onClick={() => setOpen(false)}
                  className={`w-full py-1 text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 ${
                    isActive("/distributor/routes")
                      ? isLight ? "text-black scale-105 font-extrabold" : "text-white scale-105 font-extrabold"
                      : isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Route Analytics
                </Link>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/80 w-full">
                <LiquidGlassButton
                  as="button"
                  type="button"
                  onClick={toggleTheme}
                  variant={isLight ? "light" : "dark"}
                  className="!py-2 !px-4 sm:!px-5 !rounded-full cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  options={{ scale: -60, chroma: 0, mapBlur: 6, border: 0.08 }}
                >
                  {isLight ? <Moon className="w-3.5 h-3.5 text-neutral-800 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] font-sans">
                    {isLight ? "Dark Mode" : "Light Mode"}
                  </span>
                </LiquidGlassButton>

                <LiquidGlassButton
                  as="button"
                  type="button"
                  onClick={handleSignOut}
                  variant={isLight ? "light" : "dark"}
                  className="!py-2 !px-4 sm:!px-5 !rounded-full cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] transition-all text-red-500 hover:text-red-400 !border-red-500/30"
                  options={{ scale: -60, chroma: 0, mapBlur: 6, border: 0.08 }}
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] font-sans text-red-500">
                    Sign Out
                  </span>
                </LiquidGlassButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
