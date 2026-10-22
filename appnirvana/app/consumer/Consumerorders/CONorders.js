import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../../constants/theme';
import { SkeletonCard } from '../../../components/SkeletonLoader';
import AmbientAura from '../../../components/AmbientAura';

let _cachedMap = null;
let _lastFetch = null;
const CACHE_MS = 5 * 60 * 1000;

const getProductCache = async () => {
  if (_cachedMap && _lastFetch && Date.now() - _lastFetch < CACHE_MS) return _cachedMap;
  const res = await fetch('http://192.168.29.173:5000/getAllProductsGlobal');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  _cachedMap = new Map();
  data.forEach(p => {
    _cachedMap.set(String(p.product_id), p);
    _cachedMap.set(Number(p.product_id), p);
  });
  _lastFetch = Date.now();
  return _cachedMap;
};

const StatusChip = ({ status }) => {
  const isPaid = status === 'paid';
  return (
    <View
      style={[
        styles.statusChip,
        isPaid ? styles.paidChip : styles.pendingChip,
      ]}
    >
      <Ionicons
        name={isPaid ? 'checkmark-circle' : 'time-outline'}
        size={12}
        color={isPaid ? Theme.colors.success : Theme.colors.inkMuted48}
      />
      <Text
        style={[
          styles.statusText,
          { color: isPaid ? Theme.colors.success : Theme.colors.inkMuted48 },
        ]}
      >
        {isPaid ? 'Delivered' : 'Processing'}
      </Text>
    </View>
  );
};

const ProductDropdown = ({ resolvedProducts, visible, navigation, uniqueid }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 2,
    }).start();
  }, [visible]);

  const calculatedHeight = Math.min(resolvedProducts.length * 70 + 44, 340);
  const maxHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, calculatedHeight],
  });
  const opacity = anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.5, 1] });

  if (resolvedProducts.length === 0) return null;

  return (
    <Animated.View style={[styles.dropdown, { maxHeight, opacity }]}>
      <ScrollView
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.dropdownInner}
      >
        <Text style={styles.dropdownTitle}>Items in this order</Text>
        {resolvedProducts.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.dropdownRow,
              i < resolvedProducts.length - 1 && styles.dropdownRowBorder,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              if (navigation) {
                navigation.navigate('Product', {
                  product: p,
                  categoryProducts: [p],
                  categoryName: p.category,
                  uniqueid,
                });
              }
            }}
          >
            <Image
              source={{ uri: p.picture_of_the_prod }}
              style={styles.dropdownImg}
              resizeMode="contain"
            />
            <View style={styles.dropdownInfo}>
              <Text style={styles.dropdownName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.dropdownCategory}>{p.category}</Text>
            </View>
            <View style={styles.dropdownRight}>
              <Text style={styles.dropdownPrice}>
                ₹{Number(p.price_per_unit || 0).toFixed(2)}
              </Text>
              <Text style={styles.dropdownQtyText}>Qty: {p.quantity}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Theme.colors.inkMuted48} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const OrderCard = React.memo(({ item, index, productMap, navigation, uniqueid }) => {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const resolvedProducts = React.useMemo(() => {
    if (!productMap) return [];
    let details = [];
    if (Array.isArray(item.order_details) && item.order_details.length > 0) {
      details = item.order_details.map(d => ({ pid: d.product_id, qty: d.quantity ?? 1 }));
    } else if (Array.isArray(item.items) && item.items.length > 0) {
      details = item.items.map(d => ({ pid: d.product_id ?? d.id, qty: d.quantity ?? 1 }));
    } else if (Array.isArray(item.product_ids)) {
      details = item.product_ids.map((pid, i) => ({
        pid,
        qty: Array.isArray(item.quantities) ? item.quantities[i] ?? 1 : 1,
      }));
    }
    return details
      .map(({ pid, qty }) => {
        const prod = productMap.get(String(pid)) ?? productMap.get(Number(pid));
        return prod ? { ...prod, quantity: qty } : null;
      })
      .filter(Boolean);
  }, [item, productMap]);

  const toggleExpand = useCallback(() => {
    setExpanded(v => !v);
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const thumbs = resolvedProducts.slice(0, 3);
  const extra = resolvedProducts.length - 3;
  const isDelivered = item.status === 'paid';

  return (
    <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleExpand}
        style={styles.card}
      >
        {/* Card Header Strip */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdRow}>
            <View style={styles.parcelIconWrap}>
              <Ionicons
                name={isDelivered ? 'cube-outline' : 'time-outline'}
                size={18}
                color={Theme.colors.primary}
              />
            </View>
            <View>
              <Text style={styles.deliveryStatusText}>
                Order #{item.order_id}
              </Text>
              <Text style={styles.orderNumberText}>
                {item.date_time || 'Recent order'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightStatus}>
            <StatusChip status={item.status} />
          </View>
        </View>

        {/* Thumbnail Preview Strip */}
        {thumbs.length > 0 ? (
          <View style={styles.thumbStrip}>
            {thumbs.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={styles.thumbBox}
                activeOpacity={0.7}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('Product', {
                      product: p,
                      categoryProducts: [p],
                      categoryName: p.category,
                      uniqueid,
                    });
                  }
                }}
              >
                <Image
                  source={{ uri: p.picture_of_the_prod }}
                  style={styles.thumbImg}
                  resizeMode="contain"
                />
                {p.quantity > 1 && (
                  <View style={styles.thumbQty}>
                    <Text style={styles.thumbQtyText}>{p.quantity}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {extra > 0 && (
              <TouchableOpacity
                style={[styles.thumbBox, styles.extraBox]}
                activeOpacity={0.7}
                onPress={toggleExpand}
              >
                <Text style={styles.extraText}>+{extra}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalPrice}>
              ₹{Number(item.total || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsPrompt}>
              {expanded ? 'Hide details' : 'View details'}
            </Text>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }], marginLeft: 4 }}>
              <Ionicons name="chevron-down" size={15} color={Theme.colors.primary} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expandable Product Dropdown */}
      <ProductDropdown
        resolvedProducts={resolvedProducts}
        visible={expanded}
        navigation={navigation}
        uniqueid={uniqueid}
      />
    </Animated.View>
  );
});

export default function CONorders({ route, navigation }) {
  const { uniqueid } = route.params || {};

  const [orders, setOrders] = useState([]);
  const [productMap, setProductMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, map] = await Promise.all([
        fetch(`http://192.168.29.173:5000/get_orders/${uniqueid}`),
        getProductCache(),
      ]);
      const result = await ordersRes.json();
      if (result.status === 'success') setOrders(result.data || []);
      else setError(result.message);
      setProductMap(map);
    } catch {
      setError('Unable to load orders. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  const filteredOrders = React.useMemo(() => {
    if (activeTab === 'paid') return orders.filter(o => o.status === 'paid');
    if (activeTab === 'pending') return orders.filter(o => o.status !== 'paid');
    return orders;
  }, [orders, activeTab]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Ambient Header Aura ── */}
      <AmbientAura variant="header" />

      {/* Top iOS Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* iOS Segmented Control Tabs */}
      <View style={styles.segmentedControlWrap}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'all' && styles.segmentTextActive]}>
              All ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'paid' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('paid')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'paid' && styles.segmentTextActive]}>
              Delivered ({orders.filter(o => o.status === 'paid').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'pending' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('pending')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'pending' && styles.segmentTextActive]}>
              Pending ({orders.filter(o => o.status !== 'paid').length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={44} color={Theme.colors.inkMuted48} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, i) => item.order_id?.toString() ?? i.toString()}
          renderItem={({ item, index }) => (
            <OrderCard
              item={item}
              index={index}
              productMap={productMap}
              navigation={navigation}
              uniqueid={uniqueid}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={Theme.colors.inkMuted48} />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your medicine orders will appear here once placed.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Floating Dual Pill Dock */}
      <View style={[styles.bottomNavContainer, { bottom: insets.bottom + 8 }]}>
        <View style={styles.bottomNavDock}>
          <TouchableOpacity
            style={styles.bottomNavBtn}
            onPress={() => navigation.navigate('HomeCon', { uniqueid })}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront-outline" size={16} color="rgba(255, 255, 255, 0.45)" />
            <Text style={styles.bottomNavText}>Shop</Text>
          </TouchableOpacity>

          <View style={styles.bottomNavBtnActive}>
            <Ionicons name="receipt-outline" size={16} color="#ffffff" />
            <Text style={styles.bottomNavTextActive}>Orders</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.normal,
  },
  segmentedControlWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: Theme.radius.lg,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Theme.radius.md,
  },
  segmentBtnActive: {
    backgroundColor: Theme.colors.canvas,
    ...Theme.shadows.card,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
  },
  segmentTextActive: {
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl, // 26px squircle
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parcelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.md,
    backgroundColor: '#e8f0fb',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },
  deliveryStatusText: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
  },
  orderNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  headerRightStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.pill,
  },
  paidChip: {
    backgroundColor: '#e6f7ec',
  },
  pendingChip: {
    backgroundColor: Theme.colors.canvasParchment,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbImg: {
    width: '80%',
    height: '80%',
  },
  thumbQty: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Theme.colors.ink,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbQtyText: {
    color: Theme.colors.canvas,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
  extraBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
    paddingTop: 12,
    marginTop: 14,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    letterSpacing: Theme.typography.tracking.caps,
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
    marginTop: 2,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsPrompt: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.primary,
  },
  dropdown: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownInner: {
    padding: 14,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    letterSpacing: Theme.typography.tracking.caps,
    marginBottom: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  dropdownImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.colors.canvasParchment,
    marginRight: 10,
  },
  dropdownInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
  },
  dropdownCategory: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 1,
  },
  dropdownRight: {
    alignItems: 'flex-end',
  },
  dropdownPrice: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
  },
  dropdownQtyText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: Theme.colors.inkMuted48,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.pill,
  },
  retryText: {
    color: Theme.colors.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.inkMuted48,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomNavContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  bottomNavDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111214',
    borderRadius: Theme.radius.pill,
    padding: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  bottomNavBtn: {
    width: 90,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomNavBtnActive: {
    width: 90,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#23252a',
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  bottomNavText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  bottomNavTextActive: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});