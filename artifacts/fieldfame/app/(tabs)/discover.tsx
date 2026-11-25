import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { StorageNotice } from '@/components/StorageNotice';
import { OnlineAthletesSection } from '@/components/OnlineAthletesSection';
import { ATHLETES, SPORTS } from '@/constants/demo-data';
import type { Sport } from '@/constants/demo-data';
import { useAppStore } from '@/context/AppStore';
import { useColors } from '@/hooks/useColors';

const FILTERS: Array<Sport | 'Tutti'> = ['Tutti', ...SPORTS];

export default function DiscoverScreen() {
  const colors = useColors();
  const { state, toggleFollow } = useAppStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Sport | 'Tutti'>('Tutti');

  const filteredAthletes = useMemo(
    () =>
      ATHLETES.filter((athlete) => {
        const matchesQuery =
          !query.trim() ||
          `${athlete.name} ${athlete.position} ${athlete.city} ${athlete.sport}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        const matchesSport = filter === 'Tutti' || athlete.sport === filter;
        return matchesQuery && matchesSport;
      }),
    [query, filter],
  );

  return (
    <Screen>
      <FlatList
        data={filteredAthletes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.pageHeader}>
              <View style={styles.headingText}>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  UNA COMMUNITY, TANTI SPORT
                </Text>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Sport
                </Text>
              </View>
              <View style={[styles.location, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="map-pin" size={13} color={colors.foreground} />
                <Text style={[styles.locationText, { color: colors.foreground }]}>
                  {state.profile.city}
                </Text>
              </View>
            </View>
            <StorageNotice />
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput
                testID="athlete-search"
                value={query}
                onChangeText={setQuery}
                placeholder="Atleta, ruolo o città"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="search"
                style={[styles.searchInput, { color: colors.foreground }]}
                accessibilityLabel="Cerca per atleta, ruolo o città"
              />
              {query ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancella ricerca"
                  onPress={() => setQuery('')}
                  hitSlop={8}
                >
                  <Feather name="x-circle" size={17} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              renderItem={({ item }) => {
                const selected = item === filter;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected ? colors.foreground : colors.card,
                        borderColor: selected ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterLabel,
                        { color: selected ? colors.card : colors.foreground },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <OnlineAthletesSection query={query} sport={filter} />
            <View style={[styles.scoutBanner, { backgroundColor: colors.foreground }]}>
              <View style={styles.bannerTop}>
                <View style={[styles.bannerIcon, { backgroundColor: colors.primary }]}>
                  <Feather name="crosshair" size={16} color={colors.primaryForeground} />
                </View>
                <Text style={[styles.bannerOverline, { color: colors.primary }]}>
                  RADAR LOCALE
                </Text>
              </View>
              <Text style={[styles.bannerTitle, { color: colors.card }]}>
                Talento, a due passi.
              </Text>
              <Text style={[styles.bannerCopy, { color: colors.muted }]}>
                Calcio, basket, pallavolo e padel: trova profili e giocate nella tua community.
              </Text>
            </View>
            <View style={styles.resultHeading}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                Profili da scoprire
              </Text>
              <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                {filteredAthletes.length} profili
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nessun atleta trovato
            </Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
              Prova un altro nome o ruolo.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isFollowing = state.followingIds.includes(item.id);
          return (
            <View
              style={[
                styles.athleteCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.rankNumber, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.rankNumberText, { color: colors.secondaryForeground }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>
              <Avatar initials={item.initials} size={47} highlighted={index === 0} />
              <View style={styles.athleteDetails}>
                <Text style={[styles.athleteName, { color: colors.foreground }]}>
                  {item.name}
                </Text>
                <Text style={[styles.athleteMeta, { color: colors.mutedForeground }]}>
                  {item.sport} · {item.position} · {item.city}
                </Text>
                <Text style={[styles.athleteStats, { color: colors.foreground }]}>
                  {item.sport === 'Calcio' ? (
                    <>
                      <Text style={styles.statBold}>{item.goals}</Text> gol
                      <Text style={[styles.statDot, { color: colors.mutedForeground }]}>  ·  </Text>
                      <Text style={styles.statBold}>{item.assists}</Text> assist
                    </>
                  ) : (
                    <>
                      <Text style={styles.statBold}>{item.highlights}</Text> highlight
                    </>
                  )}
                </Text>
              </View>
              <Pressable
                testID={`follow-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={isFollowing ? `Smetti di seguire ${item.name}` : `Segui ${item.name}`}
                accessibilityState={{ selected: isFollowing }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  toggleFollow(item.id);
                }}
                style={[
                  styles.followButton,
                  {
                    backgroundColor: isFollowing ? colors.secondary : colors.primary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather
                  name={isFollowing ? 'check' : 'plus'}
                  size={15}
                  color={isFollowing ? colors.secondaryForeground : colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.followText,
                    {
                      color: isFollowing
                        ? colors.secondaryForeground
                        : colors.primaryForeground,
                    },
                  ]}
                >
                  {isFollowing ? 'Seguito' : 'Segui'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingBottom: 118,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 11,
    paddingBottom: 15,
  },
  headingText: {
    gap: 5,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    fontSize: 9,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -0.9,
  },
  location: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  locationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  searchBar: {
    minHeight: 47,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    paddingVertical: 11,
  },
  filters: {
    gap: 7,
    paddingVertical: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  scoutBanner: {
    borderRadius: 21,
    padding: 17,
    marginBottom: 21,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverline: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    fontSize: 9,
  },
  bannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    letterSpacing: -0.5,
  },
  bannerCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 5,
  },
  resultHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  resultCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  athleteCard: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 90,
    padding: 11,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankNumber: {
    width: 23,
    height: 23,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
  },
  athleteDetails: {
    flex: 1,
    minWidth: 0,
  },
  athleteName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    marginBottom: 3,
  },
  athleteMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  athleteStats: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 5,
  },
  statBold: {
    fontFamily: 'Inter_700Bold',
  },
  statDot: {
    fontFamily: 'Inter_400Regular',
  },
  followButton: {
    minWidth: 65,
    height: 32,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 7,
  },
  followText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },
  emptyState: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginTop: 12,
  },
  emptyCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 5,
  },
});
