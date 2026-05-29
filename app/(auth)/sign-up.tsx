import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  orgName: z.string().min(2, "Enter your organisation name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      // 1. Create org
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({ name: data.orgName })
        .select()
        .single();
      if (orgErr) throw orgErr;

      // 2. Sign up user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (authErr) throw authErr;

      // 3. Create profile
      if (authData.user) {
        const { error: profileErr } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          organization_id: org.id,
          full_name: data.fullName,
          role: "admin",
        });
        if (profileErr) throw profileErr;
      }

      Alert.alert(
        "Account created",
        "Check your email to confirm your account before signing in.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }]
      );
    } catch (err: any) {
      Alert.alert("Registration failed", err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#0F172A" }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: "#6366F1" }}
          >
            <Text style={{ fontSize: 32 }}>🏆</Text>
          </View>
          <Text className="text-white text-3xl font-black mb-1">Create account</Text>
          <Text className="text-slate-400 text-sm text-center">
            Set up your organisation on Sports Tracker
          </Text>
        </View>

        <View
          className="rounded-2xl p-6"
          style={{ backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" }}
        >
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                placeholder="Jane Smith"
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="orgName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Organisation Name"
                placeholder="City Sports Club"
                value={value}
                onChangeText={onChange}
                error={errors.orgName?.message}
              />
            )}
          />
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
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            label="Create account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            color="#6366F1"
          />
        </View>

        <TouchableOpacity
          className="items-center mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-slate-400">
            Already have an account?{" "}
            <Text className="text-indigo-400 font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
