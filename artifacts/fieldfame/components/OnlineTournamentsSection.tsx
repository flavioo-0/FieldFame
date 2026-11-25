import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import type { CommunityTournament } from "@workspace/api-client-react";
import type { Sport } from "@/constants/demo-data";
import { useCommunity } from "@/context/CommunityContext";
import { useColors } from "@/hooks/useColors";

export function OnlineTournamentsSection({
  filter,
  refreshKey,
}: {
  filter: Sport | "Tutti";
  refreshKey: number;
}) {
  const colors = useColors();
  const community = useCommunity();
  const [tournaments, setTournaments] = useState<CommunityTournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [winnerTournament, setWinnerTournament] = useState<CommunityTournament | null>(null);

  const load = useCallback(async () => {
    if (!community.isSignedIn) {
      setTournaments([]);
      return;
    }
    setLoading(true);
    try {
      setTournaments(await community.getTournaments());
    } catch {
      Alert.alert("Tornei online non disponibili", "Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }, [community.getTournaments, community.isSignedIn]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const visibleTournaments = tournaments.filter(
    (item) => filter === "Tutti" || item.sport === filter,
  );

  async function toggleJoin(item: CommunityTournament) {
    setPendingId(item.id);
    try {
      await community.toggleTournamentJoin(item.id);
      await load();
    } catch (error) {
      Alert.alert(
        "Iscrizione non riuscita",
        error instanceof Error ? error.message : "Riprova tra poco.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function certifyWinner(tournament: CommunityTournament, winnerId: string) {
    setPendingId(tournament.id);
    try {
      await community.certifyTournamentWinner(tournament.id, winnerId);
      setWinnerTournament(null);
      await load();
      Alert.alert("Vittoria certificata", "Il risultato ora è visibile nella community.");
    } catch (error) {
      Alert.alert(
        "Certificazione non riuscita",
        error instanceof Error ? error.message : "Riprova tra poco.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={[styles.headingIcon, { backgroundColor: colors.primary }]}>
          <Feather name="globe" size={15} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Tornei della community</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Eventi condivisi tra gli account FieldFame
          </Text>
        </View>
        {community.isSignedIn ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Aggiorna tornei" onPress={() => void load()}>
            <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {!community.isSignedIn ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Accedi per vedere e organizzare tornei online.
          </Text>
          <Link href="/(auth)/sign-in" style={[styles.link, { color: colors.primary }]}>
            Accedi alla community
          </Link>
        </View>
      ) : loading && tournaments.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Caricamento tornei…</Text>
        </View>
      ) : visibleTournaments.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Nessun torneo online per questo sport. Organizza la prima sfida.
          </Text>
        </View>
      ) : (
        visibleTournaments.map((item) => {
          const eventFinished = Date.now() >= new Date(item.eventDate).getTime();
          return (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {item.sport} · {item.city} · {new Date(item.eventDate).toLocaleDateString("it-IT")}
                  </Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {item.venue} · {item.format}
                  </Text>
                </View>
                <View style={[styles.count, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.countText, { color: colors.secondaryForeground }]}>
                    {item.registeredCount}/{item.teamCapacity}
                  </Text>
                </View>
              </View>
              {item.winnerAthleteId ? (
                <View style={[styles.winner, { backgroundColor: "#FFF2E8" }]}>
                  <Feather name="award" size={14} color={colors.primary} />
                  <Text style={[styles.winnerText, { color: colors.foreground }]}>
                    Vincitore certificato · {item.winnerName ?? "Atleta FieldFame"}
                  </Text>
                </View>
              ) : (
                <View style={styles.actions}>
                  {item.isOrganizer && eventFinished ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setWinnerTournament(item)}
                      style={[styles.certifyButton, { borderColor: colors.primary }]}
                    >
                      <Feather name="award" size={14} color={colors.primary} />
                      <Text style={[styles.certifyText, { color: colors.primary }]}>Certifica vincitore</Text>
                    </Pressable>
                  ) : null}
                  {!item.isOrganizer ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={pendingId === item.id || (!item.currentUserJoined && item.registeredCount >= item.teamCapacity)}
                      onPress={() => void toggleJoin(item)}
                      style={[styles.joinButton, { backgroundColor: item.currentUserJoined ? colors.secondary : colors.primary }]}
                    >
                      <Text style={[styles.joinText, { color: item.currentUserJoined ? colors.secondaryForeground : colors.primaryForeground }]}>
                        {pendingId === item.id ? "…" : item.currentUserJoined ? "Annulla iscrizione" : "Partecipa"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </View>
          );
        })
      )}

      <Modal
        visible={winnerTournament !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setWinnerTournament(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeading}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.foreground }]}>Certifica il vincitore</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Scegli un atleta iscritto al torneo.
                </Text>
              </View>
              <Pressable accessibilityLabel="Chiudi" onPress={() => setWinnerTournament(null)}>
                <Feather name="x" size={19} color={colors.foreground} />
              </Pressable>
            </View>
            {(winnerTournament?.participants ?? []).length === 0 ? (
              <Text style={[styles.body, { color: colors.mutedForeground, marginTop: 18 }]}>
                Nessun atleta risulta iscritto: non è possibile certificare il risultato.
              </Text>
            ) : (
              winnerTournament?.participants.map((participant) => (
                <Pressable
                  key={participant.userId}
                  accessibilityRole="button"
                  disabled={pendingId === winnerTournament.id}
                  onPress={() => void certifyWinner(winnerTournament, participant.userId)}
                  style={[styles.participant, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.participantAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.participantInitial, { color: colors.primaryForeground }]}>
                      {participant.displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.participantName, { color: colors.foreground }]}>
                      {participant.displayName}
                    </Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>@{participant.username}</Text>
                  </View>
                  <Feather name="award" size={17} color={colors.primary} />
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  heading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  headingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 14 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  body: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 17 },
  link: { fontFamily: "Inter_700Bold", fontSize: 11 },
  card: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 13 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 5 },
  count: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  countText: { fontFamily: "Inter_700Bold", fontSize: 9 },
  winner: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, padding: 10, marginTop: 12 },
  winnerText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  joinButton: { borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9 },
  joinText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  certifyButton: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  certifyText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  overlay: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#00000066" },
  modal: { borderRadius: 22, padding: 18, maxHeight: "80%" },
  modalHeading: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  participant: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: 1 },
  participantAvatar: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  participantInitial: { fontFamily: "Inter_700Bold", fontSize: 12 },
  participantName: { fontFamily: "Inter_700Bold", fontSize: 11 },
});
