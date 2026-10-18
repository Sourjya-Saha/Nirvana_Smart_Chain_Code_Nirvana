"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, X, Loader2, Trash2, UserCheck } from "lucide-react";

export default function ShowAssignedDrivers({
  cartId,
  isLight = false,
  apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",
}) {
  const [showModal, setShowModal] = useState(false);
  const [assignedDrivers, setAssignedDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAssignedDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/fetch_drivers_assigned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      });
      const data = await response.json();
      if (response.ok && data) {
        setAssignedDrivers(Array.isArray(data) ? data : [data]);
      } else {
        setError(data?.error || "Failed to fetch assigned drivers");
      }
    } catch (err) {
      setError(err?.message || "Failed to query assigned drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (driverId) => {
    try {
      await fetch(`${apiBase}/delete_assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, driver_id: driverId }),
      });

      setAssignedDrivers([]);
      setShowModal(false);
    } catch (err) {
      setError(err?.message || "Failed to delete assignment");
    }
  };

  useEffect(() => {
    if (showModal && cartId) {
      fetchAssignedDrivers();
    }
  }, [showModal, cartId]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
          isLight
            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300"
            : "bg-[#181a24] hover:bg-neutral-800 text-neutral-200 border border-neutral-800"
        }`}
      >
        <Users className="w-4 h-4 text-emerald-500" />
        <span>Show Occupied Drivers</span>
      </button>

      {mounted && showModal
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex justify-center items-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div
                className={`w-full max-w-lg max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
                  isLight
                    ? "bg-white border-neutral-200 text-neutral-900"
                    : "bg-[#0d0e13] border-neutral-800 text-white"
                }`}
              >
            {/* Header */}
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                isLight ? "bg-neutral-50/80 border-neutral-200" : "bg-[#121319]/90 border-neutral-800/80"
              }`}
            >
              <div>
                <h3
                  className={`font-editorial text-xl font-light ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  Occupied Consignment Drivers
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cart #{cartId} &bull; Active dispatch personnel
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? "hover:bg-neutral-200 text-neutral-600 hover:text-black"
                    : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${
                isLight ? "bg-white text-neutral-900" : "bg-[#090a0e] text-white"
              }`}
            >
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
                  <p className="text-xs text-neutral-500">Loading assigned driver records...</p>
                </div>
              ) : error ? (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    isLight
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-rose-950/40 border-rose-800/80 text-rose-300"
                  }`}
                >
                  <p>{error}</p>
                  <button
                    onClick={fetchAssignedDrivers}
                    className="mt-2 underline font-semibold cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : assignedDrivers.length === 0 || !assignedDrivers[0]?.generated_unique_id ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-500 space-y-2">
                  <UserCheck className="w-8 h-8 stroke-1 text-neutral-400" />
                  <p className="text-xs font-medium">No drivers currently assigned to this consignment.</p>
                </div>
              ) : (
                assignedDrivers.map((driver) => (
                  <div
                    key={driver.generated_unique_id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-900"
                        : "bg-[#13141a] border-neutral-800 hover:border-neutral-700 text-neutral-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isLight ? "bg-neutral-900 text-white" : "bg-white text-black"
                        }`}
                      >
                        {driver.user_name ? driver.user_name.charAt(0).toUpperCase() : "D"}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={`font-semibold text-xs ${
                            isLight ? "text-neutral-900" : "text-neutral-100"
                          }`}
                        >
                          {driver.user_name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          ID: <span className="font-mono">{driver.generated_unique_id}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAssignment(driver.generated_unique_id)}
                      className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isLight
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          : "bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-800"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Unassign</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t flex justify-end ${
                isLight ? "bg-neutral-50/80 border-neutral-200" : "bg-[#121319]/90 border-neutral-800/80"
              }`}
            >
              <button
                onClick={() => setShowModal(false)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
