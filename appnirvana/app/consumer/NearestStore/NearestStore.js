import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../../constants/theme';
import AuroraCard from '../../../components/AuroraCard';
import { SkeletonCard } from '../../../components/SkeletonLoader';
import AmbientAura from '../../../components/AmbientAura';

export default function NearestStore({ route, navigation }) {
  const { uniqueid } = route.params || {};
  const [stores, setStores] = useState([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('5');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [items, setItems] = useState([
    { label: 'Within 5 km', value: '5' },
    { label: 'Within 10 km', value: '10' },
    { label: 'Within 15 km', value: '15' },
  ]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    fetchLocation();
  }, []);

  const sendLocation = async (selectedRadius, coords) => {
    const lat = coords?.latitude ?? location.latitude;
    const lon = coords?.longitude ?? location.longitude;

    if (!lat || !lon) return;

    setLoading(true);
    const data = {
      radius: selectedRadius ?? value,
      lat,
      lon,
    };

    try {
      const response = await fetch('http://192.168.29.173:5000/get_retailers_within_radius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.status === 200) {
        const storesArray = Object.keys(result).map((key) => ({
          name: key,
          ...result[key],
        }));
        setStores(storesArray);
      } else {
        Alert.alert('Notice', result.error || 'No pharmacies found in radius.');
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
      Alert.alert('Connection Error', 'Unable to reach the store registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({ latitude: null, longitude: null });
        setStores([]);
        Alert.alert(
          'Location Required',
          'GPS location access is required to detect genuine licensed pharmacies near your position. Please grant location permission in device settings.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(current);
      sendLocation(value, current);
    } catch (err) {
      setLocation({ latitude: null, longitude: null });
      setStores([]);
      Alert.alert(
        'GPS Signal Unavailable',
        'Unable to detect your live GPS position. Please ensure location services are enabled on your device.'
      );
    } finally {
      setLocating(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>Nearest Pharmacies</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Soft Skeuomorphic Location Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <AuroraCard aura="blue" style={styles.locationCard}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.gpsIconCircle}>
                <Ionicons name="navigate" size={18} color={Theme.colors.primary} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationCardTitle}>Detected Location</Text>
                <Text style={styles.locationCoords}>
                  {locating
                    ? 'Locating via GPS...'
                    : location.latitude && location.longitude
                    ? `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`
                    : 'GPS permission required'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshLocBtn}
                onPress={fetchLocation}
                disabled={locating}
                activeOpacity={0.8}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                ) : (
                  <Ionicons name="refresh" size={18} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </AuroraCard>
        </Animated.View>

        {/* Radius Filter DropDown */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>SEARCH RADIUS</Text>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            onChangeValue={(val) => {
              setValue(val);
              sendLocation(val);
            }}
            setOpen={setOpen}
            setValue={setValue}
            setItems={setItems}
            placeholder="Select Radius"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            placeholderStyle={{ color: Theme.colors.inkMuted48, fontSize: 14 }}
            labelStyle={{ color: Theme.colors.ink, fontWeight: '600', fontSize: 14 }}
            textStyle={{ fontSize: 14 }}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsTitle}>
            Available Pharmacies ({stores.length})
          </Text>
        </View>

        {/* Store List */}
        {loading ? (
          <View style={{ gap: 8 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : !location.latitude ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={44} color={Theme.colors.primary} />
            <Text style={styles.emptyTitle}>Location Access Required</Text>
            <Text style={styles.emptySub}>
              Please grant GPS permissions and tap the refresh icon to search verified licensed pharmacies near you.
            </Text>
          </View>
        ) : stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={44} color={Theme.colors.inkMuted48} />
            <Text style={styles.emptyTitle}>No Pharmacies in Selected Radius</Text>
            <Text style={styles.emptySub}>
              Try expanding the search radius to 10 km or 15 km to locate active pharmacies.
            </Text>
          </View>
        ) : (
          stores.map((store, index) => (
            <TouchableOpacity
              key={store.generated_unique_id || `store-${index}`}
              style={styles.storeCard}
              onPress={() =>
                navigation.navigate('Store', {
                  uniqueid,
                  storename: store.name,
                  storeid: store.generated_unique_id,
                })
              }
              activeOpacity={0.78}
            >
              <View style={styles.storeCardTop}>
                <View style={styles.storeIconWrap}>
                  <Ionicons name="storefront" size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.storeInfoWrap}>
                  <View style={styles.storeBadgeRow}>
                    <View style={styles.distanceBadge}>
                      <Ionicons name="navigate-outline" size={11} color={Theme.colors.primary} />
                      <Text style={styles.distanceBadgeText}>{store.distance_km} km away</Text>
                    </View>
                  </View>
                  <Text style={styles.storeName}>{store.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Theme.colors.inkMuted48} />
              </View>

              <View style={styles.storeCardBottom}>
                <View style={styles.stockStatus}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.stockStatusText}>In stock & verified</Text>
                </View>
                <Text style={styles.viewInventoryLink}>View inventory</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.normal,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  locationCard: {
    padding: 16,
    marginBottom: 16,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...Theme.shadows.skeuoCircle,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationCardTitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
  },
  locationCoords: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  refreshLocBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoCircle,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    letterSpacing: Theme.typography.tracking.caps,
    marginBottom: 8,
    marginLeft: 2,
  },
  dropdown: {
    backgroundColor: Theme.colors.canvas,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderRadius: Theme.radius.lg,
    minHeight: 48,
    ...Theme.shadows.skeuoCard,
  },
  dropdownContainer: {
    backgroundColor: Theme.colors.canvas,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.radius.lg,
    ...Theme.shadows.cardHover,
  },
  resultsHeaderRow: {
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  storeCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl, // 26px squircle
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Theme.shadows.skeuoCard,
    marginBottom: 12,
  },
  storeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: '#e8f0fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...Theme.shadows.skeuoCircle,
  },
  storeInfoWrap: {
    flex: 1,
  },
  storeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.primary,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.ink,
  },
  storeCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
    paddingTop: 12,
    marginTop: 12,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  stockStatusText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100, 116, 139, 0.78)',
  },
  viewInventoryLink: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: Theme.colors.primary,
  },
});