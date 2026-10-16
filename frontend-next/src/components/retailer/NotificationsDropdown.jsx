"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, XCircle, AlertTriangle, X, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function NotificationsDropdown({ userId, initialOrders = [], initialTransactions = [] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [manufacturerUsers, setManufacturerUsers] = useState({});

  useEffect(() => {
    const fetchNotificationsData = async () => {
      try {
        let manuUsers = {};
        try {
          const manuRes = await fetch(`${API_BASE}/get_manufacturer_users`);
          if (manuRes.ok) {
            manuUsers = await manuRes.json();
            setManufacturerUsers(manuUsers);
          }
        } catch (e) {
          console.warn("Manufacturers registry fetch note:", e);
        }

        let orders = initialOrders;
        let transactions = initialTransactions;

        if (userId && (!orders.length || !transactions.length)) {
          try {
            const [ordersRes, txRes] = await Promise.all([
              fetch(`${API_BASE}/getAllOrders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
              }),
              fetch(`${API_BASE}/get_all_transactions_retailer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
              }),
            ]);

            if (ordersRes.ok) {
              const oData = await ordersRes.json();
              if (Array.isArray(oData)) orders = oData;
            }
            if (txRes.ok) {
              const tData = await txRes.json();
              if (Array.isArray(tData)) transactions = tData;
            }
          } catch (e) {
            console.warn("Live notification fetch note:", e);
          }
        }

        const combined = [
          ...orders.map((o) => ({
            ...o,
            type: "order",
            id: o.order_id || o._id || o.id || "N/A",
            datetime: o.datetime || null,
            status: o.status || "unpaid",
            total: o.total ?? 0,
            customer_name: o.customer_name || "Customer",
          })),
          ...transactions.map((t) => ({
            ...t,
            type: "transaction",
            id: t.order_id || t.tx_id || t.id || "N/A",
            datetime: t.datetime || null,
            status: t.status || "unpaid",
            total: t.total ?? 0,
            manu_id: t.manu_id || "",
          })),
        ];

        // Sort descending by datetime
        const sorted = combined.sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0));
        setNotifications(sorted.slice(0, 10));
      } catch (err) {
        console.warn("Notifications load warning:", err);
      }
    };

    fetchNotificationsData();
  }, [userId, initialOrders, initialTransactions]);

  const getManufacturerName = (manuId) => {
    if (!manuId) return "Supplier";
    for (const [username, id] of Object.entries(manufacturerUsers)) {
      if (id === manuId) return username;
    }
    return manuId || "Supplier";
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Recent";
    try {
      const ts = Date.parse(dateTimeString);
      if (isNaN(ts)) return "Recent";
      const date = new Date(ts);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full border transition-all ${
          isLight
            ? "bg-white border-neutral-200 text-neutral-700 hover:text-black hover:border-neutral-400"
            : "bg-[#0d0e12] border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 shadow-md"
        }`}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse ${
            isLight ? "bg-neutral-900 text-white" : "bg-white text-black"
          }`}>
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border z-50 overflow-hidden shadow-2xl ${
              isLight
                ? "bg-white border-neutral-200 text-neutral-900"
                : "bg-[#0d0e12] border-neutral-800 text-white"
            } animate-in fade-in zoom-in-95 duration-150`}
          >
            <div className={`flex items-center justify-between p-4 border-b ${isLight ? "border-neutral-200" : "border-neutral-800/80"}`}>
              <h4 className="font-editorial text-lg font-light">Notifications & Activity</h4>
              <button
                onClick={() => setIsOpen(false)}
                className={`transition-colors p-1 ${isLight ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`max-h-96 overflow-y-auto divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"} p-2 space-y-1`}>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">No new alerts for today.</div>
              ) : (
                notifications.map((item, idx) => {
                  const isPaid = (item.status || "").toLowerCase() === "paid";
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl transition-colors ${
                        isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]"
                      } space-y-1`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`text-[11px] font-medium tracking-wide  ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
                          {item.type === "order" ? "Customer Order" : "Stock Purchase"}
                        </span>
                        <span className="text-[10px] text-neutral-500">{formatDateTime(item.datetime)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium truncate">
                          ID: {item.id}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                            isPaid
                              ? isLight
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isLight
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
                        <span className="truncate">
                          {item.type === "order"
                            ? `Customer: ${item.customer_name}`
                            : `Supplier: ${getManufacturerName(item.manu_id)}`}
                        </span>
                        <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          ₹{Number(item.total).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
