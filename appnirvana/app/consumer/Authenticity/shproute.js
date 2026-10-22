import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../../constants/theme';
import AuroraCard from '../../../components/AuroraCard';
import TactileButton from '../../../components/TactileButton';

export default function Shproute({ route, navigation }) {
  const { locations = [] } = route.params || {};

  const generateGoogleMapsUrl = (locs) => {
    if (!locs || locs.length === 0) return '';
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const origin = `${locs[0].user_lat},${locs[0].user_long}`;
    const destination = `${locs[locs.length - 1].user_lat},${locs[locs.length - 1].user_long}`;
    const waypoints = locs
      .slice(1, locs.length - 1)
      .map((l) => `${l.user_lat},${l.user_long}`)
      .join('|');
    return `${baseUrl}&origin=${origin}&destination=${destination}${waypoints ? '&waypoints=' + waypoints : ''}`;
  };

  const handleOpenGoogleMaps = () => {
    const url = generateGoogleMapsUrl(locations);
    if (url) {
      Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.canvas} />

      {/* Top iOS Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Supply Route</Text>
          <Text style={styles.headerSubtitle}>Verified GPS transit telemetry</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Transit Overview Card */}
        <AuroraCard aura="blue" style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Verified Transit Path</Text>
          <Text style={styles.overviewSub}>
            Complete journey tracking from certified manufacturer to your local pharmacy.
          </Text>

          <View style={styles.telemetryStrip}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryNumber}>{locations.length}</Text>
              <Text style={styles.telemetryLabel}>Total Stops</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryNumber}>100%</Text>
              <Text style={styles.telemetryLabel}>GPS Tracked</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryNumber}>4.0°C</Text>
              <Text style={styles.telemetryLabel}>Cold Chain</Text>
            </View>
          </View>

          <TactileButton
            title="Open in Google Maps"
            icon="map-outline"
            variant="primary"
            size="large"
            onPress={handleOpenGoogleMaps}
          />
        </AuroraCard>

        {/* Route Stops Timeline */}
        <Text style={styles.sectionLabel}>VERIFIED CHECKPOINTS</Text>
        {locations.map((loc, idx) => {
          const isLast = idx === locations.length - 1;

          return (
            <View key={idx} style={styles.stopCard}>
              <View style={styles.cardHighlight} />
              <View style={styles.stopLeftCol}>
                <View style={styles.stopNumberCircle}>
                  <Text style={styles.stopNumberText}>{idx + 1}</Text>
                </View>
                {!isLast && <View style={styles.stopLine} />}
              </View>

              <View style={styles.stopInfoWrap}>
                <View style={styles.stopBadgeRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {String(loc.user_type || 'Checkpoint').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.stopSeqText}>Stop #{idx + 1}</Text>
                </View>

                <Text style={styles.stopCoordsText}>
                  {Number(loc.user_lat).toFixed(4)}° N, {Number(loc.user_long).toFixed(4)}° E
                </Text>

                <View style={styles.auditPassedRow}>
                  <Ionicons name="checkmark-circle" size={14} color={Theme.colors.success} />
                  <Text style={styles.auditPassedText}>Location Telemetry Verified</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  overviewCard: {
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  overviewSub: {
    fontSize: 13,
    color: Theme.colors.inkMuted48,
    marginTop: 4,
    lineHeight: 18,
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: Theme.radius.lg,
    paddingVertical: 14,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  telemetryLabel: {
    fontSize: 11,
    color: Theme.colors.inkMuted48,
    marginTop: 2,
  },
  telemetryDivider: {
    width: 1,
    height: 26,
    backgroundColor: Theme.colors.hairline,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.inkMuted48,
    letterSpacing: 0.6,
    marginBottom: 12,
    marginLeft: 4,
  },
  stopCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 14,
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
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  stopLeftCol: {
    alignItems: 'center',
    marginRight: 14,
    width: 32,
  },
  stopNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff5ff',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#d2e3fc',
    marginTop: 6,
  },
  stopInfoWrap: {
    flex: 1,
  },
  stopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.pill,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: 0.3,
  },
  stopSeqText: {
    fontSize: 12,
    color: Theme.colors.inkMuted48,
    fontWeight: '500',
  },
  stopCoordsText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.ink,
    marginTop: 6,
    letterSpacing: Theme.typography.tracking.tight,
  },
  auditPassedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  auditPassedText: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.success,
  },
});
