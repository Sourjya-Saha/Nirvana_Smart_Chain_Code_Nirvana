import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from './CartContext';
import Theme from '../../../constants/theme';
import TactileButton from '../../../components/TactileButton';

export default function Cart(props) {
  const {
    uniqueid: propUniqueId,
    storeid: propStoreId,
    onClose: propOnClose,
    cartItems: propCartItems,
    updateQuantity: propUpdateQuantity,
    removeFromCart: propRemoveFromCart,
    route,
  } = props;

  const navigation = useNavigation();
  const contextCart = useCart();
  const insets = useSafeAreaInsets();

  const uniqueid = propUniqueId ?? route?.params?.uniqueid;
  const storeid = propStoreId ?? route?.params?.storeid;
  const onClose = typeof propOnClose === 'function' ? propOnClose : () => navigation.goBack();

  // Support local props (Store inventory) or context (Product screens)
  const cartItems = propCartItems ?? contextCart.cartItems;
  const updateQuantity = propUpdateQuantity ?? contextCart.updateQuantity;
  const removeFromCart = propRemoveFromCart ?? contextCart.removeFromCart;
  const totalPrice = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 1) * Number(item.price_per_unit || 0),
    0
  );

  return (
    <SafeAreaView style={styles.sheetContainer}>
      {/* iOS Tactile Drag Handle */}
      <View style={styles.dragHandleWrap}>
        <View style={styles.dragHandle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping Basket</Text>
          <Text style={styles.headerSubtitle}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={Theme.colors.inkMuted48} />
        </TouchableOpacity>
      </View>

      {/* Prescription & Safety Note */}
      <View style={styles.rxValidationBanner}>
        <Ionicons name="shield-checkmark" size={16} color={Theme.colors.success} />
        <Text style={styles.rxTitle}>All medicines verified genuine & safe</Text>
      </View>

      {/* Delivery Info */}
      <View style={styles.deliveryCard}>
        <View style={styles.deliveryLeft}>
          <Ionicons name="shield-checkmark" size={16} color={Theme.colors.primary} />
          <Text style={styles.deliveryLocation}>Verified Cold-Chain Delivery</Text>
        </View>
        <Text style={styles.speedPillText}>Live Dispatch</Text>
      </View>

      {/* Cart Items Stream */}
      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) => (item.product_id || item.id || `cart-${index}`).toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemImageWrap}>
                  <Image
                    source={{ uri: item.picture_of_the_prod }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.itemBody}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.product_id || item.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={Theme.colors.danger} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemBottomRow}>
                    <View>
                      <Text style={styles.itemPrice}>
                        ₹{((Number(item.quantity) || 1) * Number(item.price_per_unit || 0)).toFixed(2)}
                      </Text>
                      <Text style={styles.unitPriceText}>
                        ₹{Number(item.price_per_unit || 0).toFixed(2)} each
                      </Text>
                    </View>

                    {/* Stepper with circular embossed tactile buttons */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.product_id || item.id, Math.max(1, (Number(item.quantity) || 1) - 1))}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={14} color={Theme.colors.ink} />
                      </TouchableOpacity>
                      <Text style={styles.stepperQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.product_id || item.id, (Number(item.quantity) || 1) + 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={14} color={Theme.colors.ink} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Footer Checkout Summary */}
          <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              <Text style={styles.gstTagText}>Includes all taxes</Text>
            </View>

            <TactileButton
              onPress={() => {
                if (typeof onClose === 'function') onClose();
                navigation.navigate('Orderspage', {
                  uniqueid,
                  cartItems,
                  totalPrice,
                  storeid,
                });
              }}
              variant="primary"
              size="large"
              style={{ width: '100%' }}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={16} color={Theme.colors.canvas} style={{ marginLeft: 6 }} />
            </TactileButton>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={44} color={Theme.colors.inkMuted48} />
          <Text style={styles.emptyTitle}>Your basket is empty</Text>
          <Text style={styles.emptySub}>Add medicines to proceed with your order</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: Theme.colors.canvasParchment,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.hairline,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },
  rxValidationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e6f7ec',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    marginBottom: 10,
  },
  rxTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: Theme.colors.success,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.canvas,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
  },
  deliveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
  },
  speedPillText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Theme.colors.success,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.lg, // 20px squircle
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 10,
    gap: 12,
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '80%',
    height: '80%',
  },
  itemBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  unitPriceText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.canvasParchment,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },
  stepperQtyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.88)',
    minWidth: 14,
    textAlign: 'center',
  },
  footerContainer: {
    backgroundColor: Theme.colors.canvas,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  },
  gstTagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  checkoutBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.canvas,
    letterSpacing: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    textAlign: 'center',
  },
});