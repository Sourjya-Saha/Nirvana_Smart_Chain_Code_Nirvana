"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import RetailerLayout from "@/components/RetailerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ethers } from "ethers";
import axios from "axios";
import CardTransactionRegistry from "@/contracts/CardTransactionRegistry.json";
import NirvanaTokenABI from "@/contracts/NirvanaToken.json";
import contractConfig from "@/contracts/contractAddress.json";
import {
  ScanLine,
  Wallet,
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Camera,
  CameraOff,
  FlipHorizontal,
  Upload,
  RefreshCw,
  Wifi,
  Radio,
  Globe,
  Edit3,
  Navigation,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function RetailShipmentPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Web3 State
  const [walletAddress, setWalletAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [isAddressWhitelisted, setIsAddressWhitelisted] = useState(false);
  const [transactionFee, setTransactionFee] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [isApproving, setIsApproving] = useState(false);
  const [isValidatingOnChain, setIsValidatingOnChain] = useState(false);
  const [isPayingRazorpay, setIsPayingRazorpay] = useState(false);

  // Scanner Mode & Options: 'webcam' (Webcam) vs 'ip_webcam' (IP Webcam Stream)
  const [activeScanOption, setActiveScanOption] = useState("webcam");
  const [cameraIndex, setCameraIndex] = useState(0);
  const [isScanningWebcam, setIsScanningWebcam] = useState(false);
  const [ipWebcamUrl, setIpWebcamUrl] = useState(process.env.NEXT_PUBLIC_IP_WEBCAM_URL || "http://192.168.10.101:8081/video");
  const [isScanningIp, setIsScanningIp] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Live Camera Viewfinder State & Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoScanTimerRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment"); // "environment" or "user"
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(true);
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);

  // Cart Form & Verification State
  const [formInput, setFormInput] = useState({
    cardId: "",
    receiverAddressW: "",
    receiverAddressR: "",
    date: "",
    receiverAddressM: "",
  });
  const [hashMismatchError, setHashMismatchError] = useState("");
  const [allTransactions, setAllTransactions] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // 'pending' | 'completed' | 'validated' | 'failed'
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [isQrScanned, setIsQrScanned] = useState(false);
  const [isTransactionSuccess, setIsTransactionSuccess] = useState(false);
  const [isPaymentValidated, setIsPaymentValidated] = useState(false);
  const [validatedTxHash, setValidatedTxHash] = useState("");

  // Table & UI State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [trackingLoadingId, setTrackingLoadingId] = useState(null);

  // Notifications
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 12000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 10000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const showLoading = (msg) => {
    setLoadingMessage(msg);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setLoadingMessage("");
    setErrorMessage("");
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setLoadingMessage("");
    setSuccessMessage("");
  };

  const clearAll = () => {
    setLoadingMessage("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Contract Addresses from environment variable with fallback to JSON config
  const contractAddress =
    process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ||
    contractConfig?.registryAddress ||
    "0x0a7Afd6846052D1C96202B72F7Bc0DF93B3912d7";
  const tokenAddress =
    process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ||
    contractConfig?.tokenAddress ||
    "0xc905e61E2a5DD4CEE5a62b8b2ef16F910D7CCC64";

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const truncateAddress = (addr) => {
    if (!addr || addr.trim().length === 0) return "N/A";
    const clean = addr.trim();
    if (clean.length < 12) return clean;
    return `${clean.substring(0, 6)}...${clean.slice(-4)}`;
  };

  const formatNumber = (value) => {
    if (!value) return "0";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";
    if (numValue > 0 && numValue < 0.001) return "<0.001";
    return numValue.toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

  const calculateAllowancePercentage = () => {
    if (!allowance || !transactionFee || parseFloat(transactionFee) === 0) return 0;
    return Math.min(100, (parseFloat(allowance) / parseFloat(transactionFee)) * 100);
  };

  // Gas Overrides Helper
  const getLegacyOverrides = async (c, gasLimit = 300000) => {
    const provider = c?.runner?.provider;
    const fallback = ethers.parseUnits("30", "gwei");
    let gasPrice = fallback;
    try {
      if (provider?.getFeeData) {
        const fd = await provider.getFeeData();
        if (fd?.gasPrice) gasPrice = fd.gasPrice;
      }
    } catch (e) {
      console.warn("getFeeData failed, using fallback gas price", e);
    }
    return { gasLimit, gasPrice };
  };

  // Connect MetaMask & Load Contracts
  const loadContract = async () => {
    if (!contractAddress || !tokenAddress) {
      showError("Configuration error — address or tokenAddress missing from contractAddress.json.");
      return;
    }

    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      showLoading("Connecting to MetaMask wallet — please approve prompt...");
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          showError("No accounts returned from MetaMask.");
          return;
        }

        const addr = ethers.getAddress(accounts[0]);
        setWalletAddress(addr);
        try {
          localStorage.setItem("nsc_wallet_connected", "true");
        } catch {}

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(addr);

        const registry = new ethers.Contract(contractAddress, CardTransactionRegistry.abi, signer);
        setContract(registry);

        const token = new ethers.Contract(tokenAddress, NirvanaTokenABI.abi, signer);
        setTokenContract(token);

        showSuccess("Wallet connected successfully!");
      } catch (error) {
        console.error("Error loading contracts:", error);
        showError("Failed to connect wallet: " + (error?.message || "Unknown error"));
      }
    } else {
      showError("Wallet extension not found. Please install MetaMask to connect.");
    }
  };

  // Disconnect / Revoke Permissions
  const disconnectWallet = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum?.request) {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (e) {
      console.log("Permission revocation cancelled or unsupported:", e);
    }
    setWalletAddress(null);
    setContract(null);
    setTokenContract(null);
    setIsAddressWhitelisted(false);
    setTokenBalance("0");
    setAllowance("0");
    setTransactionFee("0");
    try {
      localStorage.removeItem("nsc_wallet_connected");
    } catch {}
    showSuccess("Wallet disconnected successfully.");
  };

  // Auto-connect if already authorized
  useEffect(() => {
    const init = async () => {
      clearAll();
      setHashMismatchError("");
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            await loadContract();
          }
        } catch (e) {
          console.error("Error checking existing accounts:", e);
        }
      }
    };
    init();

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          disconnectWallet();
        } else {
          loadContract();
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  // Fetch token details & transactions when contracts & wallet are ready
  const fetchTokenDetails = useCallback(async () => {
    if (tokenContract && walletAddress && contract) {
      try {
        const balance = await tokenContract.balanceOf(walletAddress);
        setTokenBalance(ethers.formatEther(balance));

        const isWhitelisted = await contract.isAddressWhitelisted(walletAddress);
        setIsAddressWhitelisted(isWhitelisted);

        const fee = await contract.transactionFee();
        setTransactionFee(ethers.formatEther(fee));

        const currentAllowance = await tokenContract.allowance(walletAddress, contractAddress);
        setAllowance(ethers.formatEther(currentAllowance));
      } catch (error) {
        console.error("Error fetching token details:", error);
        showError("Failed to fetch token details: " + (error.message || "Unknown error"));
      }
    }
  }, [tokenContract, walletAddress, contract, contractAddress]);

  const fetchAllTransactions = useCallback(async () => {
    if (!contract || !walletAddress) return;
    try {
      const [cardIds, strhash, statuses] = await contract.getAllTransactions();
      const formatted = [];
      for (let i = 0; i < cardIds.length; i++) {
        const hash = strhash[i];
        if (!hash || hash.length < 136) continue;
        const retailerInHash = hash.slice(84, 126).trim();

        // Match against current retailer's wallet address (case-insensitive)
        if (retailerInHash.toLowerCase() === walletAddress.toLowerCase()) {
          formatted.push({
            cardId: cardIds[i],
            receiverAddressW: hash.slice(42, 84).trim(),
            receiverAddressR: retailerInHash,
            date: hash.slice(126, 136).trim(),
            receiverAddressM: hash.slice(0, 42).trim(),
            status: statuses[i],
          });
        }
      }
      setAllTransactions(formatted);
    } catch (error) {
      console.error("Fetch tx error:", error);
      showError(error?.shortMessage || error?.reason || error?.message || "Failed to fetch transactions");
    }
  }, [contract, walletAddress]);

  useEffect(() => {
    if (contract && walletAddress) {
      fetchAllTransactions();
      fetchTokenDetails();
      clearAll();
      setHashMismatchError("");
    }
  }, [contract, walletAddress, tokenContract, fetchAllTransactions, fetchTokenDetails]);

  // Error Handler
  const handleTransactionError = (error) => {
    setHashMismatchError("");
    const errText = `${error?.reason || ""} ${error?.message || ""} ${error?.shortMessage || ""}`;

    if (errText.includes("Hash mismatch")) {
      const hashData = error.reason ? error.reason.slice(15) : "";
      let specificMismatch = "";
      if (hashData.slice(0, 42) !== formInput.receiverAddressM) {
        specificMismatch = "Manufacturer address in consignment record does not match ledger state.";
      } else if (hashData.slice(42, 84) !== formInput.receiverAddressW) {
        specificMismatch = "Wholesaler address in consignment record does not match ledger state.";
      } else if (hashData.slice(84, 126).toLowerCase() !== (walletAddress || "").toLowerCase()) {
        specificMismatch = "Connected retailer wallet does not match the designated recipient address.";
      } else if (hashData.slice(126, 136) !== formInput.date) {
        specificMismatch = "Consignment dispatch date does not match ledger timestamp.";
      } else {
        specificMismatch = "Consignment payload data does not match the on-chain hash recorded by the distributor.";
      }
      showError(`Blockchain State Verification Mismatch: ${specificMismatch}`);
      setHashMismatchError(hashData);
    } else if (errText.includes("transfer to non-whitelisted address")) {
      showError("Authorization Error: Connected wallet or recipient is not whitelisted on Nirvana Smart Chain.");
    } else if (errText.includes("Fee payment failed") || errText.includes("insufficient allowance")) {
      showError("Fee Budget Exhausted: Verification fee budget is insufficient. Please approve 1,000 NSC above.");
    } else if (
      errText.toLowerCase().includes("user rejected") ||
      errText.toLowerCase().includes("user denied")
    ) {
      showError("Transaction Cancelled: You rejected the signing request in your MetaMask wallet.");
    } else if (errText.toLowerCase().includes("insufficient funds")) {
      showError("Insufficient Balance: Wallet lacks enough native gas currency to cover blockchain transaction fees.");
    } else {
      const primaryReason =
        error?.shortMessage || error?.reason || error?.message || "An unexpected blockchain error occurred.";
      showError(`Blockchain Error: ${primaryReason}`);
    }
  };

  // Approve Token Spending (1,000 NSC)
  const approveTokenSpending = async () => {
    if (!tokenContract || !walletAddress) {
      showError("Please connect your wallet first.");
      return;
    }
    if (!isAddressWhitelisted) {
      showError("Your store must be authorized before approving fee budget.");
      return;
    }

    try {
      setIsApproving(true);
      const decimals = await tokenContract.decimals();
      const approvalAmount = ethers.parseUnits("1000", decimals);

      showLoading("Checking fee budget requirements on secure network...");
      try {
        await tokenContract.approve.staticCall(contractAddress, approvalAmount);
      } catch (simError) {
        showError(simError?.reason || simError?.shortMessage || simError?.message || "Budget check declined by system.");
        setIsApproving(false);
        return;
      }

      showLoading("Please confirm the fee budget approval in your wallet prompt...");
      const overrides = await getLegacyOverrides(tokenContract, 300000);
      let transaction;
      try {
        transaction = await tokenContract.approve(contractAddress, approvalAmount, overrides);
      } catch (submitError) {
        handleTransactionError(submitError);
        setIsApproving(false);
        return;
      }

      showLoading("Confirming 1,000 NSC fee budget on secure network...");
      await transaction.wait();

      const newAllowance = await tokenContract.allowance(walletAddress, contractAddress);
      setAllowance(ethers.formatEther(newAllowance));
      showSuccess("1,000 NSC verification fee budget approved successfully!");
    } catch (error) {
      console.error("Approval error:", error);
      handleTransactionError(error);
    } finally {
      setIsApproving(false);
    }
  };


  const applyDecryptedQrData = (qrData) => {
    if (!qrData || !qrData.cart_id) {
      showError("Invalid QR payload received: missing cart ID.");
      setIsQrScanned(false);
      return;
    }

    setFormInput({
      cardId: qrData.cart_id || "",
      receiverAddressM: qrData.receivers_addressM || "",
      receiverAddressW: qrData.receivers_addressW || "",
      receiverAddressR: qrData.receivers_addressR || walletAddress || "",
      date: qrData.date || "",
    });

    setPaymentStatus("pending");
    setIsQrScanned(false);

    // Verify transaction against ledger
    const matchingTransaction = allTransactions.find((t) => t.cardId === qrData.cart_id);
    const addressM = qrData.receivers_addressM || "                                          ";
    const addressW = qrData.receivers_addressW || "                                          ";

    if (!qrData.receivers_addressM || qrData.receivers_addressM.trim() === "") {
      if (!qrData.receivers_addressW) {
        showError("Invalid Consignment QR: Wholesaler address is missing from the payload.");
        return;
      }
      setIsQrScanned(true);
      showSuccess(`Consignment QR Verified: Cart #${qrData.cart_id} loaded. Ready for settlement.`);
      return;
    }

    if (qrData.receivers_addressM && !qrData.receivers_addressW) {
      setIsQrScanned(true);
      showSuccess(`Consignment QR Verified: Cart #${qrData.cart_id} loaded. Ready for manufacturer settlement.`);
      return;
    }

    if (matchingTransaction) {
      const mismatches = [];
      if (matchingTransaction.receiverAddressW !== addressW.trim()) {
        mismatches.push(
          `Wholesaler address mismatch (QR: ${truncateAddress(addressW)}, Ledger: ${truncateAddress(
            matchingTransaction.receiverAddressW
          )})`
        );
      }
      if (matchingTransaction.receiverAddressR.toLowerCase() !== (walletAddress || "").toLowerCase()) {
        mismatches.push(
          `Retailer address mismatch with connected wallet (Wallet: ${truncateAddress(
            walletAddress
          )}, Ledger: ${truncateAddress(matchingTransaction.receiverAddressR)})`
        );
      }
      if (matchingTransaction.date !== qrData.date) {
        mismatches.push(`Dispatch date mismatch (QR: ${qrData.date}, Ledger: ${matchingTransaction.date})`);
      }
      if (matchingTransaction.receiverAddressM !== addressM.trim()) {
        mismatches.push(
          `Manufacturer address mismatch (QR: ${truncateAddress(addressM)}, Ledger: ${truncateAddress(
            matchingTransaction.receiverAddressM
          )})`
        );
      }

      if (mismatches.length > 0) {
        showError(`Ledger Verification Failed for Cart #${qrData.cart_id}: ${mismatches.join(" | ")}`);
        return;
      }

      setIsQrScanned(true);
      showSuccess(`Consignment QR Verified: Cart #${qrData.cart_id} perfectly matches ledger records. Ready for settlement.`);
    } else {
      setIsQrScanned(true);
      showSuccess(`Consignment QR Verified: Cart #${qrData.cart_id} loaded. Ready for settlement.`);
    }
  };

  // Live Camera Handlers
  const stopLiveCamera = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Track stop error:", e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startLiveCamera = useCallback(async (facing = cameraFacingMode) => {
    stopLiveCamera();
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by your browser environment. Use HTTPS or localhost.");
        setIsStartingCamera(false);
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (primaryErr) {
        console.warn("Camera constraint fallback...", primaryErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("video.play() warning:", playErr);
        }
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera startup error:", err);
      let msg = "Could not access camera. Please allow camera permissions in your browser.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera permissions in your browser site settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No webcam device detected on your system.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Webcam is already in use by another application.";
      }
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  }, [cameraFacingMode, stopLiveCamera]);

  const toggleCameraFacing = useCallback(() => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    if (isCameraActive) {
      startLiveCamera(nextMode);
    }
  }, [cameraFacingMode, isCameraActive, startLiveCamera]);

  const captureAndDecodeFrame = useCallback(async (silent = false) => {
    if (!videoRef.current || !streamRef.current) return false;
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return false;

    // A. Native BarcodeDetector if available
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const detected = await barcodeDetector.detect(video);
        if (detected && detected.length > 0) {
          const rawValue = detected[0].rawValue;
          if (rawValue) {
            if (!silent) showLoading("QR code detected! Decrypting consignment payload...");
            const res = await axios.post(`${API_BASE}/scan_qr`, { qr_text: rawValue });
            const qrData = res.data?.qr_data;
            if (qrData) {
              applyDecryptedQrData(qrData);
              showSuccess(`Consignment QR successfully verified from live camera!`);
              return true;
            }
          }
        }
      } catch (bcErr) {
        // Fall back to frame capture
      }
    }

    // B. Capture current frame from <video> and send to server /scan_qr
    try {
      if (!silent) setIsCapturingFrame(true);
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let w = video.videoWidth;
      let h = video.videoHeight;
      if (w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const res = await axios.post(`${API_BASE}/scan_qr`, { image_base64: dataUrl });
      const qrData = res.data?.qr_data;
      if (qrData) {
        applyDecryptedQrData(qrData);
        showSuccess(`Consignment QR successfully verified from live camera!`);
        return true;
      }
    } catch (err) {
      if (!silent) {
        console.error("Frame decode error:", err);
        const errMsg =
          err.response?.data?.error ||
          "No consignment QR detected in frame. Hold the QR code steady inside the viewfinder reticle.";
        showError(errMsg);
      }
    } finally {
      if (!silent) setIsCapturingFrame(false);
    }
    return false;
  }, [applyDecryptedQrData]);

  // Tab switch & Unmount cleanup
  useEffect(() => {
    if (activeScanOption === "webcam") {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }

    return () => {
      stopLiveCamera();
    };
  }, [activeScanOption]);

  // Auto-scan loop when camera is live
  useEffect(() => {
    if (activeScanOption === "webcam" && isCameraActive && isAutoScanEnabled && !isQrScanned) {
      autoScanTimerRef.current = setInterval(async () => {
        await captureAndDecodeFrame(true);
      }, 1500);
    } else {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    }

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    };
  }, [activeScanOption, isCameraActive, isAutoScanEnabled, isQrScanned, captureAndDecodeFrame]);

  // Fallback hardware webcam scan
  const scanViaWebcam = async () => {
    setIsScanningWebcam(true);
    setCameraError(null);
    showLoading(`Connecting to Webcam (Camera ${cameraIndex})... Hold consignment QR code in front of camera.`);
    try {
      const response = await axios.post(`${API_BASE}/scan_qr`, {
        source: "webcam",
        camera: cameraIndex,
      });
      const qrData = response.data?.qr_data;
      if (qrData) {
        applyDecryptedQrData(qrData);
        showSuccess(`Consignment QR successfully scanned from Webcam!`);
      } else {
        showError("No QR code detected from Webcam. Please hold QR code steady in camera view.");
      }
    } catch (err) {
      console.error("Webcam scan error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No QR code detected from Webcam. Ensure camera is connected and QR code is in focus.";
      showError(errMsg);
    } finally {
      setIsScanningWebcam(false);
    }
  };

  const scanViaIpWebcam = async () => {
    let cleanUrl = (ipWebcamUrl || "").trim();
    if (!cleanUrl) {
      showError("Please enter an IP Webcam address.");
      return;
    }
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "http://" + cleanUrl;
    }
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.pathname === "" || parsed.pathname === "/") {
        cleanUrl = `${parsed.origin}/video`;
      }
    } catch {
      if (!cleanUrl.includes("/", 9)) {
        cleanUrl = cleanUrl + "/video";
      }
    }

    setIsScanningIp(true);
    showLoading(`Connecting to IP Webcam stream (${cleanUrl})...`);
    try {
      const response = await axios.post(`${API_BASE}/scan_qr`, {
        source: "ip_webcam",
        url: cleanUrl,
      });
      const qrData = response.data?.qr_data;
      if (qrData) {
        applyDecryptedQrData(qrData);
        showSuccess(`Consignment QR successfully scanned from IP Webcam!`);
      } else {
        showError("No QR code detected from IP Webcam stream. Please align consignment QR in phone camera.");
      }
    } catch (err) {
      console.error("IP Webcam scan error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Failed to scan from IP Webcam (${cleanUrl}). Ensure IP Webcam app is running and your device is on the same Wi-Fi.`;
      showError(errMsg);
    } finally {
      setIsScanningIp(false);
    }
  };

  // Load Razorpay Checkout Script
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Create Razorpay Order & Checkout
  const createRazorpayOrder = async () => {
    if (!formInput.cardId) {
      showError("No cart ID found. Please scan the QR code first.");
      return;
    }

    try {
      setIsPayingRazorpay(true);
      showLoading("Initializing Nirvana Smart Chain checkout system...");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showError("Failed to load Nirvana Smart Chain payment gateway. Check network connection.");
        setIsPayingRazorpay(false);
        return;
      }

      const isManufacturerEmpty =
        !formInput.receiverAddressM || formInput.receiverAddressM.trim() === "";
      const isWholesalerEmpty =
        !formInput.receiverAddressW || formInput.receiverAddressW.trim() === "";

      const endpoint = isWholesalerEmpty
        ? "/create_razorpay_order_transactions_ret_to_manu"
        : "/create_razorpay_order_transactions_ret_to_whole";

      const response = await axios.post(`${API_BASE}${endpoint}`, { cart_id: formInput.cardId });
      if (response.data.error) {
        showError(`Settlement Order Error: ${response.data.error}`);
        setIsPayingRazorpay(false);
        return;
      }

      setRazorpayOrderData(response.data);
      clearAll();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_ToXzU7ueHLR5Wr",
        amount: response.data.total_amount * 100,
        currency: "INR",
        name: "Nirvana Smart Chain",
        description: `Pharmaceutical settlement for Cart #${formInput.cardId} to ${
          isWholesalerEmpty ? "Manufacturer" : "Wholesaler"
        }`,
        order_id: response.data.razorpay_order_id,
        handler: function (paymentResponse) {
          const verifyEndpoint = isWholesalerEmpty
            ? "/confirm_order_payment_transactions_ret_to_manu"
            : "/confirm_order_payment_transactions_ret_to_whole";

          showLoading("Verifying cryptographic signature with Nirvana Smart Chain gateway...");
          axios
            .post(
              `${API_BASE}${verifyEndpoint}`,
              {
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                temp_order_data: response.data.temp_order_data,
              },
              { headers: { "Content-Type": "application/json" } }
            )
            .then((verifyResponse) => {
              if (verifyResponse.data.status === "success") {
                setPaymentStatus("completed");
                setIsPaymentValidated(false);
                showSuccess(
                  "Payment confirmed successfully! Please click 'Validate On Blockchain' to finalize on-chain state."
                );
              } else {
                const reason =
                  verifyResponse.data.message ||
                  verifyResponse.data.error ||
                  "Cryptographic signature check did not pass.";
                showError("Payment verification failed: " + reason);
                setPaymentStatus("failed");
              }
            })
            .catch((error) => {
              const reason =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Failed to verify payment with settlement server.";
              showError("Payment verification error: " + reason);
              setPaymentStatus("failed");
            })
            .finally(() => {
              setIsPayingRazorpay(false);
            });
        },
        prefill: {
          email: "retailer@pharmaledger.com",
          contact: "9999999999",
        },
        theme: { color: "#111218" },
        modal: {
          ondismiss: function () {
            setIsPayingRazorpay(false);
            showError("Payment cancelled: Checkout window was closed before completing payment.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failureResponse) {
        const err = failureResponse.error || {};
        const reasonParts = [];
        if (err.description) reasonParts.push(err.description);
        if (err.reason) reasonParts.push(`Reason: ${err.reason}`);
        if (err.source) reasonParts.push(`Source: ${err.source}`);
        if (err.code) reasonParts.push(`Code: ${err.code}`);
        const detailedReason = reasonParts.length > 0 ? reasonParts.join(" | ") : "Unknown payment failure";

        showError(`Payment Failed: ${detailedReason}`);
        setPaymentStatus("failed");
        setIsPayingRazorpay(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Order creation error:", error);
      const serverErrMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to create payment order.";
      showError(`Settlement Order Error: ${serverErrMsg}`);
      setIsPayingRazorpay(false);
    }
  };

  // Validate On Blockchain (searchCardTransactionR)
  const fetchCardTransactionR = async () => {
    if (!contract || !walletAddress) {
      showError("Please connect your MetaMask wallet.");
      return;
    }

    const { cardId, receiverAddressW, date, receiverAddressM } = formInput;
    const mergedW =
      receiverAddressW && receiverAddressW.length === 42
        ? receiverAddressW
        : "                                          ";
    const mergedM =
      receiverAddressM && receiverAddressM.length === 42
        ? receiverAddressM
        : "                                          ";
    const merged = mergedM + mergedW + walletAddress + date + cardId;

    try {
      setIsValidatingOnChain(true);
      showLoading("Verifying fee budget balance for shipment confirmation...");
      const fee = await contract.transactionFee();
      const currentAllowance = await tokenContract.allowance(walletAddress, contractAddress);

      if (currentAllowance < fee) {
        showError(
          `Insufficient verification fee budget (${formatNumber(allowance)} NSC available, ${formatNumber(
            transactionFee
          )} NSC required). Please approve the 1,000 NSC budget using the button above.`
        );
        setIsValidatingOnChain(false);
        return;
      }

      showLoading("Verifying shipment details against system records...");
      try {
        await contract.searchCardTransactionR.staticCall(merged);
      } catch (simError) {
        const simReason =
          simError?.reason ||
          simError?.shortMessage ||
          simError?.message ||
          "Package details do not match distributor records.";
        showError(`Blockchain Pre-check Failed: ${simReason}`);
        setIsValidatingOnChain(false);
        return;
      }

      showLoading("Please approve the delivery confirmation in your wallet prompt...");
      const overrides = await getLegacyOverrides(contract, 300000);
      let transactionData;
      try {
        transactionData = await contract.searchCardTransactionR(merged, overrides);
      } catch (submitError) {
        handleTransactionError(submitError);
        setIsValidatingOnChain(false);
        return;
      }

      showLoading("Recording confirmed delivery into your inventory...");
      await transactionData.wait();
      setValidatedTxHash(transactionData.hash);

      await fetchAllTransactions();
      await fetchTokenDetails();
      clearAll();
      setHashMismatchError("");
      setIsTransactionSuccess(true);
      setIsPaymentValidated(true);
      setPaymentStatus("validated");
      showSuccess(
        `Shipment successfully verified on Nirvana Smart Chain! Tx Hash: ${truncateAddress(
          transactionData.hash
        )}. Consignment added to store inventory.`
      );
    } catch (error) {
      console.error("Validation error:", error);
      handleTransactionError(error);
      setIsTransactionSuccess(false);
      setIsPaymentValidated(false);
    } finally {
      setIsValidatingOnChain(false);
    }
  };

  // Live GPS Tracking Handler
  const handleLiveTracking = async (tx) => {
    const cardId = tx.cardId;
    setTrackingLoadingId(cardId);
    const mAddr = tx.receiverAddressM || "";
    const wAddr = tx.receiverAddressW || "";
    const rAddr = tx.receiverAddressR || "";

    let startCoord = "";
    let checkpointCoord = "";
    let destCoord = "";

    try {
      const response = await axios.post(`${API_BASE}/get_lats_longs`, null, {
        params: {
          cart_id: cardId,
          manufacturer_address: mAddr,
          wholesaler_address: wAddr,
          retailer_address: rAddr,
        },
      });

      if (response.status === 200 && response.data) {
        const d = response.data;
        if (d.manufacturer?.manufacturer_lat && d.manufacturer?.manufacturer_long) {
          startCoord = `${d.manufacturer.manufacturer_lat}, ${d.manufacturer.manufacturer_long}`;
        }
        if (d.wholesaler?.wholesaler_lat && d.wholesaler?.wholesaler_long) {
          checkpointCoord = `${d.wholesaler.wholesaler_lat}, ${d.wholesaler.wholesaler_long}`;
        }
        if (d.retailer?.retailer_lat && d.retailer?.retailer_long) {
          destCoord = `${d.retailer.retailer_lat}, ${d.retailer.retailer_long}`;
        }
      }
    } catch (e) {
      console.warn("Could not pre-fetch exact lat/long coords:", e);
    } finally {
      setTrackingLoadingId(null);
    }

    const params = new URLSearchParams({
      cartId: cardId,
      userId: userId || "",
      userRole: "retailer",
    });

    if (mAddr) params.set("mAddr", mAddr);
    if (wAddr) params.set("wAddr", wAddr);
    if (rAddr) params.set("rAddr", rAddr);
    if (startCoord) params.set("start", startCoord);
    if (checkpointCoord) params.set("checkpoint", checkpointCoord);
    if (destCoord) params.set("dest", destCoord);

    router.push(`/Geolocation?${params.toString()}`);
  };

  // Filtered & Paginated Transactions
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return allTransactions;
    const q = searchQuery.toLowerCase();
    return allTransactions.filter(
      (tx) =>
        (tx.cardId || "").toLowerCase().includes(q) ||
        (tx.receiverAddressW || "").toLowerCase().includes(q) ||
        (tx.receiverAddressM || "").toLowerCase().includes(q) ||
        (tx.status || "").toLowerCase().includes(q) ||
        (tx.date || "").toLowerCase().includes(q)
    );
  }, [allTransactions, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const currentTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const getPaginationGroup = () => {
    const start = Math.floor((currentPage - 1) / 5) * 5;
    return new Array(Math.min(5, totalPages - start)).fill(null).map((_, idx) => start + idx + 1);
  };

  return (
    <RetailerLayout
      title="Shipment Dispatch & Verification"
      subtitle="Scan consignment packages, complete vendor payments via Nirvana Smart Chain, and verify authenticity on the secure network."
      badge="Logistics & Verification"
      actions={
        <div className="flex items-center gap-2">
          {walletAddress ? (
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold shadow-sm transition-all ${
                isLight
                  ? "bg-white border-neutral-200 text-neutral-800"
                  : "bg-[#121318] border-neutral-800 text-white"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{truncateAddress(walletAddress)}</span>
              <button
                type="button"
                onClick={disconnectWallet}
                className="text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                title="Disconnect Wallet"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={loadContract}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold shadow-sm cursor-pointer transition-all ${
                isLight
                  ? "bg-neutral-900 hover:bg-black text-white"
                  : "bg-white hover:bg-neutral-200 text-black"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Floating / Top Alert Banners */}
        {loadingMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 ${
              isLight
                ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                : "bg-[#181a24] text-white border-neutral-700 shadow-lg"
            }`}
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400 shrink-0" />
              <span>{loadingMessage}</span>
            </div>
            <button
              onClick={() => setLoadingMessage("")}
              className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 break-words ${
              isLight
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-rose-950/40 text-rose-200 border-rose-900/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Notification / Reason</span>
                <span className="font-normal opacity-90 leading-relaxed block">{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer p-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-2 shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 break-words ${
              isLight
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-emerald-950/40 text-emerald-200 border-emerald-900/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Operation Succeeded</span>
                <span className="font-normal opacity-90 leading-relaxed block">{successMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-500 hover:text-emerald-700 text-xs cursor-pointer p-1 rounded-lg hover:bg-emerald-500/10 transition-colors ml-2 shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Token Overview & Whitelist Section (Always Accessible) */}
        <div
          className={`border rounded-2xl p-5 sm:p-6 transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0c0d11] border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.6)]"
          }`}
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800/80">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-black border border-black flex items-center justify-center shadow-sm">
                <img
                  src="/nsc_logo.png"
                  alt="NSC Token"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-editorial text-xl sm:text-2xl font-light text-neutral-900 dark:text-white">
                    Nirvana Smart Coin
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Secure Settlement Coin &bull; Network Verification Budget
                </p>
              </div>
            </div>

            {/* Quick Action: Approve Button (No unnecessary icons) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={approveTokenSpending}
                disabled={!isAddressWhitelisted || isApproving || !walletAddress}
                className={`flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                  !isAddressWhitelisted || !walletAddress
                    ? "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                    : isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
                title={
                  !walletAddress
                    ? "Connect wallet first"
                    : !isAddressWhitelisted
                    ? "Your wallet address must be whitelisted to approve tokens"
                    : "Approve 1,000 NSC for transactions"
                }
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    <span>Approving 1,000 NSC...</span>
                  </>
                ) : (
                  <span>{isAddressWhitelisted ? "Approve 1,000 NSC" : "Whitelisting Required"}</span>
                )}
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {/* Balance */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#121319] border-neutral-800/80"
              }`}
            >
              <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-1.5 font-medium">
                Your Balance
              </div>
              <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {formatNumber(tokenBalance)}{" "}
                <span className="text-xs font-medium text-neutral-400">NSC</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Available for gas & settlement fees</p>
            </div>

            {/* Whitelist Status */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#121319] border-neutral-800/80"
              }`}
            >
              <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-1.5 font-medium">
                Whitelist Status
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isAddressWhitelisted
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAddressWhitelisted ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {isAddressWhitelisted ? "Verified Address" : "Unverified Address"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {isAddressWhitelisted
                  ? "Full transaction rights enabled"
                  : "Approval required by administrator"}
              </p>
            </div>

            {/* Transaction Fee */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#121319] border-neutral-800/80"
              }`}
            >
              <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-1.5 font-medium">
                Transaction Fee
              </div>
              <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {formatNumber(transactionFee)}{" "}
                <span className="text-xs font-medium text-neutral-400">NSC</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Protocol verification charge</p>
            </div>

            {/* Current Allowance */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#121319] border-neutral-800/80"
              }`}
            >
              <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-1.5 font-medium">
                Current Allowance
              </div>
              <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {formatNumber(allowance)}{" "}
                <span className="text-xs font-medium text-neutral-400">NSC</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-500"
                  style={{ width: `${calculateAllowancePercentage()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive Whitelist Gate Wrapper */}
        <div className="relative">
          {/* Whitelist Lock Overlay (Shown only if not whitelisted or not connected) */}
          {(!isAddressWhitelisted || !walletAddress) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4 rounded-2xl bg-white/70 dark:bg-black/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 transition-all">
              <div
                className={`max-w-md w-full p-8 rounded-2xl border text-center shadow-2xl transition-all ${
                  isLight ? "bg-white border-neutral-300" : "bg-[#111218] border-neutral-700/80 text-white"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-2xl font-light mb-2 text-neutral-900 dark:text-white">
                  Access Restricted
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-5">
                  {!walletAddress
                    ? "Connect your MetaMask wallet to view cart packages, scan physical consignments, and register shipments on the ledger."
                    : "Your connected wallet address is not whitelisted on the CardTransactionRegistry contract. Contact the contract administrator to authorize your node."}
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs border ${
                    isLight
                      ? "bg-neutral-100 border-neutral-200 text-neutral-700"
                      : "bg-[#181a24] border-neutral-700 text-neutral-300"
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {walletAddress
                      ? `${walletAddress.substring(0, 10)}...${walletAddress.slice(-8)}`
                      : "No wallet connected"}
                  </span>
                </div>
                <div className="mt-5">
                  {!walletAddress ? (
                    <button
                      type="button"
                      onClick={loadContract}
                      className={`w-full py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        isLight ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"
                      }`}
                    >
                      Connect MetaMask
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={fetchTokenDetails}
                      className={`w-full py-2.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                        isLight
                          ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300"
                          : "bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600"
                      }`}
                    >
                      Recheck Whitelist Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout: Cart Details (Left) + QR & Action Workflow (Right) */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all ${
              !isAddressWhitelisted || !walletAddress ? "filter blur-sm pointer-events-none select-none opacity-40" : ""
            }`}
          >
            {/* Column 1: Cart Details */}
            <div
              className={`border rounded-2xl p-6 transition-all ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0c0d11] border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.6)]"
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800/80 mb-5">
                <div>
                  <h3 className="font-editorial text-xl font-light text-neutral-900 dark:text-white">
                    Cart Package Details
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Consignment parameters extracted from smart QR
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    formInput.cardId
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                  }`}
                >
                  {formInput.cardId ? `Cart #${formInput.cardId}` : "Awaiting QR"}
                </span>
              </div>

              <div className="space-y-4">
                {/* Cart ID */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Cart ID
                  </label>
                  <input
                    type="text"
                    value={formInput.cardId}
                    readOnly
                    placeholder="Scan QR to populate Cart ID"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-400"
                        : "bg-[#13141b] border-neutral-800 text-white focus:border-neutral-700"
                    }`}
                  />
                </div>

                {/* Wholesaler Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Wholesaler Address
                    </label>
                    {formInput.receiverAddressW && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formInput.receiverAddressW, "wholesaler")}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "wholesaler" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "wholesaler" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formInput.receiverAddressW}
                    readOnly
                    placeholder="Wholesaler wallet address"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200 text-neutral-900"
                        : "bg-[#13141b] border-neutral-800 text-white"
                    }`}
                  />
                </div>

                {/* Retailer Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Retailer Address (You)
                    </label>
                    {walletAddress && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(walletAddress, "retailer")}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "retailer" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "retailer" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={walletAddress || ""}
                    disabled
                    placeholder="Connected retailer address"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono opacity-80 cursor-not-allowed ${
                      isLight
                        ? "bg-neutral-100 border-neutral-200 text-neutral-800"
                        : "bg-[#13141b] border-neutral-800 text-neutral-300"
                    }`}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Dispatch Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formInput.date}
                      readOnly
                      placeholder="YYYY-MM-DD"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-200 text-neutral-900"
                          : "bg-[#13141b] border-neutral-800 text-white"
                      }`}
                    />
                    <Calendar className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Manufacturer Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Manufacturer Address
                    </label>
                    {formInput.receiverAddressM && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formInput.receiverAddressM, "manufacturer")}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "manufacturer" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "manufacturer" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formInput.receiverAddressM}
                    readOnly
                    placeholder="Manufacturer wallet address"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200 text-neutral-900"
                        : "bg-[#13141b] border-neutral-800 text-white"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: QR Scanner, Razorpay & On-Chain Validation */}
            <div
              className={`border rounded-2xl p-6 transition-all flex flex-col justify-between ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0c0d11] border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.6)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800/80 mb-5">
                  <div>
                    <h3 className="font-editorial text-xl font-light text-neutral-900 dark:text-white">
                      Verification & Payment Flow
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Step-by-step physical and fiat validation
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isQrScanned
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                    }`}
                  >
                    Scan Status: {isQrScanned ? "Verified" : "Not Scanned"}
                  </span>
                </div>

                {/* Summary Pill View */}
                <div
                  className={`p-4 rounded-xl border space-y-2.5 mb-6 ${
                    isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#13141b] border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Cart ID</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {formInput.cardId || "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Wholesaler Address</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {truncateAddress(formInput.receiverAddressW)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Retailer Address</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {truncateAddress(walletAddress)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Dispatch Date</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {formInput.date || "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Manufacturer Address</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {truncateAddress(formInput.receiverAddressM)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Sequence & Live Camera Feed */}
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800/80">
                {/* 2-Option Scanner Selection: Webcam vs IP Webcam */}
                <div className="space-y-3">
                  <div className="flex items-center p-1.5 rounded-full bg-neutral-100 dark:bg-[#14151e] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveScanOption("webcam");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                        activeScanOption === "webcam"
                          ? isLight
                            ? "bg-neutral-900 hover:bg-black text-white shadow-sm"
                            : "bg-white hover:bg-neutral-200 text-black shadow-sm"
                          : isLight
                          ? "text-neutral-600 hover:text-black bg-transparent"
                          : "text-neutral-400 hover:text-white bg-transparent"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Webcam</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveScanOption("ip_webcam");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                        activeScanOption === "ip_webcam"
                          ? isLight
                            ? "bg-neutral-900 hover:bg-black text-white shadow-sm"
                            : "bg-white hover:bg-neutral-200 text-black shadow-sm"
                          : isLight
                          ? "text-neutral-600 hover:text-black bg-transparent"
                          : "text-neutral-400 hover:text-white bg-transparent"
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5" />
                      <span>IP Webcam</span>
                    </button>
                  </div>

                  {/* Option 1: Live Webcam Viewfinder & Scanner */}
                  {activeScanOption === "webcam" && (
                    <div
                      className={`p-4 rounded-2xl border space-y-3.5 animate-in fade-in duration-200 ${
                        isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#13141b] border-neutral-800"
                      }`}
                    >
                      {/* Live Camera Viewfinder Screen */}
                      <div
                        className={`relative w-full aspect-video max-h-72 rounded-xl overflow-hidden flex items-center justify-center shadow-inner group border transition-all ${
                          isLight ? "bg-neutral-100/90 border-neutral-200" : "bg-black border-neutral-800"
                        }`}
                      >
                        {/* Native Video Element */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover transition-opacity duration-300 ${
                            isCameraActive ? "opacity-100" : "opacity-0"
                          }`}
                        />

                        {/* When camera is active: Clean Viewfinder Overlay */}
                        {isCameraActive && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center p-3">
                            {/* Viewfinder Reticle & Laser Sweep Animation */}
                            <div className="relative w-44 h-44 sm:w-52 sm:h-52 max-w-[85%] max-h-[85%] flex items-center justify-center">
                              {/* 4 Corner Framing Brackets */}
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] rounded-tl-lg" />
                              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] rounded-tr-lg" />
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] rounded-bl-lg" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] rounded-br-lg" />

                              {/* Scanning Laser Line */}
                              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-scan-laser" />
                            </div>
                          </div>
                        )}

                        {/* When camera is stopped or starting */}
                        {!isCameraActive && (
                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 transition-colors ${
                              isLight ? "bg-neutral-100/95" : "bg-[#0a0a0f]"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                                isLight
                                  ? "bg-white border-neutral-200 text-neutral-700 shadow-sm"
                                  : "bg-neutral-800/80 border-neutral-700 text-neutral-300"
                              }`}
                            >
                              {isStartingCamera ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Camera className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-xs font-semibold ${
                                  isLight ? "text-neutral-900" : "text-white"
                                }`}
                              >
                                {isStartingCamera ? "Starting Webcam..." : "Camera Inactive"}
                              </p>
                              <p
                                className={`text-[11px] mt-0.5 ${
                                  isLight ? "text-neutral-500" : "text-neutral-400"
                                }`}
                              >
                                {isStartingCamera
                                  ? "Connecting to local camera hardware..."
                                  : "Start camera to display live video feed on this page."}
                              </p>
                            </div>
                            {!isStartingCamera && (
                              <button
                                type="button"
                                onClick={() => startLiveCamera()}
                                className={`h-9 sm:h-10 px-5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                                  isLight
                                    ? "bg-neutral-900 hover:bg-black text-white"
                                    : "bg-white hover:bg-neutral-200 text-black"
                                }`}
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Start Live Camera</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Viewfinder Controls & Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => captureAndDecodeFrame(false)}
                          disabled={!isCameraActive || isCapturingFrame}
                          className={`flex-1 h-10 sm:h-11 px-6 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                            !isCameraActive || isCapturingFrame
                              ? isLight
                                ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none"
                                : "bg-[#181a24] text-neutral-600 border border-neutral-800 cursor-not-allowed shadow-none"
                              : isLight
                              ? "bg-neutral-900 hover:bg-black text-white cursor-pointer"
                              : "bg-white hover:bg-neutral-200 text-black cursor-pointer"
                          }`}
                        >
                          {isCapturingFrame ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Scanning Frame...</span>
                            </>
                          ) : (
                            <>
                              <ScanLine className="w-3.5 h-3.5" />
                              <span>{isQrScanned ? "Rescan Current Frame" : "Scan Current Frame"}</span>
                            </>
                          )}
                        </button>

                        {/* Switch Camera Facing (front/back) */}
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          disabled={!isCameraActive}
                          title="Flip / Switch Camera Facing"
                          className={`p-2.5 rounded-full border transition-colors ${
                            !isCameraActive
                              ? isLight
                                ? "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed shadow-none"
                                : "bg-[#14151f] border-neutral-800 text-neutral-600 cursor-not-allowed shadow-none"
                              : isLight
                              ? "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 cursor-pointer shadow-xs"
                              : "bg-[#181a24] hover:bg-[#202230] border-neutral-700 text-neutral-300 cursor-pointer"
                          }`}
                        >
                          <FlipHorizontal className="w-4 h-4" />
                        </button>

                        {/* Stop / Restart Camera */}
                        <button
                          type="button"
                          onClick={isCameraActive ? stopLiveCamera : () => startLiveCamera()}
                          title={isCameraActive ? "Stop Camera" : "Start Camera"}
                          className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
                            isLight
                              ? "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-xs"
                              : "bg-[#181a24] hover:bg-[#202230] border-neutral-700 text-neutral-300"
                          }`}
                        >
                          {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Fallback button: Hardware camera scan */}
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Direct device index fallback:
                        </span>
                        <button
                          type="button"
                          onClick={scanViaWebcam}
                          disabled={isScanningWebcam}
                          className="text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white underline font-semibold cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          {isScanningWebcam ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Scanning device...</span>
                            </>
                          ) : (
                            <span>Scan via Hardware (Camera {cameraIndex})</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 2: IP Webcam Stream */}
                  {activeScanOption === "ip_webcam" && (
                    <div
                      className={`p-4 rounded-2xl border space-y-3.5 animate-in fade-in duration-200 ${
                        isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#13141b] border-neutral-800"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-neutral-400" />
                          <span>IP Webcam Address / URL</span>
                        </label>
                        <input
                          type="text"
                          value={ipWebcamUrl}
                          onChange={(e) => setIpWebcamUrl(e.target.value)}
                          placeholder="http://192.168.10.101:8081/video"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none focus:ring-2 focus:ring-neutral-500/20 ${
                            isLight
                              ? "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 shadow-xs"
                              : "bg-[#0f1016] border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-500"
                          }`}
                        />
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Enter your phone's IP Webcam stream URL (e.g. <span className="font-mono text-neutral-700 dark:text-neutral-300 font-medium">http://192.168.x.x:8081/video</span>). Both devices must be on the same Wi-Fi.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={scanViaIpWebcam}
                        disabled={isScanningIp || !ipWebcamUrl.trim()}
                        className={`w-full h-10 sm:h-11 px-6 rounded-full text-xs sm:text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                          isScanningIp || !ipWebcamUrl.trim()
                            ? isLight
                              ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none"
                              : "bg-[#181a24] text-neutral-600 border border-neutral-800 cursor-not-allowed shadow-none"
                            : isLight
                            ? "bg-neutral-900 hover:bg-black text-white cursor-pointer"
                            : "bg-white hover:bg-neutral-200 text-black cursor-pointer"
                        }`}
                      >
                        {isScanningIp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting & Scanning IP Stream...</span>
                          </>
                        ) : (
                          <>
                            <Radio className="w-4 h-4" />
                            <span>Scan via IP Webcam</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                      {cameraError}
                    </div>
                  )}
                </div>

                {/* 2. Settlement Payment Button (shown when QR is scanned & payment pending) */}
                {isQrScanned && paymentStatus === "pending" && (
                  <button
                    type="button"
                    onClick={createRazorpayOrder}
                    disabled={isPayingRazorpay}
                    className={`w-full h-10 sm:h-11 px-6 rounded-full text-xs sm:text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm animate-in fade-in ${
                      isPayingRazorpay
                        ? isLight
                          ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none"
                          : "bg-[#181a24] text-neutral-600 border border-neutral-800 cursor-not-allowed shadow-none"
                        : isLight
                        ? "bg-neutral-900 hover:bg-black text-white cursor-pointer"
                        : "bg-white hover:bg-neutral-200 text-black cursor-pointer"
                    }`}
                  >
                    {isPayingRazorpay ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Nirvana Smart Chain Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {!formInput.receiverAddressW || formInput.receiverAddressW.trim() === ""
                            ? "Pay Manufacturer via Nirvana Smart Chain"
                            : "Pay Wholesaler via Nirvana Smart Chain"}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {/* 3. Validate After Payment (shown when payment completed) */}
                {paymentStatus === "completed" && !isPaymentValidated && (
                  <button
                    type="button"
                    onClick={fetchCardTransactionR}
                    disabled={isValidatingOnChain}
                    className={`w-full h-10 sm:h-11 px-6 rounded-full text-xs sm:text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm animate-in fade-in ${
                      isValidatingOnChain
                        ? isLight
                          ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none"
                          : "bg-[#181a24] text-neutral-600 border border-neutral-800 cursor-not-allowed shadow-none"
                        : isLight
                        ? "bg-neutral-900 hover:bg-black text-white cursor-pointer"
                        : "bg-white hover:bg-neutral-200 text-black cursor-pointer"
                    }`}
                  >
                    {isValidatingOnChain ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating On-Chain...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Validate On Blockchain</span>
                      </>
                    )}
                  </button>
                )}

                {/* 4. Validated Status Banner */}
                {paymentStatus === "validated" && (
                  <div
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium animate-in fade-in ${
                      isLight
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                          Transaction Successfully Validated!
                        </div>
                        {validatedTxHash && (
                          <div className="text-[11px] font-mono text-emerald-700/80 dark:text-neutral-400 mt-0.5">
                            TX: {truncateAddress(validatedTxHash)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isLight
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      Confirmed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. All Transactions Ledger */}
        <div
          className={`border rounded-2xl p-6 transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0c0d11] border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.6)]"
          }`}
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800/80">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-editorial text-xl sm:text-2xl font-light text-neutral-900 dark:text-white">
                  All Recorded Transactions
                </h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isLight
                      ? "bg-neutral-100 text-neutral-800 border border-neutral-200"
                      : "bg-[#181a24] text-neutral-300 border border-neutral-700"
                  }`}
                >
                  {allTransactions.length} shipments found
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                On-chain registry events mapped to your dispensary wallet address
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by Cart ID, address, date..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-400"
                    : "bg-[#13141b] border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-700"
                }`}
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr
                  className={`border-b text-xs font-semibold ${
                    isLight
                      ? "border-neutral-200 text-neutral-600 bg-neutral-50/50"
                      : "border-neutral-800 text-neutral-300 bg-[#121318]"
                  }`}
                >
                  <th className="py-3 px-4">Cart ID</th>
                  <th className="py-3 px-4">Wholesaler</th>
                  <th className="py-3 px-4">Retailer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-sans">
                {currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-neutral-400 text-xs">
                      No matching blockchain transactions recorded for this wallet.
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((tx, idx) => {
                    const statusLower = (tx.status || "").toLowerCase();
                    const isDelivered = statusLower.includes("delivered") || statusLower.includes("received");
                    const isValidated = statusLower.includes("validated") || statusLower.includes("completed");
                    const isTransit = statusLower.includes("transit");

                    return (
                      <tr
                        key={`${tx.cardId}-${idx}`}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50" : "hover:bg-[#15161f]"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                          #{tx.cardId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-300">
                          <span title={tx.receiverAddressW}>{truncateAddress(tx.receiverAddressW)}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-300">
                          <span title={tx.receiverAddressR}>{truncateAddress(tx.receiverAddressR)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                          {tx.date || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-300">
                          <span title={tx.receiverAddressM}>{truncateAddress(tx.receiverAddressM)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isValidated || isDelivered
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : isTransit
                                ? "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border border-neutral-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {tx.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleLiveTracking(tx)}
                            disabled={trackingLoadingId === tx.cardId}
                            className={`h-8 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                              isLight
                                ? "bg-neutral-900 hover:bg-black text-white"
                                : "bg-white hover:bg-neutral-200 text-black"
                            } ${trackingLoadingId === tx.cardId ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {trackingLoadingId === tx.cardId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Navigation className="w-3.5 h-3.5" />
                            )}
                            <span>Live Tracking</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-5 border-t border-neutral-200 dark:border-neutral-800/80 mt-4">
              <div className="text-xs text-neutral-400">
                Page {currentPage} of {totalPages} &bull; Showing {currentTransactions.length} of{" "}
                {filteredTransactions.length}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === 1
                      ? "opacity-40 cursor-not-allowed border-neutral-200 dark:border-neutral-800"
                      : isLight
                      ? "hover:bg-neutral-100 border-neutral-200"
                      : "hover:bg-neutral-800 border-neutral-800 text-white"
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPaginationGroup().map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === num
                        ? isLight
                          ? "bg-neutral-900 text-white shadow-sm"
                          : "bg-white text-black shadow-sm"
                        : isLight
                        ? "text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                        : "text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? "opacity-40 cursor-not-allowed border-neutral-200 dark:border-neutral-800"
                      : isLight
                      ? "hover:bg-neutral-100 border-neutral-200"
                      : "hover:bg-neutral-800 border-neutral-800 text-white"
                  }`}
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes scanLaser {
            0% {
              top: 10%;
              opacity: 0.3;
            }
            50% {
              top: 90%;
              opacity: 1;
            }
            100% {
              top: 10%;
              opacity: 0.3;
            }
          }
          .animate-scan-laser {
            position: absolute;
            animation: scanLaser 2.2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </RetailerLayout>
  );
}
