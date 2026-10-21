import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Animated, 
  Dimensions, Alert, StatusBar, StyleSheet, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSocket } from '@/app/(tabs)/SocketContext';
import { apiService } from '@/app/(tabs)/apiservices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ElevenTheme } from '@/constants/theme';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
  const { socket, isConnected } = useSocket();
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Incomplete Credentials', 'Please enter your driver username and password.');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const response = await apiService.loginDriver(username, password);
      
      if (!response || !response.unique_user_id) {
        throw new Error('Invalid authentication response');
      }

      await AsyncStorage.setItem('driverId', response.unique_user_id.toString());
      
      if (isConnected && socket) {
        socket.emit('user-role', { 
          role: 'driver', 
          driver_id: response.unique_user_id 
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/routeTracking?driverId=${response.unique_user_id}`);
    } catch (apiError: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Authentication Failed',
        apiError?.message || 'Unable to authenticate with dispatch server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Subtle Blurry ImageBackground */}
        <ImageBackground
          source={require('../../assets/images/bg_truck.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 8 : 5}
        >
          <View style={styles.overlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardView}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Animated.View 
                  style={[
                    styles.contentContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  {/* Header Section with Much Bigger Logo */}
                  <View style={styles.headerSection}>
                    <Image 
                      source={require('../../assets/images/NirvanaSmartChainLogo.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />

                    <Text style={styles.displayHeadline}>Sign in</Text>
                    <Text style={styles.subhead}>
                      Precision in Every Delivery
                    </Text>
                  </View>

                {/* Form Section without enclosing border/background box */}
                <View style={styles.formContainer}>
                  {/* Username Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Username</Text>
                    <View style={[
                      styles.inputContainer,
                      focusedInput === 'username' && styles.inputContainerFocused
                    ]}>
                      <MaterialIcons 
                        name="person-outline" 
                        size={18} 
                        color={focusedInput === 'username' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. driver_alex"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        onFocus={() => setFocusedInput('username')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      {username.length > 0 && !isLoading && (
                        <TouchableOpacity onPress={() => setUsername('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <MaterialIcons name="cancel" size={16} color="rgba(255, 255, 255, 0.4)" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <View style={[
                      styles.inputContainer,
                      focusedInput === 'password' && styles.inputContainerFocused
                    ]}>
                      <MaterialIcons 
                        name="lock-outline" 
                        size={18} 
                        color={focusedInput === 'password' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={18} 
                          color="rgba(255, 255, 255, 0.5)" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Solid Blue Login Button */}
                  <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 12 }}>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        isLoading && styles.loginButtonDisabled
                      ]}
                      activeOpacity={0.82}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  </TouchableWithoutFeedback>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoImage: {
    width: 170,
    height: 170,
    marginBottom: 12,
  },
  displayHeadline: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subhead: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.15,
    paddingHorizontal: 16,
  },
  // Form container directly on canvas (no outer border or card bg)
  formContainer: {
    width: '100%',
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 14,
    gap: 10,
  },
  inputContainerFocused: {
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 0.15,
  },
  loginButton: {
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: ElevenTheme.typography.bodyFamily,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

export default LoginScreen;