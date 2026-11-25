import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Screen } from '@/components/Screen';
import { StorageNotice } from '@/components/StorageNotice';
import { ATHLETES, SPORTS } from '@/constants/demo-data';
import type { AthleteProfile, Sport, Tournament } from '@/constants/demo-data';
import { useAppStore } from '@/context/AppStore';
import { useCommunity } from '@/context/CommunityContext';
import { useColors } from '@/hooks/useColors';
import { OnlineTournamentsSection } from '@/components/OnlineTournamentsSection';
import { useRouter } from 'expo-router';

const SPORT_ICONS: Record<Sport, keyof typeof Feather.glyphMap> = {
  Calcio: 'target',
  Basket: 'circle',
  Pallavolo: 'activity',
  Padel: 'zap',
};
const FILTER_OPTIONS: Array<Sport | 'Tutti'> = ['Tutti', ...SPORTS];
const TEAM_CAPACITIES = [8, 12, 16, 24];

export default function TournamentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const community = useCommunity();
  const {
    state,
    toggleJoinTournament,
    certifyTournamentWinner,
  } = useAppStore();
  const [filter, setFilter] = useState<Sport | 'Tutti'>('Tutti');
  const [createOpen, setCreateOpen] = useState(false);
  const [certifyingTournament, setCertifyingTournament] =
    useState<Tournament | null>(null);
  const [onlineRefreshKey, setOnlineRefreshKey] = useState(0);

  function openCreateTournament() {
    if (!community.isSignedIn) {
      router.push('/(auth)/sign-in');
      return;
    }
    setCreateOpen(true);
  }

  const tournaments = useMemo(
    () =>
      state.tournaments
        .filter((tournament) => filter === 'Tutti' || tournament.sport === filter)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [state.tournaments, filter],
  );

  return (
    <Screen>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.pageHeader}>
              <View style={styles.titleBlock}>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  LA COMMUNITY SCENDE IN CAMPO
                </Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>
                  Tornei
                </Text>
              </View>
              <Pressable
                testID="create-tournament"
                accessibilityRole="button"
                accessibilityLabel="Organizza un torneo"
                onPress={openCreateTournament}
                style={[styles.createButton, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={16} color={colors.primaryForeground} />
                <Text style={[styles.createButtonText, { color: colors.primaryForeground }]}>
                  Organizza
                </Text>
              </Pressable>
            </View>

            <StorageNotice />
            <OnlineTournamentsSection filter={filter} refreshKey={onlineRefreshKey} />

            <View style={[styles.heroCard, { backgroundColor: colors.foreground }]}>
              <View style={styles.heroTopLine}>
                <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
                  <Feather name="calendar" size={17} color={colors.primaryForeground} />
                </View>
                <Text style={[styles.heroEyebrow, { color: colors.primary }]}>
                  PROSSIMA SFIDA
                </Text>
              </View>
              <Text style={[styles.heroTitle, { color: colors.card }]}>
                Organizza. Partecipa. Gioca.
              </Text>
              <Text style={[styles.heroCopy, { color: colors.muted }]}>
                Crea tornei per il tuo sport e trova avversari nella community.
              </Text>
              <View style={[styles.heroStats, { borderTopColor: colors.muted }]}>
                <View>
                  <Text style={[styles.heroNumber, { color: colors.card }]}>
                    {state.tournaments.length}
                  </Text>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>
                    EVENTI
                  </Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.muted }]} />
                <View>
                  <Text style={[styles.heroNumber, { color: colors.card }]}>
                    {state.joinedTournamentIds.length}
                  </Text>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>
                    I TUOI TORNEI
                  </Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.muted }]} />
                <View>
                  <Text style={[styles.heroNumber, { color: colors.card }]}>
                    {SPORTS.length}
                  </Text>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>
                    SPORT
                  </Text>
                </View>
              </View>
            </View>

            <FlatList
              horizontal
              data={FILTER_OPTIONS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
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
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
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
              }}
            />

            <View style={styles.listHeading}>
              <View>
                <Text style={[styles.listTitle, { color: colors.foreground }]}>
                  Prossimi tornei
                </Text>
                <Text style={[styles.listSubtitle, { color: colors.mutedForeground }]}>
                  {filter === 'Tutti' ? 'Tutti gli sport' : filter}
                </Text>
              </View>
              <Text style={[styles.eventCount, { color: colors.mutedForeground }]}>
                {tournaments.length} {tournaments.length === 1 ? 'evento' : 'eventi'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="calendar" size={20} color={colors.accentForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nessun torneo per ora
            </Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
              Organizza la prima sfida per {filter === 'Tutti' ? 'la community' : filter}.
            </Text>
            <Pressable
              onPress={openCreateTournament}
              style={[styles.emptyCta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.emptyCtaText, { color: colors.primaryForeground }]}>
                Crea un torneo
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <TournamentCard
            tournament={item}
            joined={state.joinedTournamentIds.includes(item.id)}
            isOrganizer={
              item.organizerId === 'me' ||
              (!item.organizerId && item.organizer === state.profile.name)
            }
            onCertify={() => setCertifyingTournament(item)}
            onJoin={() => {
              const isJoined = state.joinedTournamentIds.includes(item.id);
              if (!isJoined && item.registeredCount >= item.teamCapacity) {
                Alert.alert('Torneo completo', 'Non ci sono più posti disponibili.');
                return;
              }
              void Haptics.selectionAsync();
              toggleJoinTournament(item.id);
            }}
          />
        )}
      />
      <CreateTournamentModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (tournament) => {
          try {
            await community.createTournament({
              title: tournament.name,
              sport: tournament.sport,
              city: tournament.city,
              venue: tournament.venue,
              eventDate: new Date(tournament.date).toISOString(),
              format: tournament.format,
              teamCapacity: tournament.teamCapacity,
            });
            setFilter('Tutti');
            setCreateOpen(false);
            setOnlineRefreshKey((value) => value + 1);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert(
              'Torneo non pubblicato',
              error instanceof Error ? error.message : 'Riprova tra poco.',
            );
          }
        }}
        defaultSport={community.profile?.sport ?? state.profile.sport}
        defaultCity={community.profile?.city ?? state.profile.city}
      />
      <WinnerCertificationModal
        visible={certifyingTournament !== null}
        tournament={certifyingTournament}
        profile={state.profile}
        athletes={ATHLETES.filter(
          (athlete) => athlete.sport === certifyingTournament?.sport,
        )}
        onClose={() => setCertifyingTournament(null)}
        onCertify={(winnerId, winnerName) => {
          if (!certifyingTournament) return;
          certifyTournamentWinner(
            certifyingTournament.id,
            winnerId,
            winnerName,
          );
          setCertifyingTournament(null);
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }}
      />
    </Screen>
  );
}

function TournamentCard({
  tournament,
  joined,
  isOrganizer,
  onJoin,
  onCertify,
}: {
  tournament: Tournament;
  joined: boolean;
  isOrganizer: boolean;
  onJoin: () => void;
  onCertify: () => void;
}) {
  const colors = useColors();
  const spotsLeft = Math.max(0, tournament.teamCapacity - tournament.registeredCount);
  const fillPercent = Math.min(
    100,
    (tournament.registeredCount / tournament.teamCapacity) * 100,
  );

  return (
    <View style={[styles.tournamentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.sportIcon, { backgroundColor: colors.accent }]}>
          <Feather
            name={SPORT_ICONS[tournament.sport]}
            size={17}
            color={colors.accentForeground}
          />
        </View>
        <View style={styles.cardTitleBlock}>
          <View style={styles.sportLabelRow}>
            <Text style={[styles.sportLabel, { color: colors.primary }]}>
              {tournament.sport.toUpperCase()}
            </Text>
            <View style={[styles.cityDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.cityLabel, { color: colors.mutedForeground }]}>
              {tournament.city}
            </Text>
          </View>
          <Text style={[styles.tournamentName, { color: colors.foreground }]}>
            {tournament.name}
          </Text>
        </View>
        <View style={[styles.dateBadge, { backgroundColor: colors.secondary }]}>
          <Feather name="calendar" size={12} color={colors.secondaryForeground} />
          <Text style={[styles.dateText, { color: colors.secondaryForeground }]}>
            {formatDate(tournament.date)}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {tournament.venue}
          </Text>
        </View>
        <View style={styles.formatBadge}>
          <Feather name="users" size={12} color={colors.mutedForeground} />
          <Text style={[styles.formatText, { color: colors.mutedForeground }]}>
            {tournament.format}
          </Text>
        </View>
      </View>

      <View style={styles.capacityHeading}>
        <Text style={[styles.capacityLabel, { color: colors.foreground }]}>
          Iscrizioni
        </Text>
        <Text style={[styles.capacityCount, { color: colors.mutedForeground }]}>
          {tournament.registeredCount}/{tournament.teamCapacity} · {spotsLeft} posti
        </Text>
      </View>
      <View style={[styles.capacityTrack, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.capacityFill,
            { backgroundColor: colors.primary, width: `${fillPercent}%` },
          ]}
        />
      </View>

      {tournament.winnerName ? (
        <View style={[styles.winnerBanner, { backgroundColor: colors.accent }]}>
          <Feather name="award" size={14} color={colors.accentForeground} />
          <View style={styles.winnerCopy}>
            <Text style={[styles.winnerName, { color: colors.accentForeground }]}>
              {tournament.winnerName}
            </Text>
            <Text style={[styles.winnerMeta, { color: colors.accentForeground }]}>
              Vincitore certificato dall’organizzatore
            </Text>
          </View>
          <Feather name="check-circle" size={15} color={colors.accentForeground} />
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={[styles.organizerText, { color: colors.mutedForeground }]} numberOfLines={1}>
          A cura di {isOrganizer ? 'te' : tournament.organizer}
        </Text>
        {isOrganizer ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              tournament.winnerName
                ? 'Modifica il vincitore certificato'
                : 'Certifica il vincitore del torneo'
            }
            onPress={onCertify}
            style={[styles.joinButton, { backgroundColor: colors.foreground }]}
          >
            <Feather
              name={tournament.winnerName ? 'edit-2' : 'award'}
              size={13}
              color={colors.card}
            />
            <Text style={[styles.joinText, { color: colors.card }]}>
              {tournament.winnerName ? 'Modifica vincitore' : 'Certifica vincitore'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: joined, disabled: !joined && spotsLeft === 0 }}
            disabled={!joined && spotsLeft === 0}
            onPress={onJoin}
            style={[
              styles.joinButton,
              {
                backgroundColor: joined ? colors.secondary : colors.foreground,
                opacity: !joined && spotsLeft === 0 ? 0.58 : 1,
              },
            ]}
          >
            <Feather
              name={joined ? 'check' : 'plus'}
              size={13}
              color={joined ? colors.secondaryForeground : colors.card}
            />
            <Text
              style={[
                styles.joinText,
                { color: joined ? colors.secondaryForeground : colors.card },
              ]}
            >
              {joined ? 'Iscritto' : spotsLeft ? 'Iscriviti' : 'Completo'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function WinnerCertificationModal({
  visible,
  tournament,
  profile,
  athletes,
  onClose,
  onCertify,
}: {
  visible: boolean;
  tournament: Tournament | null;
  profile: AthleteProfile;
  athletes: typeof ATHLETES;
  onClose: () => void;
  onCertify: (winnerId: string, winnerName: string) => void;
}) {
  const colors = useColors();
  if (!visible || !tournament) return null;

  const ownSportMatches = profile.sport === tournament.sport;
  const candidates = [
    ...(ownSportMatches
      ? [{ id: 'me', name: profile.name, username: 'Tu', initials: 'TU' }]
      : []),
    ...athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      username: athlete.username,
      initials: athlete.initials,
    })),
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chiudi certificazione"
            onPress={onClose}
            style={styles.modalClose}
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.modalTitleBlock}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Certifica il vincitore
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              {tournament.name}
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView
          contentContainerStyle={styles.winnerContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.certificationNote, { backgroundColor: colors.accent }]}>
            <Feather name="shield" size={16} color={colors.accentForeground} />
            <Text style={[styles.certificationNoteText, { color: colors.accentForeground }]}>
              La vittoria sarà certificata dall’organizzatore. In questa anteprima la registrazione resta locale e non è una verifica ufficiale.
            </Text>
          </View>
          <Text style={[styles.winnerSectionTitle, { color: colors.foreground }]}>
            Seleziona il vincitore
          </Text>
          {candidates.map((candidate) => (
            <Pressable
              key={candidate.id}
              testID={`certify-winner-${candidate.id}`}
              accessibilityRole="button"
              onPress={() => onCertify(candidate.id, candidate.name)}
              style={[
                styles.candidateRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.candidateAvatar,
                  { backgroundColor: candidate.id === 'me' ? colors.primary : colors.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.candidateInitials,
                    {
                      color:
                        candidate.id === 'me'
                          ? colors.primaryForeground
                          : colors.secondaryForeground,
                    },
                  ]}
                >
                  {candidate.initials}
                </Text>
              </View>
              <View style={styles.candidateCopy}>
                <Text style={[styles.candidateName, { color: colors.foreground }]}>
                  {candidate.name}
                </Text>
                <Text style={[styles.candidateUsername, { color: colors.mutedForeground }]}>
                  {candidate.username}
                </Text>
              </View>
              <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
            </Pressable>
          ))}
          {candidates.length === 0 ? (
            <Text style={[styles.noCandidates, { color: colors.mutedForeground }]}>
              Nessun atleta disponibile per questo sport.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function CreateTournamentModal({
  visible,
  onClose,
  onCreate,
  defaultSport,
  defaultCity,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (
    tournament: Omit<
      Tournament,
      'id' | 'registeredCount' | 'organizer' | 'organizerId'
    >,
  ) => void;
  defaultSport: Sport;
  defaultCity: string;
}) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [sport, setSport] = useState<Sport>(defaultSport);
  const [city, setCity] = useState(defaultCity);
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [format, setFormat] = useState('');
  const [teamCapacity, setTeamCapacity] = useState(16);

  function create() {
    const normalizedDate = parseFutureDate(date);
    if (
      name.trim().length < 3 ||
      !city.trim() ||
      !venue.trim() ||
      !format.trim() ||
      !normalizedDate
    ) {
      Alert.alert(
        'Controlla i dati',
        normalizedDate
          ? 'Inserisci nome, città, luogo e formato del torneo.'
          : 'Inserisci una data valida nel futuro (GG/MM/AAAA).',
      );
      return;
    }
    onCreate({
      name: name.trim(),
      sport,
      city: city.trim(),
      venue: venue.trim(),
      date: normalizedDate,
      format: format.trim(),
      teamCapacity,
    });
    setName('');
    setCity(defaultCity);
    setVenue('');
    setDate('');
    setFormat('');
    setTeamCapacity(16);
    setSport(defaultSport);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chiudi creazione torneo"
            onPress={onClose}
            style={styles.modalClose}
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.modalTitleBlock}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Nuovo torneo
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Organizza la prossima partita
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAwareScrollViewCompat
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          bottomOffset={80}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Nome torneo</Text>
          <TextInput
            testID="tournament-name"
            value={name}
            onChangeText={setName}
            placeholder="Es. Bari Summer Cup"
            placeholderTextColor={colors.mutedForeground}
            maxLength={44}
            returnKeyType="next"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Sport</Text>
          <View style={styles.sportFormGrid}>
            {SPORTS.map((item) => {
              const selected = sport === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSport(item)}
                  style={[
                    styles.sportFormChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={SPORT_ICONS[item]}
                    size={14}
                    color={selected ? colors.primaryForeground : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.sportFormText,
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

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Città</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Bari"
            placeholderTextColor={colors.mutedForeground}
            maxLength={36}
            returnKeyType="next"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Impianto o luogo</Text>
          <TextInput
            value={venue}
            onChangeText={setVenue}
            placeholder="Nome del campo o del club"
            placeholderTextColor={colors.mutedForeground}
            maxLength={60}
            returnKeyType="next"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Data
              </Text>
              <TextInput
                testID="tournament-date"
                value={date}
                onChangeText={setDate}
                placeholder="GG/MM/AAAA"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                returnKeyType="next"
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Formato
              </Text>
              <TextInput
                value={format}
                onChangeText={setFormat}
                placeholder="5 contro 5"
                placeholderTextColor={colors.mutedForeground}
                maxLength={24}
                returnKeyType="done"
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Numero di squadre
          </Text>
          <View style={styles.capacityOptions}>
            {TEAM_CAPACITIES.map((item) => {
              const selected = teamCapacity === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTeamCapacity(item)}
                  style={[
                    styles.capacityOption,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.capacityOptionText,
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

          <View style={[styles.formNotice, { backgroundColor: colors.accent }]}>
            <Feather name="info" size={15} color={colors.accentForeground} />
            <Text style={[styles.formNoticeText, { color: colors.accentForeground }]}>
              Eventi e iscrizioni sono salvati in questa anteprima, solo su questo dispositivo.
            </Text>
          </View>

          <Pressable
            testID="save-tournament"
            accessibilityRole="button"
            onPress={create}
            style={[styles.submitButton, { backgroundColor: colors.foreground }]}
          >
            <Feather name="calendar" size={16} color={colors.card} />
            <Text style={[styles.submitButtonText, { color: colors.card }]}>
              Crea torneo
            </Text>
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

function parseFutureDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (candidate <= today) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 118,
  },
  pageHeader: {
    minHeight: 71,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 13,
  },
  titleBlock: {
    gap: 4,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -0.8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  heroCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 15,
  },
  heroTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },
  heroIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  heroCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 11,
    marginTop: 14,
  },
  heroNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  heroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 0.7,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 25,
    opacity: 0.35,
  },
  filterList: {
    gap: 7,
    paddingBottom: 18,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  listTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  listSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 3,
  },
  eventCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    paddingBottom: 2,
  },
  tournamentCard: {
    borderRadius: 19,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sportIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlock: {
    flex: 1,
  },
  sportLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  sportLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 0.7,
  },
  cityDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  cityLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
  },
  tournamentName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 9,
  },
  dateText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    textTransform: 'capitalize',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    flexShrink: 1,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  formatText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  capacityHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capacityLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  capacityCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
  },
  capacityTrack: {
    height: 5,
    borderRadius: 99,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 99,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 11,
    marginTop: 11,
  },
  winnerCopy: {
    flex: 1,
  },
  winnerName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },
  winnerMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 7,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  organizerText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
  },
  joinButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  joinText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },
  emptyCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  emptyIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  emptyCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 5,
  },
  emptyCta: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    marginTop: 14,
  },
  emptyCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalClose: {
    width: 38,
    height: 40,
    alignItems: 'flex-start',
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
    fontSize: 9,
    marginTop: 3,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 19,
    paddingTop: 16,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  sportFormGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  sportFormChip: {
    width: '48%',
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  sportFormText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  capacityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  capacityOption: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityOptionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  formNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 13,
    padding: 11,
    marginTop: 17,
  },
  formNoticeText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    lineHeight: 14,
  },
  submitButton: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    marginTop: 16,
  },
  submitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  winnerContent: {
    padding: 18,
    paddingBottom: 30,
  },
  certificationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
  },
  certificationNoteText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  winnerSectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    marginBottom: 10,
  },
  candidateRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  candidateAvatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateInitials: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  candidateCopy: {
    flex: 1,
  },
  candidateName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  candidateUsername: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    marginTop: 3,
  },
  noCandidates: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    padding: 15,
    textAlign: 'center',
  },
});
