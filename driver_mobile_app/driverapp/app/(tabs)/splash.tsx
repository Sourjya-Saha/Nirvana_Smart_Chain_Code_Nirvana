import React, { useEffect } from 'react';
import { 
  View, Text, Dimensions, StatusBar, Image, StyleSheet, TouchableOpacity, ImageBackground, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ElevenTheme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const timer = setTimeout(() => {
      handleProceed();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const handleProceed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/login');
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={1}
      onPress={handleProceed}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Subtle Blurry ImageBackground */}
      <ImageBackground
        source={require('../../assets/images/bg_truck.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 8 : 5}
      >
        <View style={styles.overlay}>
          {/* Main Content Area */}
          <View style={styles.mainContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/NirvanaSmartChainLogo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Editorial Display Heading */}
            <Text style={styles.displayHeadline}>
              Nirvana <Text style={styles.displayHeadlineItalic}>SmartChain</Text>
            </Text>

            {/* Clean Tagline */}
            <Text style={styles.bodyDescription}>
              Precision in Every Delivery
            </Text>
          </View>

          {/* Clean Footer Caption */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerCaption}>NSC v1.0</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 380,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  displayHeadline: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 42,
    marginBottom: 8,
  },
  displayHeadlineItalic: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  bodyDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    paddingHorizontal: 12,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerCaption: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1.6,
  },
});

export default SplashScreen;