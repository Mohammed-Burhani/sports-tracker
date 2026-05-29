import React from "react";
import { Tabs } from "expo-router";
import { LayoutDashboard, Trophy, Timer, Users, Settings } from "lucide-react-native";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { backgroundColor: 'transparent' }
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: "Sessions",
          tabBarIcon: ({ color, size }) => <Timer color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Players",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
