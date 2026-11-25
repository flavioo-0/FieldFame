import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/Avatar';
import { HighlightCard } from '@/components/HighlightCard';
import { Screen } from '@/components/Screen';
import { StorageNotice } from '@/components/StorageNotice';
import { DEMO_POSTS, SPORTS } from '@/constants/demo-data';
import type {
  FeedPreferences,
  HighlightPost,
  Sport,
} from '@/constants/demo-data';
import { useAppStore } from '@/context/AppStore';
import { useCommunity } from '@/context/CommunityContext';
import { useColors } from '@/hooks/useColors';
import type { CommunityComment } from '@workspace/api-client-react';

type FeedMode = 'Per te' | 'Globale';

const STORY_ITEMS = [
  { initials: 'MG', name: 'Matteo', id: 'ath-07' },
  { initials: 'SC', name: 'Simone', id: 'ath-09' },
  { initials: 'DN', name: 'Davide', id: 'ath-11' },
  { initials: 'TL', name: 'Tommy', id: 'ath-01' },
];
const SPORT_ICONS: Record<Sport, keyof typeof Feather.glyphMap> = {
  Calcio: 'target',
  Basket: 'circle',
  Pallavolo: 'activity',
  Padel: 'zap',
};

export default function FeedScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    state,
    toggleLike,
    toggleSave,
    updateFeedPreferences,
  } = useAppStore();
  const community = useCommunity();
  const [mode, setMode] = useState<FeedMode>('Per te');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [commentPost, setCommentPost] = useState<HighlightPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<FeedPreferences>(
    state.feedPreferences,
  );
  const activeFilterCount =
    state.feedPreferences.sports.length +
    Number(state.feedPreferences.followingOnly) +
    Number(state.feedPreferences.localOnly);
  React.useEffect(() => {
    if (!community.isSignedIn) return;
    const modeToFetch =
      mode === 'Per te' && state.feedPreferences.followingOnly
        ? 'following'
        : 'popular';
    void community.refreshFeed(modeToFetch).catch(() => undefined);
  }, [
    community.isSignedIn,
    community.refreshFeed,
    mode,
    state.feedPreferences.followingOnly,
  ]);
  React.useEffect(() => {
    if (!commentPost || !community.isSignedIn || !commentPost.isShared) {
      setComments([]);
      return;
    }
    let active = true;
    setCommentsLoading(true);
    void community
      .getComments(commentPost.id)
      .then((result) => {
        if (active) setComments(result);
      })
      .catch(() => {
        if (active) setComments([]);
      })
      .finally(() => {
        if (active) setCommentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [commentPost?.id, community.getComments, community.isSignedIn]);
  const posts = useMemo(() => {
    const combined = Array.from(
      new Map(
        [...community.feedPosts, ...state.myPosts, ...DEMO_POSTS].map((post) => [
          post.id,
          post,
        ]),
      ).values(),
    );
    if (mode === 'Globale') {
      return combined.sort(
        (a, b) =>
          b.likes + Number(!b.isShared && state.likedPostIds.includes(b.id)) -
          (a.likes + Number(!a.isShared && state.likedPostIds.includes(a.id))),
      );
    }
    const preferences = state.feedPreferences;
    return combined.filter(
      (post) =>
        (preferences.sports.length === 0 ||
          preferences.sports.includes(post.sport)) &&
        (!preferences.followingOnly ||
          post.isShared ||
          state.followingIds.includes(post.athleteId)) &&
        (!preferences.localOnly || post.city === state.profile.city),
    );
  }, [
    state.myPosts,
    community.feedPosts,
    state.feedPreferences,
    state.followingIds,
    state.profile.city,
    state.likedPostIds,
    mode,
  ]);

  function openFilters() {
    setDraftPreferences(state.feedPreferences);
    setFiltersOpen(true);
  }

  function toggleDraftSport(sport: Sport) {
    setDraftPreferences((current) => ({
      ...current,
      sports: current.sports.includes(sport)
        ? current.sports.filter((item) => item !== sport)
        : [...current.sports, sport],
    }));
  }

  function toggleDraftPreference(key: 'followingOnly' | 'localOnly') {
    setDraftPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function applyFilters() {
    updateFeedPreferences(draftPreferences);
    setFiltersOpen(false);
  }

  async function submitComment() {
    if (!commentPost || !commentText.trim() || commentSending) return;
    setCommentSending(true);
    try {
      const created = await community.addComment(commentPost.id, commentText);
      setComments((current) => [...current, created]);
      setCommentText('');
      await community.refreshFeed(mode === 'Globale' ? 'popular' : 'following');
    } catch {
      // Keep the draft visible so the athlete can retry.
    } finally {
      setCommentSending(false);
    }
  }

  return (
    <Screen>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.brandMark}
                />
                <Text style={[styles.brandName, { color: colors.foreground }]}>
                  FIELD<Text style={{ color: colors.primary }}>FAME</Text>
                </Text>
              </View>
              <View style={styles.topActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerca atleti"
                  onPress={() => router.push('/discover')}
                  style={[styles.topIcon, { backgroundColor: colors.card }]}
                >
                  <Feather name="search" size={19} color={colors.foreground} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pubblica un highlight"
                  testID="open-create-post"
                  onPress={() => router.push('/create')}
                  style={[styles.createButton, { backgroundColor: colors.primary }]}
                >
                  <Feather name="plus" size={19} color={colors.primaryForeground} />
                </Pressable>
              </View>
            </View>

            <StorageNotice />

            <View style={styles.introRow}>
              <View style={styles.introText}>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  IL TALENTO GIOCA QUI
                </Text>
                <Text style={[styles.headline, { color: colors.foreground }]}>
                  Ciao, {state.profile.name.split(' ')[0]}.
                </Text>
                <Text style={[styles.subheadline, { color: colors.mutedForeground }]}>
                  Il campo è tuo. Fatti vedere.
                </Text>
              </View>
              <View
                style={[
                  styles.cityTag,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather name="map-pin" size={13} color={colors.foreground} />
                <Text style={[styles.cityText, { color: colors.foreground }]}>
                  {state.profile.city}
                </Text>
              </View>
            </View>

            <View style={styles.storyArea}>
              <View style={styles.sectionHeading}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  In campo oggi
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/discover')}
                  hitSlop={8}
                >
                  <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>
                    Scopri tutti
                  </Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stories}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aggiungi il tuo highlight"
                  onPress={() => router.push('/create')}
                  style={styles.storyItem}
                >
                  <View
                    style={[
                      styles.addStory,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Feather name="plus" size={20} color={colors.foreground} />
                  </View>
                  <Text style={[styles.storyName, { color: colors.mutedForeground }]}>
                    Il tuo
                  </Text>
                </Pressable>
                {STORY_ITEMS.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push('/discover')}
                    style={styles.storyItem}
                  >
                    <Avatar initials={item.initials} size={48} highlighted />
                    <Text style={[styles.storyName, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.feedHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {mode === 'Globale' ? 'Feed globale' : 'La tua community'}
                </Text>
                <Text style={[styles.smallText, { color: colors.mutedForeground }]}>
                  {mode === 'Globale'
                    ? 'Le clip più popolari, tra tutti gli sport'
                    : activeFilterCount > 0
                      ? `${activeFilterCount} filtri attivi`
                      : 'Azioni da tutti gli sport, vicino a te'}
                </Text>
              </View>
              <View style={styles.feedActions}>
                {mode === 'Per te' ? (
                  <Pressable
                    testID="open-feed-filters"
                    accessibilityRole="button"
                    accessibilityLabel={`Filtri personalizzati, ${activeFilterCount} attivi`}
                    onPress={openFilters}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: colors.card,
                        borderColor: activeFilterCount ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather name="sliders" size={14} color={colors.foreground} />
                    <Text style={[styles.filterButtonText, { color: colors.foreground }]}>
                      Filtri
                    </Text>
                    {activeFilterCount > 0 ? (
                      <View style={[styles.filterCount, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.filterCountText, { color: colors.primaryForeground }]}>
                          {activeFilterCount}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                ) : (
                  <View style={[styles.allSportsTag, { backgroundColor: colors.accent }]}>
                    <Feather name="globe" size={12} color={colors.accentForeground} />
                    <Text style={[styles.allSportsText, { color: colors.accentForeground }]}>
                      Tutti gli sport
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.filterPill, { backgroundColor: colors.secondary }]}>
                {(['Per te', 'Globale'] as FeedMode[]).map((item) => {
                  const selected = item === mode;
                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setMode(item)}
                      style={[
                        styles.filterOption,
                        selected && { backgroundColor: colors.card },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: selected ? colors.foreground : colors.mutedForeground,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="users" size={21} color={colors.accentForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {mode === 'Globale'
                ? 'Ancora poche clip popolari'
                : 'Il tuo feed si riempirà presto'}
            </Text>
            <Text style={[styles.smallText, { color: colors.mutedForeground }]}>
              {mode === 'Globale'
                ? 'Le clip più viste appariranno qui.'
                : 'Prova a modificare i filtri per vedere più azioni.'}
            </Text>
            <Pressable
              onPress={() => router.push('/discover')}
              style={[styles.emptyCta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.emptyCtaText, { color: colors.primaryForeground }]}>
                Vai alla sezione Sport
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <HighlightCard
            post={item}
            isLiked={item.isShared ? Boolean(item.likedByMe) : state.likedPostIds.includes(item.id)}
            isSaved={state.savedPostIds.includes(item.id)}
            onLike={() => {
              void Haptics.selectionAsync();
              if (item.isShared && community.isSignedIn) {
                void community.toggleLike(item.id).catch(() => undefined);
              } else {
                toggleLike(item.id);
              }
            }}
            onSave={() => {
              void Haptics.selectionAsync();
              toggleSave(item.id);
            }}
            onAthletePress={() => router.push('/discover')}
            onComments={
              item.isShared && community.isSignedIn
                ? () => setCommentPost(item)
                : undefined
            }
          />
        )}
      />
      <Modal
        visible={filtersOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={[styles.filterModal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chiudi filtri"
              onPress={() => setFiltersOpen(false)}
              style={styles.modalClose}
            >
              <Feather name="x" size={19} color={colors.foreground} />
            </Pressable>
            <View style={styles.modalTitleBlock}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Personalizza feed
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                Scegli cosa vedere in “Per te”
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterModalContent}
          >
            <View style={styles.modalSectionHeading}>
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                Sport
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setDraftPreferences((current) => ({ ...current, sports: [] }))
                }
              >
                <Text style={[styles.clearText, { color: colors.mutedForeground }]}>
                  Tutti
                </Text>
              </Pressable>
            </View>
            <View style={styles.sportFilterGrid}>
              {SPORTS.map((sport) => {
                const selected = draftPreferences.sports.includes(sport);
                return (
                  <Pressable
                    key={sport}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => toggleDraftSport(sport)}
                    style={[
                      styles.sportFilterChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={SPORT_ICONS[sport]}
                      size={14}
                      color={selected ? colors.primaryForeground : colors.foreground}
                    />
                    <Text
                      style={[
                        styles.sportFilterLabel,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {sport}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalSectionTitle, styles.optionsTitle, { color: colors.foreground }]}>
              Altri filtri
            </Text>
            <PreferenceRow
              icon="users"
              title="Solo atleti che seguo"
              description="Nasconde i contenuti degli altri profili."
              value={draftPreferences.followingOnly}
              onValueChange={() => toggleDraftPreference('followingOnly')}
            />
            <PreferenceRow
              icon="map-pin"
              title={`Solo ${state.profile.city}`}
              description="Mostra highlight della tua città."
              value={draftPreferences.localOnly}
              onValueChange={() => toggleDraftPreference('localOnly')}
            />
            <View style={[styles.modalHint, { backgroundColor: colors.accent }]}>
              <Feather name="zap" size={15} color={colors.accentForeground} />
              <Text style={[styles.modalHintText, { color: colors.accentForeground }]}>
                “Globale” mostra sempre le clip più popolari di tutti gli sport.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const defaults: FeedPreferences = {
                  sports: [],
                  followingOnly: false,
                  localOnly: false,
                };
                setDraftPreferences(defaults);
                updateFeedPreferences(defaults);
                setFiltersOpen(false);
              }}
              style={styles.resetButton}
            >
              <Text style={[styles.resetButtonText, { color: colors.mutedForeground }]}>
                Azzera
              </Text>
            </Pressable>
            <Pressable
              testID="apply-feed-filters"
              accessibilityRole="button"
              onPress={applyFilters}
              style={[styles.applyButton, { backgroundColor: colors.foreground }]}
            >
              <Text style={[styles.applyButtonText, { color: colors.card }]}>
                Applica filtri
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={commentPost !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentPost(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' }}>
          <View style={{ maxHeight: '82%', backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>
                  Commenti
                </Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 }}>
                  Usa @username per menzionare un atleta
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Chiudi commenti" onPress={() => setCommentPost(null)}>
                <Feather name="x" size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ minHeight: 110 }}>
              {commentsLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : comments.length === 0 ? (
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, paddingVertical: 18 }}>
                  Nessun commento ancora. Inizia tu la conversazione.
                </Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 }}>
                      @{comment.username}
                    </Text>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                      {comment.body}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Scrivi un commento…"
                placeholderTextColor={colors.mutedForeground}
                maxLength={500}
                style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 12 }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Invia commento"
                disabled={!commentText.trim() || commentSending}
                onPress={() => void submitComment()}
                style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: !commentText.trim() || commentSending ? 0.55 : 1 }}
              >
                {commentSending ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="arrow-up" size={18} color={colors.primaryForeground} />}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.preferenceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={15} color={colors.secondaryForeground} />
      </View>
      <View style={styles.preferenceCopy}>
        <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.preferenceDescription, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  topBar: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.8,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  topIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 17,
    marginBottom: 19,
  },
  introText: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    fontSize: 9,
    marginBottom: 7,
  },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 27,
    letterSpacing: -0.8,
  },
  subheadline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  cityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  cityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  storyArea: {
    marginBottom: 23,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  stories: {
    gap: 13,
    paddingVertical: 2,
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
    width: 57,
  },
  addStory: {
    width: 52,
    height: 52,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  feedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  smallText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 4,
  },
  filterPill: {
    borderRadius: 12,
    flexDirection: 'row',
    padding: 3,
    alignSelf: 'flex-start',
    marginBottom: 13,
  },
  filterOption: {
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  feedActions: {
    minHeight: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  filterCount: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
  },
  allSportsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
  },
  allSportsText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },
  filterModal: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  modalClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 3,
  },
  filterModalContent: {
    paddingHorizontal: 19,
    paddingTop: 11,
    paddingBottom: 30,
  },
  modalSectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  modalSectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  clearText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  sportFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportFilterChip: {
    minWidth: '47%',
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportFilterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  optionsTitle: {
    marginTop: 24,
    marginBottom: 10,
  },
  preferenceRow: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 15,
    padding: 10,
    marginBottom: 8,
  },
  preferenceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  preferenceDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    marginTop: 3,
  },
  modalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 13,
    padding: 12,
    marginTop: 12,
  },
  modalHintText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: '#EBDDCF',
  },
  resetButton: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  resetButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  applyButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 23,
    marginTop: 14,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginBottom: 5,
  },
  emptyCta: {
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
});
