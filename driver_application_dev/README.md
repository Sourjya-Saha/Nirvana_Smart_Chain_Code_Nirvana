# Nirvana Smart Chain — Driver Mobile App (Dev Build with 24/7 Background Tracking)

This application is the **development build** of the Driver App with enterprise-grade **Continuous Background Location Tracking** and **Android Foreground Service** support for pharmaceutical drug supply chain monitoring.

---

## 🚀 Key Features Added

1. **Continuous Background Location Tracking**:
   - Location is transmitted continuously when:
     - The app is minimized
     - The phone screen is locked/turned off
     - The driver opens Google Maps or switches to another app
   - High-precision navigation accuracy (`Location.Accuracy.BestForNavigation`).

2. **Android Foreground Service (Sticky Notification)**:
   - Registers a native Android Foreground Service with an ongoing notification (`killServiceOnDestroy: false`).
   - Ensures continuous transmission even if the driver swipes away/clears the app from the Android "Recent Apps" tray.
   - Ongoing system notification: *"Active Drug Shipment In Transit - Tracking active shipment #..."*

3. **Hybrid Transmission Architecture (WebSocket + Headless HTTP POST)**:
   - When app is in foreground: Uses real-time WebSocket events (`driver-location-update`) for instantaneous map and camera tracking.
   - When app is backgrounded / killed: Uses headless background tasks (`expo-task-manager`) posting to `/api/driver/location-update` over HTTP REST with automatic retry.

4. **Battery & Traffic-Aware Tuning**:
   - Configured with `timeInterval: 4000` (4 seconds) and `distanceInterval: 5` (5 meters).
   - `pausesLocationUpdatesAutomatically: false` ensures tracking does not pause while stopped at traffic lights.
   - `activityType: AutomotiveNavigation` instructs OS GPS chip to optimize for vehicular movement.

---

## 🛠️ Prerequisites & Setup

### 1. Install Dependencies
Navigate into this folder:
```bash
cd driver_application_dev
npm install
```

> **Note:** Background location tracking with foreground services requires native capabilities. Standard Expo Go sandbox cannot run persistent background services; you must run a **Development Build** or create an **EAS APK**.

---

## 📦 How to Build and Run

### Option A: Local Development Build (Recommended for Fast Testing)

Generate native project folders and run directly on your connected Android phone or emulator:

```bash
# 1. Prebuild native Android project
npx expo prebuild --platform android

# 2. Run directly on connected Android device (with USB debugging enabled)
npx expo run:android
```

### Option B: Build Standalone APK with EAS (No Android Studio required)

Install EAS CLI globally if you haven't already:
```bash
npm install -g eas-cli
eas login
```

Build a standalone APK that can be directly installed on any driver's phone:
```bash
npm run build:apk
# Or: eas build --profile preview --platform android
```

EAS will generate a cloud download link for the `.apk` file.

---

## 📱 Driver Phone Permissions Setup

For continuous 24/7 location transmission to work without OS battery interference:

1. **Location Permission**:
   - When the app prompts, choose **"While using the app"**, then when prompted in Android Settings, select **"Allow all the time"**.
2. **Battery Optimization (Crucial on Xiaomi, Samsung, OnePlus, Vivo)**:
   - Go to phone **Settings > Apps > Nirvana Driver Dev > Battery**.
   - Change from **"Optimized"** to **"Unrestricted"**.
   - Enable **"Allow background activity"** and **"Autostart"** (on Xiaomi/MIUI).

---

## 🌐 Backend Endpoints

- **WebSocket**: `http://<YOUR_IP>:8000` (event: `driver-location-update`)
- **HTTP Background Endpoint**: `POST http://<YOUR_IP>:8000/api/driver/location-update`
  - Body:
    ```json
    {
      "cart_id": "CART_123",
      "driver_id": "DRIVER_456",
      "latitude": 22.5726,
      "longitude": 88.3639,
      "heading": 142.5,
      "speed": 8.2,
      "timestamp": "2026-10-21T18:15:00.000Z"
    }
    ```
