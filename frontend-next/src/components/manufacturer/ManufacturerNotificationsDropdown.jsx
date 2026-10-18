"use client";

import React, { useState, useMemo } from "react";
import { Bell, CheckCircle2, Clock, AlertTriangle, X, Truck, Boxes, ShoppingBag, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

export default function ManufacturerNotificationsDropdown({
  userId,
  orders = [],
  products = [],
  consignments = [],
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'orders' | 'stock'

  // Format date helper
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

  // Compile notifications
  const allNotifications = useMemo(() => {
    const list = [];

    // 1. Order notifications
    if (Array.isArray(orders)) {
      orders.forEach((o, index) => {
        const partner = o.partnerType || "Buyer";
        list.push({
          id: `order-${(o.partnerType || "order").toLowerCase()}-${o.order_id || index}-${index}`,
          category: "orders",
          title: `${partner} Order #${o.order_id || index + 1}`,
          subtitle: `${partner} • ${o.customer_name || "Customer"}`,
          amount: Number(o.total || 0),
          status: (o.status || "pending").toLowerCase(),
          datetime: o.datetime || o.date_time || null,
          icon: o.status?.toLowerCase() === "paid" ? "paid" : "pending",
        });
      });
    }

    // 2. Stock alerts
    if (Array.isArray(products)) {
      products.forEach((p, index) => {
        const qty = Number(p.quantity_of_uom ?? p.quantity ?? 0);
        const unit = p.uom_name || "units";
        if (qty === 0) {
          list.push({
            id: `stock-out-${p.product_id || p.id || index}-${index}`,
            category: "stock",
            title: `Out of Stock`,
            subtitle: `${p.name} is completely out of stock (0 ${unit})`,
            status: "critical",
            datetime: null,
            icon: "out-of-stock",
          });
        } else if (qty < 15) {
          list.push({
            id: `stock-low-${p.product_id || p.id || index}-${index}`,
            category: "stock",
            title: `Low Stock Alert`,
            subtitle: `${p.name} is running low (${qty} ${unit} left)`,
            status: "warning",
            datetime: null,
            icon: "low-stock",
          });
        }
      });
    }

    // 3. Consignment milestones
    if (Array.isArray(consignments)) {
      consignments.slice(0, 5).forEach((c, index) => {
        list.push({
          id: `consignment-${c.cardId || index}-${index}`,
          category: "orders",
          title: `Shipment #${c.cardId}`,
          subtitle: `Status: ${c.status?.replace(/_/g, " ") || "In Transit"}`,
          status: c.status?.toLowerCase() || "registered",
          datetime: c.date || null,
          icon: "truck",
        });
      });
    }

    // Sort: items with timestamps descending, critical alerts at the top
    return list.sort((a, b) => {
      if (a.status === "critical") return -1;
      if (b.status === "critical") return 1;
      const tA = a.datetime ? new Date(a.datetime).getTime() : 0;
      const tB = b.datetime ? new Date(b.datetime).getTime() : 0;
      return tB - tA;
    });
  }, [orders, products, consignments]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return allNotifications;
    return allNotifications.filter((n) => n.category === activeTab);
  }, [allNotifications, activeTab]);

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full border transition-all cursor-pointer ${
          isLight
            ? "bg-white border-neutral-200 text-neutral-700 hover:text-black hover:border-neutral-400 shadow-xs"
            : "bg-[#0d0e12] border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 shadow-md"
        }`}
        title="Notifications & Operational Alerts"
      >
        <Bell className="w-4 h-4" />
        {allNotifications.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse ${
              isLight ? "bg-neutral-900 text-white" : "bg-white text-black"
            }`}
          >
            {allNotifications.length > 9 ? "9+" : allNotifications.length}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border z-50 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? "bg-white border-neutral-200 text-neutral-900"
                : "bg-[#0d0e12] border-neutral-800 text-white"
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isLight ? "border-neutral-200" : "border-neutral-800/80"}`}>
              <div>
                <h4 className="font-editorial text-lg font-light">Notifications & Updates</h4>
                <p className="text-[11px] text-neutral-500">Recent orders and medicine inventory alerts</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`transition-colors p-1 rounded-lg cursor-pointer ${
                  isLight ? "text-neutral-500 hover:text-black hover:bg-neutral-100" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className={`px-4 pt-2.5 pb-2 border-b flex items-center gap-1.5 text-xs ${isLight ? "border-neutral-100 bg-neutral-50/50" : "border-neutral-800/60 bg-[#121319]"}`}>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? isLight
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-white text-black shadow-xs"
                    : isLight
                    ? "text-neutral-600 hover:text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                All ({allNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  activeTab === "orders"
                    ? isLight
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-white text-black shadow-xs"
                    : isLight
                    ? "text-neutral-600 hover:text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Orders ({allNotifications.filter((n) => n.category === "orders").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stock")}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  activeTab === "stock"
                    ? isLight
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-white text-black shadow-xs"
                    : isLight
                    ? "text-neutral-600 hover:text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Stock ({allNotifications.filter((n) => n.category === "stock").length})
              </button>
            </div>

            {/* Notifications List */}
            <div className={`max-h-96 overflow-y-auto divide-y p-2 space-y-1 ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No notifications recorded under this tab.
                </div>
              ) : (
                filteredNotifications.map((item, idx) => {
                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      className={`p-3 rounded-xl transition-colors space-y-1 ${
                        isLight ? "hover:bg-neutral-50" : "hover:bg-[#13141a]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {item.icon === "paid" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {item.icon === "pending" && (
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          {item.icon === "out-of-stock" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          {item.icon === "low-stock" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          {item.icon === "truck" && (
                            <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          <span className="font-semibold">{item.title}</span>
                        </div>
                        {item.datetime && (
                          <span className="text-[10px] text-neutral-500">
                            {formatDateTime(item.datetime)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
                        <span className="truncate pr-2">{item.subtitle}</span>
                        {item.amount !== undefined && item.amount > 0 && (
                          <span className={`font-mono font-semibold shrink-0 ${isLight ? "text-neutral-900" : "text-white"}`}>
                            ₹{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation */}
            <div className={`p-3 border-t flex items-center justify-between text-xs ${isLight ? "border-neutral-200 bg-neutral-50/70" : "border-neutral-800/80 bg-[#0e0f14]"}`}>
              <Link
                href="/manufacturer/allshipments"
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                <span>All Orders</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link
                href="/manufacturer/warehouse"
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                <span>Warehouse SKUs</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
