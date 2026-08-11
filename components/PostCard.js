import React, { useMemo, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AvatarWithStatus from './AvatarWithStatus';
import RatingStars from './RatingStars';
import { RADIUS, FONT, SPACING, SHADOW } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const getCompensationMap = (COLORS) => ({
  Free: { label: 'Free', color: COLORS.free, bg: COLORS.freeSoft },
  Paid: { label: 'Paid', color: COLORS.paid, bg: COLORS.paidSoft },
  Rent: { label: 'Rent', color: COLORS.rent, bg: COLORS.rentSoft },
  Exchange: { label: 'Skill Exchange', color: COLORS.exchange, bg: COLORS.exchangeSoft },
});

export default function PostCard({ post, onPress, onToggleLike, onToggleBookmark, onConnect }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const compensationMap = useMemo(() => getCompensationMap(COLORS), [COLORS]);
  const likeScale = useRef(new Animated.Value(1)).current;
  const comp = compensationMap[post.compensation] || compensationMap.Free;
  const isNeed = post.type === 'need';

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.35, useNativeDriver: true, speed: 60 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onToggleLike && onToggleLike(post.id);
  };

  return (
    <Pressable onPress={() => onPress && onPress(post)} style={styles.card}>
      <View style={styles.header}>
        <AvatarWithStatus uri={post.user.avatar} size={44} online={post.user.online} showStatus={false} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name} numberOfLines={1}>{post.user.name}</Text>
          <Text style={styles.dept} numberOfLines={1}>{post.user.department}</Text>
        </View>
        <RatingStars rating={post.user.rating} size={12} />
      </View>

      <View style={styles.typeBadgeRow}>
        <View style={[styles.typeBadge, { backgroundColor: isNeed ? COLORS.errorSoft : COLORS.successSoft }]}>
          <Text style={[styles.typeBadgeText, { color: isNeed ? COLORS.error : COLORS.success }]}>
            {isNeed ? 'Need Help' : 'Offering Help'}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: comp.bg }]}>
          <Text style={[styles.typeBadgeText, { color: comp.color }]}>
            {comp.label}{post.price ? ` · ${post.price}` : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{post.description}</Text>

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.locationText} numberOfLines={1}>{post.location}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.locationText}>{post.postedAt}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => onConnect && onConnect(post)} style={styles.connectBtn}>
          <Ionicons name="paper-plane-outline" size={15} color={COLORS.white} />
          <Text style={styles.connectText}>Connect</Text>
        </Pressable>

        <View style={styles.actionsRow}>
          <Pressable onPress={handleLike} hitSlop={8} style={styles.actionBtn}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons
                name={post.liked ? 'heart' : 'heart-outline'}
                size={22}
                color={post.liked ? COLORS.error : COLORS.textSecondary}
              />
            </Animated.View>
            <Text style={styles.actionCount}>{post.likes}</Text>
          </Pressable>
          <Pressable onPress={() => onToggleBookmark && onToggleBookmark(post.id)} hitSlop={8} style={styles.actionBtn}>
            <Ionicons
              name={post.bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={21}
              color={post.bookmarked ? COLORS.primary : COLORS.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      ...SHADOW.soft,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    name: {
      fontSize: FONT.body,
      fontWeight: '700',
      color: COLORS.text,
    },
    dept: {
      fontSize: FONT.tiny,
      color: COLORS.textSecondary,
      marginTop: 1,
    },
    typeBadgeRow: {
      flexDirection: 'row',
      marginBottom: SPACING.sm,
    },
    typeBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: RADIUS.round,
      marginRight: 8,
    },
    typeBadgeText: {
      fontSize: FONT.tiny,
      fontWeight: '700',
    },
    title: {
      fontSize: FONT.h4,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 4,
    },
    description: {
      fontSize: FONT.small,
      color: COLORS.textSecondary,
      lineHeight: 19,
    },
    image: {
      width: '100%',
      height: 160,
      borderRadius: RADIUS.md,
      marginTop: SPACING.md,
      backgroundColor: COLORS.card,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.md,
    },
    locationText: {
      fontSize: FONT.tiny,
      color: COLORS.textLight,
      marginLeft: 4,
      maxWidth: '55%',
    },
    dot: {
      color: COLORS.textLight,
      marginHorizontal: 6,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    connectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: RADIUS.round,
    },
    connectText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: FONT.small,
      marginLeft: 6,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: SPACING.lg,
    },
    actionCount: {
      fontSize: FONT.tiny,
      color: COLORS.textSecondary,
      marginLeft: 4,
      fontWeight: '600',
    },
  });
