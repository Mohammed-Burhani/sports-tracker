import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);

    if (error) {
      showErrorToast(error.message);
      return;
    }
    router.replace("/(app)/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={styles.brandContainer}>
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Sports Tracker</Text>
          <Text style={styles.brandSubtitle}>
            Manage events, sessions & participants
          </Text>
        </View>

        <View style={[styles.formCard, shadows.cardElevated]}>
          <Text style={styles.formTitle}>Sign in</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                placeholder="you@organisation.com"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          {/* <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push("/(auth)/forgot-password")}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity> */}

          <Button
            label="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Captain Sign In Button */}
          <TouchableOpacity
            style={styles.captainButton}
            onPress={() => router.push("/(auth)/captain-sign-in")}
            activeOpacity={0.7}
          >
            <Text style={styles.captainButtonText}>Sign in as Captain</Text>
            <Text style={styles.captainButtonHint}>Use your team code</Text>
          </TouchableOpacity>
        </View>

        {/* <TouchableOpacity
          style={styles.signUpContainer}
          onPress={() => router.push("/(auth)/sign-up")}
          activeOpacity={0.7}
        >
          <Text style={styles.signUpText}>
            Don't have an account?{" "}
            <Text style={styles.signUpLink}>Sign up</Text>
          </Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: spacing.huge,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  brandTitle: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  formCard: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  forgotButton: {
    alignItems: "flex-end",
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "600",
  },
  signUpContainer: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  signUpText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signUpLink: {
    color: colors.accent,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
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
  captainButton: {
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
  },
  captainButtonText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  captainButtonHint: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
