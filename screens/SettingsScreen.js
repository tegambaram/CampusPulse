import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { colors: COLORS, isDark, setDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [notifications, setNotifications] = useState(true);

  React.useEffect(() => {
    AsyncStorage.getItem('setting:notifications').then((value) => {
      if (value !== null) setNotifications(value === 'true');
    });
  }, []);

  const handleToggleDarkMode = (value) => {
    setDarkMode(value);
  };

  const handleToggleNotifications = (value) => {
    setNotifications(value);
    AsyncStorage.setItem('setting:notifications', String(value));
  };

  const showInfo = (title, message) => Alert.alert(title, message);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.exchangeSoft }]}>
                <Ionicons name="moon-outline" size={18} color={COLORS.exchange} />
              </View>
              <Text style={styles.rowText}>Dark Mode</Text>
            </View>
            <Switch value={isDark} onValueChange={handleToggleDarkMode} color={COLORS.primary} />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Notifications</Text>
            </View>
            <Switch value={notifications} onValueChange={handleToggleNotifications} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>General</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => showInfo('Privacy Policy', 'CampusPulse only shares your posts and profile details with other verified students on your campus.')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.successSoft }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.rowText}>Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => showInfo('About CampusPulse', 'CampusPulse v1.0.0\nConnecting Students. Sharing Skills.')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.warningSoft }]}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
              </View>
              <Text style={styles.rowText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => showInfo('Help & Support', 'Reach out to campuspulse.support@college.edu for any issues.')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.paidSoft }]}>
                <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Help</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </Pressable>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.versionText}>CampusPulse v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.lg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: FONT.h3,
      fontWeight: '800',
      color: COLORS.text,
    },
    scroll: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxxl,
    },
    sectionLabel: {
      fontSize: FONT.small,
      fontWeight: '700',
      color: COLORS.textLight,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      ...SHADOW.soft,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.md,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
    },
    rowText: {
      fontSize: FONT.body,
      color: COLORS.text,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.card,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xl,
      paddingVertical: 14,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: COLORS.errorSoft,
    },
    logoutText: {
      color: COLORS.error,
      fontWeight: '700',
      fontSize: FONT.small,
      marginLeft: 8,
    },
    versionText: {
      textAlign: 'center',
      fontSize: FONT.tiny,
      color: COLORS.textLight,
      marginTop: SPACING.xl,
    },
  });
