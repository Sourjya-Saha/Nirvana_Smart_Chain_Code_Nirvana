"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import axios from "axios";
import NirvanaTokenABI from "@/contracts/NirvanaToken.json";
import contractConfig from "@/contracts/contractAddress.json";
import { useTheme } from "@/context/ThemeContext";
import AdminLayout from "@/components/AdminLayout";
import TablePagination from "@/components/retailer/TablePagination";
import {
  ShieldCheck,
  Coins,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wallet,
  Copy,
  Check,
  Search,
  RefreshCw,
  Activity,
  Layers,
  LogOut,
  Loader2,
  ArrowRight,
  Clock,
  Globe,
  TrendingUp,
  UserCheck,
  Hash,
} from "lucide-react";

// Admin address that has exclusive access
const ADMIN_ADDRESS =
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "0xB2bA65deF35CB5c8769b2f802692D1E227318db7";
const TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ||
  contractConfig?.tokenAddress ||
  "0xc905e61E2a5DD4CEE5a62b8b2ef16F910D7CCC64";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  // Auth & Web3 States
  const [walletAddress, setWalletAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenContract, setTokenContract] = useState(null);
  const [networkInfo, setNetworkInfo] = useState({ name: "", chainId: "" });

  // Whitelist States
  const [addressToWhitelist, setAddressToWhitelist] = useState("");
  const [addressToCheck, setAddressToCheck] = useState("");
  const [isAddressWhitelisted, setIsAddressWhitelisted] = useState(null);

  // Transfer States
  const [tokenAmount, setTokenAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  // Notification & Feedback States
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  // Data & Table States
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all"); // 'all' | 'whitelisted' | 'not_whitelisted'
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PAGE_SIZE = 8;
  const [balances, setBalances] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalWhitelisted: 0,
    totalNotWhitelisted: 0,
    totalSupply: "0",
    adminBalance: "0",
  });

  // Sub-navigation tabs definition
  const tabs = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: Activity },
      { id: "whitelist", label: "Whitelist", icon: ShieldCheck },
      { id: "tokens", label: "Treasury", icon: Coins },
      { id: "users", label: `Stakeholders (${allUsers.length})`, icon: Users },
      { id: "tokenlist", label: "Token List", icon: Layers },
    ],
    [allUsers.length]
  );

  // Copy helper with visual feedback
  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey("");
    }, 2000);
  };

  // Gas override utility
  const getLegacyOverrides = async (contract, gasLimit = 300000) => {
    const provider = contract?.runner?.provider;
    const fallbackGasPrice = ethers.parseUnits("30", "gwei");

    let gasPrice = fallbackGasPrice;

    try {
      if (provider?.getFeeData) {
        const feeData = await provider.getFeeData();
        if (feeData?.gasPrice) gasPrice = feeData.gasPrice;
      }
    } catch (e) {
      console.warn("getFeeData failed, using fallback gas price", e);
    }

    return { gasLimit, gasPrice };
  };

  // Load contract with signer
  const loadContract = async (address) => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(address);

        const abi = NirvanaTokenABI.abi || NirvanaTokenABI;
        const nirvanaToken = new ethers.Contract(TOKEN_ADDRESS, abi, signer);

        setTokenContract(nirvanaToken);
        setErrorMessage("");
        return nirvanaToken;
      } catch (error) {
        console.error("Error loading contract:", error);
        setErrorMessage("Failed to load token contract: " + (error.message || "Unknown error"));
        return null;
      }
    }
  };

  // Fetch Network Info
  const fetchNetworkInfo = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const networkName = network.name === "homestead" ? "Ethereum Mainnet" : network.name;
        setNetworkInfo({
          name: networkName.charAt(0).toUpperCase() + networkName.slice(1),
          chainId: network.chainId.toString(),
        });
      } catch (error) {
        console.error("Error fetching network info:", error);
      }
    }
  };

  // Fetch Stats
  const fetchStats = useCallback(
    async (currentWallet = walletAddress) => {
      if (!tokenContract || !isAdmin) return;

      try {
        setIsLoading(true);

        const response = await axios.get(`${API_BASE}/api/get_all_users`);
        const users = response.data?.users || [];

        let totalWhitelisted = 0;
        let totalNotWhitelisted = 0;

        for (const user of users) {
          if (!ethers.isAddress(user.metamask_add)) continue;

          try {
            const isWhitelisted = await tokenContract.isWhitelisted(user.metamask_add);
            if (isWhitelisted) totalWhitelisted++;
            else totalNotWhitelisted++;
          } catch (err) {
            console.warn("Whitelist check failed for", user.metamask_add);
          }
        }

        const totalSupply = await tokenContract.totalSupply();
        const formattedSupply = ethers.formatUnits(totalSupply, 18);

        const adminBal = await tokenContract.balanceOf(ADMIN_ADDRESS);
        const formattedBalance = ethers.formatUnits(adminBal, 18);

        setStats({
          totalWhitelisted,
          totalNotWhitelisted,
          totalSupply: parseFloat(formattedSupply).toFixed(2),
          adminBalance: parseFloat(formattedBalance).toFixed(2),
        });
      } catch (error) {
        console.error("Stats error:", error);
        const msg = error?.response?.data?.error || error?.message || "Failed to fetch stats";
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [tokenContract, isAdmin, walletAddress]
  );

  // Fetch All Users & Balances
  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin || !tokenContract) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE}/api/get_all_users`);

      if (response.status === 200) {
        const users = response.data?.users || [];

        const enhancedUsersPromises = users.map(async (user) => {
          let isWhitelisted = false;
          let balance = "0";

          if (ethers.isAddress(user.metamask_add)) {
            try {
              isWhitelisted = await tokenContract.isWhitelisted(user.metamask_add);
              const rawBalance = await tokenContract.balanceOf(user.metamask_add);
              balance = ethers.formatUnits(rawBalance, 18);
            } catch (error) {
              console.error(`Error fetching data for ${user.metamask_add}:`, error);
            }
          }

          return {
            ...user,
            isWhitelisted,
            balance,
          };
        });

        const enhancedUsers = await Promise.all(enhancedUsersPromises);
        setAllUsers(enhancedUsers);

        const balanceMap = {};
        enhancedUsers.forEach((user) => {
          if (user.metamask_add) {
            balanceMap[user.metamask_add] = user.balance;
          }
        });
        setBalances(balanceMap);
      } else {
        setErrorMessage("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to fetch users: " + (error.response?.data?.error || error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, tokenContract]);

  // Check initial wallet connection
  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          const checksumAddress = ethers.getAddress(accounts[0]);
          setWalletAddress(checksumAddress);

          if (checksumAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
            await loadContract(checksumAddress);
          } else {
            setIsAdmin(false);
            setErrorMessage("Access denied: You are not authorized to use this admin panel.");
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (!accounts || accounts.length === 0) {
      setWalletAddress(null);
      setIsAdmin(false);
      setTokenContract(null);
    } else {
      const checksumAddress = ethers.getAddress(accounts[0]);
      setWalletAddress(checksumAddress);

      if (checksumAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
        setIsAdmin(true);
        await loadContract(checksumAddress);
      } else {
        setIsAdmin(false);
        setErrorMessage("Access denied: You are not authorized to use this admin panel.");
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setIsLoading(true);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const checksumAddress = ethers.getAddress(accounts[0]);
        setWalletAddress(checksumAddress);

        if (checksumAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
          setIsAdmin(true);
          await loadContract(checksumAddress);
        } else {
          setIsAdmin(false);
          setErrorMessage("Access denied: You are not authorized to use this admin panel.");
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        setErrorMessage("Failed to connect wallet: " + (error.message || "Unknown error"));
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage("MetaMask is not detected. Please install MetaMask to access this administrative portal.");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsAdmin(false);
    setTokenContract(null);
    setSuccessMessage("Admin wallet disconnected.");
  };

  // Add to Whitelist
  const addToWhitelist = async (addressToAdd = addressToWhitelist) => {
    if (!tokenContract || !isAdmin) return;
    if (!ethers.isAddress(addressToAdd)) {
      setErrorMessage("Invalid Ethereum address provided.");
      return;
    }

    try {
      setActionInProgress(`whitelist_${addressToAdd}`);
      setErrorMessage("");
      setSuccessMessage("");

      await tokenContract.addToWhitelist.staticCall(addressToAdd);
      const overrides = await getLegacyOverrides(tokenContract, 300000);
      const tx = await tokenContract.addToWhitelist(addressToAdd, overrides);

      setSuccessMessage(`Transaction broadcast: Whitelisting ${addressToAdd.slice(0, 8)}...`);
      await tx.wait();

      setSuccessMessage(`Address ${addressToAdd.slice(0, 8)}...${addressToAdd.slice(-6)} successfully whitelisted!`);
      if (addressToAdd === addressToWhitelist) setAddressToWhitelist("");

      if (addressToCheck && addressToCheck.toLowerCase() === addressToAdd.toLowerCase()) {
        setIsAddressWhitelisted(true);
      }

      await fetchStats(walletAddress);
      await fetchAllUsers();
    } catch (error) {
      console.error("Whitelist error:", error);
      setErrorMessage(error.reason || error.message || "Failed to whitelist address.");
    } finally {
      setActionInProgress("");
    }
  };

  // Remove from Whitelist
  const removeFromWhitelist = async (address) => {
    if (!tokenContract || !isAdmin) return;

    try {
      setActionInProgress(`unwhitelist_${address}`);
      setErrorMessage("");
      setSuccessMessage("");

      await tokenContract.removeFromWhitelist.staticCall(address);
      const overrides = await getLegacyOverrides(tokenContract, 300000);
      const tx = await tokenContract.removeFromWhitelist(address, overrides);

      setSuccessMessage(`Transaction broadcast: Revoking whitelist for ${address.slice(0, 8)}...`);
      await tx.wait();

      setSuccessMessage(`Address ${address.slice(0, 8)}...${address.slice(-6)} removed from whitelist.`);

      if (addressToCheck && addressToCheck.toLowerCase() === address.toLowerCase()) {
        setIsAddressWhitelisted(false);
      }

      await fetchStats(walletAddress);
      await fetchAllUsers();
    } catch (error) {
      console.error("Error removing from whitelist:", error);
      setErrorMessage("Failed to remove from whitelist: " + (error.reason || error.message || "Unknown error"));
    } finally {
      setActionInProgress("");
    }
  };

  // Check Whitelist Status
  const checkWhitelistStatus = async () => {
    if (!tokenContract) return;
    if (!ethers.isAddress(addressToCheck)) {
      setErrorMessage("Invalid Ethereum address entered for verification.");
      return;
    }

    try {
      setActionInProgress("check_status");
      setErrorMessage("");

      const isWhitelisted = await tokenContract.isWhitelisted(addressToCheck);
      setIsAddressWhitelisted(isWhitelisted);
    } catch (error) {
      console.error("Error checking whitelist status:", error);
      setErrorMessage("Failed to check whitelist status: " + (error.message || "Unknown error"));
    } finally {
      setActionInProgress("");
    }
  };

  // Send Tokens
  const sendTokens = async () => {
    if (!tokenContract || !isAdmin) return;

    if (!ethers.isAddress(recipientAddress)) {
      setErrorMessage("Please specify a valid Ethereum recipient address.");
      return;
    }

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setErrorMessage("Please specify a positive NSC token amount.");
      return;
    }

    try {
      setActionInProgress("send_tokens");
      setErrorMessage("");
      setSuccessMessage("");

      const amountInWei = ethers.parseUnits(tokenAmount, 18);

      const isWhitelisted = await tokenContract.isWhitelisted(recipientAddress);
      if (!isWhitelisted) {
        setErrorMessage("Transfer rejected: Recipient address is not whitelisted.");
        return;
      }

      const adminBal = await tokenContract.balanceOf(walletAddress);
      if (adminBal < amountInWei) {
        setErrorMessage(
          `Insufficient treasury balance. You have ${ethers.formatUnits(adminBal, 18)} NSC available.`
        );
        return;
      }

      await tokenContract.transfer.staticCall(recipientAddress, amountInWei);
      const overrides = await getLegacyOverrides(tokenContract, 300000);
      const tx = await tokenContract.transfer(recipientAddress, amountInWei, overrides);

      setSuccessMessage(`Transaction broadcast: Dispatching ${tokenAmount} NSC...`);
      await tx.wait();

      setSuccessMessage(
        `Successfully transferred ${tokenAmount} NSC to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}!`
      );

      setTokenAmount("");
      setRecipientAddress("");

      await fetchStats(walletAddress);
      await fetchAllUsers();
    } catch (error) {
      console.error("Token transfer error:", error);
      const msg =
        error?.reason ||
        error?.shortMessage ||
        error?.info?.error?.message ||
        error?.message ||
        "Transfer transaction failed";
      setErrorMessage(msg);
    } finally {
      setActionInProgress("");
    }
  };

  // Initial wallet check on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkWalletConnection();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when contract or admin state changes
  useEffect(() => {
    if (tokenContract && isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNetworkInfo();
      fetchStats();
      fetchAllUsers();
    }
  }, [tokenContract, isAdmin, fetchStats, fetchAllUsers]);

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (userFilter === "whitelisted") {
      list = list.filter((u) => u.isWhitelisted);
    } else if (userFilter === "not_whitelisted") {
      list = list.filter((u) => !u.isWhitelisted);
    }

    if (!userSearch.trim()) return list;
    const q = userSearch.toLowerCase().trim();
    return list.filter(
      (u) =>
        String(u.user_id || "").toLowerCase().includes(q) ||
        String(u.generated_unique_id || "").toLowerCase().includes(q) ||
        String(u.metamask_add || "").toLowerCase().includes(q)
    );
  }, [allUsers, userSearch, userFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * USERS_PAGE_SIZE;
    return filteredUsers.slice(start, start + USERS_PAGE_SIZE);
  }, [filteredUsers, usersPage]);

  const whitelistedUsers = useMemo(() => {
    return allUsers.filter((u) => u.isWhitelisted);
  }, [allUsers]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 10000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 8000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // ─────────────────────────────────────────────────────────────
  // RENDER: State 1 - Wallet Not Connected (Cloned Retailer Frame)
  // ─────────────────────────────────────────────────────────────
  if (!walletAddress) {
    return (
      <AdminLayout
        title="Administrative Portal"
        subtitle="Connect your authorized cryptographic key to configure supply chain whitelists, monitor treasury reserves, and dispatch NSC tokens."
        badge="NSC Governance"
        walletAddress={null}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        networkInfo={networkInfo}
      >
        <div className="flex items-center justify-center py-10 sm:py-16">
          <div
            className={`w-full max-w-lg rounded-3xl border p-8 sm:p-10 text-center space-y-6 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-xl"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_24px_48px_rgba(0,0,0,0.8)]"
            }`}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center p-2.5 shadow-lg">
              <Image src="/nsc_logo.png" alt="NSC" width={48} height={48} className="w-full h-full object-contain" unoptimized />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                Governance Protocol
              </span>
              <h2 className={`font-editorial text-2xl sm:text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Connect Admin Wallet
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Connect your authorized administrative key to configure supply chain whitelists, monitor treasury reserves,
                and dispatch NSC tokens.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={connectWallet}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isLight ? "bg-black hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"
              } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Web3...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Connect MetaMask Wallet</span>
                </>
              )}
            </button>

            <div className={`p-3 rounded-xl border text-[11px] font-mono break-all text-neutral-500 ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14151a] border-neutral-800"}`}>
              Required Admin Key: {ADMIN_ADDRESS}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: State 2 - Unauthorized Account (Cloned Retailer Frame)
  // ─────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <AdminLayout
        title="Access Restricted"
        subtitle="The currently connected wallet does not hold administrative authority over the NSC Token Contract."
        badge="Unauthorized Account"
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        networkInfo={networkInfo}
      >
        <div className="flex items-center justify-center py-10 sm:py-16">
          <div
            className={`w-full max-w-lg rounded-3xl border p-8 sm:p-10 text-center space-y-6 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-xl"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_24px_48px_rgba(0,0,0,0.8)]"
            }`}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center p-2.5 shadow-lg">
              <Image src="/nsc_logo.png" alt="NSC" width={48} height={48} className="w-full h-full object-contain opacity-50 grayscale" unoptimized />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400">
                Unauthorized Account
              </span>
              <h2 className={`font-editorial text-2xl sm:text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Administrative Rights Required
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                The account currently active in MetaMask is not registered as the NSC Token Contract administrator.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border text-xs font-mono break-all text-neutral-400 ${
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"
              }`}
            >
              Connected: {walletAddress}
            </div>

            <button
              type="button"
              onClick={disconnectWallet}
              className={`w-full py-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isLight ? "bg-neutral-900 hover:bg-black text-white" : "bg-white hover:bg-neutral-200 text-black"
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect & Switch Account</span>
            </button>

            <div className={`p-3 rounded-xl border text-[11px] font-mono break-all text-neutral-500 ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14151a] border-neutral-800"}`}>
              Required Admin Key: {ADMIN_ADDRESS}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: State 3 - Authorized Admin Console (Exact Retailer UI Clone)
  // ─────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      title="Token Administration"
      subtitle="Manage stakeholder whitelist permissions, track live smart contract metrics, and execute reserve token allocations with automated gas handling."
      badge="NSC Governance Node"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={tabs}
      walletAddress={walletAddress}
      connectWallet={connectWallet}
      disconnectWallet={disconnectWallet}
      networkInfo={networkInfo}
      actions={
        <button
          type="button"
          onClick={() => {
            fetchStats();
            fetchAllUsers();
            fetchNetworkInfo();
          }}
          disabled={isLoading}
          className={`h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs sm:text-[14px] font-semibold flex items-center gap-2 cursor-pointer transition-all border ${
            isLight
              ? "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 shadow-sm"
              : "bg-[#14151a] border-neutral-800 text-neutral-200 hover:bg-[#1a1c24] shadow-sm"
          }`}
          title="Synchronize Blockchain Ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Sync Ledger</span>
        </button>
      }
    >
      {/* Dismissible Feedback Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="p-1 rounded-full hover:bg-rose-500/20 text-rose-300 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="p-1 rounded-full hover:bg-emerald-500/20 text-emerald-300 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: DASHBOARD (Clone of Retailer Dashboard Layout)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Overview Stat Cards Grid — Exactly matching Retailer Dashboard stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Whitelisted Nodes */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Whitelisted Nodes
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {stats.totalWhitelisted}
              </div>
              <p className="text-[11px] text-neutral-500">Authorized smart contract nodes</p>
            </div>

            {/* 2. Pending Whitelist */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Pending Whitelist
                </span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {stats.totalNotWhitelisted}
              </div>
              <p className="text-[11px] text-neutral-500">Awaiting admin authorization</p>
            </div>

            {/* 3. Total Stakeholders */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Total Stakeholders
                </span>
                <Users className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {allUsers.length}
              </div>
              <p className="text-[11px] text-neutral-500">Registered platform accounts</p>
            </div>

            {/* 4. Whitelist Access Ratio */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Whitelist Ratio
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-editorial text-3xl font-light text-emerald-400">{stats.totalWhitelisted}</span>
                <span className="text-xs text-neutral-500">/</span>
                <span className="font-editorial text-2xl font-light text-amber-400">{stats.totalNotWhitelisted} pending</span>
              </div>
              <p className="text-[11px] text-neutral-500">Authorized vs pending access</p>
            </div>

            {/* 5. Total NSC Supply (Token Related) */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Total NSC Supply
                </span>
                <Image src="/nsc_logo.png" alt="NSC" width={16} height={16} className="w-4 h-4 object-contain" unoptimized />
              </div>
              <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {parseFloat(stats.totalSupply || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-neutral-500">Total minted token cap</p>
            </div>

            {/* 6. Treasury Reserves (Token Related) */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Treasury Reserves
                </span>
                <Image src="/nsc_logo.png" alt="NSC" width={16} height={16} className="w-4 h-4 object-contain" unoptimized />
              </div>
              <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {parseFloat(stats.adminBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-neutral-500">In administrator vault</p>
            </div>

            {/* 7. Circulating Supply */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Circulating NSC
                </span>
                <TrendingUp className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {(Math.max(0, parseFloat(stats.totalSupply || 0) - parseFloat(stats.adminBalance || 0))).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-neutral-500">Dispatched to nodes</p>
            </div>

            {/* 8. Consensus Network */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Consensus Network
                </span>
                <Globe className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-2xl sm:text-3xl font-light truncate ${isLight ? "text-neutral-900" : "text-white"}`}>
                {networkInfo.name || "Nirvana Chain"}
              </div>
              <p className="text-[11px] text-neutral-500">Chain ID: {networkInfo.chainId || "—"}</p>
            </div>
          </div>

          {/* Quick Actions Two-Card Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Whitelist Card */}
            <div
              className={`${
                isLight
                  ? "bg-white border-neutral-200"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              } border rounded-2xl p-6 sm:p-7 space-y-5`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className={`text-lg font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Quick Whitelist
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Instantly grant on-chain transaction rights to a stakeholder.
                  </p>
                </div>
                <UserCheck className={`w-5 h-5 ${isLight ? "text-neutral-500" : "text-neutral-400"} shrink-0`} />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-neutral-400">
                  Stakeholder Ethereum Address
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="0x... (42-character hex address)"
                    value={addressToWhitelist}
                    onChange={(e) => setAddressToWhitelist(e.target.value)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => addToWhitelist()}
                    disabled={!addressToWhitelist || actionInProgress === `whitelist_${addressToWhitelist}`}
                    className={`h-10 px-6 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 ${
                      isLight ? "bg-neutral-900 hover:bg-black text-white" : "bg-white hover:bg-neutral-200 text-black"
                    } ${
                      !addressToWhitelist || actionInProgress === `whitelist_${addressToWhitelist}`
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {actionInProgress === `whitelist_${addressToWhitelist}` ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <span>Whitelist</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Transfer Card */}
            <div
              className={`${
                isLight
                  ? "bg-white border-neutral-200"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              } border rounded-2xl p-6 sm:p-7 space-y-5`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className={`text-lg font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Quick Token Transfer
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Dispatch NSC tokens from admin treasury to any whitelisted account.
                  </p>
                </div>
                <Image src="/nsc_logo.png" alt="NSC" width={20} height={20} className="w-5 h-5 object-contain opacity-70 shrink-0" unoptimized />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-medium text-neutral-400">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x... recipient address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-neutral-400">
                      Amount (NSC)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 50"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={sendTokens}
                  disabled={
                    !recipientAddress ||
                    !tokenAmount ||
                    actionInProgress === "send_tokens"
                  }
                  className={`w-full h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isLight ? "bg-neutral-900 hover:bg-black text-white" : "bg-white hover:bg-neutral-200 text-black"
                  } ${
                    !recipientAddress || !tokenAmount || actionInProgress === "send_tokens"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {actionInProgress === "send_tokens" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending NSC...</span>
                    </>
                  ) : (
                    <span>Send NSC Tokens</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Stakeholders Overview Table */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl overflow-hidden`}
          >
            <div
              className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isLight ? "border-neutral-200" : "border-neutral-800/80"
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Active Stakeholder Directory
                  </h3>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                      isLight ? "bg-neutral-100 text-neutral-700" : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {allUsers.length} Nodes
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Overview of connected participants, token balances, and permission states.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto ${
                  isLight
                    ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                    : "bg-[#181a24] hover:bg-neutral-800 text-white border border-neutral-700"
                }`}
              >
                <span>View All Stakeholders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                <thead
                  className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                    isLight
                      ? "bg-neutral-50/80 text-neutral-500 border-neutral-200"
                      : "bg-[#14151a] text-neutral-400 border-neutral-800"
                  }`}
                >
                  <tr>
                    <th className="py-3.5 px-4">Stakeholder</th>
                    <th className="py-3.5 px-4">Node ID</th>
                    <th className="py-3.5 px-4">MetaMask Address</th>
                    <th className="py-3.5 px-4">NSC Balance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-neutral-100" : "divide-neutral-800/60"
                  }`}
                >
                  {allUsers.slice(0, 5).map((user) => {
                    const isWhitelisted = user.isWhitelisted;
                    const addr = user.metamask_add || "";
                    const isPending =
                      actionInProgress === `whitelist_${addr}` ||
                      actionInProgress === `unwhitelist_${addr}`;

                    return (
                      <tr
                        key={user.generated_unique_id || user.user_id}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-neutral-900/30"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                          {user.user_id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">
                          {user.generated_unique_id || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">
                              {addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "—"}
                            </span>
                            {addr && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(addr, `dash_user_${user.user_id}`)}
                                className="text-neutral-400 hover:text-white cursor-pointer"
                                title="Copy full address"
                              >
                                {copiedKey === `dash_user_${user.user_id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                          {parseFloat(user.balance || 0).toFixed(4)} NSC
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isWhitelisted
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {isWhitelisted ? "Whitelisted" : "Not Whitelisted"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isWhitelisted ? (
                              <button
                                type="button"
                                onClick={() => removeFromWhitelist(addr)}
                                disabled={isPending}
                                className="h-8 px-3 rounded-full text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revoke"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToWhitelist(addr)}
                                disabled={isPending}
                                className="h-8 px-3 rounded-full text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Authorize"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setRecipientAddress(addr);
                                setActiveTab("tokens");
                              }}
                              className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                isLight
                                  ? "bg-neutral-900 hover:bg-black text-white"
                                  : "bg-white hover:bg-neutral-200 text-black"
                              }`}
                            >
                              <span>Send</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: WHITELIST MANAGEMENT (Cloned Retailer Aesthetic)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "whitelist" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Whitelist Stakeholder Card */}
            <div
              className={`${
                isLight
                  ? "bg-white border-neutral-200"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              } border rounded-2xl p-6 sm:p-7 space-y-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Authorize Supply Chain Node
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Enroll a participant address to enable receiving and transferring tokens.
                  </p>
                </div>
                <ShieldCheck className={`w-5 h-5 ${isLight ? "text-neutral-500" : "text-neutral-400"} shrink-0`} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Ethereum Wallet Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x... (42-character hex address)"
                    value={addressToWhitelist}
                    onChange={(e) => setAddressToWhitelist(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => addToWhitelist()}
                  disabled={!addressToWhitelist || actionInProgress === `whitelist_${addressToWhitelist}`}
                  className={`w-full h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isLight ? "bg-neutral-900 hover:bg-black text-white" : "bg-white hover:bg-neutral-200 text-black"
                  } ${
                    !addressToWhitelist || actionInProgress === `whitelist_${addressToWhitelist}`
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {actionInProgress === `whitelist_${addressToWhitelist}` ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing on-chain...</span>
                    </>
                  ) : (
                    <span>Add to Whitelist</span>
                  )}
                </button>
              </div>
            </div>

            {/* Check Whitelist Status Card */}
            <div
              className={`${
                isLight
                  ? "bg-white border-neutral-200"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              } border rounded-2xl p-6 sm:p-7 space-y-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Verify Node Whitelist Status
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Query the live smart contract to verify authorization for any address.
                  </p>
                </div>
                <Search className={`w-5 h-5 ${isLight ? "text-neutral-500" : "text-neutral-400"} shrink-0`} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Query Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={addressToCheck}
                      onChange={(e) => {
                        setAddressToCheck(e.target.value);
                        setIsAddressWhitelisted(null);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                          : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={checkWhitelistStatus}
                      disabled={!addressToCheck || actionInProgress === "check_status"}
                      className={`h-10 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                        isLight
                          ? "border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800"
                          : "border-neutral-700 bg-[#181920] hover:bg-neutral-800 text-neutral-200"
                      } ${!addressToCheck || actionInProgress === "check_status" ? "opacity-50" : ""}`}
                    >
                      {actionInProgress === "check_status" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Result Display */}
                {isAddressWhitelisted !== null && (
                  <div
                    className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${
                      isAddressWhitelisted
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAddressWhitelisted ? (
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 shrink-0" />
                        )}
                        <span className="font-semibold text-xs sm:text-sm">
                          {isAddressWhitelisted ? "Address is Whitelisted" : "Address is NOT Whitelisted"}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-current">
                        {isAddressWhitelisted ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-xs font-mono break-all opacity-80">{addressToCheck}</p>

                    {!isAddressWhitelisted && (
                      <button
                        type="button"
                        onClick={() => addToWhitelist(addressToCheck)}
                        disabled={actionInProgress === `whitelist_${addressToCheck}`}
                        className="mt-2 h-8 px-4 rounded-full text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Whitelist This Address Now</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Whitelisted Nodes Table */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl overflow-hidden`}
          >
            <div
              className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isLight ? "border-neutral-200" : "border-neutral-800/80"
              }`}
            >
              <div>
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Whitelisted Stakeholder Nodes
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Currently active supply chain participants permitted to transact on Nirvana Smart Chain.
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  isLight
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                {whitelistedUsers.length} Authorized
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                <thead
                  className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                    isLight
                      ? "bg-neutral-50/80 text-neutral-500 border-neutral-200"
                      : "bg-[#14151a] text-neutral-400 border-neutral-800"
                  }`}
                >
                  <tr>
                    <th className="py-3.5 px-4">Stakeholder</th>
                    <th className="py-3.5 px-4">Node ID</th>
                    <th className="py-3.5 px-4">MetaMask Address</th>
                    <th className="py-3.5 px-4">NSC Balance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Revoke Action</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-neutral-100" : "divide-neutral-800/60"
                  }`}
                >
                  {whitelistedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs">
                        No whitelisted supply chain participants registered yet.
                      </td>
                    </tr>
                  ) : (
                    whitelistedUsers.map((user) => {
                      const addr = user.metamask_add || "";
                      const isPending = actionInProgress === `unwhitelist_${addr}`;

                      return (
                        <tr
                          key={user.generated_unique_id || user.user_id}
                          className={`transition-colors ${
                            isLight ? "hover:bg-neutral-50/80" : "hover:bg-neutral-900/30"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                            {user.user_id}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">
                            {user.generated_unique_id || "—"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">
                            {addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "—"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold">
                            {parseFloat(user.balance || 0).toFixed(4)} NSC
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Whitelisted
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => removeFromWhitelist(addr)}
                              disabled={isPending}
                              className="h-8 px-3 rounded-full text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revoke"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: TOKEN MANAGEMENT (Treasury & Specifications)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "tokens" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Transfer Tokens Card */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-7 space-y-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Dispatch NSC Tokens
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Direct on-chain allocation from the administrator treasury reserves.
                </p>
              </div>
              <Image src="/nsc_logo.png" alt="NSC" width={20} height={20} className="w-5 h-5 object-contain opacity-70 shrink-0" unoptimized />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Whitelisted Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                      : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-400">
                    Token Amount (NSC)
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    Available: {parseFloat(stats.adminBalance || 0).toLocaleString()} NSC
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount to send"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                      : "bg-[#14161f] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={sendTokens}
                disabled={
                  !recipientAddress ||
                  !tokenAmount ||
                  actionInProgress === "send_tokens"
                }
                className={`w-full h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                  isLight ? "bg-neutral-900 hover:bg-black text-white" : "bg-white hover:bg-neutral-200 text-black"
                } ${
                  !recipientAddress || !tokenAmount || actionInProgress === "send_tokens"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {actionInProgress === "send_tokens" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting Transaction...</span>
                  </>
                ) : (
                  <span>Send NSC Tokens</span>
                )}
              </button>
            </div>
          </div>

          {/* Token Specifications Card */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-7 space-y-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Asset Parameters
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Canonical smart contract parameters for the Nirvana Smart Coin asset.
                </p>
              </div>
              <Image src="/nsc_logo.png" alt="NSC" width={20} height={20} className="w-5 h-5 object-contain opacity-70 shrink-0" unoptimized />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"
                }`}
              >
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Token Name
                </span>
                <span className="font-semibold text-sm">Nirvana Smart Coin</span>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"
                }`}
              >
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Symbol & Decimals
                </span>
                <span className="font-semibold text-sm">NSC &bull; 18 decimals</span>
              </div>

              <div
                className={`p-4 rounded-xl border sm:col-span-2 ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"
                }`}
              >
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Contract Address
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs break-all text-neutral-500 dark:text-neutral-300">
                    {TOKEN_ADDRESS}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(TOKEN_ADDRESS, "contract_address")}
                    className={`p-1.5 rounded-lg border cursor-pointer transition-colors shrink-0 ${
                      isLight ? "border-neutral-200 hover:bg-neutral-200" : "border-neutral-700 hover:bg-neutral-800"
                    }`}
                    title="Copy Address"
                  >
                    {copiedKey === "contract_address" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"
                }`}
              >
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Total Minted
                </span>
                <span className="font-semibold text-sm">{stats.totalSupply} NSC</span>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"
                }`}
              >
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Admin Reserves
                </span>
                <span className="font-semibold text-sm text-emerald-500 dark:text-emerald-400">{stats.adminBalance} NSC</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: USERS MANAGEMENT (Stakeholder Directory Table)       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl overflow-hidden`}
        >
          {/* Header Toolbar */}
          <div
            className={`p-5 sm:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isLight ? "border-neutral-200" : "border-neutral-800/80"
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Stakeholder Directory
                </h3>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    isLight ? "bg-neutral-100 text-neutral-700" : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {filteredUsers.length} total
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Live on-chain token balances and whitelist authority statuses.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Pills */}
              <div
                className={`flex items-center p-1 rounded-full border text-xs font-semibold ${
                  isLight ? "bg-neutral-100 border-neutral-200" : "bg-[#14151a] border-neutral-800"
                }`}
              >
                {[
                  { id: "all", label: "All" },
                  { id: "whitelisted", label: "Whitelisted" },
                  { id: "not_whitelisted", label: "Pending" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setUserFilter(f.id);
                      setUsersPage(1);
                    }}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      userFilter === f.id
                        ? isLight
                          ? "bg-white text-black shadow-sm"
                          : "bg-white text-black shadow-sm"
                        : isLight
                        ? "text-neutral-600 hover:text-black"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isLight ? "text-neutral-400" : "text-neutral-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search ID or 0x address..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs outline-none border transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-400"
                      : "bg-[#13141b] border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-700"
                  }`}
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearch("");
                      setUsersPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchAllUsers}
                disabled={isLoading}
                className={`p-2 rounded-xl border cursor-pointer transition-colors shrink-0 ${
                  isLight
                    ? "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                    : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
                title="Refresh Users"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
              <thead
                className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                  isLight
                    ? "bg-neutral-50/80 text-neutral-500 border-neutral-200"
                    : "bg-[#14151a] text-neutral-400 border-neutral-800"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Stakeholder</th>
                  <th className="py-3.5 px-4">Node ID</th>
                  <th className="py-3.5 px-4">MetaMask Address</th>
                  <th className="py-3.5 px-4">NSC Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? "divide-neutral-100" : "divide-neutral-800/60"
                }`}
              >
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-neutral-400">
                      <p className="font-medium text-sm">No stakeholders found</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {userSearch ? "Try adjusting your search query." : "No users registered in the database."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const isWhitelisted = user.isWhitelisted;
                    const addr = user.metamask_add || "";
                    const isPending =
                      actionInProgress === `whitelist_${addr}` ||
                      actionInProgress === `unwhitelist_${addr}`;

                    return (
                      <tr
                        key={user.generated_unique_id || user.user_id}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-neutral-900/30"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                          {user.user_id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">
                          {user.generated_unique_id || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">
                              {addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "—"}
                            </span>
                            {addr && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(addr, `user_${user.user_id}`)}
                                className="text-neutral-400 hover:text-white cursor-pointer"
                                title="Copy full address"
                              >
                                {copiedKey === `user_${user.user_id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                          {parseFloat(user.balance || 0).toFixed(4)} NSC
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isWhitelisted
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {isWhitelisted ? "Whitelisted" : "Not Whitelisted"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isWhitelisted ? (
                              <button
                                type="button"
                                onClick={() => removeFromWhitelist(addr)}
                                disabled={isPending}
                                className="h-8 px-3 rounded-full text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revoke"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToWhitelist(addr)}
                                disabled={isPending}
                                className="h-8 px-3 rounded-full text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Authorize"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setRecipientAddress(addr);
                                setActiveTab("tokens");
                              }}
                              className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                isLight
                                  ? "bg-neutral-900 hover:bg-black text-white"
                                  : "bg-white hover:bg-neutral-200 text-black"
                              }`}
                            >
                              <span>Send</span>
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

          {/* Pagination Controls */}
          <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800/80">
            <TablePagination
              currentPage={usersPage}
              totalItems={filteredUsers.length}
              pageSize={USERS_PAGE_SIZE}
              onPageChange={setUsersPage}
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: TOKEN LIST (Nirvana Smart Coin Dedicated Showcase)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "tokenlist" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Header Card */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-8`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center p-3 shadow-lg shrink-0">
                  <Image
                    src="/nsc_logo.png"
                    alt="Nirvana Smart Coin"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                      Nirvana Smart Coin
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-200 font-mono">
                      NSC
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Primary Asset
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xl">
                    The native cryptographic settlement and governance asset powering transparent tracking, batch verification, and multi-tier stakeholder settlements across Nirvana Smart Chain.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(TOKEN_ADDRESS, "hero_token_address")}
                  className={`h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isLight
                      ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                      : "bg-[#181a24] hover:bg-neutral-800 text-white border border-neutral-700"
                  }`}
                >
                  {copiedKey === "hero_token_address" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Address</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tokens")}
                  className={`h-9 px-5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  Dispatch Tokens
                </button>
              </div>
            </div>
          </div>

          {/* Key Metric Cards (Matching Retailer Dashboard stat cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {/* 1. Total Minted */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Total Supply
                </span>
                <Image src="/nsc_logo.png" alt="NSC" width={16} height={16} className="w-4 h-4 object-contain opacity-70" unoptimized />
              </div>
              <div className={`font-editorial text-2xl sm:text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {parseFloat(stats.totalSupply || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-neutral-500">NSC minted cap</p>
            </div>

            {/* 2. Admin Reserves */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Treasury Balance
                </span>
                <Image src="/nsc_logo.png" alt="NSC" width={16} height={16} className="w-4 h-4 object-contain opacity-70" unoptimized />
              </div>
              <div className={`font-editorial text-2xl sm:text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {parseFloat(stats.adminBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-neutral-500">In administrator vault</p>
            </div>

            {/* 3. Circulating Supply */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Circulating
                </span>
                <TrendingUp className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-2xl sm:text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                {(Math.max(0, parseFloat(stats.totalSupply || 0) - parseFloat(stats.adminBalance || 0))).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-neutral-500">Distributed to nodes</p>
            </div>

            {/* 4. Decimals */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Decimals
                </span>
                <Hash className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-2xl sm:text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                18
              </div>
              <p className="text-[11px] text-neutral-500">Subunit precision (wei)</p>
            </div>

            {/* 5. Token Standard */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Standard
                </span>
                <Layers className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-xl sm:text-2xl font-light truncate ${isLight ? "text-neutral-900" : "text-white"}`}>
                ERC-20
              </div>
              <p className="text-[11px] text-neutral-500">Whitelist gated</p>
            </div>

            {/* 6. Network Info */}
            <div
              className={`${
                isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
              } border rounded-2xl p-5 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                  Network
                </span>
                <Globe className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
              </div>
              <div className={`font-editorial text-xl sm:text-2xl font-light truncate ${isLight ? "text-neutral-900" : "text-white"}`}>
                {networkInfo.name || "Nirvana Chain"}
              </div>
              <p className="text-[11px] text-neutral-500">Chain ID: {networkInfo.chainId || "—"}</p>
            </div>
          </div>

          {/* Detailed Contract Specifications */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-7 space-y-5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Smart Contract Architecture
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified contract details, governance access control, and supply parameters.
                </p>
              </div>
              <Layers className={`w-5 h-5 ${isLight ? "text-neutral-500" : "text-neutral-400"} shrink-0`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"}`}>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  NSC Token Contract Address
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs break-all text-neutral-600 dark:text-neutral-300">
                    {TOKEN_ADDRESS}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(TOKEN_ADDRESS, "contract_address_tab")}
                    className={`p-1.5 rounded-lg border cursor-pointer transition-colors shrink-0 ${
                      isLight ? "border-neutral-200 hover:bg-neutral-200" : "border-neutral-700 hover:bg-neutral-800"
                    }`}
                    title="Copy Address"
                  >
                    {copiedKey === "contract_address_tab" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"}`}>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Administrator / Treasury Address
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs break-all text-neutral-600 dark:text-neutral-300">
                    {ADMIN_ADDRESS}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ADMIN_ADDRESS, "admin_address_tab")}
                    className={`p-1.5 rounded-lg border cursor-pointer transition-colors shrink-0 ${
                      isLight ? "border-neutral-200 hover:bg-neutral-200" : "border-neutral-700 hover:bg-neutral-800"
                    }`}
                    title="Copy Address"
                  >
                    {copiedKey === "admin_address_tab" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"}`}>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Access Restriction Policy
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Only addresses verified and enrolled in the on-chain Whitelist registry can receive, hold, or execute tokenized pharmaceutical transactions.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800"}`}>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Consensus & Finality
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Fast sub-second finality on Polygon Amoy testnet L2 with Ethereum EVM compatibility and gas-optimized transaction fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
