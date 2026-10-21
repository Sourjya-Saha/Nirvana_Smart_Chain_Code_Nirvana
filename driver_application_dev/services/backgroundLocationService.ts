import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, Platform } from 'react-native';

export const BACKGROUND_LOCATION_TASK = 'NIRVANA_SHIPMENT_BACKGROUND_TRACKING';

export const STORAGE_KEYS = {
  ACTIVE_CART_ID: '@nirvana_active_cart_id',
  ACTIVE_DRIVER_ID: '@nirvana_active_driver_id',
  BACKEND_URL: '@nirvana_backend_url',
  LAST_LOCATION: '@nirvana_last_location',
  TRACKING_STATUS: '@nirvana_tracking_status',
};

// Headless background task definition.
// Must be defined in global scope so it registers when the headless JS runtime wakes up.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocationTask] TaskManager error:', error.message);
    return;
  }

  if (data) {
    try {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (!locations || locations.length === 0) return;

      const latestLocation = locations[locations.length - 1];
      const cartId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CART_ID);
      const driverId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DRIVER_ID);
      const backendUrl =
        (await AsyncStorage.getItem(STORAGE_KEYS.BACKEND_URL)) || 'http://192.168.10.101:8000';

      if (!cartId) {
        console.log('[BackgroundLocationTask] No active cart ID stored. Skipping transmission.');
        return;
      }

      const locationPayload = {
        cart_id: cartId,
        driver_id: driverId || undefined,
        latitude: latestLocation.coords.latitude,
        longitude: latestLocation.coords.longitude,
        heading: latestLocation.coords.heading || 0,
        speed: 0,
        accuracy: latestLocation.coords.accuracy,
        timestamp: new Date(latestLocation.timestamp).toISOString(),
      };

      // Cache latest position locally
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_LOCATION,
        JSON.stringify(locationPayload)
      );

      // Transmit directly via HTTP POST
      await axios.post(`${backendUrl}/api/driver/location-update`, locationPayload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(
        `[BackgroundLocationTask] Location transmitted for cart ${cartId}: (${latestLocation.coords.latitude.toFixed(
          5
        )}, ${latestLocation.coords.longitude.toFixed(5)})`
      );
    } catch (err: any) {
      console.warn('[BackgroundLocationTask] Transmission warning:', err?.message || err);
    }
  }
});

/**
 * Request both foreground and background location permissions.
 * Explains the requirement for 'Allow all the time' to the driver.
 */
export async function requestAllLocationPermissions(): Promise<{
  success: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
}> {
  try {
    // 1. Foreground permission
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Foreground location permission is necessary to display navigation and route progress.'
      );
      return { success: false, foregroundGranted: false, backgroundGranted: false };
    }

    // 2. Background permission
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    const backgroundGranted = bgStatus === 'granted';

    if (!backgroundGranted) {
      Alert.alert(
        'Background Tracking Notice',
        'To ensure real-time shipment updates continue when the phone is locked, when using Google Maps, or when the app is minimized, please enable "Allow all the time" in your device Location settings.',
        [{ text: 'OK' }]
      );
    }

    return {
      success: backgroundGranted,
      foregroundGranted: true,
      backgroundGranted,
    };
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return { success: false, foregroundGranted: false, backgroundGranted: false };
  }
}

/**
 * Start the persistent background location service with an ongoing Android notification.
 * Works even if the driver switches apps, locks the phone, or swipes the app away.
 */
export async function startBackgroundTracking(
  cartId: string,
  driverId: string,
  backendUrl: string = 'http://192.168.10.101:8000'
): Promise<boolean> {
  try {
    if (!cartId) {
      console.warn('[BackgroundLocation] Cannot start tracking without cartId');
      return false;
    }

    // Store tracking metadata in AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CART_ID, cartId);
    if (driverId) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DRIVER_ID, driverId);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.BACKEND_URL, backendUrl);
    await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_STATUS, 'active');

    // Check if background service is already running
    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isStarted) {
      console.log('[BackgroundLocation] Service already running. Restarting with updated cart ID.');
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    // Launch persistent background tracking
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000, // Update every 3 seconds
      distanceInterval: 0, // Update even when stationary at red lights/traffic
      deferredUpdatesInterval: 3000,
      showsBackgroundLocationIndicator: true, // Blue status bar/pill on iOS
      pausesUpdatesAutomatically: false, // Never pause while stopped in traffic
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'Active Drug Shipment In Transit',
        notificationBody: `Tracking active shipment #${cartId} in real-time.`,
        notificationColor: '#0284C7',
        killServiceOnDestroy: false, // Keeps Android Foreground Service running if app is swiped away
      },
    });

    console.log(`[BackgroundLocation] Started background tracking for cart: ${cartId}`);
    return true;
  } catch (error) {
    console.error('[BackgroundLocation] Failed to start background tracking:', error);
    return false;
  }
}

/**
 * Stop background tracking when delivery is completed or cancelled.
 */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[BackgroundLocation] Stopped background location tracking.');
    }

    const cartId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CART_ID);
    const driverId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DRIVER_ID);
    const backendUrl =
      (await AsyncStorage.getItem(STORAGE_KEYS.BACKEND_URL)) || 'http://192.168.10.101:8000';

    if (cartId) {
      try {
        await axios.post(
          `${backendUrl}/api/driver/tracking-status`,
          { cart_id: cartId, driver_id: driverId, status: 'stopped' },
          { timeout: 4000 }
        );
      } catch (postErr) {
        console.warn('[BackgroundLocation] Failed to notify backend of tracking stop:', postErr);
      }
    }

    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_CART_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_DRIVER_ID);
    await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_STATUS, 'stopped');
  } catch (error) {
    console.error('[BackgroundLocation] Error stopping background tracking:', error);
  }
}

/**
 * Check if the background location service is actively running.
 */
export async function isBackgroundTrackingRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}

/**
 * Retrieve the last known location saved by the background task.
 */
export async function getLastRecordedLocation(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
