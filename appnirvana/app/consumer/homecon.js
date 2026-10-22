import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  Image,
  Dimensions,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import _ from 'lodash';
import SideCON from './SidemenuCON';
import { useCart } from './NearestStore/CartContext';
import Theme from '../../constants/theme';
import AuroraCard from '../../components/AuroraCard';
import AmbientAura from '../../components/AmbientAura';
import { SkeletonCard } from '../../components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
let cachedProducts = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

const CategoryItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.categoryCard}
    onPress={() => onPress(item)}
    activeOpacity={0.75}
  >
    <View style={styles.categoryImgWrap}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.categoryImage}
          resizeMode="contain"
          fadeDuration={0}
        />
      ) : (
        <Ionicons name="medical-outline" size={24} color={Theme.colors.primary} />
      )}
    </View>
    <Text style={styles.categoryName} numberOfLines={2}>
      {item.category}
    </Text>
  </TouchableOpacity>
));

const FloatingBottomNav = React.memo(({ activeIndex, onToggle, onOpenMenu, bottomInset = 16 }) => {
  const moveAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(moveAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [activeIndex]);

  const translateX = moveAnim.interpolate({
    inputRange: [1, 2],
    outputRange: [0, 88],
  });

  return (
    <View style={[styles.bottomNavContainer, { bottom: Math.max(bottomInset, 16) + 4 }]}>
      <View style={styles.bottomNavDock}>
        <Animated.View
          style={[styles.bottomNavSlider, { transform: [{ translateX }] }]}
        />
        <TouchableOpacity
          style={styles.bottomNavBtn}
          onPress={() => onToggle(1)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={activeIndex === 1 ? Theme.colors.canvas : Theme.colors.inkMuted48}
          />
          <Text
            style={[
              styles.bottomNavText,
              activeIndex === 1 && styles.bottomNavTextActive,
            ]}
          >
            Shop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavBtn}
          onPress={() => onToggle(2)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeIndex === 2 ? Theme.colors.canvas : Theme.colors.inkMuted48}
          />
          <Text
            style={[
              styles.bottomNavText,
              activeIndex === 2 && styles.bottomNavTextActive,
            ]}
          >
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavMenuBtn}
          onPress={onOpenMenu}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function HomeCon({ route, navigation }) {
  const { uniqueid } = route.params || {};
  const insets = useSafeAreaInsets();
  const { cartItems, totalPrice, totalItems, addToCart } = useCart();

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.75)).current;

  const fetchProducts = useCallback(async () => {
    try {
      if (cachedProducts && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
        setCategories(cachedProducts.categories);
        setAllProducts(cachedProducts.raw);
        setLoading(false);
        return;
      }

      const response = await fetch('http://192.168.29.173:5000/getAllProductsGlobal');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data && Array.isArray(data)) {
        setAllProducts(data);
        const categoryGroups = _.groupBy(data, 'category');
        const categoryBoxes = Object.entries(categoryGroups)
          .map(([catName, prods]) => ({
            id: catName,
            category: catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase(),
            image: prods[0]?.picture_of_the_prod,
            products: prods,
          }))
          .filter(item => item.image);

        cachedProducts = { categories: categoryBoxes, raw: data };
        lastFetchTime = Date.now();
        setCategories(categoryBoxes);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleMenu = useCallback(() => {
    const opening = !isMenuVisible;
    const toValue = opening ? 0 : -SCREEN_WIDTH * 0.75;
    Animated.timing(slideAnim, {
      toValue,
      duration: 260,
      useNativeDriver: true,
    }).start();
    setIsMenuVisible(opening);
  }, [isMenuVisible, slideAnim]);

  const handleToggleNav = useCallback(
    (val) => {
      if (val === 2) {
        navigation.navigate('CONorders', { uniqueid });
      }
    },
    [navigation, uniqueid]
  );

  const handleCategoryPress = useCallback(
    (item) => {
      navigation.navigate('Category', {
        categoryName: item.category,
        products: item.products,
        uniqueid,
      });
    },
    [navigation, uniqueid]
  );

  const handleProductPress = useCallback(
    (product) => {
      navigation.navigate('Product', {
        product,
        categoryProducts:
          categories.find(
            cat => cat.category.toLowerCase() === (product.category || '').toLowerCase()
          )?.products || [product],
        categoryName: product.category,
        uniqueid,
      });
    },
    [navigation, uniqueid, categories]
  );

  const handleSearchChange = useCallback(
    (text) => {
      setSearchQuery(text);
      if (!text.trim()) {
        setSearchResults([]);
        return;
      }
      const query = text.toLowerCase().trim();
      const filtered = allProducts.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
      setSearchResults(filtered);
    },
    [allProducts]
  );

  const featuredMedicines = useMemo(() => {
    return allProducts.slice(0, 4);
  }, [allProducts]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AmbientAura variant="header" />

      {/* Top iOS Minimal Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>Nirvana</Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color={Theme.colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <FlatList
        data={searchQuery.trim().length > 0 ? searchResults : [{ key: 'dashboard_content' }]}
        keyExtractor={(item, index) => item.product_id?.toString() || item.key || `item-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              cartItems.length > 0
                ? Math.max(insets.bottom, 16) + 140
                : Math.max(insets.bottom, 16) + 90,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searchQuery.trim().length > 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={Theme.colors.inkMuted48} />
              <Text style={styles.emptyTitle}>No matching medicines found</Text>
              <Text style={styles.emptySubtitle}>Try searching by generic compound or brand</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.key === 'dashboard_content') {
            return (
              <View>
                {/* Greeting & Ethereal Aurora Hero Banner */}
                <View style={styles.heroSection}>
                  <AuroraCard aura="blue" style={styles.auroraHeroCard}>
                    <View style={styles.heroInner}>
                      <View style={styles.heroBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.heroBadgeText}>LIVE PHARMACY</Text>
                      </View>
                      <Text style={styles.greetingTitle}>Your Health, Verified.</Text>
                      <Text style={styles.greetingSub}>
                        Order prescription medicine with direct cold-chain delivery.
                      </Text>

                      {/* Delivery Pill Bar */}
                      <View style={styles.deliveryCard}>
                        <View style={styles.deliveryCardLeft}>
                          <Ionicons name="shield-checkmark" size={16} color={Theme.colors.primary} />
                          <Text style={styles.deliveryLocation}>Verified Cold-Chain Delivery</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.deliverySpeedText}>Direct Supply</Text>
                        </View>
                      </View>
                    </View>
                  </AuroraCard>
                </View>

                {/* iOS Search Bar */}
                <View style={styles.searchSection}>
                  <View style={styles.searchInputWrap}>
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={Theme.colors.inkMuted48}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search medicines, salts, brands..."
                      placeholderTextColor={Theme.colors.inkMuted48}
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => handleSearchChange('')}>
                        <Ionicons name="close-circle" size={18} color={Theme.colors.inkMuted48} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Tactile Quick Action Cards (Zenvest / Track Style) */}
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('Neareststore', { uniqueid })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionIconWrapBlue}>
                      <Ionicons name="storefront" size={20} color={Theme.colors.primary} />
                    </View>
                    <View style={styles.actionTextWrap}>
                      <Text style={styles.actionTitle}>Nearest Store</Text>
                      <Text style={styles.actionSub}>Local stock</Text>
                      <Text style={styles.distanceTagText}>Live GPS search</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('Authentic', { uniqueid })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionIconWrapGreen}>
                      <Ionicons name="shield-checkmark" size={20} color={Theme.colors.success} />
                    </View>
                    <View style={styles.actionTextWrap}>
                      <Text style={styles.actionTitle}>Verify Batch</Text>
                      <Text style={styles.actionSub}>Scan QR code</Text>
                      <Text style={styles.verifiedTagText}>Genuine check</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Categories */}
                <View style={styles.categorySection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <Text style={styles.sectionCountText}>{categories.length} total</Text>
                  </View>

                  {loading ? (
                    <View style={{ gap: 8 }}>
                      <SkeletonCard />
                      <SkeletonCard />
                    </View>
                  ) : error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>Unable to load categories</Text>
                      <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.categoryGrid}>
                      {categories.map(cat => (
                        <CategoryItem
                          key={cat.id}
                          item={cat}
                          onPress={handleCategoryPress}
                        />
                      ))}
                    </View>
                  )}
                </View>

                {/* Featured Medicines */}
                {featuredMedicines.length > 0 && (
                  <View style={styles.featuredSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Featured Medicines</Text>
                    </View>

                    {featuredMedicines.map(prod => (
                      <TouchableOpacity
                        key={prod.product_id}
                        style={styles.medicineCard}
                        onPress={() => handleProductPress(prod)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.medImgWrap}>
                          <Image
                            source={{ uri: prod.picture_of_the_prod }}
                            style={styles.medImage}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.medInfoWrap}>
                          <View style={styles.medBadgeRow}>
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={12} color={Theme.colors.success} />
                              <Text style={styles.verifiedBadgeText}>Verified</Text>
                            </View>
                            <Text style={styles.rxText}>Rx Required</Text>
                          </View>

                          <Text style={styles.medName} numberOfLines={1}>{prod.name}</Text>
                          <Text style={styles.medCategory} numberOfLines={1}>{prod.category}</Text>
                          <Text style={styles.medPrice}>₹{Number(prod.price_per_unit || 0).toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.addBtnPill}
                          onPress={() => addToCart(prod, 1)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={16} color={Theme.colors.canvas} />
                          <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          }

          // Search result row item
          return (
            <TouchableOpacity
              style={styles.searchResultCard}
              onPress={() => handleProductPress(item)}
              activeOpacity={0.75}
            >
              <Image
                source={{ uri: item.picture_of_the_prod }}
                style={styles.searchImg}
                resizeMode="contain"
              />
              <View style={styles.searchInfoWrap}>
                <Text style={styles.searchTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.searchCat} numberOfLines={1}>{item.category}</Text>
                <Text style={styles.searchPrice}>₹{Number(item.price_per_unit || 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={styles.searchAddBtn}
                onPress={() => addToCart(item, 1)}
              >
                <Ionicons name="add" size={18} color={Theme.colors.canvas} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {/* Slide Drawer Modal */}
      {isMenuVisible && (
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
      <Animated.View
        style={[
          styles.drawerContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SideCON
          navigation={navigation}
          uniqueid={uniqueid}
          toggleMenu={toggleMenu}
        />
      </Animated.View>

      {/* Floating Active Cart Capsule */}
      {cartItems.length > 0 && (
        <View
          style={[
            styles.floatingCartContainer,
            { bottom: Math.max(insets.bottom, 16) + 68 },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() =>
              navigation.navigate('Cart', {
                uniqueid,
              })
            }
            activeOpacity={0.9}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartIconCircle}>
                <Ionicons name="cart" size={16} color={Theme.colors.canvas} />
              </View>
              <View>
                <Text style={styles.cartItemCountText}>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} · ₹{Number(totalPrice || 0).toFixed(2)}
                </Text>
                <Text style={styles.cartSubtitle}>Tap to review your order</Text>
              </View>
            </View>
            <View style={styles.viewCartAction}>
              <Text style={styles.viewCartActionText}>View Cart</Text>
              <Ionicons name="chevron-forward" size={14} color={Theme.colors.canvas} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Dual Pill Bottom Navigator */}
      <FloatingBottomNav
        activeIndex={1}
        onToggle={handleToggleNav}
        onOpenMenu={toggleMenu}
        bottomInset={insets.bottom}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.canvasParchment,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },

  // ── Hero Section with AuroraCard
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  auroraHeroCard: {
    padding: 18,
  },
  heroInner: {},
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.pill,
    marginBottom: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  heroBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    letterSpacing: 0.8,
  },
  greetingTitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 26,
    fontWeight: '300',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  greetingSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 4,
    lineHeight: 22,
    letterSpacing: 0,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: 14,
    ...Theme.shadows.skeuoCircle,
  },
  deliveryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
  },
  deliveryDot: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
  },
  deliverySpeedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color: Theme.colors.success,
  },
  deliveryChangeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: Theme.colors.primary,
  },

  // ── Search
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    height: 48,
    ...Theme.shadows.skeuoCard,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    letterSpacing: 0,
  },

  // ── Tactile Quick Actions (Zenvest style)
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl, // 26px squircle
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
  },
  actionIconWrapBlue: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: '#e8f0fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...Theme.shadows.skeuoCircle,
  },
  actionIconWrapGreen: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: '#e6f7ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...Theme.shadows.skeuoCircle,
  },
  actionTextWrap: {},
  actionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  actionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
    letterSpacing: 0,
  },
  distanceTagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color: Theme.colors.primary,
    marginTop: 8,
  },
  verifiedTagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color: Theme.colors.success,
    marginTop: 8,
  },

  // ── Categories
  categorySection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  sectionCountText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  categoryCard: {
    width: Math.max(72, Math.min(94, (SCREEN_WIDTH - 40 - 30) / 4)),
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.lg,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Theme.shadows.skeuoCard,
  },
  categoryImgWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Theme.colors.canvasParchment,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '80%',
    height: '80%',
  },
  categoryName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Featured Medicines
  featuredSection: {
    paddingHorizontal: 20,
    marginTop: 26,
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl, // 26px squircle
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 12,
  },
  medImgWrap: {
    width: 68,
    height: 68,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  medImage: {
    width: '82%',
    height: '82%',
  },
  medInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  medBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: Theme.colors.success,
  },
  rxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  medName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    letterSpacing: 0,
  },
  medCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 1,
  },
  medPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 4,
  },
  addBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.pill,
    ...Theme.shadows.skeuoButton,
  },
  addBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.canvas,
  },

  // ── Search results
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvas,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: Theme.radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
  },
  searchImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Theme.colors.canvasParchment,
    marginRight: 12,
  },
  searchInfoWrap: {
    flex: 1,
  },
  searchTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
  },
  searchCat: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 1,
  },
  searchPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 2,
  },
  searchAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 4,
  },

  // ── Drawer
  drawerBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 90,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: Theme.colors.canvas,
    zIndex: 100,
  },

  // ── Floating Cart
  floatingCartContainer: {
    position: 'absolute',
    bottom: 74,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  floatingCartBar: {
    backgroundColor: Theme.colors.surfaceTile,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Theme.shadows.floating,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemCountText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.canvas,
  },
  cartSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '400',
    color: Theme.colors.inkLight,
  },
  viewCartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.pill,
  },
  viewCartActionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.canvas,
  },

  // ── Bottom Nav — Zenvest-style dark pill
  bottomNavContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  bottomNavDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111214',  // Dark luxury pill like Zenvest reference
    borderRadius: Theme.radius.pill,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Theme.shadows.floating,
  },
  bottomNavSlider: {
    position: 'absolute',
    width: 88,
    height: 40,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.pill,
    left: 5,
  },
  bottomNavBtn: {
    width: 88,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 2,
  },
  bottomNavText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
  },
  bottomNavTextActive: {
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.canvas,
    fontWeight: '600',
  },
  bottomNavMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  // ── Error State
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: Theme.colors.danger,
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Theme.radius.pill,
  },
  retryBtnText: {
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
});
