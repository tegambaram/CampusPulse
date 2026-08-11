import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PostCard from '../components/PostCard';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import postService from '../services/postService';
import categoryService from '../services/categoryService';
import searchService from '../services/searchService';
import conversationService from '../services/conversationService';
import { mapPost, mapConversation } from '../utils/mappers';

export default function SearchScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trending, setTrending] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
    searchService.trending().then(setTrending).catch(() => {});
    if (!isGuest) searchService.recent().then(setRecentSearches).catch(() => {});
  }, []);

  const runSearch = useCallback(
    async (q) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchService.search(q.trim());
        setResults(res.data.map((p) => mapPost(p, user?.id)));
        if (!isGuest) searchService.recent().then(setRecentSearches).catch(() => {});
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [user?.id, isGuest]
  );

  const handleChangeQuery = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  };

  const toggleLike = async (id) => {
    setResults((prev) => prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)));
    try {
      await postService.toggleLike(id);
    } catch (err) {
      /* optimistic UI already applied; ignore transient errors */
    }
  };
  const toggleBookmark = async (id) => {
    setResults((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)));
    try {
      await postService.toggleBookmark(id);
    } catch (err) {
      /* optimistic UI already applied; ignore transient errors */
    }
  };
  const handleConnect = async (post) => {
    try {
      const conversation = await conversationService.startConversation(post.user.id);
      navigation.navigate('Chat', { conversation: mapConversation(conversation) });
    } catch (err) {
      navigation.navigate('Messages');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={19} color={COLORS.textLight} />
          <TextInput
            value={query}
            onChangeText={handleChangeQuery}
            placeholder="Search skills, items, people..."
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => handleChangeQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={19} color={COLORS.textLight} />
            </Pressable>
          )}
        </View>
      </View>

      {query.trim().length === 0 ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {recentSearches.length > 0 && (
            <>
              <SectionHeader title="Recent Searches" />
              <View style={styles.chipWrap}>
                {recentSearches.map((item) => (
                  <Pressable key={item} style={styles.recentChip} onPress={() => handleChangeQuery(item)}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.recentChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <SectionHeader title="Trending Skills" style={{ marginTop: SPACING.lg }} />
          <View style={styles.chipWrap}>
            {trending.map((item) => (
              <Pressable key={item._id} style={styles.trendingChip} onPress={() => handleChangeQuery(item.name)}>
                <Ionicons name="trending-up" size={14} color={COLORS.primary} />
                <Text style={styles.trendingChipText}>{item.name}</Text>
              </Pressable>
            ))}
          </View>

          <SectionHeader title="Popular Categories" style={{ marginTop: SPACING.lg }} />
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable key={cat._id} style={styles.categoryCard} onPress={() => handleChangeQuery(cat.name)}>
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={cat.icon} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryLabel}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {searching ? (
            <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.resultsLabel}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</Text>
              {results.length === 0 ? (
                <EmptyState icon="search-outline" title="No results found" subtitle="Try searching with different keywords." />
              ) : (
                results.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={(p) => navigation.navigate('PostDetails', { postId: p.id })}
                    onToggleLike={toggleLike}
                    onToggleBookmark={toggleBookmark}
                    onConnect={handleConnect}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: FONT.body,
    color: COLORS.text,
    paddingVertical: 13,
    marginLeft: 8,
  },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recentChipText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  trendingChipText: {
    fontSize: FONT.small,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: FONT.tiny,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsLabel: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
});
