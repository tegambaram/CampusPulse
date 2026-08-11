import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import SelectField from '../components/SelectField';
import CustomButton from '../components/CustomButton';
import { FONT, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Comm.',
  'Mechanical Engg.',
  'Civil Engineering',
  'Fine Arts',
  'Music & Performing Arts',
];

const SEMESTERS = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !department || !semester || !password || !confirmPassword) {
      Alert.alert('Incomplete form', 'Please fill in all the fields to create your account.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and Confirm Password do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, collegeEmail: email, department, semester, password, confirmPassword });
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Registration failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your campus community in a few steps.</Text>

          <View style={{ marginTop: SPACING.xxl }}>
            <CustomInput label="Full Name" icon="person-outline" placeholder="Enter your full name" value={name} onChangeText={setName} autoCapitalize="words" />
            <CustomInput label="College Email" icon="mail-outline" placeholder="you@college.edu" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <SelectField label="Department" icon="school-outline" placeholder="Select your department" value={department} options={DEPARTMENTS} onSelect={setDepartment} />
            <SelectField label="Semester" icon="calendar-outline" placeholder="Select your semester" value={semester} options={SEMESTERS} onSelect={setSemester} />
            <CustomInput label="Password" icon="lock-closed-outline" placeholder="Create a password" value={password} onChangeText={setPassword} secureText />
            <CustomInput label="Confirm Password" icon="lock-closed-outline" placeholder="Re-enter your password" value={confirmPassword} onChangeText={setConfirmPassword} secureText />

            <CustomButton title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: SPACING.sm }} />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Login</Text>
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
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
