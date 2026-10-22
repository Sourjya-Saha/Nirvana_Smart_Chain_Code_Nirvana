import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Easing,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import TactileButton from '../components/TactileButton';
import AmbientAura from '../components/AmbientAura';

const { width: W } = Dimensions.get('window');

export default function LandingPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(18)).current;
  const listFade  = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(22)).current;
  const btnFade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Hero section enters
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1, duration: 520,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.spring(heroSlide, {
          toValue: 0, speed: 13, bounciness: 2, useNativeDriver: true,
        }),
      ]),
      // 2. Feature list enters
      Animated.parallel([
        Animated.timing(listFade, {
          toValue: 1, duration: 420,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.spring(listSlide, {
          toValue: 0, speed: 11, bounciness: 2, useNativeDriver: true,
        }),
      ]),
      // 3. CTA button fades in last
      Animated.timing(btnFade, {
        toValue: 1, duration: 300,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Ethereal Aurora Ambience ── */}
      <AmbientAura variant="fullscreen" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero / Logo area ── */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: heroFade, transform: [{ translateY: heroSlide }] },
          ]}
        >
          {/* App icon squircle with NSC emblem */}
          <View style={styles.appIcon}>
            <View style={styles.topBevel} />
            <Image
              source={require('../assets/images/nsc_emblem.png')}
              style={styles.appIconImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.appName}>Nirvana</Text>
          <Text style={styles.appTagline}>Your trusted pharmacy, verified & delivered.</Text>
        </Animated.View>

        {/* ── Feature list ── */}
        <Animated.View
          style={[
            styles.featureList,
            { opacity: listFade, transform: [{ translateY: listSlide }] },
          ]}
        >
          <FeatureRow icon="shield-checkmark"   text="Verified authentic medicines" />
          <FeatureRow icon="location"            text="Nearest pharmacy in minutes" />
          <FeatureRow icon="document-text"       text="Prescription upload & OCR processing" />
          <FeatureRow icon="time"                text="Real-time order & delivery tracking" />
        </Animated.View>

        {/* ── CTA ── */}
        <Animated.View style={[styles.ctaSection, { opacity: btnFade }]}>
          <TactileButton
            title="Get Started"
            icon="arrow-forward"
            variant="primary"
            size="large"
            onPress={() => navigation.navigate('LoginCon')}
            style={styles.ctaBtn}
          />

          <Text style={styles.footerNote}>
            Safe · Private · Trusted by thousands of patients
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function FeatureRow({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>
        <View style={styles.iconBevel} />
        <Ionicons name={icon} size={19} color={Theme.colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
      <Ionicons name="chevron-forward" size={14} color={Theme.colors.inkLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  // ── Hero
  heroSection: {
    alignItems: 'flex-start',
    marginTop: 20,
    zIndex: 2,
  },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: Theme.radius.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  appIconImage: {
    width: 76,
    height: 52,
  },
  topBevel: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  appName: {
    fontSize: 46,
    fontWeight: '700',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
    lineHeight: 50,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: '400',
    color: Theme.colors.inkMuted48,
    marginTop: 10,
    lineHeight: 23,
    letterSpacing: Theme.typography.tracking.normal,
  },

  // ── Feature list
  featureList: {
    gap: 12,
    marginVertical: 8,
    zIndex: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    ...Theme.shadows.card,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconBevel: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    color: Theme.colors.ink,
    flex: 1,
    letterSpacing: Theme.typography.tracking.normal,
  },

  // ── CTA
  ctaSection: {
    gap: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  ctaBtn: {
    width: '100%',
  },
  footerNote: {
    fontSize: 12,
    color: Theme.colors.inkLight,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});