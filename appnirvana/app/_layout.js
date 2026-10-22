import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { CartProvider } from './consumer/NearestStore/CartContext';
import Theme from '../constants/theme';

import SplashScreen from './SplashScreen';
import HomeCon from './consumer/homecon';
import LandingPage from './LandingPage';
import LoginCon from './LoginCon';
import CONorders from './consumer/Consumerorders/CONorders';
import Neareststore from './consumer/NearestStore/NearestStore';
import Cart from './consumer/NearestStore/cart';
import Store from './consumer/NearestStore/store';
import Orderspage from './consumer/NearestStore/OrderPage';
import Printed from './consumer/OCR/printed';
import Authentic from './consumer/Authenticity/authentic';
import Qrdetails from './consumer/Authenticity/qrdetails';
import Shproute from './consumer/Authenticity/shproute';
import Category from './consumer/products/category';
import Product from './consumer/products/product';

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_300Light: require('../assets/fonts/Inter_300Light.ttf'),
    Inter_400Regular: require('../assets/fonts/Inter_400Regular.ttf'),
  });

  // Hold render until Inter is available — prevents ? / tofu symbols
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Theme.colors.canvas }} />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <CartProvider>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              contentStyle: { backgroundColor: Theme.colors.background },
            }}
            initialRouteName="SplashScreen"
          >
            <Stack.Screen name="SplashScreen" component={SplashScreen} />
            <Stack.Screen name="LandingPage" component={LandingPage} />
            <Stack.Screen name="LoginCon" component={LoginCon} />
            <Stack.Screen name="HomeCon" component={HomeCon} />
            <Stack.Screen name="Authentic" component={Authentic} />
            <Stack.Screen name="CONorders" component={CONorders} />
            <Stack.Screen name="Neareststore" component={Neareststore} />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="Store" component={Store} />
            <Stack.Screen name="Orderspage" component={Orderspage} />
            <Stack.Screen name="Printed" component={Printed} />
            <Stack.Screen name="Qrdetails" component={Qrdetails} />
            <Stack.Screen name="Shproute" component={Shproute} />
            <Stack.Screen name="Category" component={Category} />
            <Stack.Screen name="Product" component={Product} />
          </Stack.Navigator>
        </CartProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}