import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '../components/PostCard';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import postService from '../services/postService';
import categoryService from '../services/categoryService';
import conversationService from '../services/conversationService';
import { mapPost, mapConversation } from '../utils/mappers';

export default function HomeScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  const loadPosts = useCallback(
    async (targetPage, category) => {
      try {
        if (targetPage === 1) setError(null);
        const params = { page: targetPage, limit: 10 };
        if (category && category !== 'All') params.category = category;
        const res = await postService.getFeed(params);
        const mapped = res.data.map((p) => mapPost(p, user?.id));
        setPosts((prev) => (targetPage === 1 ? mapped : [...prev, ...mapped]));
        setHasMore(res.meta.hasMore);
        setPage(targetPage);
      } catch (err) {
        setError(err.message || 'Could not load posts');
      }
    },
    [user?.id]
  );

  useEffect(() => {
    setLoading(true);
    loadPosts(1, selectedCategory).finally(() => setLoading(false));
  }, [selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts(1, selectedCategory);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await loadPosts(page + 1, selectedCategory);
    setLoadingMore(false);
  };

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

  const toggleLike = (id) => {
    requireAuth(async () => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)));
      try {
        await postService.toggleLike(id);
      } catch (err) {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)));
      }
    });
  };

  const toggleBookmark = (id) => {
    requireAuth(async () => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)));
      try {
        await postService.toggleBookmark(id);
      } catch (err) {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)));
      }
    });
  };

  const handleConnect = (post) => {
    requireAuth(async () => {
      try {
        const conversation = await conversationService.startConversation(post.user.id);
        navigation.navigate('Chat', { conversation: mapConversation(conversation) });
      } catch (err) {
        Alert.alert('Could not start chat', err.message || 'Please try again.');
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <LinearGradient colors={[COLORS.primaryLight, COLORS.primary]} style={styles.brandIcon}>
            <Ionicons name="pulse" size={18} color={COLORS.white} />
          </LinearGradient>
          <View>
            <Text style={styles.brandTitle}>CampusPulse</Text>
            <Text style={styles.brandSubtitle}>Hi, {(user?.name || 'Guest').split(' ')[0]} 👋</Text>
          </View>
        </View>
        <Pressable style={styles.bellBtn} onPress={() => requireAuth(() => navigation.navigate('Notifications'))}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error && posts.length === 0 ? (
        <View style={styles.centerFill}>
          <EmptyState icon="cloud-offline-outline" title="Couldn't load posts" subtitle={error} />
          <Pressable style={styles.retryBtn} onPress={() => loadPosts(1, selectedCategory)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListHeaderComponent={
            <>
              <Pressable style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search" size={18} color={COLORS.textLight} />
                <Text style={styles.searchPlaceholder}>Search skills, items, people...</Text>
              </Pressable>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
                {categories.map((cat) => {
                  const active = selectedCategory === cat.name;
                  return (
                    <Pressable
                      key={cat._id}
                      style={styles.storyItem}
                      onPress={() => setSelectedCategory(active ? 'All' : cat.name)}
                    >
                      <LinearGradient
                        colors={active ? [COLORS.primaryLight, COLORS.primary] : [COLORS.border, COLORS.border]}
                        style={styles.storyRing}
                      >
                        <View style={styles.storyInner}>
                          <Ionicons name={cat.icon} size={20} color={active ? COLORS.primary : COLORS.textSecondary} />
                        </View>
                      </LinearGradient>
                      <Text style={[styles.storyLabel, active && { color: COLORS.primary, fontWeight: '700' }]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                <CategoryChip label="All" icon="apps-outline" active={selectedCategory === 'All'} onPress={() => setSelectedCategory('All')} />
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat._id}
                    label={cat.name}
                    icon={cat.icon}
                    active={selectedCategory === cat.name}
                    onPress={() => setSelectedCategory(cat.name)}
                  />
                ))}
              </ScrollView>

              <Text style={styles.feedTitle}>Recent Posts</Text>
            </>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={(p) => navigation.navigate('PostDetails', { postId: p.id })}
              onToggleLike={toggleLike}
              onToggleBookmark={toggleBookmark}
              onConnect={handleConnect}
            />
          )}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: SPACING.lg }} color={COLORS.primary} /> : null}
          ListEmptyComponent={
            <EmptyState icon="search-outline" title="No posts here yet" subtitle="Try a different category to see more posts." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: FONT.h4,
    fontWeight: '800',
    color: COLORS.text,
  },
  brandSubtitle: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: SPACING.lg,
  },
  searchPlaceholder: {
    fontSize: FONT.small,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  storiesRow: {
    paddingBottom: SPACING.md,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 64,
  },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
  },
  storyInner: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  chipsRow: {
    paddingBottom: SPACING.lg,
  },
  feedTitle: {
    fontSize: FONT.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
});
