"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  ArrowLeft,
  RefreshCw,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Info,
  Truck,
  Sun,
  Moon,
  ShieldCheck,
  Building2,
  Factory,
  Store,
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import ShowAssignedDrivers from "./components/ShowAssignedDrivers";
import ChatComponent from "./components/ChatComponent";
import DeviationTracker from "./components/DeviationTracker";

// Endpoints and Keys from environment with fallbacks
const SOCKET_SERVER = process.env.NEXT_PUBLIC_GEOLOC_SOCKET_URL || "http://localhost:8000";
const API_URL = process.env.NEXT_PUBLIC_GEOLOC_API_URL || "http://127.0.0.1:8000/api";
const MAIN_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const DEFAULT_COORDINATES = {
  center: { lat: 22.5726, lng: 88.3639 },
};

// Dark mode skin for Google Maps
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#161822" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#161822" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e5e7eb" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#242838" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#161822" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2e3448" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a1d28" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c0e14" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }],
  },
];

// Helper to check if an address is valid and not empty / zero address
const isAddressValid = (addr) => {
  if (!addr) return false;
  const cleaned = addr.trim().toLowerCase();
  if (cleaned === "" || cleaned === "n/a" || cleaned === "null" || cleaned === "undefined") return false;
  if (cleaned === "0x0000000000000000000000000000000000000000") return false;
  if (cleaned.replace(/^0x/, "").replace(/0/g, "") === "") return false;
  return true;
};

// Helper to parse coordinates string e.g. "22.5726, 88.3639"
const parseCoordinates = (coordString) => {
  if (!coordString) return null;
  try {
    const parts = coordString.split(",").map((c) => {
      const num = parseFloat(c.trim());
      return isNaN(num) ? null : num;
    });
    if (parts.length < 2 || parts[0] === null || parts[1] === null) return null;
    const [lat, lng] = parts;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  } catch (err) {
    console.error("Error parsing coordinates:", err);
    return null;
  }
};

function ShipmentTrackingInner(props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  // Derive parameters from props or searchParams
  const rawRole =
    props.userRole ||
    searchParams.get("userRole") ||
    auth?.userType ||
    (typeof window !== "undefined" ? localStorage.getItem("userType") : null) ||
    "retailer";
  const userRole = String(rawRole).toLowerCase();
  const userId = props.userId || searchParams.get("userId") || auth?.userId || "";
  const cartId = props.cartId || searchParams.get("cartId") || "";

  const handleBackNavigation = () => {
    switch (userRole) {
      case "manufacturer":
        router.push("/manufacturer/dashboard");
        break;
      case "wholesaler":
        router.push("/wholesaler/shipments");
        break;
      case "distributor":
        router.push("/distributor/shipments");
        break;
      case "retailer":
      default:
        router.push("/retailer/deliveries");
        break;
    }
  };

  const backLabel =
    userRole === "manufacturer"
      ? "Dashboard"
      : userRole === "wholesaler"
      ? "Shipments"
      : userRole === "distributor"
      ? "Shipments"
      : "Deliveries";

  const mAddrParam = searchParams.get("mAddr") || props.mAddr || "";
  const wAddrParam = searchParams.get("wAddr") || props.wAddr || "";
  const rAddrParam = searchParams.get("rAddr") || props.rAddr || "";

  const initialStart =
    props.initialStartLocation ||
    searchParams.get("startLocation") ||
    searchParams.get("initialStartLocation") ||
    "";
  const initialCheckpointVal =
    props.initialCheckpoint ||
    searchParams.get("checkpoint") ||
    searchParams.get("initialCheckpoint") ||
    "";
  const initialDest =
    props.initialDestination ||
    searchParams.get("destination") ||
    searchParams.get("initialDestination") ||
    "";

  // Stakeholder involvement tracking
  const [hasManufacturer, setHasManufacturer] = useState(
    isAddressValid(mAddrParam) && Boolean(initialStart)
  );
  const [hasWholesaler, setHasWholesaler] = useState(
    isAddressValid(wAddrParam) || Boolean(initialCheckpointVal)
  );
  const [hasRetailer, setHasRetailer] = useState(true);

  // States
  const [map, setMap] = useState(null);
  const [driverMarker, setDriverMarker] = useState(null);
  const [startLocation, setStartLocation] = useState(initialStart);
  const [checkpoint, setCheckpoint] = useState(initialCheckpointVal);
  const [destination, setDestination] = useState(initialDest);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState(null);
  const [shipmentDetails, setShipmentDetails] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [routeDeviation, setRouteDeviation] = useState(false);
  const [deviationPath, setDeviationPath] = useState(null);
  const [lastDriverUpdate, setLastDriverUpdate] = useState(null);

  const [locationNames, setLocationNames] = useState({
    start: "",
    checkpoint: "",
    destination: "",
  });

  const locationNamesRef = useRef(locationNames);
  useEffect(() => {
    locationNamesRef.current = locationNames;
  }, [locationNames]);

  // Refs
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const startMarkerRef = useRef(null);
  const checkpointMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const currentInfoWindowRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const routePolylinesRef = useRef([]);

  const addNotification = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  // If coordinates are missing, fetch them from backend and strictly verify involvement
  useEffect(() => {
    const fetchCoordsIfMissing = async () => {
      if (!cartId) return;

      try {
        const res = await fetch(`${MAIN_API_BASE}/get_lats_longs?cart_id=${cartId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const formatCoords = (loc, latKey, longKey) => {
            if (loc && loc[latKey] && loc[longKey]) {
              const lat = parseFloat(loc[latKey]);
              const lng = parseFloat(loc[longKey]);
              if (!isNaN(lat) && !isNaN(lng)) return `${lat}, ${lng}`;
            }
            return "";
          };
          const m = formatCoords(data.manufacturer, "manufacturer_lat", "manufacturer_long");
          const w = formatCoords(data.wholesaler, "wholesaler_lat", "wholesaler_long");
          const r = formatCoords(data.retailer, "retailer_lat", "retailer_long");

          // Manufacturer is only involved if it has both valid address and coordinates
          const isMValid = Boolean(m && isAddressValid(mAddrParam || data.manufacturer?.manufacturer_metamask));
          setHasManufacturer(isMValid);
          if (isMValid) {
            setStartLocation(m);
          } else {
            setStartLocation("");
          }

          const isWValid = Boolean(w && (isAddressValid(wAddrParam || data.wholesaler?.wholesaler_metamask) || Boolean(w)));
          setHasWholesaler(isWValid);
          if (isWValid && w) setCheckpoint(w);

          if (r) {
            setHasRetailer(true);
            setDestination(r);
          }
        }
      } catch (err) {
        console.warn("Auto-fetch coordinates failed:", err);
      }
    };

    fetchCoordsIfMissing();
  }, [cartId, mAddrParam, wAddrParam]);

  // Load Google Maps Script
  useEffect(() => {
    if (!isAuthorized) return;

    if (typeof window !== "undefined") {
      if (typeof window.google?.maps?.Map === "function") {
        setIsGoogleMapsLoaded(true);
        return;
      }

      window.__initGoogleMaps = () => {
        if (typeof window.google?.maps?.Map === "function") {
          setIsGoogleMapsLoaded(true);
        }
      };

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const interval = setInterval(() => {
          if (typeof window.google?.maps?.Map === "function") {
            setIsGoogleMapsLoaded(true);
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      } else {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=__initGoogleMaps`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          addNotification("Google Maps failed to load. Check API Key.", "error");
        };
        document.head.appendChild(script);
      }
    }
  }, [isAuthorized]);

  // Authentication & Verification
  useEffect(() => {
    const verifyAccess = async () => {
      if (!cartId) {
        setIsVerifying(false);
        setVerifyError("No Cart ID specified for tracking telematics.");
        return;
      }

      setIsVerifying(true);
      setVerifyError(null);

      try {
        const response = await axios.post(`${API_URL}/shipment/verify-access`, {
          cart_id: cartId,
          user_id: userId || "retailer_user",
          role: userRole,
        });

        if (response.data.success && response.data.authorized) {
          setIsAuthorized(true);
          if (response.data.shipment) {
            setShipmentDetails(response.data.shipment);
          }
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        setIsAuthorized(true);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAccess();
  }, [userId, cartId, userRole]);

  // Reverse Geocode coordinates to location names
  useEffect(() => {
    const convertToLocationName = async (coords) => {
      try {
        const [lat, lng] = coords.split(",").map((c) => c.trim());
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        return response.data.display_name;
      } catch {
        return coords;
      }
    };

    const updateLocationNames = async () => {
      if (hasManufacturer && startLocation) {
        const startName = await convertToLocationName(startLocation);
        setLocationNames((prev) => ({ ...prev, start: startName }));
      }
      if (hasWholesaler && checkpoint) {
        const checkpointName = await convertToLocationName(checkpoint);
        setLocationNames((prev) => ({ ...prev, checkpoint: checkpointName }));
      }
      if (hasRetailer && destination) {
        const destinationName = await convertToLocationName(destination);
        setLocationNames((prev) => ({ ...prev, destination: destinationName }));
      }
    };

    updateLocationNames();
  }, [startLocation, checkpoint, destination, hasManufacturer, hasWholesaler, hasRetailer]);

  // Initialize Map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || !isAuthorized || typeof window.google?.maps?.Map !== "function") {
      return;
    }

    try {
      // Parse coordinates only for involved stakeholders
      const startCoords = hasManufacturer ? parseCoordinates(startLocation) : null;
      const checkpointCoords = hasWholesaler ? parseCoordinates(checkpoint) : null;
      const destinationCoords = parseCoordinates(destination);

      let effectiveStartCoords = null;
      let effectiveDestinationCoords = null;
      let waypoints = [];
      let routeDescription = "";

      if (startCoords) {
        effectiveStartCoords = startCoords;
        if (destinationCoords) {
          effectiveDestinationCoords = destinationCoords;
          if (checkpointCoords) {
            waypoints = [{ location: checkpointCoords, stopover: true }];
            routeDescription = "Complete manufacturer to retailer route";
          } else {
            routeDescription = "Direct manufacturer to retailer route";
          }
        } else if (checkpointCoords) {
          effectiveDestinationCoords = checkpointCoords;
          routeDescription = "Manufacturer to wholesaler leg";
        }
      } else if (checkpointCoords) {
        // Manufacturer not involved: route begins at Wholesaler!
        effectiveStartCoords = checkpointCoords;
        if (destinationCoords) {
          effectiveDestinationCoords = destinationCoords;
          routeDescription = "Wholesaler to dispensary route";
        }
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: effectiveStartCoords || DEFAULT_COORDINATES.center,
        styles: isLight ? [] : darkMapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
      });

      // Custom Marker with interactive InfoWindow on click
      const createCustomMarker = (position, labelText, title, addressText, color = "#2563eb", roleKey = "") => {
        if (!position) return null;
        const marker = new window.google.maps.Marker({
          position,
          map: mapInstance,
          label: {
            text: labelText,
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "12px",
          },
          title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          },
          animation: window.google.maps.Animation.DROP,
        });

        const getFormattedContent = () => {
          let currentAddress = addressText;
          if (roleKey === "start" && locationNamesRef.current?.start) {
            currentAddress = locationNamesRef.current.start;
          } else if (roleKey === "checkpoint" && locationNamesRef.current?.checkpoint) {
            currentAddress = locationNamesRef.current.checkpoint;
          } else if (roleKey === "destination" && locationNamesRef.current?.destination) {
            currentAddress = locationNamesRef.current.destination;
          }

          const textColor = "#0f172a";
          const subTextColor = "#475569";
          const chipBg = "#f1f5f9";
          const chipText = "#475569";

          return `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px 2px; max-width: 270px; min-width: 190px; box-sizing: border-box; text-align: left;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; color: #ffffff; font-size: 11px; font-weight: 700; flex-shrink: 0;">
                  ${labelText}
                </span>
                <span style="font-size: 13px; font-weight: 600; color: ${textColor}; line-height: 1.2;">
                  ${title}
                </span>
              </div>
              <div style="font-size: 11px; line-height: 1.45; color: ${subTextColor}; word-break: break-word; margin-bottom: 6px;">
                ${currentAddress || `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`}
              </div>
              <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: ${chipBg}; color: ${chipText};">
                ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}
              </div>
            </div>
          `;
        };

        const infoWindow = new window.google.maps.InfoWindow({
          content: getFormattedContent(),
        });

        marker.addListener("click", () => {
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }
          infoWindow.setContent(getFormattedContent());
          infoWindow.open(mapInstance, marker);
          currentInfoWindowRef.current = infoWindow;
        });

        return marker;
      };

      // Only add markers for involved stakeholders
      if (startCoords && hasManufacturer) {
        startMarkerRef.current = createCustomMarker(
          startCoords,
          "M",
          "Manufacturer location",
          locationNames.start || startLocation,
          "#4f46e5",
          "start"
        );
      }
      if (checkpointCoords && hasWholesaler) {
        checkpointMarkerRef.current = createCustomMarker(
          checkpointCoords,
          "W",
          "Wholesaler location",
          locationNames.checkpoint || checkpoint,
          "#0891b2",
          "checkpoint"
        );
      }
      if (destinationCoords) {
        destinationMarkerRef.current = createCustomMarker(
          destinationCoords,
          "R",
          "Retailer location",
          locationNames.destination || destination,
          "#059669",
          "destination"
        );
      }

      if (effectiveStartCoords && effectiveDestinationCoords) {
        const calculateAndRenderRoute = async () => {
          try {
            let RouteClass = window.google?.maps?.routes?.Route;
            if (!RouteClass && window.google?.maps?.importLibrary) {
              const routesLib = await window.google.maps.importLibrary("routes");
              RouteClass = routesLib?.Route;
            }

            if (RouteClass && typeof RouteClass.computeRoutes === "function") {
              const request = {
                origin: effectiveStartCoords,
                destination: effectiveDestinationCoords,
                intermediates: waypoints.map((w) => ({ location: w.location })),
                travelMode: "DRIVING",
              };

              const response = await RouteClass.computeRoutes(request);
              const routes = response?.routes;
              if (routes && routes.length > 0) {
                if (routePolylinesRef.current) {
                  routePolylinesRef.current.forEach((p) => p.setMap(null));
                }
                routePolylinesRef.current = [];

                if (typeof routes[0].createPolylines === "function") {
                  const polylines = routes[0].createPolylines();
                  polylines.forEach((poly) => {
                    poly.setOptions({
                      strokeColor: isLight ? "#2563eb" : "#38bdf8",
                      strokeWeight: 5,
                      strokeOpacity: 0.85,
                    });
                    poly.setMap(mapInstance);
                    routePolylinesRef.current.push(poly);
                  });
                }

                const bounds = new window.google.maps.LatLngBounds();
                if (startCoords && hasManufacturer) bounds.extend(startCoords);
                if (checkpointCoords && hasWholesaler) bounds.extend(checkpointCoords);
                if (destinationCoords) bounds.extend(destinationCoords);
                if (!bounds.isEmpty()) {
                  mapInstance.fitBounds(bounds);
                }

                if (routeDescription) addNotification(routeDescription, "info");
                return;
              }
            }
          } catch (routeErr) {
            console.warn("Route.computeRoutes call info:", routeErr);
          }

          // Fallback only if Route library is unavailable
          try {
            if (window.google?.maps?.DirectionsService && window.google?.maps?.DirectionsRenderer) {
              directionsServiceRef.current = new window.google.maps.DirectionsService();
              directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                map: mapInstance,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: isLight ? "#2563eb" : "#38bdf8",
                  strokeWeight: 5,
                  strokeOpacity: 0.85,
                },
              });

              const request = {
                origin: effectiveStartCoords,
                destination: effectiveDestinationCoords,
                waypoints: waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
              };

              directionsServiceRef.current.route(request, (result, status) => {
                if (status === "OK") {
                  directionsRendererRef.current.setDirections(result);
                  if (routeDescription) addNotification(routeDescription, "info");
                }
              });

              const bounds = new window.google.maps.LatLngBounds();
              if (startCoords && hasManufacturer) bounds.extend(startCoords);
              if (checkpointCoords && hasWholesaler) bounds.extend(checkpointCoords);
              if (destinationCoords) bounds.extend(destinationCoords);
              if (!bounds.isEmpty()) {
                mapInstance.fitBounds(bounds);
              }
            }
          } catch (fallbackErr) {
            console.warn("Directions fallback error:", fallbackErr);
          }
        };

        calculateAndRenderRoute();
      }

      setMap(mapInstance);
      initializeSocket(mapInstance);

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
        if (driverMarker) driverMarker.setMap(null);
        if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
        if (routePolylinesRef.current) {
          routePolylinesRef.current.forEach((p) => p.setMap(null));
          routePolylinesRef.current = [];
        }
        if (startMarkerRef.current) startMarkerRef.current.setMap(null);
        if (checkpointMarkerRef.current) checkpointMarkerRef.current.setMap(null);
        if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
        if (currentInfoWindowRef.current) currentInfoWindowRef.current.close();
      };
    } catch (err) {
      console.error("Map initialization error:", err);
    }
  }, [
    isGoogleMapsLoaded,
    isAuthorized,
    startLocation,
    checkpoint,
    destination,
    hasManufacturer,
    hasWholesaler,
    hasRetailer,
    isLight,
  ]);

  // Update Driver Marker on live socket telemetry
  const updateDriverMarker = (mapInstance, locationData) => {
    if (!mapInstance || !locationData?.latitude || !locationData?.longitude) return;

    try {
      const position = new window.google.maps.LatLng(
        parseFloat(locationData.latitude),
        parseFloat(locationData.longitude)
      );

      if (driverMarker) {
        driverMarker.setPosition(position);
      } else {
        const newMarker = new window.google.maps.Marker({
          position: position,
          map: mapInstance,
          title: "Courier Active Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          animation: window.google.maps.Animation.DROP,
        });

        const driverInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 10px; color: #0f172a;">
              <div style="font-size: 13px; font-weight: 700;">Courier Live Position</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">Active in transit</div>
            </div>
          `,
        });

        newMarker.addListener("click", () => {
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }
          driverInfoWindow.open(mapInstance, newMarker);
          currentInfoWindowRef.current = driverInfoWindow;
        });

        setDriverMarker(newMarker);
      }

      mapInstance.panTo(position);
    } catch (err) {
      console.error("Driver marker positioning error:", err);
    }
  };

  // Socket setup
  const initializeSocket = (mapInstance) => {
    try {
      socketRef.current = io(SOCKET_SERVER, {
        query: {
          user_id: userId,
          cart_id: cartId,
          role: userRole,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      socketRef.current.on("connect", () => {
        setIsConnected(true);

        const parseCoords = (str) => {
          if (!str) return null;
          const [lat, lng] = str.split(",").map((c) => parseFloat(c.trim()));
          return !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;
        };

        const startCoords = hasManufacturer ? parseCoords(startLocation) : null;
        const checkpointCoords = hasWholesaler ? parseCoords(checkpoint) : null;
        const destCoords = parseCoords(destination);

        const waypoints = [];
        if (startCoords) waypoints.push(startCoords);
        if (checkpointCoords) waypoints.push(checkpointCoords);
        if (destCoords) waypoints.push(destCoords);

        if (waypoints.length >= 2) {
          const routeData = {
            cart_id: cartId,
            route_data: {
              metadata: {
                startTime: new Date().toISOString(),
                startLocation: startCoords ? `${startCoords.lat}, ${startCoords.lng}` : "",
                checkpoint: checkpointCoords ? `${checkpointCoords.lat}, ${checkpointCoords.lng}` : "",
                destination: destCoords ? `${destCoords.lat}, ${destCoords.lng}` : "",
              },
              waypoints: waypoints,
            },
          };
          socketRef.current.emit("route-created", routeData);
        }

        socketRef.current.emit("request-initial-state", { cart_id: cartId });
      });

      socketRef.current.on("driver-location-update", (data) => {
        if (mapInstance && data) {
          updateDriverMarker(mapInstance, data);
          setLastDriverUpdate(new Date());
        }
      });

      socketRef.current.on("route-deviation", (data) => {
        handleRouteDeviation(data, mapInstance);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", () => {
        setIsConnected(false);
      });
    } catch (err) {
      console.warn("Socket initialization issue:", err);
    }
  };

  const handleRouteDeviation = (data, mapInstance) => {
    if (data.message === "Driver returned to route") {
      setRouteDeviation(false);
      addNotification("Driver returned to certified corridor", "success");
      clearDeviationPath();
    } else {
      setRouteDeviation(true);
      addNotification(data.message || "Route deviation detected", "warning");
      if (data.start_location && data.current_location && mapInstance) {
        updateDeviationPath(data, mapInstance);
      }
    }
  };

  const updateDeviationPath = (data, mapInstance) => {
    if (!mapInstance) return;
    const { start_location, current_location } = data;
    if (deviationPath) deviationPath.setMap(null);

    const newPath = new window.google.maps.Polyline({
      path: [
        { lat: start_location.lat, lng: start_location.lng },
        { lat: current_location.lat, lng: current_location.lng },
      ],
      strokeColor: "#ef4444",
      strokeWeight: 4,
      strokeOpacity: 0.85,
      map: mapInstance,
    });
    setDeviationPath(newPath);
  };

  const clearDeviationPath = () => {
    if (deviationPath) {
      deviationPath.setMap(null);
      setDeviationPath(null);
    }
  };

  // Drivers Management
  const fetchOnlineDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await axios.post(`${MAIN_API_BASE}/fetch_drivers_online`, {
        user_id: userId,
      });
      if (response.data.drivers && response.data.drivers.length > 0) {
        setDrivers(response.data.drivers);
      } else {
        addNotification("No online couriers currently available", "warning");
        setDrivers([]);
      }
    } catch (err) {
      addNotification(err.response?.data?.error || "Failed to fetch drivers", "error");
      setDrivers([]);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const handleAssignDriver = async (driverId, distributorId) => {
    try {
      const response = await axios.post(`${MAIN_API_BASE}/assign_driver`, {
        cart_id: cartId,
        driver_id: driverId,
        distributor_id: distributorId,
      });
      if (response.status === 200) {
        addNotification(response.data.message || "Driver assigned successfully", "success");
        setShowDriverModal(false);
        setDrivers((prev) => prev.filter((d) => d.generated_unique_id !== driverId));
        fetchOnlineDrivers();
      }
    } catch (err) {
      addNotification(err.response?.data?.error || "Failed to assign driver", "error");
    }
  };

  return (
    <div
      className={`relative w-full h-screen overflow-hidden ${
        isLight ? "bg-slate-50 text-neutral-900" : "bg-[#0c0d12] text-white"
      }`}
    >
      {/* Top Floating Navigation Bar */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-xl ${
          isLight
            ? "bg-white/90 border-neutral-200/90 shadow-sm"
            : "bg-[#0c0d12]/90 border-neutral-800/90 shadow-2xl"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackNavigation}
            className={`flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isLight
                ? "bg-neutral-900 hover:bg-black text-white border border-neutral-900 font-semibold"
                : "bg-white hover:bg-neutral-200 text-black border border-white font-semibold"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </button>

          <div className="h-4 w-px bg-neutral-700/40 hidden sm:block" />

          <div>
            <span className="font-editorial text-lg tracking-tight font-medium">Nirvana Smart-Chain</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Stakeholder Pill */}
          <div
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium ${
              isLight ? "bg-neutral-50 border-neutral-200 text-neutral-800" : "bg-[#13151c] border-neutral-800 text-neutral-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Role: {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Retailer"}</span>
          </div>

          {/* Connected / Disconnected Pill */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium ${
              isConnected
                ? isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-emerald-950/40 border-emerald-800/80 text-emerald-400"
                : isLight
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-rose-950/40 border-rose-800/80 text-rose-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="hidden sm:inline font-semibold">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isLight
                ? "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700"
                : "bg-[#181a24] hover:bg-neutral-800 border-neutral-800 text-neutral-300"
            }`}
            title="Toggle Theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Floating Left Telematics HUD */}
      <aside
        className={`absolute top-20 left-4 sm:left-6 z-10 w-[92%] sm:w-[420px] max-h-[calc(100vh-100px)] overflow-y-auto rounded-3xl p-5 sm:p-6 border shadow-2xl backdrop-blur-2xl transition-all ${
          isLight
            ? "bg-white/95 border-neutral-200 text-neutral-900"
            : "bg-[#0d0e13]/95 border-neutral-800/90 text-white"
        }`}
      >
        <div className="space-y-4">
          {/* Header with Cart ID on Left side */}
          <div className="border-b pb-4 border-neutral-800/40">
            <div className="text-xs font-mono font-semibold tracking-wide text-neutral-400">
              Cart #{cartId || "—"}
            </div>
            <h2 className="font-editorial text-2xl font-light mt-1 tracking-tight">
              Shipment Details
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Real-time route tracking and telematics for your supply chain.
            </p>
          </div>

          {/* Location Cards - Only show parties involved in supply chain */}
          <div className="space-y-2.5">
            {/* Manufacturer Location (Only if involved) */}
            {hasManufacturer && startLocation && (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  isLight
                    ? "bg-neutral-50/90 border-neutral-200"
                    : "bg-[#141620]/90 border-neutral-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isLight ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  <Factory className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className={`text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Manufacturer location
                  </div>
                  <p className="text-xs text-neutral-400 leading-snug break-words">
                    {locationNames.start || startLocation}
                  </p>
                </div>
              </div>
            )}

            {/* Wholesaler Location (Only if involved) */}
            {hasWholesaler && checkpoint && (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  isLight
                    ? "bg-neutral-50/90 border-neutral-200"
                    : "bg-[#141620]/90 border-neutral-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isLight ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className={`text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Wholesaler location
                  </div>
                  <p className="text-xs text-neutral-400 leading-snug break-words">
                    {locationNames.checkpoint || checkpoint}
                  </p>
                </div>
              </div>
            )}

            {/* Retailer Location */}
            {hasRetailer && destination && (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  isLight
                    ? "bg-neutral-50/90 border-neutral-200"
                    : "bg-[#141620]/90 border-neutral-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isLight ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className={`text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Retailer location
                  </div>
                  <p className="text-xs text-neutral-400 leading-snug break-words">
                    {locationNames.destination || destination}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Modules */}
          <div className="pt-2 space-y-2 border-t border-neutral-800/40">
            {/* Real-time Chat Room */}
            <ChatComponent
              userId={userId}
              cartId={cartId}
              role={userRole}
              isLight={isLight}
              socketServer={SOCKET_SERVER}
            />

            {/* Route Deviation Telematics */}
            <DeviationTracker
              cartId={cartId}
              isLight={isLight}
              apiBase={MAIN_API_BASE}
            />

            {/* Wholesaler/Manufacturer Driver Assignment */}
            {(userRole === "wholesaler" || userRole === "manufacturer") && (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setShowDriverModal(true);
                    fetchOnlineDrivers();
                  }}
                  className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Assign Courier Driver</span>
                </button>

                <ShowAssignedDrivers
                  cartId={cartId}
                  isLight={isLight}
                  apiBase={MAIN_API_BASE}
                />
              </div>
            )}
          </div>

          {/* Telemetry Status Footer */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
              isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14161f] border-neutral-800/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="font-medium text-[11px]">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {lastDriverUpdate && (
              <span className="text-[10px] text-neutral-400">
                Ping: {new Date(lastDriverUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Driver Assignment Modal (Wholesaler / Manufacturer) */}
      {showDriverModal && (
        <div className="fixed inset-0 z-[1000] flex justify-center items-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
              isLight
                ? "bg-white border-neutral-200 text-neutral-900"
                : "bg-[#0d0e13] border-neutral-800 text-white"
            }`}
          >
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
                  Available Online Couriers
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Select a registered driver for Cart #{cartId}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchOnlineDrivers}
                  disabled={isLoadingDrivers}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? "hover:bg-neutral-200 text-neutral-600 hover:text-black"
                      : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                  title="Refresh Driver List"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDrivers ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? "hover:bg-neutral-200 text-neutral-600 hover:text-black"
                      : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${
                isLight ? "bg-white text-neutral-900" : "bg-[#090a0e] text-white"
              }`}
            >
              {isLoadingDrivers ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
                  <p className="text-xs text-neutral-500">Scanning network for available couriers...</p>
                </div>
              ) : drivers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-500 space-y-2">
                  <Truck className="w-8 h-8 stroke-1 text-neutral-400" />
                  <p className="text-xs font-medium">No online drivers available at the moment.</p>
                  <button
                    onClick={fetchOnlineDrivers}
                    className={`mt-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isLight
                        ? "bg-neutral-900 hover:bg-black text-white"
                        : "bg-white hover:bg-neutral-200 text-black"
                    }`}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                drivers.map((driver) => (
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
                            isLight ? "text-neutral-900" : "text-white"
                          }`}
                        >
                          {driver.user_name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          ID: <span className="font-mono">{driver.generated_unique_id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-medium">Online &bull; Available</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAssignDriver(driver.generated_unique_id, driver.distributor_id)}
                      className={`h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isLight
                          ? "bg-neutral-900 hover:bg-black text-white"
                          : "bg-white hover:bg-neutral-200 text-black"
                      }`}
                    >
                      Assign &rarr;
                    </button>
                  </div>
                ))
              )}
            </div>

            <div
              className={`p-4 border-t flex justify-end ${
                isLight ? "bg-neutral-50/80 border-neutral-200" : "bg-[#121319]/90 border-neutral-800/80"
              }`}
            >
              <button
                onClick={() => setShowDriverModal(false)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notifications Toast Stack */}
      <div className="fixed top-20 right-4 sm:right-6 z-[1000] flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto p-3.5 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-right duration-200 bg-white text-neutral-900 border-neutral-200"
          >
            <div className="flex items-center gap-2.5">
              {n.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : n.type === "warning" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              ) : n.type === "error" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-cyan-600" />
              )}
              <span className="leading-snug font-medium text-neutral-800">{n.message}</span>
            </div>
            <button
              onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
              className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Full-Screen Google Maps Container */}
      <div
        ref={mapRef}
        className={`w-full h-full z-0 ${isLight ? "light-map-container" : "dark-map-container"}`}
        style={{ width: "100%", height: "100vh" }}
      />
    </div>
  );
}

export default function GeolocationPage(props) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0c0d12] text-white space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-neutral-400">Loading Nirvana Telematics Engine...</p>
        </div>
      }
    >
      <ShipmentTrackingInner {...props} />
    </Suspense>
  );
}
