import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@nirvana_cart_items';
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted cart from local app storage on startup
  useEffect(() => {
    const loadStoredCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }
      } catch (err) {
        console.warn('[CartContext] Failed to load local cart:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStoredCart();
  }, []);

  // Save cart to local app data on every state modification
  useEffect(() => {
    if (!isLoaded) return;
    const saveCartToStorage = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (err) {
        console.warn('[CartContext] Failed to persist local cart:', err);
      }
    };

    saveCartToStorage();
  }, [cartItems, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const pId = product.product_id || product.id;
    setCartItems((prevCart) => {
      const existing = prevCart.find((item) => (item.product_id || item.id) === pId);
      if (existing) {
        return prevCart.map((item) =>
          (item.product_id || item.id) === pId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, product_id: pId, quantity }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        (item.product_id || item.id) === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevCart) =>
      prevCart.filter((item) => (item.product_id || item.id) !== productId)
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {
      console.warn('[CartContext] Failed to clear local cart:', err);
    }
  };

  const totalItems = cartItems.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
  const totalPrice = cartItems.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 1) * Number(item.price_per_unit || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}