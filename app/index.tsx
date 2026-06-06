import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { View, ActivityIndicator, Image } from "react-native";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" }}>
        <Image
          source={require("@/assets/logo.png")}
          style={{ width: 120, height: 120, marginBottom: 24 }}
          resizeMode="contain"
        />
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  return <Redirect href={authenticated ? "/(app)/(tabs)" : "/(auth)/sign-in"} />;
}
