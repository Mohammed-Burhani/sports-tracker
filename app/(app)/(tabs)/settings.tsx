import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/api/dashboard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const profileSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
});
const orgSchema = z.object({
  name: z.string().min(2, "Enter your organisation name"),
  contact_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
});

export default function SettingsTab() {
  const router = useRouter();
  const qc = useQueryClient();
  const [section, setSection] = useState<"profile" | "org">("profile");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);

  const { data: userData } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      return getProfile(user.id);
    },
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: { full_name: userData?.full_name ?? "" },
  });

  const orgForm = useForm({
    resolver: zodResolver(orgSchema),
    values: {
      name: userData?.organization?.name ?? "",
      contact_email: userData?.organization?.contact_email ?? "",
      contact_phone: userData?.organization?.contact_phone ?? "",
      address: userData?.organization?.address ?? "",
    },
  });

  async function saveProfile(data: { full_name: string }) {
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name })
      .eq("user_id", user.id);
    setSavingProfile(false);
    if (error) {
      showErrorToast(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: queryKeys.profile });
    showSuccessToast("Profile updated");
  }

  async function saveOrg(data: z.infer<typeof orgSchema>) {
    if (!userData?.organization?.id) return;
    setSavingOrg(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: data.name,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        address: data.address || null,
      })
      .eq("id", userData.organization.id);
    setSavingOrg(false);
    if (error) {
      showErrorToast(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: queryKeys.profile });
    showSuccessToast("Organisation updated");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  }

  const ROLE_COLORS: Record<string, string> = {
    admin: colors.sport.tableTennis.accent,
    staff: colors.sport.football.accent,
    viewer: colors.textTertiary,
  };
  const role = userData?.role ?? "viewer";

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Settings</Text>

          {/* User Info */}
          <View style={[styles.userCard, shadows.card]}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarEmoji}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.full_name ?? "—"}</Text>
              <Text style={styles.userOrg}>{userData?.organization?.name ?? "—"}</Text>
              <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[role]}20` }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[role] }]}>
                  {role.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Section tabs */}
          <View style={[styles.tabsContainer, shadows.card]}>
            {(["profile", "org"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSection(tab)}
                style={[
                  styles.tab,
                  section === tab && styles.tabActive,
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText,
                  section === tab && styles.tabTextActive,
                ]}>
                  {tab === "profile" ? "My Profile" : "Organisation"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {section === "profile" ? (
            <View>
              <Controller
                control={profileForm.control}
                name="full_name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    error={profileForm.formState.errors.full_name?.message as string | undefined}
                  />
                )}
              />
              <View style={styles.roleField}>
                <Text style={styles.roleLabel}>Role</Text>
                <View style={styles.roleDisplay}>
                  <Text style={styles.roleDisplayText}>{role}</Text>
                </View>
              </View>
              <Button
                label="Save Profile"
                onPress={profileForm.handleSubmit(saveProfile)}
                loading={savingProfile}
                fullWidth
              />
            </View>
          ) : (
            <View>
              <Controller
                control={orgForm.control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Organisation Name"
                    value={value}
                    onChangeText={onChange}
                    error={orgForm.formState.errors.name?.message}
                  />
                )}
              />
              <Controller
                control={orgForm.control}
                name="contact_email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Contact Email"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={orgForm.formState.errors.contact_email?.message}
                  />
                )}
              />
              <Controller
                control={orgForm.control}
                name="contact_phone"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Contact Phone"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                  />
                )}
              />
              <Controller
                control={orgForm.control}
                name="address"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Address"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />
              {userData?.role === "admin" && (
                <Button
                  label="Save Organisation"
                  onPress={orgForm.handleSubmit(saveOrg)}
                  loading={savingOrg}
                  fullWidth
                />
              )}
            </View>
          )}

          <View style={styles.footerSection}>
            <Button
              label="Sign out"
              onPress={handleSignOut}
              variant="danger"
              fullWidth
            />
            <Text style={styles.versionText}>
              Sports Tracker v{Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  pageTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  userCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarEmoji: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userOrg: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleText: {
    ...typography.small,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
  },
  tabText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.accentInk,
  },
  roleField: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  roleDisplay: {
    backgroundColor: colors.inputFill,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  roleDisplayText: {
    ...typography.body,
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  footerSection: {
    marginTop: spacing.xxxl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  versionText: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
