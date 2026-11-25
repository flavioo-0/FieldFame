import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton() {
  const colors = useColors();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => void WebBrowser.coolDownAsync();
  }, []);

  async function continueWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "fieldfame",
          path: "oauth-native-callback",
        }),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: ({ session }) => {
            if (!session?.currentTask) router.replace("/(tabs)");
          },
        });
      } else {
        setError("Completa i passaggi richiesti da Google e riprova.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Accesso Google non riuscito.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => void continueWithGoogle()}
        style={({ pressed }) => [
          styles.button,
          { borderColor: colors.border, backgroundColor: colors.card },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.googleMark, { color: colors.primary }]}>G</Text>
        <Text style={[styles.buttonText, { color: colors.foreground }]}>
          {loading ? "Connessione…" : "Continua con Google"}
        </Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: "#B42318" }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 15,
    marginTop: 12,
  },
  pressed: { opacity: 0.8 },
  googleMark: { fontFamily: "Inter_700Bold", fontSize: 17 },
  buttonText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  error: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 7 },
});
