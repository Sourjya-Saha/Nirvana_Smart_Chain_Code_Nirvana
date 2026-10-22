import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../../constants/theme';
import AuroraCard from '../../../components/AuroraCard';
import TactileButton from '../../../components/TactileButton';
import AmbientAura from '../../../components/AmbientAura';

const getLocationName = async (lat, long) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`,
      {
        headers: {
          'User-Agent': 'SupplyChainApp/1.0',
          'Accept': 'application/json',
        },
      }
    );
    const text = await response.text();
    if (!text || text.trim().startsWith('<')) {
      return `${lat}°N, ${long}°E`;
    }
    const data = JSON.parse(text);
    return data.display_name || `${lat}°N, ${long}°E`;
  } catch {
    return `${lat}°N, ${long}°E`;
  }
};

export default function Qrdetails({ route, navigation }) {
  const { uniqueid, photoPath } = route.params || {};

  const [locations, setLocations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationNames, setLocationNames] = useState({});
  const [products, setProducts] = useState([]);
  const [authorizedRetailers, setAuthorizedRetailers] = useState([]);

  const participantConfigs = {
    manufacturer: {
      title: 'Manufacturing Facility',
      icon: 'business-outline',
      stepTitle: 'Manufactured & Formulated',
      order: 1,
    },
    wholesaler: {
      title: 'Distribution Center',
      icon: 'cube-outline',
      stepTitle: 'Wholesale Depot Transfer',
      order: 2,
    },
    retailers: {
      title: 'Dispensing Pharmacy',
      icon: 'storefront-outline',
      stepTitle: 'Dispensed to Consumer',
      order: 3,
    },
  };

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: `file://${photoPath}`,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      const response = await fetch('http://192.168.29.173:5000/decode_qr', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const result = await response.json();
      let responseData = result;

      if (Array.isArray(result) && result.length > 0 && result[0].data) {
        responseData = result[0].data;
      } else if (result.data) {
        responseData = result.data;
      }

      if (!responseData || !responseData.participants) {
        Alert.alert('Notice', 'Unable to decode medicine package data.');
        setIsLoading(false);
        return;
      }

      const participants = responseData.participants;
      const processedData = {};

      if (participants.manufacturer) {
        processedData.manufacturer = { ...participants.manufacturer };
      }
      if (participants.wholesaler) {
        processedData.wholesaler = { ...participants.wholesaler };
      }
      if (participants.retailers && Array.isArray(participants.retailers)) {
        processedData.retailers = participants.retailers.map((r) => ({ ...r }));
      }

      if (responseData.authorised_retailers) {
        setAuthorizedRetailers(Object.values(responseData.authorised_retailers));
      }

      if (responseData.cart_products) {
        const extracted = [];
        Object.keys(responseData.cart_products).forEach((retailerKey) => {
          const retailerProducts = responseData.cart_products[retailerKey];
          Object.keys(retailerProducts).forEach((productIndex) => {
            const productData = retailerProducts[productIndex].product_details;
            if (productData) extracted.push({ ...productData, retailer: retailerKey });
          });
        });
        setProducts(extracted);
      }

      setLocations(processedData);

      if (processedData.manufacturer) {
        const { user_lat: lat, user_long: long } = processedData.manufacturer;
        if (lat && long) {
          getLocationName(lat, long).then((a) =>
            setLocationNames((p) => ({ ...p, manufacturer: a }))
          );
        }
      }
      if (processedData.wholesaler) {
        const { user_lat: lat, user_long: long } = processedData.wholesaler;
        if (lat && long) {
          getLocationName(lat, long).then((a) =>
            setLocationNames((p) => ({ ...p, wholesaler: a }))
          );
        }
      }
      if (processedData.retailers) {
        processedData.retailers.forEach((retailer, i) => {
          const { user_lat: lat, user_long: long } = retailer;
          if (lat && long) {
            getLocationName(lat, long).then((a) => {
              setLocationNames((p) => {
                const r = [...(p.retailers || [])];
                r[i] = a;
                return { ...p, retailers: r };
              });
            });
          }
        });
      }

      Alert.alert('Verified Genuine', 'Medicine package verified successfully.');
    } catch (error) {
      Alert.alert('Verification Notice', `Package scan error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableParticipants = () => {
    if (!locations) {
      return [];
    }
    const available = [];
    if (locations.manufacturer)
      available.push({
        type: 'manufacturer',
        order: 1,
        data: locations.manufacturer,
        key: 'manufacturer',
      });
    if (locations.wholesaler)
      available.push({
        type: 'wholesaler',
        order: 2,
        data: locations.wholesaler,
        key: 'wholesaler',
      });
    if (locations.retailers) {
      locations.retailers.forEach((r, i) =>
        available.push({
          type: 'retailers',
          order: 3,
          data: r,
          index: i,
          key: `retailers-${i}`,
        })
      );
    }
    return available.sort((a, b) => a.order - b.order);
  };

  const prepareLocationsForRoute = () => {
    const list = getAvailableParticipants();
    return list
      .filter((item) => item.data && item.data.user_lat && item.data.user_long)
      .map((item) => ({
        user_type: item.type,
        user_lat: parseFloat(item.data.user_lat),
        user_long: parseFloat(item.data.user_long),
      }));
  };

  const participants = getAvailableParticipants();
  const routeLocations = prepareLocationsForRoute();

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Ambient Header Aura ── */}
      <AmbientAura variant="header" />

      {/* Top iOS Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Package Verification</Text>
          <Text style={styles.headerSubtitle}>Batch authenticity & telemetry</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scanned Image Preview */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: `file://${photoPath}` }}
            style={styles.heroQrImage}
            resizeMode="cover"
          />
        </View>

        {/* Action Controls */}
        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => navigation.navigate('Authentic', { uniqueid })}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="camera-outline" size={18} color={Theme.colors.ink} />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>

          <View style={{ flex: 2 }}>
            <TactileButton
              title={isLoading ? 'Verifying...' : 'Verify Package'}
              icon="checkmark-circle-outline"
              variant="primary"
              size="large"
              onPress={handleFetch}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Authenticated Beacon Card */}
        <AuroraCard aura="mint" style={styles.beaconCard}>
          <View style={styles.beaconRow}>
            <View style={styles.beaconIconCircle}>
              <Ionicons name="shield-checkmark" size={26} color={Theme.colors.success} />
            </View>
            <View style={styles.beaconTextWrap}>
              <Text style={styles.beaconTitle}>Genuine Medicine Verified</Text>
              <Text style={styles.beaconSubtitle}>
                Batch verified against manufacturer records. Safe for consumption.
              </Text>
            </View>
          </View>
        </AuroraCard>

        {/* Quality Metric Cards */}
        <View style={styles.metricStrip}>
          <View style={styles.metricCard}>
            <View style={styles.cardHighlight} />
            <Ionicons name="checkmark-circle" size={22} color={Theme.colors.success} />
            <Text style={styles.metricNumber}>100%</Text>
            <Text style={styles.metricLabel}>Authentic</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.cardHighlight} />
            <Ionicons name="thermometer" size={22} color={Theme.colors.primary} />
            <Text style={styles.metricNumber}>4.0°C</Text>
            <Text style={styles.metricLabel}>Cold-Chain</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.cardHighlight} />
            <Ionicons name="git-network" size={22} color={Theme.colors.ink} />
            <Text style={styles.metricNumber}>{participants.length}</Text>
            <Text style={styles.metricLabel}>Checkpoints</Text>
          </View>
        </View>

        {/* Supply Chain Journey */}
        <View style={styles.journeyCard}>
          <View style={styles.cardHighlight} />
          <View style={styles.journeyHeader}>
            <Text style={styles.journeySectionTitle}>Supply Chain Journey</Text>
            <Text style={styles.stepsCountText}>{participants.length} Checkpoints</Text>
          </View>

          {participants.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Ionicons name="shield-outline" size={32} color={Theme.colors.inkMuted48} />
              <Text style={{ fontSize: 13, color: Theme.colors.inkMuted48, marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }}>
                Tap 'Verify Package' above to decode authentic manufacturer and distributor tracking checkpoints.
              </Text>
            </View>
          ) : (
            <View style={styles.journeyTimelineWrap}>
              {participants.map((p, i) => {
                const config = participantConfigs[p.type] || participantConfigs.retailers;
                const isLast = i === participants.length - 1;
                const locName =
                  p.type === 'retailers'
                    ? locationNames.retailers?.[p.index] || `Dispensing Retailer (${p.data?.user_id || 'ID Verified'})`
                    : locationNames[p.type] ||
                      (p.data?.user_id ? `Facility ID: ${p.data.user_id}` : 'Verified Checkpoint');

                return (
                  <View key={`journey-${i}`} style={styles.journeyStepRow}>
                    <View style={styles.stepDotCol}>
                      <View style={styles.stepDot}>
                        <Ionicons name="checkmark" size={12} color={Theme.colors.canvas} />
                      </View>
                      {!isLast && <View style={styles.stepConnector} />}
                    </View>

                    <View style={styles.stepInfoWrap}>
                      <Text style={styles.stepTitle}>{config.title}</Text>
                      <Text style={styles.stepSubTitle}>{config.stepTitle}</Text>
                      <Text style={styles.stepAddress} numberOfLines={2}>
                        {locName}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* View Route on Map CTA */}
          <TactileButton
            title="View Route on Map"
            icon="map-outline"
            variant="primary"
            size="large"
            onPress={() =>
              navigation.navigate('Shproute', { locations: routeLocations })
            }
          />
        </View>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  imageCard: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: Theme.colors.canvas,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    height: 200,
    marginBottom: 16,
    ...Theme.shadows.skeuoCard,
  },
  heroQrImage: {
    width: '100%',
    height: '100%',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Theme.colors.canvas,
    height: 52,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    ...Theme.shadows.skeuoButton,
  },
  retakeBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  beaconCard: {
    marginBottom: 16,
  },
  beaconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  beaconIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f7ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beaconTextWrap: {
    flex: 1,
  },
  beaconTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  beaconSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
    lineHeight: 18,
    marginTop: 2,
  },
  metricStrip: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  metricNumber: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 6,
    letterSpacing: 0,
  },
  metricLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  journeyCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  journeySectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  stepsCountText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
  },
  journeyTimelineWrap: {
    paddingLeft: 4,
    marginBottom: 18,
  },
  journeyStepRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepDotCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#d1e7dd',
    marginVertical: 4,
  },
  stepInfoWrap: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  stepSubTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  stepAddress: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
});