import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Easing,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import TactileButton from '../components/TactileButton';
import AmbientAura from '../components/AmbientAura';

const { width: W } = Dimensions.get('window');

export default function LoginCon() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [userType] = useState('Consumer');
  const [option, setOption] = useState(1); // 1=Sign In, 2=Sign Up, 3=Forgot
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const screenFade = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(24)).current;
  const formFade   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenFade, {
        toValue: 1, duration: 420,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0, speed: 14, bounciness: 2, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const switchTab = (tab) => {
    Animated.sequence([
      Animated.timing(formFade, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.timing(formFade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setOption(tab);
    setPassword('');
    setRepeatPassword('');
  };

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your username and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.29.173:5000/login_app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const result = await response.json();
      if (response.status === 200) {
        navigation.navigate('HomeCon', { uniqueid: result.unique_user_id });
      } else {
        Alert.alert('Sign In Failed', result.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      Alert.alert('Connection Error', 'Unable to reach server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (password !== repeatPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.29.173:5000/signup_app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, user_type: userType }),
      });
      const result = await response.json();
      if (response.status === 201) {
        Alert.alert('Account Created', result.message || 'Your account is ready.');
        navigation.navigate('HomeCon', { uniqueid: result.unique_user_id });
      } else {
        Alert.alert('Sign Up Failed', result.error || 'Could not create account. Please try again.');
      }
    } catch {
      Alert.alert('Connection Error', 'Unable to reach server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = () => {
    Alert.alert('Password Reset', 'Password reset instructions will be sent to your registered contact.');
  };

  const tabs = ['Sign In', 'Sign Up', 'Forgot'];
  const primaryAction = option === 1 ? handleSignIn : option === 2 ? handleSignUp : handleForgot;
  const primaryLabel  = option === 1 ? 'Sign In' : option === 2 ? 'Create Account' : 'Send Reset Link';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Ethereal Aurora Ambience ── */}
      <AmbientAura variant="fullscreen" />

      {/* ── Top Bar with Safe Inset ── */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 8, opacity: screenFade }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Theme.colors.ink} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: screenFade,
                transform: [{ translateY: cardSlide }],
              },
            ]}
          >
          {/* ── Top bevel ── */}
          <View style={styles.cardBevel} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {option === 1 ? 'Welcome back' : option === 2 ? 'Create account' : 'Reset password'}
            </Text>
            <Text style={styles.subtitle}>
              {option === 1
                ? 'Sign in to access your prescriptions and orders.'
                : option === 2
                ? 'Join to order medicines and track deliveries.'
                : "We'll help you recover access to your account."}
            </Text>
          </View>

          {/* ── iOS Segmented Control ── */}
          <View style={styles.segControl}>
            {tabs.map((tab, i) => {
              const active = option === i + 1;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.segBtn, active && styles.segBtnActive]}
                  onPress={() => switchTab(i + 1)}
                  activeOpacity={0.75}
                >
                  {active && <View style={styles.segActiveBevel} />}
                  <Text style={[styles.segText, active && styles.segTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Form Fields ── */}
          <Animated.View style={{ opacity: formFade, gap: 14 }}>
            {/* Username */}
            <InputField
              label={option === 3 ? 'Username or phone' : 'Username'}
              icon="person-outline"
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password */}
            {option !== 3 && (
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputField}>
                  <View style={styles.inputBevel} />
                  <Ionicons name="lock-closed-outline" size={18} color={Theme.colors.inkMuted48} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor={Theme.colors.inkMuted48}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={Theme.colors.inkMuted48}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Confirm Password */}
            {option === 2 && (
              <InputField
                label="Confirm password"
                icon="lock-closed-outline"
                placeholder="Repeat password"
                value={repeatPassword}
                onChangeText={setRepeatPassword}
                secureTextEntry={!showPassword}
              />
            )}

            {/* Primary CTA */}
            <TactileButton
              title={isLoading ? 'Please wait...' : primaryLabel}
              variant="primary"
              size="large"
              onPress={primaryAction}
              disabled={isLoading}
              style={{ marginTop: 4 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : undefined}
            </TactileButton>
          </Animated.View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Theme.colors.inkMuted48} />
            <Text style={styles.footerText}>Secure clinical data encryption</Text>
          </View>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Reusable InputField ───────────────────────────────────────────────────────
function InputField({
  label, icon, placeholder, value, onChangeText,
  secureTextEntry, autoCapitalize, autoCorrect,
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputField}>
        <View style={styles.inputBevel} />
        <Ionicons name={icon} size={18} color={Theme.colors.inkMuted48} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.inkMuted48}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
    overflow: 'hidden',
  },

  topBar: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.card,
  },

  keyboard: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // ── Form card — frosted glass panel
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: Theme.radius.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    gap: 18,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  cardBevel: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    zIndex: 1,
  },

  // ── Header
  header: {},
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: Theme.colors.inkMuted48,
    lineHeight: 21,
    letterSpacing: Theme.typography.tracking.normal,
  },

  // ── Segmented control (iOS native feel)
  segControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: Theme.radius.lg,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Theme.radius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  segBtnActive: {
    backgroundColor: Theme.colors.canvas,
    ...Theme.shadows.card,
  },
  segActiveBevel: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  segText: {
    fontSize: 14,
    fontWeight: '400',
    color: Theme.colors.inkMuted48,
    letterSpacing: Theme.typography.tracking.normal,
  },
  segTextActive: {
    fontWeight: '600',
    color: Theme.colors.ink,
  },

  // ── Input fields
  inputWrap: { gap: 6 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.normal,
    marginLeft: 2,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    height: 54,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  inputBevel: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  inputIcon: { marginRight: 10 },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.normal,
  },
  eyeBtn: { padding: 6 },

  // ── Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: Theme.colors.inkMuted48,
  },
});