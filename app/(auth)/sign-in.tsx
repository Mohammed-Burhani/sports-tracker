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
      Alert.alert("Sign in failed", error.message);
      return;
    }
    router.replace("/(app)/(tabs)");
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
        {/* Logo / Brand */}
        <View className="items-center mb-10">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: "#6366F1" }}
          >
            <Text style={{ fontSize: 32 }}>🏆</Text>
          </View>
          <Text className="text-white text-3xl font-black mb-1">Sports Tracker</Text>
          <Text className="text-slate-400 text-base text-center">
            Manage events, sessions & participants
          </Text>
        </View>

        <View
          className="rounded-2xl p-6"
          style={{ backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" }}
        >
          <Text className="text-white text-xl font-bold mb-6">Sign in</Text>

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

          <TouchableOpacity
            className="items-end mb-4 -mt-2"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text className="text-indigo-400 text-sm">Forgot password?</Text>
          </TouchableOpacity>

          <Button
            label="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            color="#6366F1"
          />
        </View>

        <TouchableOpacity
          className="items-center mt-6"
          onPress={() => router.push("/(auth)/sign-up")}
        >
          <Text className="text-slate-400">
            Don't have an account?{" "}
            <Text className="text-indigo-400 font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
