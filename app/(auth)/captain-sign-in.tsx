import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck, ArrowRight } from "lucide-react-native";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";
import {
  verifyTeamCode,
  createCaptainSession,
  storeCaptainSession,
} from "@/lib/api/captainAuth";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function CaptainSignIn() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    const code = accessCode.trim().toUpperCase();

    if (code.length !== 6) {
      showErrorToast("Please enter a valid 6-character code");
      return;
    }

    setLoading(true);
    try {
      // Verify code
      const teamInfo = await verifyTeamCode(code);

      if (!teamInfo) {
        showErrorToast("Invalid team code");
        setLoading(false);
        return;
      }

      // Create session
      const session = await createCaptainSession(
        teamInfo.team_id,
        code,
        teamInfo.captain_member_id || undefined
      );

      // Store session
      storeCaptainSession(session.id, teamInfo.team_id);

      showSuccessToast(`Welcome, ${teamInfo.team_name}!`);

      // Navigate to event details page in captain mode
      router.replace(`/(app)/events/${teamInfo.event_id}?captain=true&teamId=${teamInfo.team_id}`);
    } catch (error: any) {
      console.error("Captain sign in error:", error);
      showErrorToast(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(text: string) {
    // Only allow alphanumeric, auto-uppercase, max 6 chars
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setAccessCode(cleaned);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, shadows.cardElevated]}>
              <LinearGradient
                colors={[colors.accent, `${colors.accent}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <ShieldCheck size={32} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Captain Access</Text>
            <Text style={styles.subtitle}>
              Enter your team code to view event details and team information
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Team Code</Text>
            <View style={[styles.codeInputContainer, shadows.card]}>
              <TextInput
                style={styles.codeInput}
                value={accessCode}
                onChangeText={handleCodeChange}
                placeholder="ABC123"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
            </View>
            <Text style={styles.hint}>
              Ask your event organizer for your unique team code
            </Text>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              shadows.card,
              (loading || accessCode.length !== 6) && styles.signInButtonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading || accessCode.length !== 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.signInButtonText}>Access Team Dashboard</Text>
                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Admin Sign In Link */}
          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.7}
          >
            <Text style={styles.adminLinkText}>
              Sign in as event organizer →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xxl,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  codeInputContainer: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeInput: {
    ...typography.heading,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    letterSpacing: 8,
  },
  hint: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
  signInButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInButtonText: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.small,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  adminLink: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  adminLinkText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
