"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, MapPin, Clock, X, Loader2, CheckCircle2 } from "lucide-react";

export default function DeviationTracker({
  cartId,
  isLight = false,
  apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",
  googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
}) {
  const [deviationData, setDeviationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen && cartId) {
      fetchDeviationData();
    }
  }, [isModalOpen, cartId]);

  const fetchDeviationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/get_deviation_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch route deviation telematics.");
      }

      const data = await response.json();

      if (data.message === "No deviation data" || !data || Object.keys(data).length === 0) {
        setDeviationData({});
        setLoading(false);
        return;
      }

      const sortedData = Object.entries(data)
        .sort((a, b) => new Date(b[1].start.timestamp) - new Date(a[1].start.timestamp))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      setDeviationData(sortedData);
      fetchLocationNames(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationNames = async (data) => {
    const locationCache = {};

    for (const entry of Object.values(data)) {
      const { start, end } = entry;
      const startKey = `${start.location.lat},${start.location.lng}`;
      const endKey = `${end.location.lat},${end.location.lng}`;

      if (!locationCache[startKey]) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${start.location.lat},${start.location.lng}&key=${googleMapsApiKey}`
          );
          const geocode = await res.json();
          if (geocode.results && geocode.results[0]) {
            locationCache[startKey] = geocode.results[0].formatted_address;
          } else {
            locationCache[startKey] = `${start.location.lat.toFixed(4)}, ${start.location.lng.toFixed(4)}`;
          }
        } catch {
          locationCache[startKey] = `${start.location.lat.toFixed(4)}, ${start.location.lng.toFixed(4)}`;
        }
      }

      if (!locationCache[endKey]) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${end.location.lat},${end.location.lng}&key=${googleMapsApiKey}`
          );
          const geocode = await res.json();
          if (geocode.results && geocode.results[0]) {
            locationCache[endKey] = geocode.results[0].formatted_address;
          } else {
            locationCache[endKey] = `${end.location.lat.toFixed(4)}, ${end.location.lng.toFixed(4)}`;
          }
        } catch {
          locationCache[endKey] = `${end.location.lat.toFixed(4)}, ${end.location.lng.toFixed(4)}`;
        }
      }
    }

    setLocations(locationCache);
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
      });
    } catch {
      return String(timestamp);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
          isLight
            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300"
            : "bg-[#181a24] hover:bg-neutral-800 text-neutral-200 border border-neutral-800"
        }`}
      >
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span>View Route Deviations</span>
      </button>

      {mounted && isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex justify-center items-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div
                className={`w-full max-w-xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
                  isLight
                    ? "bg-white border-neutral-200 text-neutral-900"
                    : "bg-[#0d0e13] border-neutral-800 text-white"
                }`}
              >
            {/* Modal Header */}
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
                  Route Deviation Telematics
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Consignment Cart #{cartId} &bull; Sensor-tracked route compliance
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? "hover:bg-neutral-200 text-neutral-600 hover:text-black"
                    : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${
                isLight ? "bg-white text-neutral-900" : "bg-[#090a0e] text-white"
              }`}
            >
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  <p className="text-xs text-neutral-500">Querying telemetry for transit anomalies...</p>
                </div>
              ) : error ? (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                    isLight
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-rose-950/40 border-rose-800/80 text-rose-300"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              ) : deviationData && Object.keys(deviationData).length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-500 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 stroke-1" />
                  <p className={`text-sm font-medium ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                    No route deviations recorded
                  </p>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    The driver remained strictly within the designated corridor throughout this consignment leg.
                  </p>
                </div>
              ) : deviationData ? (
                Object.entries(deviationData).map(([key, entry]) => {
                  const startKey = `${entry.start.location.lat},${entry.start.location.lng}`;
                  const endKey = `${entry.end.location.lat},${entry.end.location.lng}`;

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border space-y-3 transition-all ${
                        isLight
                          ? "bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-900"
                          : "bg-[#13141a] border-neutral-800 hover:border-neutral-700 text-neutral-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLight
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-amber-950/60 text-amber-300 border-amber-800"
                          }`}
                        >
                          Deviation Incident #{parseInt(key) + 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                          <span>{entry.start?.distance ? entry.start.distance.toFixed(2) : "0.00"}</span>
                          <span className="text-[10px] text-neutral-500 uppercase font-medium">meters off-path</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs pt-1">
                        {/* Start Point */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[10px] uppercase font-semibold text-neutral-500">Deviation Origin</span>
                            <p
                              className={`font-medium leading-relaxed ${
                                isLight ? "text-neutral-900" : "text-neutral-200"
                              }`}
                            >
                              {locations[startKey] || startKey}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-neutral-500 pt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(entry.start?.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        {/* End Point */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[10px] uppercase font-semibold text-neutral-500">Corridor Recovery Point</span>
                            <p
                              className={`font-medium leading-relaxed ${
                                isLight ? "text-neutral-900" : "text-neutral-200"
                              }`}
                            >
                              {locations[endKey] || endKey}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-neutral-500 pt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(entry.end?.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : null}
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t flex justify-end ${
                isLight ? "bg-neutral-50/80 border-neutral-200" : "bg-[#121319]/90 border-neutral-800/80"
              }`}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Close Telematics
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
