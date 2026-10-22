import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../constants/theme';

export default function SideCON({ navigation, uniqueid, toggleMenu }) {
  const menuItems = [
    {
      title: 'Nearest Pharmacy',
      subtitle: 'Find pharmacies near you',
      icon: 'location-outline',
      onPress: () => navigation.navigate('Neareststore', { uniqueid }),
    },
    {
      title: 'My Orders',
      subtitle: 'View and track your orders',
      icon: 'receipt-outline',
      onPress: () => navigation.navigate('CONorders', { uniqueid }),
    },
    {
      title: 'Verify Medicine',
      subtitle: 'Scan package to check authenticity',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('Authentic', { uniqueid }),
    },
    {
      title: 'Upload Prescription',
      subtitle: 'Process your prescription',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('Printed'),
    },
    {
      title: 'Sign Out',
      subtitle: 'Return to home screen',
      icon: 'arrow-back-outline',
      danger: true,
      onPress: () => navigation.navigate('LandingPage'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={Theme.colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>My Account</Text>
          {uniqueid ? (
            <Text style={styles.profileId} numberOfLines={1}>
              ID: {String(uniqueid).substring(0, 14)}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={toggleMenu} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={Theme.colors.inkMuted48} />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Navigation Items */}
      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.menuItem}
            onPress={() => {
              item.onPress();
              toggleMenu();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, item.danger && styles.iconWrapDanger]}>
              <Ionicons
                name={item.icon}
                size={19}
                color={item.danger ? Theme.colors.danger : Theme.colors.primary}
              />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>
                {item.title}
              </Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Theme.colors.inkMuted48} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Nirvana · v1.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.canvas,
  },

  // ── Profile header
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
  },
  profileId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: Theme.colors.hairline,
    marginHorizontal: 0,
  },

  // ── Menu items
  menuList: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e8f0fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#fff1f0',
  },
  textWrap: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(15, 23, 42, 0.88)',
  },
  menuTitleDanger: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: Theme.colors.danger,
  },
  menuSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 2,
  },

  // ── Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
    textAlign: 'center',
  },
});