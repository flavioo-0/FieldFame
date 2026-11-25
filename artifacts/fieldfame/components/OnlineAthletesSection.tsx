import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import type { CommunityAthlete } from "@workspace/api-client-react";
import type { Sport } from "@/constants/demo-data";
import { useCommunity } from "@/context/CommunityContext";
import { useColors } from "@/hooks/useColors";

export function OnlineAthletesSection({
  query,
  sport,
}: {
  query: string;
  sport: Sport | "Tutti";
}) {
  const colors = useColors();
  const community = useCommunity();
  const [athletes, setAthletes] = useState<CommunityAthlete[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!community.isSignedIn) {
      setAthletes([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      void community
        .searchAthletes(query, sport === "Tutti" ? undefined : sport)
        .then((result) => {
          if (active) {
            setAthletes(result.slice(0, 8));
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [community.isSignedIn, community.searchAthletes, query, sport]);

  async function toggleFollow(athlete: CommunityAthlete) {
    try {
      const following = await community.toggleFollow(athlete.userId);
      setAthletes((current) =>
        current.map((item) =>
          item.userId === athlete.userId ? { ...item, isFollowing: following } : item,
        ),
      );
    } catch {
      setError(true);
    }
  }

  if (!community.isSignedIn) {
    return (
      <View style={[styles.signInCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Accedi per trovare e seguire atleti reali della community.
        </Text>
        <Link href="/(auth)/sign-in" style={[styles.signInLink, { color: colors.primary }]}>
          Accedi
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Atleti online</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Profili condivisi e aggiornati dalla community
          </Text>
        </View>
        <Feather name="users" size={17} color={colors.primary} />
      </View>
      {error ? (
        <Text style={[styles.description, { color: "#B42318" }]}>
          Non riesco a caricare i profili online.
        </Text>
      ) : athletes.length === 0 ? (
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Nessun altro atleta trovato per questi filtri.
        </Text>
      ) : (
        athletes.map((athlete) => (
          <View key={athlete.userId} style={[styles.athlete, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {athlete.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {athlete.displayName}
              </Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={1}>
                @{athlete.username} · {athlete.sport} · {athlete.city || athlete.position}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={athlete.isFollowing ? `Non seguire più ${athlete.displayName}` : `Segui ${athlete.displayName}`}
              onPress={() => void toggleFollow(athlete)}
              style={[styles.followButton, { backgroundColor: athlete.isFollowing ? colors.secondary : colors.primary }]}
            >
              <Text style={[styles.followText, { color: athlete.isFollowing ? colors.secondaryForeground : colors.primaryForeground }]}>
                {athlete.isFollowing ? "Segui già" : "Segui"}
              </Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 18, marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontFamily: "Inter_700Bold", fontSize: 13 },
  description: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15, marginTop: 4 },
  athlete: { minHeight: 60, borderWidth: 1, borderRadius: 15, padding: 9, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 7 },
  avatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  name: { fontFamily: "Inter_700Bold", fontSize: 11 },
  followButton: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  followText: { fontFamily: "Inter_700Bold", fontSize: 9 },
  signInCard: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  signInLink: { fontFamily: "Inter_700Bold", fontSize: 10 },
});
