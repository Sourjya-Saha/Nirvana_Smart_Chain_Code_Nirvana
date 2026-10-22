import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SideCON from '../SidemenuCON';
import Theme from '../../../constants/theme';
import { SkeletonCard } from '../../../components/SkeletonLoader';
import AmbientAura from '../../../components/AmbientAura';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductItem = React.memo(({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.productCard}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.productTopBevel} />
        <View style={styles.productImageWrap}>
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

        <View style={styles.productDetails}>
          <View style={styles.verifiedRow}>
            <View style={styles.safeTag}>
              <Ionicons name="checkmark-circle" size={12} color={Theme.colors.success} />
              <Text style={styles.safeTagText}>Verified</Text>
            </View>
            <Text style={styles.rxText}>Rx Required</Text>
          </View>

          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description || 'Clinical pharmaceutical grade formulation'}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                ₹{Number(item.price_per_unit || 0).toFixed(2)}
              </Text>
              <Text style={styles.mrpLabel}>incl. taxes</Text>
            </View>

            <View style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={Theme.colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default function Category({ route, navigation }) {
  const { categoryName, products, uniqueid } = route.params || {};
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.75)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products || []);

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

  const handleSearch = useCallback(
    (text) => {
      setSearchQuery(text);
      if (!text.trim()) {
        setFilteredProducts(products || []);
        return;
      }

      const searchTerm = text.toLowerCase().trim();
      const filtered = (products || []).filter(
        (product) =>
          product.name && product.name.toLowerCase().includes(searchTerm)
      );
      setFilteredProducts(filtered);
    },
    [products]
  );

  const handleProductPress = useCallback(
    (product) => {
      navigation.navigate('Product', {
        product,
        categoryProducts: products,
        categoryName,
        uniqueid,
      });
    },
    [navigation, products, categoryName, uniqueid]
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Ambient Header Aura ── */}
      <AmbientAura variant="header" />

      {/* iOS Top Navigation Bar */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName || 'Medicines'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredProducts.length} verified item{filteredProducts.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={22} color={Theme.colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Theme.colors.inkMuted48}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${categoryName || 'category'}...`}
            placeholderTextColor={Theme.colors.inkMuted48}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Theme.colors.inkMuted48} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductItem item={item} onPress={handleProductPress} />
        )}
        keyExtractor={(item, index) =>
          item.product_id?.toString() || item.id?.toString() || `prod-${index}`
        }
        style={styles.productList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.productListContent, { paddingBottom: insets.bottom + 40 }]}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={8}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={32} color={Theme.colors.inkMuted48} />
            </View>
            <Text style={styles.emptyTitle}>No matching medicines found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search terms</Text>
          </View>
        }
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
          toggleMenu={toggleMenu}
          uniqueid={uniqueid}
        />
      </Animated.View>
    </View>
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
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
    fontWeight: '400',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    ...Theme.shadows.skeuoCard,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(15, 23, 42, 0.88)',
    fontWeight: '400',
    letterSpacing: 0,
  },
  productList: {
    flex: 1,
  },
  productListContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.canvas,
    marginBottom: 14,
    borderRadius: Theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  productImageWrap: {
    width: 86,
    height: 86,
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
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f7ec',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radius.pill,
  },
  safeTagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.success,
  },
  rxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(100, 116, 139, 0.78)',
    fontWeight: '400',
  },
  productName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 4,
    letterSpacing: 0,
  },
  productDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
    lineHeight: 16,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  productPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.primary,
    letterSpacing: 0,
  },
  mrpLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(100, 116, 139, 0.78)',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f0f5ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radius.pill,
  },
  viewDetailsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 4,
  },
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
});