import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finishSignIn() {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (!session?.currentTask) router.replace("/(tabs)");
      },
    });
  }

  async function submit() {
    setError(null);
    const result = await signIn.password({ emailAddress: email.trim(), password });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (signIn.status === "complete") {
      await finishSignIn();
    } else if (signIn.status === "needs_client_trust") {
      setNeedsCode(true);
      await signIn.mfa.sendEmailCode();
    } else if (signIn.status === "needs_second_factor") {
      const emailFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );
      if (emailFactor) {
        setNeedsCode(true);
        await signIn.mfa.sendEmailCode();
      } else {
        setError("Questo account richiede un secondo fattore non disponibile in questa schermata.");
      }
    } else {
      setError("Accesso incompleto. Controlla i dati e riprova.");
    }
  }

  async function verifyCode() {
    setError(null);
    const result = await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (signIn.status === "complete") await finishSignIn();
    else setError("Codice non verificato. Riprova.");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Torna indietro"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Feather name="arrow-left" size={19} color={colors.foreground} />
        </Pressable>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Feather name="activity" size={22} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>FIELD FAME</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Entra in community</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Accedi per pubblicare clip, seguire atleti e partecipare ai tornei.
        </Text>

        {needsCode ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Codice email</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="Inserisci il codice"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="nome@email.com"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="La tua password"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          </>
        )}

        {error ? <Text style={[styles.error, { color: "#B42318" }]}>{error}</Text> : null}
        <Pressable
          disabled={fetchStatus === "fetching" || (needsCode ? !code : !email || !password)}
          onPress={() => void (needsCode ? verifyCode() : submit())}
          style={[styles.primaryButton, { backgroundColor: colors.primary }, fetchStatus === "fetching" && styles.disabled]}
        >
          {fetchStatus === "fetching" ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
              {needsCode ? "Verifica e accedi" : "Accedi"}
            </Text>
          )}
        </Pressable>
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.orText, { color: colors.mutedForeground }]}>oppure</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>
        <GoogleAuthButton />
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Non hai un account? </Text>
          <Link href="/(auth)/sign-up" style={[styles.link, { color: colors.primary }]}>Registrati</Link>
        </View>
        <View nativeID="clerk-captcha" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 25, paddingTop: 26, paddingBottom: 40 },
  back: { width: 40, height: 40, justifyContent: "center" },
  logo: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 35 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1.8, marginTop: 22 },
  title: { fontFamily: "Inter_700Bold", fontSize: 25, marginTop: 7 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 19, marginTop: 9, marginBottom: 27 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 7, marginTop: 13 },
  input: { minHeight: 49, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontFamily: "Inter_400Regular", fontSize: 12 },
  error: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 10 },
  primaryButton: { height: 50, alignItems: "center", justifyContent: "center", borderRadius: 15, marginTop: 20 },
  primaryText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  disabled: { opacity: 0.55 },
  divider: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 17 },
  line: { flex: 1, height: 1 },
  orText: { fontFamily: "Inter_400Regular", fontSize: 10 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 26 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  link: { fontFamily: "Inter_700Bold", fontSize: 11 },
});
