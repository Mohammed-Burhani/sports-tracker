import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
          <View style={[styles.logoBox, shadows.card]}>
            <Text style={styles.logoEmoji}>🏆</Text>
          </View>
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
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    backgroundColor: colors.accent,
  },
  logoEmoji: {
    fontSize: 32,
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
});
