import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/api/dashboard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";

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
    if (error) { Alert.alert("Error", error.message); return; }
    qc.invalidateQueries({ queryKey: queryKeys.profile });
    Alert.alert("Saved", "Profile updated.");
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
    if (error) { Alert.alert("Error", error.message); return; }
    qc.invalidateQueries({ queryKey: queryKeys.profile });
    Alert.alert("Saved", "Organisation updated.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  }

  const ROLE_COLORS: Record<string, string> = { admin: "#F59E0B", staff: "#22C55E", viewer: "#64748B" };
  const role = userData?.role ?? "viewer";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-white text-2xl font-black mb-6">Settings</Text>

        {/* User Info */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-center gap-4"
          style={{ backgroundColor: "#1E293B" }}
        >
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: "#6366F133" }}
          >
            <Text style={{ fontSize: 28 }}>👤</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{userData?.full_name ?? "—"}</Text>
            <Text className="text-slate-400 text-sm">{userData?.organization?.name ?? "—"}</Text>
            <View
              className="mt-1 self-start rounded-full px-2 py-0.5"
              style={{ backgroundColor: ROLE_COLORS[role] + "22" }}
            >
              <Text style={{ color: ROLE_COLORS[role], fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                {role}
              </Text>
            </View>
          </View>
        </View>

        {/* Section tabs */}
        <View className="flex-row mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: "#1E293B" }}>
          {(["profile", "org"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSection(tab)}
              className="flex-1 py-2.5 items-center"
              style={{ backgroundColor: section === tab ? "#6366F1" : "transparent" }}
            >
              <Text className="font-semibold text-sm" style={{ color: section === tab ? "#FFF" : "#64748B" }}>
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
            <View className="mb-4">
              <Text className="text-slate-400 text-sm mb-1 font-medium">Role</Text>
              <View
                className="rounded-xl p-3"
                style={{ backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" }}
              >
                <Text className="text-slate-300 capitalize">{role}</Text>
              </View>
            </View>
            <Button
              label="Save Profile"
              onPress={profileForm.handleSubmit(saveProfile)}
              loading={savingProfile}
              fullWidth
              color="#6366F1"
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
                color="#6366F1"
              />
            )}
          </View>
        )}

        <View className="mt-8 pt-6 border-t border-navy-border">
          <Button
            label="Sign out"
            onPress={handleSignOut}
            variant="danger"
            fullWidth
          />
          <Text className="text-slate-600 text-xs text-center mt-4">
            Sports Tracker v{Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
