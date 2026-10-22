import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Platform } from 'react-native';
import Theme from '../constants/theme';

const { width: W } = Dimensions.get('window');

/**
 * AmbientAura
 * Renders the ethereal, iridescent iOS aura background seen in the reference designs.
 * Soft overlapping blurred pastel gradients (sky blue, lavender, blush rose)
 * with subtle organic breathing motion that brings smooth luxury ambience.
 */
export default function AmbientAura({
  variant = 'header', // 'header' (top 35% glow) | 'fullscreen' (full ambient canvas)
  style,
  animated = true,
  children,
}) {
  const breathAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);

  const scaleOrb1 = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const scaleOrb2 = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const isHeader = variant === 'header';

  return (
    <View style={[isHeader ? styles.headerContainer : styles.fullContainer, style]} pointerEvents="box-none">
      {/* Sky Blue Ambient Orb */}
      <Animated.View
        style={[
          styles.orb,
          styles.orbSky,
          isHeader ? styles.orbSkyHeader : styles.orbSkyFull,
          { transform: [{ scale: scaleOrb1 }] },
        ]}
        pointerEvents="none"
      />

      {/* Lavender / Violet Ambient Orb */}
      <Animated.View
        style={[
          styles.orb,
          styles.orbLavender,
          isHeader ? styles.orbLavenderHeader : styles.orbLavenderFull,
          { transform: [{ scale: scaleOrb2 }] },
        ]}
        pointerEvents="none"
      />

      {/* Soft Rose / Peach Ambient Orb */}
      <View
        style={[
          styles.orb,
          styles.orbRose,
          isHeader ? styles.orbRoseHeader : styles.orbRoseFull,
        ]}
        pointerEvents="none"
      />

      {/* Ambient Diffuser Veil */}
      <View style={styles.diffuserVeil} pointerEvents="none" />

      {children}
    </View>
  );
}

const ORB_W = Math.min(W * 0.78, 360);

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
    zIndex: 0,
  },
  fullContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
    width: ORB_W,
    height: ORB_W,
    borderRadius: ORB_W / 2,
    opacity: Platform.OS === 'ios' ? 0.8 : 0.65,
  },
  orbSky: {
    backgroundColor: '#cbe4fd', // Ethereal pastel sky
  },
  orbSkyHeader: {
    top: -ORB_W * 0.35,
    right: -ORB_W * 0.15,
  },
  orbSkyFull: {
    top: -ORB_W * 0.25,
    right: -ORB_W * 0.2,
  },
  orbLavender: {
    backgroundColor: '#eadcff', // Soft ethereal lavender
  },
  orbLavenderHeader: {
    top: -ORB_W * 0.2,
    left: -ORB_W * 0.25,
  },
  orbLavenderFull: {
    top: '32%',
    left: -ORB_W * 0.3,
  },
  orbRose: {
    backgroundColor: '#ffe5ed', // Gentle blush iridescent rose
    width: ORB_W * 0.7,
    height: ORB_W * 0.7,
    borderRadius: (ORB_W * 0.7) / 2,
  },
  orbRoseHeader: {
    top: 30,
    right: '25%',
  },
  orbRoseFull: {
    bottom: -ORB_W * 0.15,
    right: -ORB_W * 0.15,
  },
  diffuserVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
