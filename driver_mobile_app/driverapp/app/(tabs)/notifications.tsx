// DriverNotificationsScreen.tsx
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import { ElevenTheme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface Notification {
  cart_id: string;
  driver_id: string;
}

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <StatusBar barStyle="light-content" backgroundColor="#000000" />
    <ActivityIndicator size="large" color="#FFFFFF" />
    <Text style={styles.loadingText}>Fetching dispatch shipments...</Text>
  </View>
);

const DriverNotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const driverId = await AsyncStorage.getItem('driverId');
      if (!driverId) {
        setNotifications([]);
        Alert.alert('Authentication Required', 'Please login again to view consignments.');
        router.push('/login');
        return;
      }

      const response = await axios.post('http://192.168.10.104:5000/fetch_notifications', {
        driver_id: driverId
      });

      if (response.data.notifications) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (!refreshing) {
        // Silently handle error or alert
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchNotifications();
      const pollingInterval = setInterval(fetchNotifications, 30000);
      
      return () => {
        clearInterval(pollingInterval);
      };
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleStartTracking = async (cartId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const driverId = await AsyncStorage.getItem('driverId');
      if (!driverId) {
        Alert.alert('Session Expired', 'Please login again.');
        router.push('/login');
        return;
      }

      router.push({
        pathname: '/routeTracking',
        params: { cartId, driverId }
      });
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Navigation Error', 'Failed to start route tracking.');
    }
  };

  const renderItem = ({ item, index }: { item: Notification; index: number }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexBadgeText}>{index + 1}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.shipmentLabel}>Shipment</Text>
          <Text style={styles.cartIdText}>#{item.cart_id}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => handleStartTracking(item.cart_id)}
        activeOpacity={0.82}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Assigned Routes</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.cart_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFFFFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconPlate}>
              <MaterialIcons name="notifications-none" size={32} color="rgba(255, 255, 255, 0.4)" />
            </View>
            <Text style={styles.emptyTitle}>No Pending Deliveries</Text>
            <Text style={styles.emptyText}>New consignment assignments will appear here automatically.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 16,
  },
  header: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subHeader: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 4,
    letterSpacing: 0.15,
  },
  listContent: {
    paddingBottom: 40,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indexBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 11,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 14,
    ...Platform.select({
      android: {
        marginBottom: 1,
      },
      ios: {
        marginBottom: 0,
      }
    }),
  },
  textContainer: {
    marginLeft: 14,
    flex: 1,
  },
  shipmentLabel: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '300',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  cartIdText: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 15,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    letterSpacing: 0.15,
  },
  startButton: {
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: ElevenTheme.typography.bodyFamily,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 32,
  },
  emptyIconPlate: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DriverNotificationsScreen;