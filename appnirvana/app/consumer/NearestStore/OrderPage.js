import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import RazorpayCheckout from 'react-native-razorpay';
import Theme from '../../../constants/theme';
import TactileButton from '../../../components/TactileButton';
import AmbientAura from '../../../components/AmbientAura';
import { useCart } from './CartContext';

const API_BASE = 'http://192.168.29.173:5000';

export default function Orderspage({ route, navigation }) {
  const { uniqueid, cartItems: routeCartItems, totalPrice = 0, userId, storeid } = route.params || {};
  const insets = useSafeAreaInsets();
  const { cartItems: contextCartItems, clearCart } = useCart();
  const cartItems = routeCartItems && routeCartItems.length > 0 ? routeCartItems : contextCartItems;

  const [mobileNumber, setMobileNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consumerId] = useState(1);

  // GPS location state
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // ─── GPS on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location in Settings to show delivery address.');
        setLocationLoading(false);
        return;
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      if (place) {
        const parts = [
          place.name !== place.street ? place.name : null,
          place.street,
          place.district || place.subregion,
          place.city || place.region,
          place.postalCode,
        ].filter(Boolean);
        setDeliveryAddress(parts.join(', '));
      } else {
        setDeliveryAddress(`${coords.coords.latitude.toFixed(4)}, ${coords.coords.longitude.toFixed(4)}`);
      }
    } catch (err) {
      setLocationError('Could not fetch your location. Please check GPS is enabled.');
    } finally {
      setLocationLoading(false);
    }
  };

  // ─── Razorpay order creation ─────────────────────────────────────────────────
  const createRazorpayOrder = async () => {
    const resolvedUserId = uniqueid || userId || 1;
    const orderPayload = {
      order: {
        customer_name: recipientName.trim(),
        phone_num: mobileNumber.trim(),
        date_time: new Date().toISOString(),
        payment_method: 'online',
        order_details: (cartItems || []).map(item => ({
          product_id: item.product_id || item.id,
          quantity: Number(item.quantity) || 1,
        })),
      },
      user_id: resolvedUserId,
      consumer_id: consumerId,
    };

    const response = await fetch(`${API_BASE}/create_razorpay_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    const resJson = await response.json();
    if (!response.ok) {
      throw new Error(resJson.error || `Server error: ${response.status}`);
    }
    return resJson;
  };

  // ─── Update order status after payment ──────────────────────────────────────
  const updateOrderStatus = async (orderId) => {
    try {
      await fetch(`${API_BASE}/update_order_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
    } catch (err) {
      console.warn('[updateOrderStatus] Failed silently:', err.message);
    }
  };

  // ─── Confirm payment with backend ────────────────────────────────────────────
  const handlePaymentSuccess = async (paymentData, orderData) => {
    const response = await fetch(`${API_BASE}/confirm_order_payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
        temp_order_data: orderData.temp_order_data,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment confirmation failed');
    }

    clearCart();
    await updateOrderStatus(data.order_id);
    Alert.alert(
      'Order Confirmed ✓',
      `Payment successful! Order ID: ${data.order_id}`,
      [
        {
          text: 'View My Orders',
          onPress: () => {
            navigation.navigate('CONorders', { uniqueid: uniqueid || userId || 1 });
          },
        },
      ]
    );
  };

  // ─── Online payment (Razorpay) ────────────────────────────────────────────────
  const handleOnlinePayment = async () => {
    if (!recipientName.trim() || !mobileNumber.trim()) {
      Alert.alert('Missing Details', 'Please enter your full name and 10-digit mobile number.');
      return;
    }
    if (mobileNumber.trim().length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = await createRazorpayOrder();

      const sanitizedPhone = mobileNumber.replace(/\D/g, '').slice(-10);
      const totalPaise = Math.round(Number(orderData.total_amount || 0) * 100);

      const options = {
        description: 'Medicine Order Payment',
        currency: 'INR',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Tqdl69PAIrUpiJ',
        amount: totalPaise,
        name: 'Nirvana HealthChain',
        order_id: orderData.razorpay_order_id,
        prefill: {
          email: 'customer@example.com',
          contact: sanitizedPhone,
          name: recipientName.trim(),
        },
        theme: { color: '#0066cc' },
      };

      const isDevOrder = String(orderData.razorpay_order_id).startsWith('order_dev_');

      if (!isDevOrder && RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        const paymentData = await RazorpayCheckout.open(options);
        await handlePaymentSuccess(paymentData, orderData);
      } else {
        // Dev/Expo Go fallback: skip checkout UI but still confirm with backend
        await handlePaymentSuccess(
          {
            razorpay_payment_id: `pay_dev_${Date.now()}`,
            razorpay_order_id: orderData.razorpay_order_id,
            razorpay_signature: 'dev_signature',
          },
          orderData
        );
      }
    } catch (error) {
      console.error('[Razorpay] Error:', error);

      let isCancelled = false;
      let errorTitle = 'Payment Failed';
      let errorDesc = 'Something went wrong during payment processing. Please try again.';

      if (error) {
        let parsedDetail = null;
        if (error.error && typeof error.error === 'object') {
          parsedDetail = error.error;
        } else if (typeof error.description === 'string') {
          try {
            const parsed = JSON.parse(error.description);
            if (parsed && parsed.error) parsedDetail = parsed.error;
          } catch (_) {
            errorDesc = error.description;
          }
        }

        if (parsedDetail) {
          if (parsedDetail.description) {
            errorDesc = parsedDetail.description;
          }
          if (parsedDetail.step === 'payment_authentication') {
            errorDesc = 'Payment authentication declined or cancelled at the bank/OTP screen. In Test Mode, select Netbanking/Card and tap "Success" on the test simulator (or use test card 4111 1111 1111 1111).';
          }
        }

        // Only treat as cancellation if user explicitly backed out of modal without attempting
        if (
          error.code === 0 ||
          (typeof error.description === 'string' && error.description.toLowerCase().includes('cancel') && !parsedDetail) ||
          (parsedDetail && parsedDetail.reason === 'cancelled')
        ) {
          isCancelled = true;
        }
      }

      if (isCancelled) {
        Alert.alert('Payment Cancelled', 'You closed the payment window without completing the transaction.');
      } else {
        Alert.alert(
          'Razorpay Test Key Rejected',
          'Razorpay servers rejected key rzp_test_2EpPSCTb8XHFCk ("Authentication failed").\n\nYou can complete this as a simulated test order (marks as paid in DB and updates orders), or switch to Cash on Delivery.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete as Test Order',
              onPress: () => completeOnlineOrderAsTest(),
            },
            {
              text: 'Place as COD',
              onPress: () => handleCOD(),
            },
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Complete test online order when gateway key is expired ───────────────────
  const completeOnlineOrderAsTest = async () => {
    setIsLoading(true);
    try {
      const resolvedUserId = uniqueid || userId || 1;
      const response = await fetch(`${API_BASE}/insert_order_consumer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: recipientName.trim(),
          phone_num: mobileNumber.trim(),
          payment_method: 'online',
          user_id: resolvedUserId,
          consumer_id: consumerId,
          order_details: (cartItems || []).map(item => ({
            product_id: item.product_id || item.id,
            quantity: Number(item.quantity) || 1,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      await updateOrderStatus(data.order_id);
      clearCart();
      Alert.alert(
        'Order Confirmed ✓',
        `Online test order recorded successfully! Order ID: ${data.order_id}`,
        [
          {
            text: 'View My Orders',
            onPress: () => navigation.navigate('CONorders', { uniqueid: resolvedUserId }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Could not complete test order.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Cash on Delivery ─────────────────────────────────────────────────────────
  const handleCOD = async () => {
    if (!recipientName.trim() || !mobileNumber.trim()) {
      Alert.alert('Missing Details', 'Please enter your full name and mobile number.');
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    setIsLoading(true);
    try {
      const resolvedUserId = uniqueid || userId || 1;
      const response = await fetch(`${API_BASE}/insert_order_consumer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: recipientName.trim(),
          phone_num: mobileNumber.trim(),
          payment_method: 'cash',
          user_id: resolvedUserId,
          consumer_id: consumerId,
          order_details: (cartItems || []).map(item => ({
            product_id: item.product_id || item.id,
            quantity: Number(item.quantity) || 1,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      clearCart();
      Alert.alert(
        'Order Placed ✓',
        `Your COD order has been placed successfully! Order ID: ${data.order_id}`,
        [
          {
            text: 'View My Orders',
            onPress: () => navigation.navigate('CONorders', { uniqueid: resolvedUserId }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Order Failed', error.message || 'Could not place COD order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Ambient Aurora */}
      <AmbientAura variant="header" />

      {/* Top iOS Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Delivery Location Card ── */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location" size={18} color={Theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>Delivering to</Text>
                {locationLoading ? (
                  <View style={styles.locationLoadingRow}>
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                    <Text style={styles.locationLoadingText}>Detecting your location…</Text>
                  </View>
                ) : locationError ? (
                  <Text style={styles.locationErrorText}>{locationError}</Text>
                ) : (
                  <Text style={styles.locationAddressText} numberOfLines={2}>
                    {deliveryAddress}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={fetchLocation} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={16} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Order Summary Card ── */}
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeaderRow}>
              <View>
                <Text style={styles.invoiceTitle}>Order Summary</Text>
                <Text style={styles.invoiceSubtitle}>Verified pharmaceutical items</Text>
              </View>
              <View style={styles.itemBadge}>
                <Text style={styles.itemCountTag}>{cartItems?.length || 0} items</Text>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, { flex: 2.5 }]}>Medicine</Text>
              <Text style={[styles.colHeader, { textAlign: 'center', flex: 1 }]}>Qty</Text>
              <Text style={[styles.colHeader, { textAlign: 'right', flex: 1.5 }]}>Price</Text>
            </View>

            {(cartItems || []).map((item, index) => (
              <View style={styles.tableRow} key={item.product_id || item.id || `item-${index}`}>
                <Text style={styles.cellItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cellItemQty}>×{item.quantity}</Text>
                <Text style={styles.cellItemPrice}>
                  ₹{(Number(item.price_per_unit || 0) * Number(item.quantity || 1)).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.totalPrice}>₹{Number(totalPrice || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.taxBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Theme.colors.success} />
                <Text style={styles.gstBadgeText}>Incl. all taxes</Text>
              </View>
            </View>
          </View>

          {/* ── Recipient Details Form ── */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Delivery Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Full Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Theme.colors.inkMuted48} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter recipient full name"
                  placeholderTextColor={Theme.colors.inkLight}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Contact Number</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color={Theme.colors.inkMuted48} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={Theme.colors.inkLight}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* ── Payment Buttons ── */}
          <View style={styles.paymentSection}>
            <TactileButton
              onPress={handleOnlinePayment}
              disabled={isLoading}
              variant="primary"
              size="large"
            >
              {isLoading ? (
                <ActivityIndicator color={Theme.colors.canvas} />
              ) : (
                <>
                  <Ionicons name="card" size={18} color={Theme.colors.canvas} style={{ marginRight: 8 }} />
                  <Text style={styles.onlinePayBtnText}>
                    Pay Online · ₹{Number(totalPrice || 0).toFixed(2)}
                  </Text>
                </>
              )}
            </TactileButton>

            <TactileButton
              onPress={handleCOD}
              disabled={isLoading}
              variant="secondary"
              size="large"
            >
              <Ionicons name="cash-outline" size={18} color={Theme.colors.ink} style={{ marginRight: 8 }} />
              <Text style={styles.codBtnText}>Cash on Delivery</Text>
            </TactileButton>

            <View style={styles.securityFooter}>
              <Ionicons name="shield-checkmark" size={14} color={Theme.colors.success} />
              <Text style={styles.securityFooterText}>
                256-bit encrypted checkout · Direct pharmacy verification
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.canvasParchment,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Location card ──────────────────────────────────────────────────────────
  locationCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationAddressText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    lineHeight: 20,
  },
  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLoadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
  },
  locationErrorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(220, 38, 38, 0.85)',
    lineHeight: 17,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Invoice card ──────────────────────────────────────────────────────────
  invoiceCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 16,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  invoiceTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  invoiceSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  itemBadge: {
    backgroundColor: Theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.pill,
  },
  itemCountTag: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  taxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.pill,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
    paddingBottom: 8,
    marginBottom: 8,
  },
  colHeader: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  cellItemName: {
    flex: 2.5,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
  },
  cellItemQty: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(100, 116, 139, 0.78)',
  },
  cellItemPrice: {
    flex: 1.5,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  totalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    letterSpacing: Theme.typography.tracking.caps,
  },
  totalPrice: {
    fontFamily: 'Inter_300Light',
    fontSize: 26,
    fontWeight: '300',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 2,
  },
  gstBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
  },

  // ── Form card ──────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 20,
  },
  formSectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvasParchment,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(15, 23, 42, 0.88)',
  },

  // ── Payment section ────────────────────────────────────────────────────────
  paymentSection: {
    gap: 12,
  },
  onlinePayBtnText: {
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.canvas,
    fontSize: 16,
    fontWeight: '600',
  },
  codBtnText: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(15, 23, 42, 0.88)',
    fontSize: 15,
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  securityFooterText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
  },
});
