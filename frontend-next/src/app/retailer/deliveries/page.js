"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import RetailerLayout from "@/components/RetailerLayout";
import TablePagination from "@/components/retailer/TablePagination";
import { TableSkeletonRows, ShipmentsPageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ethers } from "ethers";
import CardTransactionRegistry from "@/contracts/CardTransactionRegistry.json";
import contractConfig from "@/contracts/contractAddress.json";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  X,
  Factory,
  Building2,
  Store,
  Navigation,
  Loader2,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function RetailerDeliveriesPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [walletAddress, setWalletAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingWallet, setConnectingWallet] = useState(false);

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Geolocation Live Tracking Modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Copied address tooltip
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "info") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 6000);
  };

  const contractAddress = contractConfig?.registryAddress || "0x0a7Afd6846052D1C96202B72F7Bc0DF93B3912d7";

  // Check wallet and initialize
  useEffect(() => {
    const initWalletAndContract = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            const checksum = ethers.getAddress(accounts[0]);
            setWalletAddress(checksum);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(checksum);
            const registryContract = new ethers.Contract(
              contractAddress,
              CardTransactionRegistry.abi,
              signer
            );
            setContract(registryContract);
          }
        } catch (e) {
          console.warn("Wallet initialization check error:", e);
        }
      }
      setLoading(false);
    };

    initWalletAndContract();

    // Listen to MetaMask account switches
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts && accounts.length > 0) {
          try {
            const checksum = ethers.getAddress(accounts[0]);
            setWalletAddress(checksum);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(checksum);
            const registryContract = new ethers.Contract(
              contractAddress,
              CardTransactionRegistry.abi,
              signer
            );
            setContract(registryContract);
          } catch (e) {
            console.error("Account change handling error:", e);
          }
        } else {
          setWalletAddress(null);
          setContract(null);
          setAllTransactions([]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    }
  }, [contractAddress]);

  // Fetch transactions from Smart Contract strictly matching the connected retailer
  useEffect(() => {
    const fetchContractTransactions = async () => {
      if (!contract || !walletAddress) {
        setAllTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [cardIds, strhash, statuses] = await contract.getAllTransactions();
        const formatted = [];

        for (let i = 0; i < cardIds.length; i++) {
          const rawHash = strhash[i] || "";
          const retailerAddr = rawHash.slice(84, 126).trim();

          // STRICT MATCH: Only include if the connected MetaMask address matches this shipment's retailer address!
          if (retailerAddr && retailerAddr.toLowerCase() === walletAddress.toLowerCase()) {
            formatted.push({
              cardId: cardIds[i],
              receiverAddressM: rawHash.slice(0, 42).trim(),
              receiverAddressW: rawHash.slice(42, 84).trim(),
              receiverAddressR: retailerAddr,
              date: rawHash.slice(126, 136).trim(),
              status: statuses[i] || "PENDING",
            });
          }
        }

        // Set exactly what was found for this connected wallet.
        // If a different address is connected that has no shipments, formatted is [] and it shows NOTHING!
        setAllTransactions(formatted);
      } catch (err) {
        console.error("Smart contract transaction query error:", err);
        setAllTransactions([]);
        showToast("Error retrieving on-chain transactions from smart contract.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchContractTransactions();
  }, [contract, walletAddress]);

  // Connect wallet button handler
  const handleConnectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setConnectingWallet(true);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          const checksum = ethers.getAddress(accounts[0]);
          setWalletAddress(checksum);

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner(checksum);
          const registryContract = new ethers.Contract(
            contractAddress,
            CardTransactionRegistry.abi,
            signer
          );
          setContract(registryContract);
          showToast(`Wallet connected: ${truncateAddress(checksum)}`, "success");
        }
      } catch (err) {
        console.error("MetaMask connect error:", err);
        showToast("Wallet connection was rejected or failed.", "error");
      } finally {
        setConnectingWallet(false);
      }
    } else {
      showToast("MetaMask was not detected in your browser.", "error");
    }
  };

  const copyToClipboard = (text, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  const isAddressValid = (addr) => {
    if (!addr) return false;
    const cleaned = addr.trim().toLowerCase();
    if (cleaned === "" || cleaned === "n/a" || cleaned === "null" || cleaned === "undefined") return false;
    if (cleaned === "0x0000000000000000000000000000000000000000") return false;
    if (cleaned.replace(/^0x/, "").replace(/0/g, "") === "") return false;
    return true;
  };

  const truncateAddress = (addr) => {
    if (!isAddressValid(addr)) return "N/A";
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Live Geolocation Tracking navigation handler
  const handleOpenLiveTracking = async (shipment) => {
    try {
      const cartId = shipment.cardId;
      const mAddr = (shipment.receiverAddressM || "").trim();
      const wAddr = (shipment.receiverAddressW || "").trim();
      const rAddr = (shipment.receiverAddressR || "").trim();

      if (!cartId || (!mAddr && !wAddr && !rAddr)) {
        showToast("Insufficient address data for live tracking.", "warning");
        return;
      }

      showToast(`Initiating telematics for Cart #${cartId}...`, "info");

      // Query coordinates to pass as props / query params
      let startLoc = "";
      let checkLoc = "";
      let destLoc = "";

      try {
        const response = await fetch(
          `${API_BASE}/get_lats_longs?cart_id=${encodeURIComponent(cartId)}&manufacturer_address=${encodeURIComponent(mAddr)}&wholesaler_address=${encodeURIComponent(wAddr)}&retailer_address=${encodeURIComponent(rAddr)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.ok) {
          const locData = await response.json();
          const formatCoords = (location, latKey, longKey) => {
            if (location && location[latKey] && location[longKey]) {
              const lat = parseFloat(location[latKey]);
              const lng = parseFloat(location[longKey]);
              if (!isNaN(lat) && !isNaN(lng)) {
                return `${lat}, ${lng}`;
              }
            }
            return "";
          };

          startLoc = formatCoords(locData.manufacturer, "manufacturer_lat", "manufacturer_long");
          checkLoc = formatCoords(locData.wholesaler, "wholesaler_lat", "wholesaler_long");
          destLoc = formatCoords(locData.retailer, "retailer_lat", "retailer_long");
        }
      } catch (locErr) {
        console.warn("Pre-fetch coordinates warning:", locErr);
      }

      // Redirect to /geolocation with all values passed as query parameters
      const params = new URLSearchParams({
        cartId: cartId,
        userId: userId || "",
        userRole: "retailer",
      });

      if (isAddressValid(mAddr)) params.set("mAddr", mAddr);
      if (isAddressValid(wAddr)) params.set("wAddr", wAddr);
      if (isAddressValid(rAddr)) params.set("rAddr", rAddr);
      if (startLoc && isAddressValid(mAddr)) params.set("startLocation", startLoc);
      if (checkLoc && isAddressValid(wAddr)) params.set("checkpoint", checkLoc);
      if (destLoc && isAddressValid(rAddr)) params.set("destination", destLoc);

      router.push(`/Geolocation?${params.toString()}`);
    } catch (e) {
      console.error("Live tracking redirect error:", e);
      router.push(`/Geolocation?cartId=${encodeURIComponent(shipment.cardId)}&userId=${encodeURIComponent(userId || "")}&userRole=retailer`);
    }
  };

  // "Add Cart" to inventory handler
  const handleAddCartToInventory = async (shipment) => {
    try {
      const cartId = shipment.cardId;
      const mAddr = shipment.receiverAddressM?.trim();
      const wAddr = shipment.receiverAddressW?.trim();

      const isWholesalerPresent = wAddr && wAddr.length > 0 && wAddr !== " ".repeat(42);
      const isManufacturerPresent = mAddr && mAddr.length > 0 && mAddr !== " ".repeat(42);

      let endpoint = `${API_BASE}/addCartToProducts`;
      if (isWholesalerPresent) {
        endpoint = `${API_BASE}/addCartToProductsWholeInventory`;
      } else if (!isManufacturerPresent) {
        showToast("Neither manufacturer nor wholesaler address found in shipment record.", "error");
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_id: cartId,
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.inserted_product_ids) {
        showToast(`Successfully added ${data.inserted_product_ids.length} medicines from Cart #${cartId} to your inventory!`, "success");
      } else {
        showToast(data.message || data.error || `Failed to add Cart #${cartId} medicines to inventory.`, "error");
      }
    } catch (err) {
      console.error("Add cart API error:", err);
      showToast(`Network error communicating with inventory server for Cart #${shipment.cardId}.`, "error");
    }
  };

  // Format status in human-readable sentence case
  const formatStatusDisplay = (status) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING":
        return "Pending";
      case "IN_TRANSIT_WHOLESALER":
        return "In transit to wholesaler";
      case "WHOLESALER_RECEIVED":
        return "Received by wholesaler";
      case "IN_TRANSIT_RETAILER":
        return "In transit to retailer";
      case "DELIVERED":
        return "Delivered";
      default:
        if (!status) return "Pending";
        return status
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Filtered shipments
  const filteredShipments = allTransactions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.cardId || "").toLowerCase().includes(q) ||
      (s.receiverAddressM || "").toLowerCase().includes(q) ||
      (s.receiverAddressW || "").toLowerCase().includes(q) ||
      (s.date || "").includes(q)
    );
  });

  const PAGE_SIZE = 6;
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredShipments.slice(start, start + PAGE_SIZE);
  }, [filteredShipments, currentPage]);

  return (
    <RetailerLayout
      title="Shipment Deliveries & Tracking"
      subtitle="Track your incoming pharmaceutical shipments live on the blockchain from manufacturer to wholesaler and your dispensary."
      badge="Live Shipments"
    >
      {loading ? (
        <ShipmentsPageSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-8">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-300 ${
              toastMessage.type === "success"
                ? isLight
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-black border-white"
                : toastMessage.type === "error"
                ? isLight
                  ? "bg-neutral-100 text-neutral-900 border-neutral-300"
                  : "bg-[#181a22] text-neutral-200 border-neutral-700"
                : isLight
                ? "bg-neutral-50 text-neutral-800 border-neutral-200"
                : "bg-[#13141a] text-neutral-200 border-neutral-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage.msg}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="underline text-xs cursor-pointer">
              Close
            </button>
          </div>
        )}

        {/* Web3 Wallet Header Card */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isLight ? "text-neutral-700" : "text-neutral-300"}`} />
              <h3 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Smart Contract Registry Status
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Contract Address:{" "}
              <span className="font-medium">{truncateAddress(contractAddress)}</span> &bull; Verified ledger events
            </p>
          </div>

          <div className="flex items-center gap-3">
            {walletAddress ? (
              <div
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900"
                    : "bg-[#13141a] border-neutral-800 text-white"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{truncateAddress(walletAddress)}</span>
                <button
                  onClick={() => copyToClipboard(walletAddress, "wallet-head")}
                  title="Copy address"
                  className="p-1 hover:text-neutral-400 cursor-pointer"
                >
                  {copiedAddress === "wallet-head" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={connectingWallet}
                className={`h-9 px-5 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Connect MetaMask
              </button>
            )}
          </div>
        </div>

        {/* Shipments Table Container */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-7 space-y-6`}
        >
          {/* Table Header: Title & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <h3 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Shipment Consignments
              </h3>
              <p className="text-xs text-neutral-400">
                Verified on-chain registry logs &bull; {filteredShipments.length} total shipments
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Cart ID or date..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-400"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-700"
                }`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isLight ? "bg-neutral-50/80 border-neutral-200 text-neutral-500" : "bg-[#14151a] text-neutral-400 border-neutral-800"}`}>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Cart ID</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Date</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Manufacturer</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Wholesaler Hub</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {loading ? (
                  <TableSkeletonRows columns={6} rows={6} isLight={isLight} />
                ) : !walletAddress ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center space-y-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${
                        isLight ? "bg-neutral-100 border-neutral-300 text-neutral-600" : "bg-[#16171d] border-neutral-700 text-neutral-400"
                      }`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className={`text-sm font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                        MetaMask Not Connected
                      </div>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto">
                        Connect your dispensary&apos;s registered MetaMask wallet to inspect live on-chain shipment records from the genesis contract.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleConnectWallet}
                          disabled={connectingWallet}
                          className={`h-9 px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
                            isLight
                              ? "bg-neutral-900 hover:bg-black text-white"
                              : "bg-white hover:bg-neutral-200 text-black"
                          }`}
                        >
                          {connectingWallet ? "Connecting..." : "Connect MetaMask"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : allTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center space-y-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${
                        isLight ? "bg-neutral-100 border-neutral-300 text-neutral-600" : "bg-[#16171d] border-neutral-700 text-neutral-400"
                      }`}>
                        <ShieldCheck className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div className={`text-sm font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                        No Shipments Found for Connected Wallet
                      </div>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                        The currently connected wallet (<span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>{truncateAddress(walletAddress)}</span>) is not listed as the retailer recipient on any shipments in the registry contract. Please switch to your dispensary&apos;s authorized retailer wallet in MetaMask to view your shipments.
                      </p>
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                      No shipments matching your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedShipments.map((shipment, index) => {
                    const isDelivered = (shipment.status || "").toUpperCase() === "DELIVERED";

                    return (
                      <tr
                        key={shipment.cardId || index}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-[#13141a]"
                        }`}
                      >
                        {/* Cart ID */}
                        <td className="py-4 px-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                              #{shipment.cardId}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-3 text-neutral-400">
                          {shipment.date || "—"}
                        </td>

                        {/* Manufacturer Address */}
                        <td className="py-4 px-3">
                          {isAddressValid(shipment.receiverAddressM) ? (
                            <div className="flex items-center gap-1.5">
                              <span>{truncateAddress(shipment.receiverAddressM)}</span>
                              <button
                                onClick={() => copyToClipboard(shipment.receiverAddressM, `m-${shipment.cardId}`)}
                                className="text-neutral-400 hover:text-white cursor-pointer"
                                title="Copy manufacturer address"
                              >
                                {copiedAddress === `m-${shipment.cardId}` ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-neutral-500 font-mono text-xs">N/A</span>
                          )}
                        </td>

                        {/* Wholesaler Hub Address */}
                        <td className="py-4 px-3">
                          {isAddressValid(shipment.receiverAddressW) ? (
                            <div className="flex items-center gap-1.5">
                              <span>{truncateAddress(shipment.receiverAddressW)}</span>
                              <button
                                onClick={() => copyToClipboard(shipment.receiverAddressW, `w-${shipment.cardId}`)}
                                className="text-neutral-400 hover:text-white cursor-pointer"
                                title="Copy wholesaler address"
                              >
                                {copiedAddress === `w-${shipment.cardId}` ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-neutral-500 font-mono text-xs">N/A</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 border ${
                              (shipment.status || "").toUpperCase() === "DELIVERED"
                                ? isLight
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                                : (shipment.status || "").toUpperCase() === "IN_TRANSIT_RETAILER"
                                ? isLight
                                  ? "bg-blue-50 text-blue-700 border-blue-300"
                                  : "bg-blue-950/60 text-blue-400 border-blue-800/80"
                                : (shipment.status || "").toUpperCase() === "WHOLESALER_RECEIVED"
                                ? isLight
                                  ? "bg-purple-50 text-purple-700 border-purple-300"
                                  : "bg-purple-950/60 text-purple-400 border-purple-800/80"
                                : (shipment.status || "").toUpperCase() === "IN_TRANSIT_WHOLESALER"
                                ? isLight
                                  ? "bg-cyan-50 text-cyan-700 border-cyan-300"
                                  : "bg-cyan-950/60 text-cyan-400 border-cyan-800/80"
                                : isLight
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "bg-amber-950/60 text-amber-400 border-amber-800/80"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                (shipment.status || "").toUpperCase() === "DELIVERED"
                                  ? "bg-emerald-500"
                                  : (shipment.status || "").toUpperCase() === "IN_TRANSIT_RETAILER"
                                  ? "bg-blue-500"
                                  : (shipment.status || "").toUpperCase() === "WHOLESALER_RECEIVED"
                                  ? "bg-purple-500"
                                  : (shipment.status || "").toUpperCase() === "IN_TRANSIT_WHOLESALER"
                                  ? "bg-cyan-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {formatStatusDisplay(shipment.status)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* Live Tracking Modal Button */}
                            <button
                              onClick={() => handleOpenLiveTracking(shipment)}
                              className={`h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                isLight
                                  ? "bg-neutral-900 hover:bg-black text-white"
                                  : "bg-white hover:bg-neutral-200 text-black"
                              }`}
                            >
                              Live Tracking
                            </button>

                            {/* Add Cart to Products Inventory */}
                            <button
                              onClick={() => handleAddCartToInventory(shipment)}
                              disabled={!isDelivered}
                              title={isDelivered ? "Add medicines to dispensary stock" : "Available once package is delivered"}
                              className={`h-8 px-4 rounded-full text-xs font-semibold transition-all ${
                                isDelivered
                                  ? isLight
                                    ? "bg-neutral-900 hover:bg-black text-white cursor-pointer shadow-sm"
                                    : "bg-white hover:bg-neutral-200 text-black cursor-pointer shadow-sm"
                                  : isLight
                                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : "bg-[#181a22] text-neutral-600 border border-neutral-800 cursor-not-allowed"
                              }`}
                            >
                              Add to Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredShipments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            isLight={isLight}
          />
        </div>
      </div>
      )}

      {/* Live Geolocation Route Tracking Modal */}
      {trackingModalOpen && selectedShipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setTrackingModalOpen(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border ${
              isLight
                ? "bg-white border-neutral-200 text-neutral-900 shadow-2xl"
                : "bg-[#0d0e12] border-neutral-800 text-white shadow-[0_24px_60px_rgba(0,0,0,0.9)]"
            } p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between gap-4 border-b ${isLight ? "border-neutral-200" : "border-neutral-800/80"} pb-4`}>
              <div className="space-y-1">
                <span className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border font-medium ${
                  isLight ? "text-neutral-800 bg-neutral-100 border-neutral-300" : "bg-[#16171d] text-neutral-200 border-neutral-700/60"
                }`}>
                  Live Shipment Telematics
                </span>
                <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Tracking Cart #{selectedShipment.cardId}
                </h3>
                <p className="text-xs text-neutral-400">
                  Current Status: <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>{formatStatusDisplay(selectedShipment.status)}</span>
                </p>
              </div>

              <button
                onClick={() => setTrackingModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? "text-neutral-500 hover:text-black hover:bg-neutral-100" : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Waypoints & Coordinates */}
            {locLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                <p className="text-xs text-neutral-400">Fetching live geolocation coordinates...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Waypoint Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Origin: Manufacturer */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#13141a] border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-neutral-400" />
                      <span className="text-[10px] font-semibold uppercase text-neutral-400">1. Origin</span>
                    </div>
                    <div className={`font-semibold text-xs ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Manufacturer Facility
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {locationData?.manufacturer?.manufacturer_lat
                        ? `${locationData.manufacturer.manufacturer_lat}, ${locationData.manufacturer.manufacturer_long}`
                        : "Coordinates not available"}
                    </div>
                    <span className="text-[10px] text-emerald-500 font-medium block">Dispatched &bull; Verified</span>
                  </div>

                  {/* Checkpoint: Wholesaler */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#13141a] border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      <span className="text-[10px] font-semibold uppercase text-neutral-400">2. Waypoint</span>
                    </div>
                    <div className={`font-semibold text-xs ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Wholesale Hub
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {locationData?.wholesaler?.wholesaler_lat
                        ? `${locationData.wholesaler.wholesaler_lat}, ${locationData.wholesaler.wholesaler_long}`
                        : "Coordinates not available"}
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium block">Depot Processing</span>
                  </div>

                  {/* Destination: Retailer */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#13141a] border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-neutral-400" />
                      <span className="text-[10px] font-semibold uppercase text-neutral-400">3. Destination</span>
                    </div>
                    <div className={`font-semibold text-xs ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Your Pharmacy
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {locationData?.retailer?.retailer_lat
                        ? `${locationData.retailer.retailer_lat}, ${locationData.retailer.retailer_long}`
                        : "Coordinates not available"}
                    </div>
                    <span className="text-[10px] font-medium block text-neutral-400">Dispensary Delivery</span>
                  </div>
                </div>

                {/* Live Shipment Details Card */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#111217] border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="font-semibold">Shipment Details &amp; Telematics</span>
                    </div>
                    <span className="text-neutral-400 text-[11px]">Cart #{selectedShipment.cardId}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className={`p-2.5 rounded-xl border ${isLight ? "bg-white border-neutral-200" : "bg-[#16171d] border-neutral-800"}`}>
                      <div className="text-[10px] text-neutral-400">Current Status</div>
                      <div className="font-semibold text-emerald-500">{formatStatusDisplay(selectedShipment.status)}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isLight ? "bg-white border-neutral-200" : "bg-[#16171d] border-neutral-800"}`}>
                      <div className="text-[10px] text-neutral-400">Date Logged</div>
                      <div className="font-semibold">{selectedShipment.date || "—"}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isLight ? "bg-white border-neutral-200" : "bg-[#16171d] border-neutral-800"}`}>
                      <div className="text-[10px] text-neutral-400">Dispensary Recipient</div>
                      <div className="font-semibold">{truncateAddress(selectedShipment.receiverAddressR)}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isLight ? "bg-white border-neutral-200" : "bg-[#16171d] border-neutral-800"}`}>
                      <div className="text-[10px] text-neutral-400">Registry Source</div>
                      <div className="font-semibold">Smart Contract</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTrackingModalOpen(false)}
                className={`h-9 px-5 rounded-full text-xs sm:text-[14px] font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </RetailerLayout>
  );
}
