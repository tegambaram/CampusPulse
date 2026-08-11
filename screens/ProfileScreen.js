import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RatingStars from '../components/RatingStars';
import SkillChip from '../components/SkillChip';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import AvatarWithStatus from '../components/AvatarWithStatus';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import userService from '../services/userService';
import { mapPost } from '../utils/mappers';

export default function ProfileScreen({ navigation }) {
  const { user, isGuest, logout } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [stats, setStats] = useState({ postsCount: 0, reviewsCount: 0 });
  const [myPosts, setMyPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      userService.getUser(user.id),
      userService.getUserPosts(user.id, 1),
      userService.getUserReviews(user.id, 1),
    ])
      .then(([profileRes, postsRes, reviewsRes]) => {
        setStats(profileRes.stats);
        setMyPosts(postsRes.data.slice(0, 3).map((p) => mapPost(p, user.id)));
        setReviews(reviewsRes.data.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerFill}>
          <EmptyState icon="person-circle-outline" title="You're browsing as a guest" subtitle="Log in or create an account to view and manage your profile." />
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Login / Register</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        <LinearGradient colors={[COLORS.primaryLight, COLORS.primary]} style={styles.headerBg}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Pressable onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={20} color={COLORS.white} />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.avatarWrap}>
          <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.department}>{user.department} • {user.semester}</Text>
          <View style={{ marginTop: 6 }}>
            <RatingStars rating={user.rating || 0} count={user.ratingCount || 0} size={14} />
          </View>
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={styles.statsRow}>
          <StatCard value={stats.postsCount} label="Posts" />
          <StatCard value={stats.reviewsCount} label="Reviews" />
          <StatCard value={(user.rating || 0).toFixed(1)} label="Rating" />
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.primaryAction} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="create-outline" size={17} color={COLORS.white} />
            <Text style={styles.primaryActionText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('Booking')}>
            <Ionicons name="calendar-outline" size={17} color={COLORS.primary} />
            <Text style={styles.secondaryActionText}>Bookings</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title="Skills" />
              <View style={styles.skillsWrap}>
                {(user.skills || []).length === 0 ? (
                  <Text style={styles.emptyInlineText}>No skills added yet.</Text>
                ) : (
                  user.skills.map((skill) => <SkillChip key={skill} label={skill} />)
                )}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title={`My Posts (${stats.postsCount})`} actionLabel="See all" onAction={() => navigation.navigate('Search')} />
              {myPosts.length === 0 ? (
                <Text style={styles.emptyInlineText}>You haven't posted anything yet.</Text>
              ) : (
                myPosts.map((post) => (
                  <Pressable key={post.id} style={styles.miniPost} onPress={() => navigation.navigate('PostDetails', { postId: post.id })}>
                    <View style={styles.miniPostIcon}>
                      <Ionicons name={post.type === 'need' ? 'hand-left-outline' : 'sparkles-outline'} size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniPostTitle} numberOfLines={1}>{post.title}</Text>
                      <Text style={styles.miniPostMeta}>{post.category} • {post.postedAt}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title="Reviews" />
              {reviews.length === 0 ? (
                <Text style={styles.emptyInlineText}>No reviews yet.</Text>
              ) : (
                reviews.map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <AvatarWithStatus uri={review.fromUser?.profileImage} size={40} showStatus={false} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.reviewTopRow}>
                        <Text style={styles.reviewName}>{review.fromUser?.name}</Text>
                        <RatingStars rating={review.rating} size={11} showValue={false} />
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.small,
  },
  headerBg: {
    height: 120,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT.h3,
    fontWeight: '800',
    color: COLORS.white,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -56,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.card,
    ...SHADOW.medium,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: '35%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  infoBlock: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  name: {
    fontSize: FONT.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  department: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  bio: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginRight: SPACING.sm,
  },
  primaryActionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.small,
    marginLeft: 6,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginLeft: SPACING.sm,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.small,
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyInlineText: {
    fontSize: FONT.small,
    color: COLORS.textLight,
  },
  miniPost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  miniPostIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm + 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  miniPostTitle: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.text,
  },
  miniPostMeta: {
    fontSize: FONT.tiny,
    color: COLORS.textLight,
    marginTop: 2,
  },
  reviewCard: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewComment: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xl,
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
});
