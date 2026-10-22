import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ExCamera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../../constants/theme';
import AuroraCard from '../../../components/AuroraCard';
import AmbientAura from '../../../components/AmbientAura';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Authentic({ navigation, route }) {
  const { uniqueid } = route.params || {};
  const [hasPermission, setHasPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);

  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const shutterScale = useRef(new Animated.Value(1)).current;

  // Animated laser scan line
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getPermissions = async () => {
      try {
        const cameraStatus = await ExCamera.Camera.requestCameraPermissionsAsync();
        const mediaStatus = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(cameraStatus.status === 'granted');
        setMediaPermission(mediaStatus.status === 'granted');
      } catch (error) {
        setHasPermission(false);
      }
    };

    getPermissions();

    const laserLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    laserLoop.start();

    return () => {
      laserLoop.stop();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive) {
      timerRef.current = setTimeout(() => {
        setIsCameraActive(false);
      }, 30000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isCameraActive]);

  const capturePhoto = async () => {
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(shutterScale, { toValue: 1, speed: 20, bounciness: 4, useNativeDriver: true }),
    ]).start();

    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          exif: true,
        });

        if (mediaPermission) {
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          navigation.navigate('Qrdetails', { photoPath: asset.uri, uniqueid });
        } else {
          Alert.alert('Permission Required', 'Media library permission is needed to save and decode photos.');
        }
      }
    } catch (error) {
      Alert.alert('Scan Error', `Failed to capture image: ${error.message}`);
    }
  };

  const handleTapToActivateCamera = () => {
    setIsCameraActive(true);
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 260],
  });

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
          <Text style={styles.headerTitle}>Verify Medicine</Text>
        </View>

        <TouchableOpacity
          style={styles.torchBtn}
          onPress={() => setTorchOn(!torchOn)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={torchOn ? 'flash' : 'flash-outline'}
            size={20}
            color={torchOn ? Theme.colors.primary : Theme.colors.ink}
          />
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder with Softer Corners */}
      <View style={styles.viewfinderCard}>
        <TouchableOpacity
          style={styles.cameraBox}
          onPress={handleTapToActivateCamera}
          activeOpacity={1}
        >
          {isCameraActive && hasPermission ? (
            <ExCamera.CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              enableTorch={torchOn}
            >
              {/* Corner reticles */}
              <View style={styles.reticleOverlay} pointerEvents="none">
                <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
                <View style={[styles.cornerBracket, styles.bracketTopRight]} />
                <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
                <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

                {/* Animated laser line */}
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />

                <View style={styles.centerPromptWrap}>
                  <Text style={styles.centerPromptText}>
                    Align the QR code on the package within the frame
                  </Text>
                </View>
              </View>
            </ExCamera.CameraView>
          ) : (
            <View style={styles.inactiveCamera}>
              <Ionicons name="camera-outline" size={48} color={Theme.colors.inkMuted48} />
              <Text style={styles.inactiveTitle}>Camera Paused</Text>
              <Text style={styles.inactiveSub}>Tap to reactivate the camera</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions AuroraCard */}
      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <AuroraCard aura="mint" style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color={Theme.colors.success} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Genuine Medicine Guarantee</Text>
            <Text style={styles.infoSub}>
              Scanning confirms the package batch number, manufacturer authenticity, and storage conditions.
            </Text>
          </View>
        </AuroraCard>
      </View>

      {/* iOS Tactile Shutter Button */}
      <View style={[styles.shutterSection, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
          <TouchableOpacity
            style={styles.shutterOuterRing}
            onPress={capturePhoto}
            activeOpacity={0.8}
          >
            <View style={styles.shutterInnerCircle} />
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.shutterLabel}>Tap to Scan</Text>
      </View>
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
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  torchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderCard: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  cameraBox: {
    width: '100%',
    height: 320,
    borderRadius: Theme.radius.xxl, // 32px squircle
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    ...Theme.shadows.skeuoCard,
  },
  reticleOverlay: {
    position: 'absolute',
    inset: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ffffff',
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Theme.colors.primary,
  },
  centerPromptWrap: {
    position: 'absolute',
    bottom: 14,
    paddingHorizontal: 16,
  },
  centerPromptText: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },
  inactiveCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 6,
    backgroundColor: Theme.colors.canvas,
  },
  inactiveTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    marginTop: 6,
  },
  inactiveSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
  },
  infoCard: {
    padding: 16,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Theme.shadows.skeuoCircle,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.92)',
    letterSpacing: 0,
  },
  infoSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(100, 116, 139, 0.78)',
    lineHeight: 18,
    marginTop: 2,
  },
  shutterSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Theme.colors.primary,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.skeuoButton,
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
  },
  shutterLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(100, 116, 139, 0.78)',
    marginTop: 10,
  },
});
