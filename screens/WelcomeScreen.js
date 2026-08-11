import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '../components/CustomButton';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function WelcomeScreen({ navigation }) {
  const { continueAsGuest } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.illustrationWrap}>
        <View style={styles.circleBg}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            style={styles.mainCircle}
          >
            <Ionicons name="people" size={54} color={COLORS.white} />
          </LinearGradient>

          <View style={[styles.floatingIcon, styles.floatTopLeft]}>
            <Ionicons name="book" size={20} color={COLORS.primary} />
          </View>
          <View style={[styles.floatingIcon, styles.floatTopRight]}>
            <Ionicons name="chatbubbles" size={20} color={COLORS.exchange} />
          </View>
          <View style={[styles.floatingIcon, styles.floatBottomLeft]}>
            <Ionicons name="school" size={20} color={COLORS.warning} />
          </View>
          <View style={[styles.floatingIcon, styles.floatBottomRight]}>
            <Ionicons name="heart" size={20} color={COLORS.error} />
          </View>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.heading}>Learn, Share &{'\n'}Grow Together</Text>
        <Text style={styles.subheading}>
          Trade skills, borrow essentials, and connect with students right on your campus.
        </Text>
      </View>

      <View style={styles.buttonBlock}>
        <CustomButton title="Login" onPress={() => navigation.navigate('Login')} style={{ marginBottom: SPACING.md }} />
        <CustomButton
          title="Register"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
          style={{ marginBottom: SPACING.md }}
        />
        <CustomButton
          title="Continue as Guest"
          variant="text"
          onPress={() => {
            continueAsGuest();
            navigation.replace('MainTabs');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.white,
      paddingHorizontal: SPACING.xxl,
      justifyContent: 'space-between',
    },
    illustrationWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xxxl,
    },
    circleBg: {
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: COLORS.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingIcon: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: RADIUS.lg,
      backgroundColor: COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    floatTopLeft: { top: 6, left: 6 },
    floatTopRight: { top: 6, right: 6 },
    floatBottomLeft: { bottom: 6, left: 6 },
    floatBottomRight: { bottom: 6, right: 6 },
    textBlock: {
      marginTop: SPACING.xxxl,
    },
    heading: {
      fontSize: FONT.h1,
      fontWeight: '800',
      color: COLORS.text,
      textAlign: 'center',
      lineHeight: 36,
    },
    subheading: {
      fontSize: FONT.body,
      color: COLORS.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.md,
      lineHeight: 21,
      paddingHorizontal: SPACING.sm,
    },
    buttonBlock: {
      marginBottom: SPACING.xl,
      marginTop: SPACING.xxxl,
    },
  });
