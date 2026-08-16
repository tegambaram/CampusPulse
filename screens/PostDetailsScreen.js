import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RatingStars from '../components/RatingStars';
import AvatarWithStatus from '../components/AvatarWithStatus';
import CustomButton from '../components/CustomButton';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import postService from '../services/postService';
import bookingService from '../services/bookingService';
import conversationService from '../services/conversationService';
import { mapPost, mapConversation } from '../utils/mappers';

const getCompensationMap = (COLORS) => ({
  Free: { label: 'Free', color: COLORS.free, bg: COLORS.freeSoft },
  Paid: { label: 'Paid', color: COLORS.paid, bg: COLORS.paidSoft },
  Rent: { label: 'Rent', color: COLORS.rent, bg: COLORS.rentSoft },
  Exchange: { label: 'Skill Exchange', color: COLORS.exchange, bg: COLORS.exchangeSoft },
});

export default function PostDetailsScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user, isGuest } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [post, setPost] = useState(null);
  const [rawPost, setRawPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    postService
      .getPost(postId)
      .then((raw) => {
        setRawPost(raw);
        const mapped = mapPost(raw, user?.id);
        setPost(mapped);
        setBookmarked(mapped.bookmarked);
      })
      .catch((err) => setError(err.message || 'Could not load this post'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [postId]);

  const requireAuth = (action) => {
    if (isGuest) {
      Alert.alert('Login required', 'Create an account or log in to do that.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    action();
  };

  const handleToggleBookmark = () => {
    requireAuth(async () => {
      setBookmarked((prev) => !prev);
      try {
        await postService.toggleBookmark(postId);
      } catch (err) {
        setBookmarked((prev) => !prev);
      }
    });
  };

  const handleBook = () => {
    requireAuth(async () => {
      setBooking(true);
      try {
        await bookingService.create({ postId });
        Alert.alert('Booking requested', `Your request for "${post.title}" has been sent to ${post.user.name}.`, [
          { text: 'View Bookings', onPress: () => navigation.navigate('Booking') },
          { text: 'OK', style: 'cancel' },
        ]);
      } catch (err) {
        Alert.alert('Could not book', err.message || 'Please try again.');
      } finally {
        setBooking(false);
      }
    });
  };

  const handleContact = () => {
    requireAuth(async () => {
      try {
        const conversation = await conversationService.startConversation(post.user.id);
        navigation.navigate('Chat', { conversation: mapConversation(conversation) });
      } catch (err) {
        Alert.alert('Could not start chat', err.message || 'Please try again.');
      }
    });
  };

  const handleEdit = () => {
    // CreatePostScreen pre-fills its image picker from `editPost.image` (singular), but the raw
    // post record stores it as `images` (array) — pass the shape it actually expects, or the form
    // opens with no image and silently wipes the existing one on save.
    navigation.navigate('MainTabs', {
      screen: 'Create',
      params: { editPost: { ...rawPost, image: rawPost.images?.[0] || null } },
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete post', 'Are you sure you want to delete this post? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await postService.deletePost(postId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not delete post', err.message || 'Please try again.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerFill} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.centerFill} edges={['top']}>
        <EmptyState icon="cloud-offline-outline" title="Couldn't load this post" subtitle={error} />
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const compensationMap = getCompensationMap(COLORS);
  const comp = compensationMap[post.compensation] || compensationMap.Free;
  const isNeed = post.type === 'need';
  const isOwner = user?.id && post.user?.id === user.id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {post.image ? (
          <Image source={{ uri: post.image }} style={styles.image} />
        ) : (
          <LinearGradient colors={[COLORS.primaryLight, COLORS.primary]} style={styles.image}>
            <Ionicons name="image-outline" size={54} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        )}

        <SafeAreaView edges={['top']} style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </Pressable>
          <Pressable onPress={handleToggleBookmark} style={styles.circleBtn}>
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={bookmarked ? COLORS.primary : COLORS.text} />
          </Pressable>
        </SafeAreaView>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isNeed ? COLORS.errorSoft : COLORS.successSoft }]}>
              <Text style={[styles.badgeText, { color: isNeed ? COLORS.error : COLORS.success }]}>
                {isNeed ? 'Need Help' : 'Offering Help'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: comp.bg }]}>
              <Text style={[styles.badgeText, { color: comp.color }]}>
                {comp.label}{post.price ? ` · ${post.price}` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={COLORS.textLight} />
            <Text style={styles.metaText}>{post.location}</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="pricetag-outline" size={15} color={COLORS.textLight} />
            <Text style={styles.metaText}>{post.category}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{post.postedAt}</Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{post.description}</Text>

          <Text style={styles.sectionTitle}>Provider</Text>
          <Pressable
            style={styles.providerCard}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
          >
            <AvatarWithStatus uri={post.user.avatar} size={54} online={post.user.online} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.providerName}>{post.user.name}</Text>
              <Text style={styles.providerDept}>{post.user.department}</Text>
              <View style={{ marginTop: 4 }}>
                <RatingStars rating={post.user.rating} size={12} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {isOwner ? (
          <>
            <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={19} color={COLORS.error} />
                  <Text style={styles.deleteText}>Delete</Text>
                </>
              )}
            </Pressable>
            <CustomButton title="Edit Post" icon="create-outline" onPress={handleEdit} style={{ flex: 1.4 }} />
          </>
        ) : (
          <>
            <Pressable style={styles.contactBtn} onPress={handleContact}>
              <Ionicons name="chatbubble-ellipses-outline" size={19} color={COLORS.primary} />
              <Text style={styles.contactText}>Contact</Text>
            </Pressable>
            <CustomButton title="Book Now" onPress={handleBook} loading={booking} style={{ flex: 1.4 }} />
          </>
        )}
      </View>
    </View>
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
    backgroundColor: COLORS.white,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.small,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOW.soft,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: FONT.tiny,
    fontWeight: '700',
  },
  title: {
    fontSize: FONT.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  metaText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  dot: {
    color: COLORS.textLight,
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: FONT.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  providerName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  providerDept: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginRight: SPACING.md,
  },
  contactText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.small,
    marginLeft: 6,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.errorSoft,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginRight: SPACING.md,
  },
  deleteText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: FONT.small,
    marginLeft: 6,
  },
});
