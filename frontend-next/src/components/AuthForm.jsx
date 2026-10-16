"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Eye, EyeOff, MapPin, AlertCircle, ArrowLeft } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function AuthForm({ authType, userType, redirectPath }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [metamaskAdd, setMetamaskAdd] = useState("");
  const [userLat, setUserLat] = useState("");
  const [userLong, setUserLong] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLat(latitude.toString());
          setUserLong(longitude.toString());
          alert("Location coordinates fetched successfully.");
        },
        () => {
          alert("Unable to fetch your current location. Please verify browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = authType === "signup"
      ? `${API_BASE}/signup`
      : `${API_BASE}/login`;

    const requestData = {
      username,
      password,
      user_type: userType,
    };

    if (authType === "signup") {
      requestData.user_lat = userLat;
      requestData.user_long = userLong;
      if (userType !== "distributor") {
        requestData.metamask_add = metamaskAdd;
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        if (authType === "signup") {
          router.push(`/login/${userType}`);
        } else {
          const finalId = data.unique_user_id || username;
          login(finalId, userType, username);
          router.push(redirectPath);
        }
      } else {
        setError(data.error || data.message || "Authentication failed. Please check your credentials.");
      }
    } catch (err) {
      setError(
        "Network connection error. Ensure the backend server is running on " + API_BASE
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeDisplay = () => {
    switch (userType) {
      case "manufacturer":
        return "Manufacturer";
      case "wholesaler":
        return "Wholesaler";
      case "retailer":
        return "Retailer";
      case "distributor":
        return "Distributor";
      default:
        return userType;
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-6 sm:p-12 pt-24 sm:pt-32 overflow-hidden ${isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"} transition-colors duration-200`}>
      {/* Main Editorial Card */}
      <div className={`relative z-10 w-full max-w-[460px] ${
        isLight
          ? "bg-white border-neutral-200 text-neutral-900 shadow-sm"
          : "bg-[#0d0e12] border-neutral-800/90 text-white shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
      } border rounded-2xl p-8 sm:p-10 space-y-8 transition-colors duration-200`}>
        {/* Navigation Breadcrumb / Back */}
        <div className={`flex items-center justify-between border-b ${isLight ? "border-neutral-100" : "border-neutral-800/80"} pb-4`}>
          <Link
            href="/auth/login"
            className={`inline-flex items-center gap-1.5 text-xs ${isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"} transition-colors`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Portals
          </Link>
          <span className={`text-[12px] font-medium tracking-normal px-3 py-1 rounded-full ${isLight ? "bg-neutral-100 text-neutral-800" : "bg-[#16171d] border border-neutral-700/60 text-neutral-200"}`}>
            {getUserTypeDisplay()}
          </span>
        </div>

        {/* Editorial Heading */}
        <div className="space-y-2">
          <h1 className={`font-editorial text-3xl sm:text-[34px] font-light tracking-[-0.02em] ${isLight ? "text-neutral-900" : "text-white"} leading-[1.15]`}>
            {authType === "signup" ? "Enroll Stakeholder" : "Authenticate Identity"}
          </h1>
          <p className={`text-sm ${isLight ? "text-neutral-600" : "text-neutral-400"} font-normal leading-relaxed`}>
            {authType === "signup"
              ? `Register a verified ${getUserTypeDisplay().toLowerCase()} account on the network.`
              : `Access your ${getUserTypeDisplay().toLowerCase()} portal with your credentials.`}
          </p>
        </div>


        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className={`block text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-300"} tracking-[0.16px]`}
            >
              Username / Operator ID
            </label>
            <input
              type="text"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. pharma_operator"
              className={`w-full h-11 px-4 rounded-lg border text-[15px] focus:outline-none transition-all ${
                isLight
                  ? "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black"
                  : "bg-[#13141a] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600"
              }`}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className={`block text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-300"} tracking-[0.16px]`}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full h-11 pl-4 pr-11 rounded-lg border text-[15px] focus:outline-none transition-all ${
                  isLight
                    ? "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black"
                    : "bg-[#13141a] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`absolute right-3.5 top-3 ${isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"} transition-colors`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Additional fields for Signup only */}
          {authType === "signup" && (
            <div className={`space-y-4 pt-2 border-t ${isLight ? "border-neutral-200" : "border-neutral-800/80"}`}>
              {/* Metamask (non-distributor) */}
              {userType !== "distributor" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="metamask_add"
                    className={`block text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-300"} tracking-[0.16px]`}
                  >
                    MetaMask / Ethereum Public Address
                  </label>
                  <input
                    type="text"
                    id="metamask_add"
                    required
                    value={metamaskAdd}
                    onChange={(e) => setMetamaskAdd(e.target.value)}
                    placeholder="0x71C...49A1"
                    className={`w-full h-11 px-4 rounded-lg border text-[15px] focus:outline-none transition-all ${
                      isLight
                        ? "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black"
                        : "bg-[#13141a] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                    }`}
                  />
                </div>
              )}

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="user_lat"
                    className={`block text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-300"}`}
                  >
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="user_lat"
                    required
                    readOnly
                    value={userLat}
                    onChange={(e) => setUserLat(e.target.value)}
                    placeholder="Fetch coords"
                    className={`w-full h-11 px-4 rounded-lg border text-xs ${
                      isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#13141a] border-neutral-800 text-neutral-400"
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="user_long"
                    className={`block text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-300"}`}
                  >
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="user_long"
                    required
                    readOnly
                    value={userLong}
                    onChange={(e) => setUserLong(e.target.value)}
                    placeholder="Fetch coords"
                    className={`w-full h-11 px-4 rounded-lg border text-xs ${
                      isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#13141a] border-neutral-800 text-neutral-400"
                    }`}
                  />
                </div>
              </div>

              {/* Button to fetch current location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className={`w-full h-10 rounded-full border text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isLight
                    ? "border-neutral-300 hover:border-black text-neutral-800 bg-transparent"
                    : "border-neutral-700/80 hover:border-neutral-500 text-neutral-200 bg-[#16171d]"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Capture Device Coordinates
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-11 rounded-full text-[14px] font-semibold flex items-center justify-center transition-all shadow-sm disabled:opacity-50 cursor-pointer ${
              isLight
                ? "bg-neutral-900 hover:bg-black text-white"
                : "bg-white hover:bg-neutral-200 text-black"
            }`}
          >
            {isLoading
              ? "Verifying..."
              : authType === "signup"
              ? `Register ${getUserTypeDisplay()} Account`
              : `Sign in as ${getUserTypeDisplay()}`}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className={`pt-2 text-center text-sm ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
          {authType === "signup" ? (
            <p>
              Already registered?{" "}
              <Link
                href={`/auth/login/${userType}`}
                className={`${isLight ? "text-black" : "text-white"} font-medium underline underline-offset-4 hover:opacity-80`}
              >
                Sign in here
              </Link>
            </p>
          ) : (
            <p>
              Need a verified portal account?{" "}
              <Link
                href={`/auth/signup/${userType}`}
                className={`${isLight ? "text-black" : "text-white"} font-medium underline underline-offset-4 hover:opacity-80`}
              >
                Enroll here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
