import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
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
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert(
      "Check your email",
      "We sent a password reset link to your email.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#0F172A", padding: 24, justifyContent: "center" }}
    >
      <TouchableOpacity className="mb-6" onPress={() => router.back()}>
        <Text className="text-indigo-400 text-base">← Back</Text>
      </TouchableOpacity>
      <Text className="text-white text-2xl font-black mb-2">Reset password</Text>
      <Text className="text-slate-400 text-sm mb-6">
        Enter your account email and we'll send a reset link.
      </Text>

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

      <Button
        label="Send reset link"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        fullWidth
        color="#6366F1"
      />
    </KeyboardAvoidingView>
  );
}
