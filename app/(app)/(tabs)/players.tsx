import React from "react";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayerCountSummary } from "@/hooks/usePlayerCounts";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSportMeta } from "@/constants/sports";

function HeadcountBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-slate-400 text-xs">{label}</Text>
        <Text className="text-white text-xs font-bold">{value}</Text>
      </View>
      <View className="h-2 rounded-full bg-navy-elevated overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

export default function PlayersTab() {
  const { data, isLoading, refetch, isRefetching } = usePlayerCountSummary();

  const totalExpected = data?.reduce((s, e) => s + e.total_expected, 0) ?? 0;
  const totalActual = data?.reduce((s, e) => s + e.total_actual, 0) ?? 0;
  const totalCheckedIn = data?.reduce((s, e) => s + e.total_checked_in, 0) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22C55E" />
        }
      >
        <Text className="text-white text-2xl font-black mb-6">Headcount</Text>

        {/* Summary totals */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" }}
        >
          <Text className="text-slate-400 text-xs uppercase tracking-widest mb-4">Overall participation</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 items-center">
              <Text className="text-3xl font-black" style={{ color: "#22C55E" }}>{totalExpected}</Text>
              <Text className="text-slate-500 text-xs mt-1">Expected</Text>
            </View>
            <View className="w-px bg-navy-border" />
            <View className="flex-1 items-center">
              <Text className="text-3xl font-black text-white">{totalActual}</Text>
              <Text className="text-slate-500 text-xs mt-1">Actual</Text>
            </View>
            <View className="w-px bg-navy-border" />
            <View className="flex-1 items-center">
              <Text className="text-3xl font-black" style={{ color: "#06B6D4" }}>{totalCheckedIn}</Text>
              <Text className="text-slate-500 text-xs mt-1">Checked In</Text>
            </View>
          </View>
        </View>

        {/* Per event */}
        <Text className="text-white text-lg font-bold mb-3">By Event</Text>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            emoji="👥"
            title="No participant data yet"
            subtitle="Sessions with logged headcounts will appear here"
          />
        ) : (
          data?.map((event) => {
            const sport = getSportMeta(event.sport);
            const maxVal = Math.max(event.total_expected, event.total_actual, event.total_checked_in, 1);
            return (
              <View
                key={event.event_id}
                className="rounded-2xl p-4 mb-3"
                style={{
                  backgroundColor: "#1E293B",
                  borderLeftWidth: 3,
                  borderLeftColor: sport.accent,
                }}
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <Text style={{ fontSize: 18 }}>{sport.emoji}</Text>
                  <Text className="text-white font-bold text-base flex-1" numberOfLines={1}>
                    {event.event_name}
                  </Text>
                </View>
                <HeadcountBar label="Expected" value={event.total_expected} max={maxVal} color="#22C55E" />
                <HeadcountBar label="Actual" value={event.total_actual} max={maxVal} color={sport.accent} />
                <HeadcountBar label="Checked In" value={event.total_checked_in} max={maxVal} color="#06B6D4" />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
