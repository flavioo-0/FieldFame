import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  getAchievementBadges,
  type AchievementBadge,
} from '@/constants/achievements';
import { DEMO_POSTS, SPORTS } from '@/constants/demo-data';
import type { AthleteProfile, HighlightCategory, HighlightPost, Sport } from '@/constants/demo-data';
import { useAppStore } from '@/context/AppStore';
import { useCommunity } from '@/context/CommunityContext';
import { useColors } from '@/hooks/useColors';

const POSITIONS_BY_SPORT: Record<Sport, string[]> = {
  Calcio: ['Ala', 'Attaccante', 'Centrocampo', 'Difensore', 'Portiere'],
  Basket: ['Guardia', 'Ala', 'Centro', 'Playmaker'],
  Pallavolo: ['Palleggiatore', 'Schiacciatore', 'Centrale', 'Libero'],
  Padel: ['Destro', 'Sinistra'],
};

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const community = useCommunity();
  const {
    state,
    toggleLike,
    toggleSave,
    updateProfile,
  } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(state.profile.name);
  const [draftSport, setDraftSport] = useState<Sport>(state.profile.sport);
  const [draftPosition, setDraftPosition] = useState(state.profile.position);
  const [activeSection, setActiveSection] = useState<'Highlight' | 'Salvati'>('Highlight');

  const currentProfile: AthleteProfile = community.profile
    ? {
        ...state.profile,
        name: community.profile.displayName,
        username: community.profile.username,
        city: community.profile.city,
        sport: community.profile.sport,
        position: community.profile.position,
        number: community.profile.number,
      }
    : state.profile;
  const ownPosts = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...state.myPosts.filter((post) => post.athleteId === 'me'),
            ...community.feedPosts.filter((post) => post.athleteId === community.userId),
          ].map((post) => [post.id, post]),
        ).values(),
      ),
    [community.feedPosts, community.userId, state.myPosts],
  );
  const displayedPosts = useMemo(() => {
    if (activeSection === 'Highlight') return ownPosts;
    const saved = [...community.feedPosts, ...state.myPosts, ...DEMO_POSTS].filter((post) =>
      state.savedPostIds.includes(post.id),
    );
    return saved;
  }, [activeSection, community.feedPosts, ownPosts, state.myPosts, state.savedPostIds]);
  const badges = useMemo(() => getAchievementBadges(state), [state]);
  const unlockedBadges = badges.filter((badge) => badge.unlocked).length;

  useEffect(() => {
    if (community.isSignedIn) void community.refreshFeed('popular').catch(() => undefined);
  }, [community.isSignedIn, community.refreshFeed]);
  useEffect(() => {
    if (editing) return;
    setDraftName(currentProfile.name);
    setDraftSport(currentProfile.sport);
    setDraftPosition(currentProfile.position);
  }, [community.profile, editing, currentProfile.name, currentProfile.position, currentProfile.sport]);

  function openEditor() {
    setDraftName(currentProfile.name);
    setDraftSport(currentProfile.sport);
    setDraftPosition(currentProfile.position);
    setEditing(true);
  }

  async function saveProfile() {
    const trimmedName = draftName.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Nome troppo breve', 'Inserisci almeno due caratteri.');
      return;
    }
    const username = trimmedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    const profile: AthleteProfile = {
      ...currentProfile,
      name: trimmedName,
      username: username || currentProfile.username,
      sport: draftSport,
      position: draftPosition,
    };
    if (community.isSignedIn) {
      try {
        await community.updateProfile({
          username: profile.username,
          displayName: profile.name,
          city: profile.city,
          sport: profile.sport,
          position: profile.position,
          number: profile.number,
          bio: community.profile?.bio ?? '',
          avatarUrl: community.profile?.avatarUrl ?? null,
        });
      } catch (error) {
        Alert.alert(
          'Profilo online non aggiornato',
          error instanceof Error ? error.message : 'Riprova tra poco.',
        );
        return;
      }
    }
    updateProfile(profile);
    setEditing(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <Screen>
      <FlatList
        data={displayedPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.mark}
                />
                <Text style={[styles.brandName, { color: colors.foreground }]}>
                  Il tuo profilo
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Modifica profilo"
                onPress={openEditor}
                style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="edit-2" size={16} color={colors.foreground} />
              </Pressable>
            </View>
            <StorageNotice />
            <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTitle, { color: colors.foreground }]}>
                  {community.isSignedIn ? 'Community online attiva' : 'Entra nella community'}
                </Text>
                <Text style={[styles.accountCopy, { color: colors.mutedForeground }]}>
                  {community.isSignedIn
                    ? `@${community.profile?.username ?? 'profilo'} · clip e tornei condivisi`
                    : 'Accedi per pubblicare clip, commentare e partecipare ai tornei.'}
                </Text>
              </View>
              {community.isSignedIn ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Esci dall’account"
                  onPress={() => void community.signOut()}
                  style={[styles.accountButton, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.accountButtonText, { color: colors.secondaryForeground }]}>Esci</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(auth)/sign-in')}
                  style={[styles.accountButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.accountButtonText, { color: colors.primaryForeground }]}>Accedi</Text>
                </Pressable>
              )}
            </View>
            {community.profileError ? (
              <Text style={{ color: '#B42318', fontFamily: 'Inter_400Regular', fontSize: 10, marginBottom: 12 }}>
                {community.profileError}
              </Text>
            ) : null}
            <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.profileHero}>
                <View style={[styles.coverShape, { backgroundColor: colors.foreground }]}>
                  <View style={[styles.coverOrb, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.coverWordmark, { color: colors.card }]}>
                    BARI / 2026
                  </Text>
                  <Image
                    source={require('../../assets/images/icon.png')}
                    style={styles.coverMark}
                  />
                </View>
                <View style={styles.avatarOverlap}>
                  <Avatar initials={currentProfile.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()} size={66} highlighted />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameLine}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.foreground }]}>
                      {currentProfile.name}
                    </Text>
                    <Text style={[styles.username, { color: colors.mutedForeground }]}>
                      @{currentProfile.username}
                    </Text>
                  </View>
                  <View style={[styles.numberBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.numberText, { color: colors.accentForeground }]}>
                      #{currentProfile.number}
                    </Text>
                  </View>
                </View>
                <View style={styles.profileTags}>
                  <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                    <Feather name="activity" size={12} color={colors.secondaryForeground} />
                    <Text style={[styles.tagText, { color: colors.secondaryForeground }]}>
                      {currentProfile.position}
                    </Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                    <Feather name="map-pin" size={12} color={colors.secondaryForeground} />
                    <Text style={[styles.tagText, { color: colors.secondaryForeground }]}>
                      {currentProfile.city}
                    </Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                    <Feather name="shield" size={12} color={colors.secondaryForeground} />
                    <Text style={[styles.tagText, { color: colors.secondaryForeground }]}>
                      {currentProfile.sport}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.bio, { color: colors.mutedForeground }]}>
                  Ogni partita è un’occasione. Il prossimo highlight può essere il mio.
                </Text>
                <View style={[styles.statsRow, { borderColor: colors.border }]}>
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatValue, { color: colors.foreground }]}>
                      {ownPosts.length}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.mutedForeground }]}>
                      HIGHLIGHT
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatValue, { color: colors.foreground }]}>
                      {state.followingIds.length}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.mutedForeground }]}>
                      SEGUITI
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatValue, { color: colors.foreground }]}>
                      {state.savedPostIds.length}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.mutedForeground }]}>
                      SALVATI
                    </Text>
                  </View>
                </View>
                <Pressable
                  testID="edit-profile"
                  accessibilityRole="button"
                  onPress={openEditor}
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                >
                  <Feather name="edit-3" size={14} color={colors.primaryForeground} />
                  <Text style={[styles.editButtonText, { color: colors.primaryForeground }]}>
                    Modifica profilo
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.badgeSection}>
              <View style={styles.badgeSectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    I tuoi badge
                  </Text>
                  <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                    {unlockedBadges} di {badges.length} sbloccati
                  </Text>
                </View>
                <View style={[styles.badgeCounter, { backgroundColor: colors.accent }]}>
                  <Feather name="award" size={14} color={colors.accentForeground} />
                  <Text style={[styles.badgeCounterText, { color: colors.accentForeground }]}>
                    {unlockedBadges}
                  </Text>
                </View>
              </View>
              <View style={styles.badgeGrid}>
                {badges.map((badge) => (
                  <AchievementCard key={badge.id} badge={badge} />
                ))}
              </View>
              <Text style={[styles.badgeFootnote, { color: colors.mutedForeground }]}>
                I badge si aggiornano con i tuoi highlight, le iscrizioni e i risultati certificati.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  In evidenza
                </Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  La tua storia, azione dopo azione
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pubblica un highlight"
                onPress={() => router.push('/create')}
                style={[styles.addButton, { backgroundColor: colors.foreground }]}
              >
                <Feather name="plus" size={17} color={colors.card} />
              </Pressable>
            </View>

            <View style={[styles.segment, { backgroundColor: colors.secondary }]}>
              {(['Highlight', 'Salvati'] as const).map((item) => {
                const selected = item === activeSection;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setActiveSection(item)}
                    style={[
                      styles.segmentOption,
                      selected && { backgroundColor: colors.card },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: selected ? colors.foreground : colors.mutedForeground },
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
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather
                name={activeSection === 'Highlight' ? 'video' : 'bookmark'}
                size={21}
                color={colors.accentForeground}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {activeSection === 'Highlight' ? 'Il prossimo highlight è tuo' : 'Ancora nessun salvato'}
            </Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
              {activeSection === 'Highlight'
                ? 'Pubblica una giocata e inizia a costruire il tuo profilo.'
                : 'Salva le azioni che vuoi ritrovare.'}
            </Text>
            {activeSection === 'Highlight' ? (
              <Pressable
                onPress={() => router.push('/create')}
                style={[styles.publishCta, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.publishCtaText, { color: colors.primaryForeground }]}>
                  Pubblica il tuo primo video
                </Text>
              </Pressable>
            ) : null}
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
          />
        )}
      />
      <Modal
        visible={editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chiudi modifica profilo"
              onPress={() => setEditing(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Modifica profilo
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Salva profilo"
              onPress={saveProfile}
              style={styles.saveButton}
            >
              <Feather name="check" size={21} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.editorContent}
          >
            <Text style={[styles.editorLabel, { color: colors.foreground }]}>
              Nome atleta
            </Text>
            <TextInput
              testID="profile-name-input"
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Come ti chiami?"
              placeholderTextColor={colors.mutedForeground}
              maxLength={40}
              autoCapitalize="words"
              returnKeyType="done"
              style={[
                styles.nameInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
            <Text style={[styles.editorLabel, { color: colors.foreground }]}>
              Sport praticato
            </Text>
            <View style={styles.positionGrid}>
              {SPORTS.map((item) => {
                const selected = draftSport === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setDraftSport(item);
                      setDraftPosition(POSITIONS_BY_SPORT[item][0]);
                    }}
                    style={[
                      styles.positionChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.positionText,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.editorLabel, { color: colors.foreground }]}>
              Ruolo
            </Text>
            <View style={styles.positionGrid}>
              {POSITIONS_BY_SPORT[draftSport].map((item) => {
                const selected = draftPosition === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setDraftPosition(item)}
                    style={[
                      styles.positionChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.positionText,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.privacyNote, { backgroundColor: colors.accent }]}>
              <Feather name="lock" size={14} color={colors.accentForeground} />
              <Text style={[styles.privacyText, { color: colors.accentForeground }]}>
                Il profilo e i dati di esempio restano su questo dispositivo.
              </Text>
            </View>
            <Pressable
              testID="save-profile"
              accessibilityRole="button"
              onPress={saveProfile}
              style={[styles.modalCta, { backgroundColor: colors.foreground }]}
            >
              <Text style={[styles.modalCtaText, { color: colors.card }]}>
                Salva modifiche
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

function AchievementCard({ badge }: { badge: AchievementBadge }) {
  const colors = useColors();
  const progress = badge.progress
    ? Math.min(100, (badge.progress.value / badge.progress.target) * 100)
    : 0;
  const status = badge.verified
    ? 'CERTIFICATO'
    : badge.unlocked
      ? 'SBLOCCATO'
      : badge.level === 'Certificato'
        ? 'DA CERTIFICARE'
        : badge.level.toUpperCase();

  return (
    <View
      accessibilityLabel={`${badge.title}: ${badge.unlocked ? 'sbloccato' : 'da sbloccare'}`}
      style={[
        styles.badgeCard,
        {
          backgroundColor: badge.unlocked ? colors.accent : colors.card,
          borderColor: badge.unlocked ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.badgeTop}>
        <View
          style={[
            styles.badgeIcon,
            { backgroundColor: badge.unlocked ? colors.primary : colors.secondary },
          ]}
        >
          <Feather
            name={badge.unlocked ? badge.icon : 'award'}
            size={16}
            color={
              badge.unlocked
                ? colors.primaryForeground
                : colors.mutedForeground
            }
          />
        </View>
        <Text
          style={[
            styles.badgeStatus,
            { color: badge.unlocked ? colors.accentForeground : colors.mutedForeground },
          ]}
        >
          {status}
        </Text>
      </View>
      <Text style={[styles.badgeTitle, { color: colors.foreground }]}>
        {badge.title}
      </Text>
      <Text style={[styles.badgeDescription, { color: colors.mutedForeground }]}>
        {badge.description}
      </Text>
      {badge.progress ? (
        <View style={styles.badgeProgressArea}>
          <Text style={[styles.badgeProgressNote, { color: colors.mutedForeground }]}>
            {badge.progress.note ??
              `${badge.progress.value}/${badge.progress.target}`}
          </Text>
          <View style={[styles.badgeProgressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.badgeProgressFill,
                { backgroundColor: colors.primary, width: `${progress}%` },
              ]}
            />
          </View>
        </View>
      ) : !badge.unlocked ? (
        <Text style={[styles.badgeProgressNote, { color: colors.mutedForeground }]}>
          Da sbloccare
        </Text>
      ) : (
        <View style={[styles.certifiedTag, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={9} color={colors.primaryForeground} />
          <Text style={[styles.certifiedTagText, { color: colors.primaryForeground }]}>
            Vincitore verificato dall’organizzatore
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountTitle: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  accountCopy: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 14, marginTop: 4 },
  accountButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  accountButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  topBar: {
    height: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 23,
    marginBottom: 22,
    overflow: 'hidden',
  },
  profileHero: {
    height: 126,
  },
  coverShape: {
    height: 105,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  coverOrb: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    right: -48,
    top: -105,
    opacity: 0.95,
  },
  coverWordmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    zIndex: 1,
  },
  coverMark: {
    width: 45,
    height: 45,
    position: 'absolute',
    right: 17,
    bottom: 15,
    borderRadius: 13,
  },
  avatarOverlap: {
    position: 'absolute',
    left: 17,
    bottom: 0,
  },
  profileInfo: {
    paddingHorizontal: 17,
    paddingBottom: 16,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  username: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 3,
  },
  numberBadge: {
    width: 41,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
  },
  tagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  bio: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 15,
    paddingVertical: 12,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  profileStatValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  profileStatLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
    letterSpacing: 0.7,
  },
  statDivider: {
    height: 28,
    width: 1,
  },
  editButton: {
    height: 39,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 13,
  },
  editButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  badgeSection: {
    marginBottom: 24,
  },
  badgeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeCounter: {
    minWidth: 38,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  badgeCounterText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },
  badgeCard: {
    width: '48.5%',
    minHeight: 152,
    borderWidth: 1,
    borderRadius: 16,
    padding: 11,
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  badgeIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeStatus: {
    fontFamily: 'Inter_700Bold',
    fontSize: 7,
    letterSpacing: 0.4,
  },
  badgeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    lineHeight: 14,
  },
  badgeDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    lineHeight: 12,
    marginTop: 4,
  },
  badgeProgressArea: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  badgeProgressNote: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
    lineHeight: 10,
    marginTop: 7,
  },
  badgeProgressTrack: {
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 5,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 99,
  },
  certifiedTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 7,
    marginTop: 8,
  },
  certifiedTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 6,
  },
  badgeFootnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    lineHeight: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  sectionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 4,
  },
  addButton: {
    width: 37,
    height: 37,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    marginBottom: 13,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 23,
    marginTop: 2,
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
    fontSize: 14,
    textAlign: 'center',
  },
  emptyCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 5,
  },
  publishCta: {
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginTop: 15,
  },
  publishCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  closeButton: {
    width: 35,
    height: 35,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  saveButton: {
    width: 35,
    height: 35,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  editorContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  editorLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 13,
  },
  nameInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  positionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 13,
    padding: 12,
    marginTop: 22,
  },
  privacyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    flex: 1,
    lineHeight: 15,
  },
  modalCta: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    marginTop: 20,
  },
  modalCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
});
