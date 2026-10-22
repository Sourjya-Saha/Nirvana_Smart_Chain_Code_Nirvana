import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Theme from '../constants/theme';

// Aura color palettes – mapped to Reference: Zenvest / Track aurora soft panels
const AURA_COLORS = {
  blue: {
    bg: Theme.colors.auroraBlue,
    orb1: 'rgba(105, 175, 255, 0.28)',
    orb2: 'rgba(160, 200, 255, 0.18)',
  },
  lavender: {
    bg: Theme.colors.auroraLavender,
    orb1: 'rgba(190, 155, 255, 0.24)',
    orb2: 'rgba(220, 190, 255, 0.16)',
  },
  mint: {
    bg: Theme.colors.auroraMint,
    orb1: 'rgba(52, 199, 89, 0.22)',
    orb2: 'rgba(100, 230, 140, 0.14)',
  },
  peach: {
    bg: Theme.colors.auroraPeach,
    orb1: 'rgba(255, 160, 100, 0.22)',
    orb2: 'rgba(255, 200, 150, 0.14)',
  },
  sky: {
    bg: '#edf6fd',
    orb1: 'rgba(80, 180, 240, 0.22)',
    orb2: 'rgba(140, 210, 255, 0.14)',
  },
  plain: {
    bg: Theme.colors.canvas,
    orb1: 'transparent',
    orb2: 'transparent',
  },
};

export default function AuroraCard({
  children,
  style,
  contentStyle,
  aura = 'blue',
  useBlur = false, // Set to true for real frosted glass (iOS only perf)
  intensity = 40,
}) {
  const palette = AURA_COLORS[aura] || AURA_COLORS.blue;

  const cardInner = (
    <View style={[styles.cardContainer, { backgroundColor: palette.bg }, style]}>
      {/* Soft aurora orb — top-right */}
      <View style={[styles.orbTopRight, { backgroundColor: palette.orb1 }]} />
      {/* Soft aurora orb — bottom-left */}
      <View style={[styles.orbBottomLeft, { backgroundColor: palette.orb2 }]} />

      {/* Top hairline bevel — physical skeuomorphic surface feel */}
      <View style={styles.topBevel} pointerEvents="none" />

      {/* Card content */}
      <View style={[styles.cardContent, contentStyle]}>{children}</View>
    </View>
  );

  if (useBlur) {
    return (
      <View style={[styles.blurContainer, style]}>
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[styles.orbTopRight, { backgroundColor: palette.orb1 }]} />
        <View style={[styles.orbBottomLeft, { backgroundColor: palette.orb2 }]} />
        <View style={styles.topBevel} pointerEvents="none" />
        <View style={[styles.cardContent, contentStyle]}>{children}</View>
      </View>
    );
  }

  return cardInner;
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    overflow: 'hidden',
    position: 'relative',
    ...Theme.shadows.skeuoCard,
  },
  blurContainer: {
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    overflow: 'hidden',
    position: 'relative',
    ...Theme.shadows.skeuoCard,
  },
  orbTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  topBevel: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 2,
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
});
