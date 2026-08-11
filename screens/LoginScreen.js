import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { FONT, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';

export default function LoginScreen({ navigation }) {
  const { login, googleLogin } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter your email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password, rememberMe });
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Login failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await googleLogin({
        email: 'google.demo.user@gmail.com',
        name: 'Google Demo User',
        avatar: 'https://i.pravatar.cc/300?img=60',
      });
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Google login failed', error.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue helping and getting helped.</Text>

          <View style={{ marginTop: SPACING.xxl }}>
            <CustomInput
              label="College Email"
              icon="mail-outline"
              placeholder="you@college.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <CustomInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureText
            />

            <View style={styles.rowBetween}>
              <Pressable style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!email) {
                    Alert.alert('Enter your email', 'Type your college email above first, then tap Forgot Password.');
                    return;
                  }
                  try {
                    const res = await authService.forgotPassword(email);
                    Alert.alert('Reset link sent', res.message);
                  } catch (error) {
                    Alert.alert('Something went wrong', error.message);
                  }
                }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            <CustomButton title="Login" onPress={handleLogin} loading={loading} style={{ marginTop: SPACING.xl }} />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <CustomButton
              title="Continue with Google"
              variant="google"
              icon="logo-google"
              loading={googleLoading}
              onPress={handleGoogleLogin}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Register</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: SPACING.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: FONT.small,
    color: COLORS.primary,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONT.tiny,
    color: COLORS.textLight,
    marginHorizontal: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  footerText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: FONT.small,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
