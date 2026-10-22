import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Theme from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // Logo entrance
  const logoScale  = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  // Brand text
  const textFade  = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(12)).current;
  // Progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Aurora orb breath
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  // Tagline fade
  const tagFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── 1. Logo entrance (spring pop)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 70,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // ── 2. Brand text — slides up with delay
    Animated.parallel([
      Animated.timing(textFade, {
        toValue: 1,
        duration: 450,
        delay: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(textSlide, {
        toValue: 0,
        speed: 14,
        bounciness: 2,
        delay: 320,
        useNativeDriver: true,
      }),
    ]).start();

    // ── 3. Tagline fades after brand
    Animated.timing(tagFade, {
      toValue: 1,
      duration: 400,
      delay: 580,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // ── 4. Progress bar fills
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      delay: 200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    // ── 5. Slow breathing aurora orbs
    const breatheOrb = (anim, duration, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.18,
            duration,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const loop1 = breatheOrb(orb1Scale, 2600, 0);
    const loop2 = breatheOrb(orb2Scale, 3000, 600);
    loop1.start();
    loop2.start();

    // ── 6. Navigate after animation settles
    const timer = setTimeout(() => {
      navigation.replace('LandingPage');
    }, 2000);

    return () => {
      loop1.stop();
      loop2.stop();
      clearTimeout(timer);
    };
  }, [navigation]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Aurora Background Orbs ── */}
      {/* Orb 1 – Blue, top-right */}
      <Animated.View
        style={[styles.orb, styles.orb1, { transform: [{ scale: orb1Scale }] }]}
      />
      {/* Orb 2 – Lavender, bottom-left */}
      <Animated.View
        style={[styles.orb, styles.orb2, { transform: [{ scale: orb2Scale }] }]}
      />
      {/* Orb 3 – Sky-mint, center */}
      <View style={[styles.orb, styles.orb3]} />

      {/* ── Centered App Emblem ── */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Frosted glass squircle icon with NSC emblem */}
        <View style={styles.logoCard}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.logoCardBorder} />
          <View style={styles.topBevel} />
          <Image
            source={require('../assets/images/nsc_emblem.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Brand name */}
        <Animated.Text
          style={[
            styles.brandTitle,
            {
              opacity: textFade,
              transform: [{ translateY: textSlide }],
            },
          ]}
        >
          Nirvana
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.brandTagline, { opacity: tagFade }]}>
          Healthcare, simplified.
        </Animated.Text>
      </Animated.View>

      {/* ── iOS-style thin progress bar at bottom ── */}
      <View style={styles.loaderTrackWrap}>
        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderFill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const ORB_SIZE = W * 0.72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',   // Very slightly cool-white — not flat grey
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // ── Aurora Orbs
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  orb1: {
    // Soft blue — top-right quadrant
    top: H * 0.04,
    right: -(ORB_SIZE * 0.3),
    backgroundColor: 'rgba(140, 198, 255, 0.38)',
  },
  orb2: {
    // Lavender — bottom-left quadrant
    bottom: H * 0.05,
    left: -(ORB_SIZE * 0.32),
    backgroundColor: 'rgba(195, 165, 255, 0.3)',
  },
  orb3: {
    // Sky-mint — center, smaller, very soft
    width: ORB_SIZE * 0.55,
    height: ORB_SIZE * 0.55,
    borderRadius: (ORB_SIZE * 0.55) / 2,
    top: H * 0.42,
    left: W * 0.4,
    backgroundColor: 'rgba(140, 220, 200, 0.22)',
  },

  // ── Logo
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: Theme.radius.xxl,  // 32px squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    overflow: 'hidden',
    position: 'relative',
    ...Theme.shadows.skeuoCard,
  },
  logoImage: {
    width: 82,
    height: 56,
    zIndex: 1,
  },
  logoCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
  },
  topBevel: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    zIndex: 2,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 15,
    fontWeight: '400',
    color: Theme.colors.inkMuted48,
    letterSpacing: Theme.typography.tracking.normal,
  },

  // ── Progress bar
  loaderTrackWrap: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
  },
  loaderTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
});
