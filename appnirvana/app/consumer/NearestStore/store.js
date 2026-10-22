import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  FlatList,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Cart from './cart';
import { useCart } from './CartContext';
import Theme from '../../../constants/theme';
import AmbientAura from '../../../components/AmbientAura';
import { SkeletonCard } from '../../../components/SkeletonLoader';
import TactileButton from '../../../components/TactileButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Store({ route, navigation }) {
  const { uniqueid, storename, storeid, searchMedicines } = route.params || {};
  const insets = useSafeAreaInsets();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantities, setQuantities] = useState({});

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Toggle Cart Drawer
  const toggleMenu = () => {
    if (isMenuVisible) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }).start(() => setIsMenuVisible(false));
    } else {
      setIsMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  };

  // Fetch Products
  const sendStoreIdToAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.29.173:5000/getProducts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: storeid }),
      });

      if (!response.ok) throw new Error('Failed to fetch store inventory');
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching store inventory:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
    setSelectedProductId(null);
  };

  const incrementQuantity = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1,
    }));
  };

  const decrementQuantity = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max((prev[productId] || 1) - 1, 1),
    }));
  };

  // Filter products if prescription OCR medicine list was supplied
  const filteredProducts = products.filter((product) => {
    if (searchMedicines && searchMedicines.length > 0) {
      const searchWords = searchMedicines
        .flatMap((medicine) => medicine.split(/\s+/))
        .map((word) => word.toLowerCase().trim());
      return searchWords.some((word) =>
        product.name.toLowerCase().includes(word)
      );
    }
    return true;
  });

  useEffect(() => {
    sendStoreIdToAPI();
  }, []);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.quantity * item.price_per_unit,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AmbientAura variant="header" />

      {/* Top iOS Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {storename || 'Pharmacy Store'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {products.length} medicines in inventory
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cartIconTopBtn}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Ionicons name="bag-outline" size={22} color={Theme.colors.ink} />
          {cartItems.length > 0 && (
            <View style={styles.cartBadgeDot}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Prescription Filter Banner */}
      {searchMedicines && searchMedicines.length > 0 && (
        <View style={styles.rxFilterBanner}>
          <View style={styles.rxBannerIconWrap}>
            <Ionicons name="document-text" size={16} color={Theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rxFilterTitle}>Prescription Filter Active</Text>
            <Text style={styles.rxFilterText}>
              Showing {filteredProducts.length} matched items
            </Text>
          </View>
        </View>
      )}

      {/* Inventory Catalog List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item, index) => (item.product_id || item.id || `prod-${index}`).toString()}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                cartItems.length > 0
                  ? Math.max(insets.bottom, 16) + 110
                  : Math.max(insets.bottom, 16) + 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cube-outline" size={36} color={Theme.colors.inkMuted48} />
              </View>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySub}>
                This pharmacy does not currently have matching items in stock.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isEditingQty = selectedProductId === item.product_id;
            const currentQty = quantities[item.product_id] || 1;

            return (
              <View style={styles.productCard}>
                <View style={styles.productTopBevel} />
                <View style={styles.productCardLeft}>
                  {item.picture_of_the_prod ? (
                    <Image
                      source={{ uri: item.picture_of_the_prod }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name="medical-outline" size={28} color={Theme.colors.primary} />
                  )}
                </View>

                <View style={styles.productCardRight}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.inStockBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={Theme.colors.success} />
                      <Text style={styles.inStockText}>In Stock</Text>
                    </View>
                    <Text style={styles.mrpSmall}>incl. taxes</Text>
                  </View>

                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{Number(item.price_per_unit || 0).toFixed(2)}
                  </Text>

                  {/* Actions / Quantity Editor */}
                  <View style={styles.actionsRow}>
                    {isEditingQty ? (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => decrementQuantity(item.product_id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={14} color={Theme.colors.ink} />
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyText}>{currentQty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => incrementQuantity(item.product_id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={14} color={Theme.colors.ink} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmAddBtn}
                          onPress={() => handleAddToCart(item, currentQty)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.confirmAddBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.quickAddPill}
                        onPress={() => setSelectedProductId(item.product_id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={14} color={Theme.colors.canvas} />
                        <Text style={styles.quickAddPillText}>Select Qty</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Slide-Over Cart Drawer */}
      {isMenuVisible && (
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
      <Animated.View
        style={[
          styles.drawerSheet,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Cart
          uniqueid={uniqueid}
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          storeid={storeid}
          onClose={toggleMenu}
        />
      </Animated.View>

      {/* Floating Active Cart Capsule */}
      {cartItems.length > 0 && !isMenuVisible && (
        <View
          style={[
            styles.floatingCartWrap,
            { bottom: Math.max(insets.bottom, 16) + 12 },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.floatingCart}
            onPress={toggleMenu}
            activeOpacity={0.9}
          >
            <View style={styles.cartTopHighlight} />
            <View style={styles.cartIconCircle}>
              <Ionicons name="cart" size={16} color={Theme.colors.canvas} />
            </View>
            <View style={styles.floatingCartInfo}>
              <Text style={styles.floatingCartCount}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'} · ₹{totalPrice.toFixed(2)}
              </Text>
              <Text style={styles.floatingCartSubtitle}>Tap to review basket</Text>
            </View>
            <View style={styles.viewCartBtn}>
              <Text style={styles.viewCartBtnText}>View Cart</Text>
              <Ionicons name="chevron-forward" size={14} color={Theme.colors.canvas} />
            </View>
          </TouchableOpacity>
        </View>
      )}
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
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Theme.colors.inkMuted48,
    marginTop: 2,
  },
  cartIconTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cartBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Theme.colors.canvas,
    fontSize: 10,
    fontWeight: '600',
  },
  rxFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff5ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: '#d2e3fc',
  },
  rxBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxFilterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.ink,
  },
  rxFilterText: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginTop: 1,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 14,
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  productTopBevel: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  productCardLeft: {
    width: 82,
    height: 82,
    borderRadius: 18,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  productImage: {
    width: '82%',
    height: '82%',
  },
  productCardRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f7ec',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radius.pill,
  },
  inStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.success,
  },
  mrpSmall: {
    fontSize: 11,
    color: Theme.colors.inkMuted48,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.ink,
    marginTop: 4,
    letterSpacing: Theme.typography.tracking.tight,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginTop: 4,
    letterSpacing: Theme.typography.tracking.tight,
  },
  actionsRow: {
    marginTop: 8,
  },
  quickAddPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.pill,
    ...Theme.shadows.skeuoButton,
  },
  quickAddPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.canvas,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
  },
  stepperQtyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.ink,
    minWidth: 20,
    textAlign: 'center',
  },
  confirmAddBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.pill,
    marginLeft: 4,
    ...Theme.shadows.skeuoButton,
  },
  confirmAddBtnText: {
    color: Theme.colors.canvas,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Theme.shadows.skeuoCircle,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  emptySub: {
    fontSize: 13,
    color: Theme.colors.inkMuted48,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  drawerBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 90,
  },
  drawerSheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: Theme.colors.canvas,
    zIndex: 100,
  },
  floatingCartWrap: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 80,
  },
  floatingCart: {
    backgroundColor: Theme.colors.ink,
    borderRadius: Theme.radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  cartTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  floatingCartInfo: {
    flex: 1,
  },
  floatingCartCount: {
    color: Theme.colors.canvas,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: Theme.typography.tracking.tight,
  },
  floatingCartSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.radius.pill,
    gap: 4,
  },
  viewCartBtnText: {
    color: Theme.colors.canvas,
    fontSize: 12,
    fontWeight: '600',
  },
});