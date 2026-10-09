import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {

    // Check if user is already logged in
    const checkLoginStatus = async () => {
      try {
        const driverId = await AsyncStorage.getItem('driverId');
        
        if (driverId) {
          router.replace(`/routeTracking?driverId=${driverId}`);
        } else {
          router.replace('/splash');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        router.replace('/splash');
      }
    };

    checkLoginStatus();
  }, []);

  // Return null as this is just a router component
  return null;
}