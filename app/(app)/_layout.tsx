import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="events/[id]" />
      <Stack.Screen name="events/create" />
      <Stack.Screen name="events/[id]/edit" />
      <Stack.Screen name="sessions/[id]" />
      <Stack.Screen name="sessions/create" />
      <Stack.Screen name="sessions/[id]/edit" />
    </Stack>
  );
}
