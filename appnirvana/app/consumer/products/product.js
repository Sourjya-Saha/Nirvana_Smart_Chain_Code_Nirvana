import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Cart from '../NearestStore/cart';
import { useCart } from '../NearestStore/CartContext';
import Theme from '../../../constants/theme';
import AuroraCard from '../../../components/AuroraCard';
import AmbientAura from '../../../components/AmbientAura';
import TactileButton from '../../../components/TactileButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SimilarProductCard = React.memo(({ product, onPress, onAddToCart }) => (
  <TouchableOpacity
    style={styles.similarProductCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.similarImgWrap}>
      {product.picture_of_the_prod ? (
        <Image
          source={{ uri: product.picture_of_the_prod }}
          style={styles.similarProductImage}
          resizeMode="contain"
        />
      ) : (
        <Ionicons name="medical-outline" size={24} color={Theme.colors.primary} />
      )}
    </View>
    <Text style={styles.similarProductName} numberOfLines={1}>
      {product.name}
    </Text>
    <Text style={styles.similarProductPrice}>
      ₹{Number(product.price_per_unit || 0).toFixed(2)}
    </Text>
    <TouchableOpacity
      style={styles.similarAddBtn}
      onPress={() => onAddToCart(product)}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={14} color={Theme.colors.canvas} />
      <Text style={styles.similarAddBtnText}>Add</Text>
    </TouchableOpacity>
  </TouchableOpacity>
));

export default function Product({ route, navigation }) {
  const {
    product,
    categoryProducts,
    uniqueid,
    storeid,
    categoryName,
  } = route.params || {};

  const insets = useSafeAreaInsets();
  const { cartItems, addToCart, totalItems, totalPrice } = useCart();

  const [similarProducts, setSimilarProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

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

  const navigateToCategory = () => {
    navigation.navigate('Category', {
      categoryName: categoryName || product?.category,
      products: categoryProducts,
      uniqueid,
    });
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleSimilarProductPress = (selectedProduct) => {
    navigation.push('Product', {
      product: selectedProduct,
      categoryProducts,
      categoryName,
      uniqueid,
      storeid,
    });
  };

  useEffect(() => {
    if (categoryProducts && Array.isArray(categoryProducts) && product) {
      const filtered = categoryProducts
        .filter(p => p.product_id !== product.product_id)
        .slice(0, 4);
      setSimilarProducts(filtered);
    }
  }, [product, categoryProducts]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorCenter}>
          <Text style={styles.errorText}>Product details not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const unitTotal = (Number(product.price_per_unit || 0) * quantity).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {product.name}
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

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image Aurora Card */}
        <AuroraCard aura="blue" style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx Required</Text>
            </View>
            <View style={styles.verifiedSafeBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Theme.colors.success} />
              <Text style={styles.verifiedSafeBadgeText}>Verified Safe</Text>
            </View>
          </View>

          <View style={styles.productImageContainer}>
            {product.picture_of_the_prod ? (
              <Image
                source={{ uri: product.picture_of_the_prod }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="medical-outline" size={64} color={Theme.colors.primary} />
            )}
          </View>
        </AuroraCard>

        {/* Product Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.productCategoryLabel}>
            {product.category ? product.category.toUpperCase() : 'MEDICINE'}
          </Text>

          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productPackSize}>
            {product.quantity_of_uom ? `${product.quantity_of_uom} ${product.uom_name || ''}` : 'Standard Pack'}
          </Text>

          {/* Price & Stepper Row */}
          <View style={styles.priceStepperRow}>
            <View>
              <Text style={styles.priceMain}>
                ₹{Number(product.price_per_unit || 0).toFixed(2)}
              </Text>
              <Text style={styles.unitPriceDetail}>Includes all taxes</Text>
            </View>

            {/* Stepper with tactile circular buttons */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={handleDecrement}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color={Theme.colors.ink} />
              </TouchableOpacity>
              <Text style={styles.stepperCount}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={handleIncrement}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={Theme.colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tactile Add Button */}
          <TactileButton
            onPress={() => {
              addToCart(product, quantity);
              Alert.alert('Added to Cart', `${quantity} unit(s) of ${product.name} added to your basket.`);
            }}
            variant="primary"
            style={{ width: '100%' }}
          >
            <Ionicons name="cart-outline" size={18} color={Theme.colors.canvas} style={{ marginRight: 6 }} />
            <Text style={styles.mainAddButtonText}>
              Add to Basket · ₹{unitTotal}
            </Text>
          </TactileButton>
        </View>

        {/* Verified Authenticity / Quality Card */}
        <View style={styles.provenanceCard}>
          <View style={styles.provenanceHeader}>
            <View style={styles.provenanceIconCircle}>
              <Ionicons name="shield-checkmark" size={18} color={Theme.colors.success} />
            </View>
            <View>
              <Text style={styles.provenanceTitle}>Verified Authenticity</Text>
              <Text style={styles.provenanceSub}>Directly tracked from manufacturer</Text>
            </View>
          </View>

          {/* Supply Chain Steps */}
          <View style={styles.pipeline}>
            <View style={styles.pipelineRow}>
              <View style={styles.stepCircleDone}>
                <Ionicons name="checkmark" size={12} color={Theme.colors.canvas} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Licensed Manufacturer</Text>
                <Text style={styles.stepSub}>Produced in certified pharmaceutical facility</Text>
              </View>
            </View>
            <View style={styles.pipelineLine} />
            <View style={styles.pipelineRow}>
              <View style={styles.stepCircleDone}>
                <Ionicons name="checkmark" size={12} color={Theme.colors.canvas} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Temperature Monitored</Text>
                <Text style={styles.stepSub}>Stored under regulated climate control</Text>
              </View>
            </View>
            <View style={styles.pipelineLine} />
            <View style={styles.pipelineRow}>
              <View style={styles.stepCircleDone}>
                <Ionicons name="checkmark" size={12} color={Theme.colors.canvas} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Verified Local Pharmacy</Text>
                <Text style={styles.stepSub}>Dispensed by licensed pharmacist</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Clinical Description Section */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descriptionBody}>
            {product.description ||
              'High-grade pharmaceutical formulation prepared for standard therapeutic usage. Stored and verified under quality-controlled guidelines.'}
          </Text>
        </View>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={styles.sectionHeading}>Similar Medicines</Text>
              <TouchableOpacity onPress={navigateToCategory} activeOpacity={0.7}>
                <Text style={styles.seeMoreLink}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarCarousel}
            >
              {similarProducts.map(p => (
                <SimilarProductCard
                  key={p.product_id}
                  product={p}
                  onPress={() => handleSimilarProductPress(p)}
                  onAddToCart={prod => addToCart(prod, 1)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Slide Drawer for Cart */}
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
          storeid={storeid}
          onClose={toggleMenu}
        />
      </Animated.View>

      {/* Floating Cart Capsule */}
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
              <Text style={styles.viewCartBtnText}>View</Text>
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
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.normal,
  },
  cartIconTopBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Theme.colors.canvas,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // ── Hero Aurora Card
  heroCard: {
    padding: 16,
    marginBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rxBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.pill,
    ...Theme.shadows.skeuoCircle,
  },
  rxBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.danger,
  },
  verifiedSafeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.pill,
    ...Theme.shadows.skeuoCircle,
  },
  verifiedSafeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.success,
  },
  productImageContainer: {
    width: '100%',
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '85%',
    height: '85%',
    ...Theme.shadows.image,
  },

  // ── Details Card
  detailsCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl, // 26px squircle
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 14,
  },
  productCategoryLabel: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.inkMuted48,
    letterSpacing: Theme.typography.tracking.caps,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '300',
    fontFamily: 'Inter_300Light',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
    marginTop: 4,
  },
  productPackSize: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.inkMuted48,
    marginTop: 2,
  },
  priceStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 18,
  },
  priceMain: {
    fontSize: 26,
    fontWeight: '300',
    fontFamily: 'Inter_300Light',
    color: Theme.colors.ink,
  },
  unitPriceDetail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.inkMuted48,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvasParchment,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },
  stepperCount: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.ink,
    paddingHorizontal: 14,
  },
  mainAddButtonText: {
    color: Theme.colors.canvas,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: Theme.typography.tracking.normal,
  },

  // ── Provenance Card
  provenanceCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 14,
  },
  provenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  provenanceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7ec',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },
  provenanceTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  provenanceSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  pipeline: {
    paddingLeft: 4,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepCircleDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  stepSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  pipelineLine: {
    width: 2,
    height: 18,
    backgroundColor: '#d1e7dd',
    marginLeft: 10,
    marginVertical: 4,
  },

  // ── Description Card
  descriptionCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    marginBottom: 8,
  },
  descriptionBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(100, 116, 139, 0.78)',
    lineHeight: 20,
  },

  // ── Similar Section
  similarSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  similarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeMoreLink: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  similarCarousel: {
    gap: 12,
  },
  similarProductCard: {
    width: 144,
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Theme.shadows.skeuoCard,
  },
  similarImgWrap: {
    width: '100%',
    height: 94,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarProductImage: {
    width: '80%',
    height: '80%',
  },
  similarProductName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  similarProductPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 3,
  },
  similarAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 7,
    borderRadius: Theme.radius.pill,
    marginTop: 8,
    ...Theme.shadows.skeuoButton,
  },
  similarAddBtnText: {
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.canvas,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Floating Cart
  floatingCartWrap: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 40,
  },
  floatingCart: {
    backgroundColor: Theme.colors.surfaceTile,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Theme.shadows.floating,
  },
  cartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartInfo: {
    flex: 1,
    marginLeft: 10,
  },
  floatingCartCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.canvas,
  },
  floatingCartSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Theme.colors.inkLight,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.pill,
  },
  viewCartBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.canvas,
  },

  // ── Drawer
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
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: Theme.colors.canvas,
    zIndex: 100,
  },

  errorCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.pill,
  },
  backButtonText: {
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.canvas,
    fontSize: 14,
    fontWeight: '600',
  },
});