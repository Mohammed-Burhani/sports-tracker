import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function CaptainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.base },
      }}
    >
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
