import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { StorageNotice } from '@/components/StorageNotice';
import { ATHLETES } from '@/constants/demo-data';
import type { Athlete } from '@/constants/demo-data';
import { useAppStore } from '@/context/AppStore';
import { useColors } from '@/hooks/useColors';

type Metric = 'Gol' | 'Assist' | 'Parate';

export default function RankingsScreen() {
  const colors = useColors();
  const { state } = useAppStore();
  const [metric, setMetric] = useState<Metric>('Gol');
  const [period, setPeriod] = useState<'Stagione' | 'Settimana'>('Stagione');
  const footballAthletes = useMemo(
    () => {
      const ownPosts = state.myPosts.filter(
        (post) => post.athleteId === 'me' && post.sport === 'Calcio',
      );
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentPosts = ownPosts.filter(
        (post) =>
          post.createdAt !== undefined &&
          Date.parse(post.createdAt) >= weekAgo,
      );
      const countCategory = (posts: typeof ownPosts, category: string) =>
        posts.filter((post) => post.category === category).length;
      const initials = state.profile.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      const myAthlete: Athlete = {
        id: 'me',
        name: state.profile.name,
        username: state.profile.username,
        city: state.profile.city,
        sport: 'Calcio',
        position: state.profile.position,
        number: state.profile.number,
        goals: countCategory(ownPosts, 'Gol'),
        assists: countCategory(ownPosts, 'Assist'),
        saves: countCategory(ownPosts, 'Parata'),
        weeklyGoals: countCategory(recentPosts, 'Gol'),
        weeklyAssists: countCategory(recentPosts, 'Assist'),
        weeklySaves: countCategory(recentPosts, 'Parata'),
        highlights: ownPosts.length,
        initials,
      };
      return [
        ...ATHLETES.filter((athlete) => athlete.sport === 'Calcio'),
        ...(state.profile.sport === 'Calcio' ? [myAthlete] : []),
      ];
    },
    [state.profile, state.myPosts],
  );
  const leaderboard = useMemo(
    () =>
      [...footballAthletes].sort((a, b) => {
        const aValue =
          metric === 'Gol'
            ? period === 'Settimana' ? a.weeklyGoals : a.goals
            : metric === 'Assist'
              ? period === 'Settimana' ? a.weeklyAssists : a.assists
              : period === 'Settimana' ? a.weeklySaves : a.saves;
        const bValue =
          metric === 'Gol'
            ? period === 'Settimana' ? b.weeklyGoals : b.goals
            : metric === 'Assist'
              ? period === 'Settimana' ? b.weeklyAssists : b.assists
              : period === 'Settimana' ? b.weeklySaves : b.saves;
        return bValue - aValue;
      }),
    [footballAthletes, metric, period],
  );

  return (
    <Screen>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  IL CAMPO HA UNA CLASSIFICA
                </Text>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Ranking
                </Text>
              </View>
              <View style={[styles.cityPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="map-pin" size={13} color={colors.foreground} />
                <Text style={[styles.cityText, { color: colors.foreground }]}>Bari</Text>
              </View>
            </View>
            <StorageNotice />
            <View style={[styles.heroCard, { backgroundColor: colors.foreground }]}>
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
                  <Feather name="bar-chart-2" size={17} color={colors.primaryForeground} />
                </View>
                <Text style={[styles.heroOverline, { color: colors.primary }]}>
                  CLASSIFICA LOCALE
                </Text>
                <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.liveText, { color: colors.muted }]}>BARI</Text>
              </View>
              <Text style={[styles.heroTitle, { color: colors.card }]}>
                La città scende in campo.
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
                I tuoi gol, assist e le tue parate pubblicati aggiornano il ranking.
              </Text>
              <View style={[styles.heroStats, { borderTopColor: colors.muted }]}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroNumber, { color: colors.card }]}>01</Text>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>
                    IN TESTA
                  </Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.muted }]} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroNumber, { color: colors.card }]}>
                    {footballAthletes.length}
                  </Text>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>
                    ATLETI
                  </Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.muted }]} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroNumber, { color: colors.card }]}>24/7</Text>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>
                    SCOUTING
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.periodRow, { backgroundColor: colors.secondary }]}>
              {(['Stagione', 'Settimana'] as const).map((item) => {
                const selected = item === period;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setPeriod(item)}
                    style={[
                      styles.periodOption,
                      selected && { backgroundColor: colors.card },
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        { color: selected ? colors.foreground : colors.mutedForeground },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.metrics}>
              {(['Gol', 'Assist', 'Parate'] as Metric[]).map((item) => {
                const selected = metric === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setMetric(item)}
                    style={[
                      styles.metricChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.metricText,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.listHeading}>
              <Text style={[styles.listTitle, { color: colors.foreground }]}>
                Top atleti
              </Text>
              <Text style={[styles.listMeta, { color: colors.mutedForeground }]}>
                {period.toLowerCase()} · Bari
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const score =
            metric === 'Gol'
              ? period === 'Settimana' ? item.weeklyGoals : item.goals
              : metric === 'Assist'
                ? period === 'Settimana' ? item.weeklyAssists : item.assists
                : period === 'Settimana' ? item.weeklySaves : item.saves;
          return (
            <View
              style={[
                styles.athleteRow,
                { backgroundColor: colors.card, borderColor: colors.border },
                index === 0 && styles.firstRow,
                index === 0 && { borderColor: colors.primary },
              ]}
            >
              <View
                style={[
                  styles.place,
                  {
                    backgroundColor: index === 0 ? colors.primary : colors.secondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.placeText,
                    {
                      color:
                        index === 0
                          ? colors.primaryForeground
                          : colors.secondaryForeground,
                    },
                  ]}
                >
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>
              <Avatar initials={item.initials} size={43} highlighted={index === 0} />
              <View style={styles.athleteInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.athleteName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  {item.id === 'me' ? (
                    <View style={[styles.youBadge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.youBadgeText, { color: colors.accentForeground }]}>
                        TU
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.athleteMeta, { color: colors.mutedForeground }]}>
                  {item.position} · #{item.number}
                </Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={[styles.score, { color: colors.foreground }]}>{score}</Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                  {metric.toUpperCase()}
                </Text>
              </View>
              <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
            </View>
          );
        }}
        ListFooterComponent={
          <View style={[styles.note, { backgroundColor: colors.accent }]}>
            <Feather name="info" size={14} color={colors.accentForeground} />
            <Text style={[styles.noteText, { color: colors.accentForeground }]}>
              Classifica dimostrativa per il pilot di Bari. I punteggi reali arriveranno con le prime sfide.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 11,
    paddingBottom: 15,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    fontSize: 9,
    marginBottom: 5,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -0.9,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  heroCard: {
    borderRadius: 23,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heroIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  heroOverline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    flex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    opacity: 0.9,
  },
  liveText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    letterSpacing: -0.5,
    marginTop: 16,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 250,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 16,
  },
  heroStat: {
    gap: 3,
  },
  heroNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  heroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
    letterSpacing: 0.8,
  },
  heroDivider: {
    height: 29,
    width: 1,
    opacity: 0.3,
  },
  periodRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  periodOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  periodText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  metricText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  listTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  listMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  athleteRow: {
    minHeight: 73,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 17,
    marginBottom: 8,
  },
  firstRow: {
    borderWidth: 1.5,
  },
  place: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },
  athleteInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  youBadge: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 3,
  },
  youBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 7,
    letterSpacing: 0.4,
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
  scoreBlock: {
    alignItems: 'flex-end',
    minWidth: 37,
    marginRight: 2,
  },
  score: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  scoreLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
    letterSpacing: 0.5,
  },
  note: {
    marginTop: 9,
    borderRadius: 13,
    padding: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
});
