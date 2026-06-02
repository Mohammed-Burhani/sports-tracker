import React from "react";
import { Tabs } from "expo-router";
import { LayoutDashboard, Trophy, Target, BarChart3, Settings } from "lucide-react-native";
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
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: "Standings",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} strokeWidth={2.2} />,
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
