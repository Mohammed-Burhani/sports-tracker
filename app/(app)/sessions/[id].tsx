import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/hooks/useSessions";
import { useUpdateSession, useDeleteSession } from "@/hooks/useSessions";
import { usePlayerCount, useUpsertPlayerCount } from "@/hooks/usePlayerCounts";
import { useTeams } from "@/hooks/useTeams";
import { getSportMeta, getFormatMeta } from "@/constants/sports";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormatConfig, LeagueConfig, TournamentConfig, TrainingConfig, OpenPlayConfig, FriendlyConfig, ChampionshipConfig } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#64748B", ongoing: "#F59E0B", completed: "#22C55E", cancelled: "#EF4444",
};

function FormatConfigDisplay({ format, config }: { format: string; config: FormatConfig | null }) {
  if (!config) return null;
  const rows: [string, string][] = [];

  switch (format) {
    case "tournament": {
      const c = config as TournamentConfig;
      rows.push(["Bracket", c.bracket_type ?? "—"], ["Seeded", c.seeded ? "Yes" : "No"], ["Rounds", `${c.rounds_completed ?? 0} / ${c.total_rounds ?? "?"}`]);
      break;
    }
    case "league": {
      const c = config as LeagueConfig;
      rows.push(["Win pts", String(c.points_win)], ["Draw pts", String(c.points_draw)], ["Loss pts", String(c.points_loss)], ["Legs", String(c.number_of_legs)]);
      break;
    }
    case "open_play": {
      const c = config as OpenPlayConfig;
      rows.push(["Court rotation", `${c.court_rotation_interval_minutes} min`], ["Courts", String(c.simultaneous_courts)]);
      break;
    }
    case "training": {
      const c = config as TrainingConfig;
      rows.push(["Coach", c.coach_name ?? "—"], ["Drills", (c.drills ?? []).join(", ") || "—"]);
      break;
    }
    case "friendly": {
      const c = config as FriendlyConfig;
      rows.push(["Sets/Periods", String(c.sets_or_periods)], ["Scoring", c.scoring_format ?? "—"]);
      break;
    }
    case "championship": {
      const c = config as ChampionshipConfig;
      rows.push(["Qualifying rounds", String(c.qualifying_rounds)], ["Semi-finals", c.has_semi_finals ? "Yes" : "No"], ["3rd place match", c.has_third_place_match ? "Yes" : "No"]);
      break;
    }
  }

  return (
    <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#1E293B" }}>
      <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">Format Config</Text>
      {rows.map(([k, v]) => (
        <View key={k} className="flex-row justify-between py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#334155" }}>
          <Text className="text-slate-400 text-sm">{k}</Text>
          <Text className="text-white text-sm font-semibold">{v}</Text>
        </View>
      ))}
    </View>
  );
}

function CountControl({ label, value, onIncrement, onDecrement, color }: {
  label: string; value: number; onIncrement: () => void; onDecrement: () => void; color: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-slate-400 text-xs mb-2">{label}</Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onDecrement}
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#334155" }}
        >
          <Text className="text-white text-lg font-bold">−</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-black w-10 text-center">{value}</Text>
        <TouchableOpacity
          onPress={onIncrement}
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: color + "33", borderWidth: 1, borderColor: color }}
        >
          <Text style={{ color, fontSize: 18, fontWeight: "bold" }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading, refetch } = useSession(id);
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();
  const { data: playerCount } = usePlayerCount(id);
  const upsertCount = useUpsertPlayerCount();
  const event = (session as any)?.event;
  const { data: teams } = useTeams(event?.id ?? "");

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
        <View className="p-4 gap-3">
          <Skeleton height={20} width="60%" />
          <Skeleton height={120} rounded />
          <Skeleton height={80} rounded />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" }}>
        <Text className="text-slate-400">Session not found</Text>
      </SafeAreaView>
    );
  }

  const sport = getSportMeta(event?.sport ?? "table_tennis");
  const format = getFormatMeta(event?.format ?? "friendly");

  async function updateCount(field: "actual_count" | "checked_in_count", delta: number) {
    const current = (playerCount as any)?.[field] ?? 0;
    const val = Math.max(0, current + delta);
    await upsertCount.mutateAsync({ sessionId: id, counts: { [field]: val } });
  }

  async function setStatus(status: string) {
    await updateSession.mutateAsync({ id, payload: { status: status as any } });
    refetch();
  }

  async function handleDelete() {
    Alert.alert("Delete Session", "Remove this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => { await deleteSession.mutateAsync(id); router.back(); },
      },
    ]);
  }

  const isTeamEvent = event?.player_type === "team";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={sport.accent} />}
      >
        {/* Hero */}
        <View
          className="px-4 pt-4 pb-5"
          style={{ backgroundColor: sport.accent + "22", borderBottomWidth: 1, borderBottomColor: sport.accent + "44" }}
        >
          <TouchableOpacity onPress={() => router.back()} className="mb-3">
            <Text className="text-slate-400 text-sm">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-black mb-1">{session.name}</Text>
          {event && <Text className="text-slate-400 text-sm mb-3">{sport.emoji} {event.name}</Text>}
          <View className="flex-row gap-2 flex-wrap">
            <Badge label={format.label} color={sport.accent} />
            <Badge label={session.status} color={STATUS_COLORS[session.status]} />
            {session.session_number && <Badge label={`Session #${session.session_number}`} color="#64748B" />}
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Info */}
          <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#1E293B" }}>
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">Session Info</Text>
            {[
              ["Date", session.date],
              ["Start", session.start_time],
              ["Duration", `${session.duration_hours}h`],
              ...(session.end_time ? [["End", session.end_time]] : []),
              ...(session.venue_area ? [["Location", session.venue_area]] : []),
            ].map(([k, v]) => (
              <View key={k} className="flex-row justify-between py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#293548" }}>
                <Text className="text-slate-400 text-sm">{k}</Text>
                <Text className="text-white text-sm font-semibold">{v}</Text>
              </View>
            ))}
            {session.notes && (
              <View className="mt-2 pt-2 border-t border-navy-border" style={{ borderTopColor: "#293548" }}>
                <Text className="text-slate-400 text-xs">Notes</Text>
                <Text className="text-slate-300 text-sm mt-0.5">{session.notes}</Text>
              </View>
            )}
          </View>

          {/* Format config */}
          <FormatConfigDisplay format={event?.format ?? ""} config={session.format_config} />

          {/* Headcount */}
          <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#1E293B" }}>
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-4">Headcount</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 items-center">
                <Text className="text-slate-400 text-xs mb-1">Expected</Text>
                <Text className="text-2xl font-black" style={{ color: "#22C55E" }}>{playerCount?.expected_count ?? 0}</Text>
              </View>
              <View className="w-px bg-navy-border" />
              <CountControl
                label="Actual"
                value={playerCount?.actual_count ?? 0}
                onIncrement={() => updateCount("actual_count", 1)}
                onDecrement={() => updateCount("actual_count", -1)}
                color={sport.accent}
              />
              <View className="w-px bg-navy-border" />
              <CountControl
                label="Checked In"
                value={playerCount?.checked_in_count ?? 0}
                onIncrement={() => updateCount("checked_in_count", 1)}
                onDecrement={() => updateCount("checked_in_count", -1)}
                color="#06B6D4"
              />
            </View>
          </View>

          {/* Team results (if team event) */}
          {isTeamEvent && teams && teams.length > 0 && (
            <View className="mb-4">
              <Text className="text-white font-bold text-base mb-3">Team Results</Text>
              {teams.map((team) => (
                <View
                  key={team.id}
                  className="rounded-xl p-3 mb-2 flex-row items-center gap-3"
                  style={{ backgroundColor: "#1E293B", borderLeftWidth: 3, borderLeftColor: team.colour_hex }}
                >
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: team.colour_hex }} />
                  <Text className="text-white font-semibold flex-1">{team.name}</Text>
                  <Text className="text-slate-500 text-xs">Score: —</Text>
                </View>
              ))}
            </View>
          )}

          {/* Status change */}
          <View className="mb-4">
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">Change Status</Text>
            <View className="flex-row gap-2 flex-wrap">
              {["scheduled", "ongoing", "completed", "cancelled"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  className="rounded-full px-4 py-1.5"
                  style={{
                    backgroundColor: session.status === s ? STATUS_COLORS[s] + "33" : "#1E293B",
                    borderWidth: 1,
                    borderColor: session.status === s ? STATUS_COLORS[s] : "#334155",
                  }}
                >
                  <Text style={{ color: session.status === s ? STATUS_COLORS[s] : "#CBD5E1", fontSize: 12, fontWeight: "700", textTransform: "capitalize" }}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Button label="Edit" variant="secondary" onPress={() => router.push(`/(app)/sessions/${id}/edit`)} size="sm" />
            <Button label="Delete" variant="danger" onPress={handleDelete} size="sm" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
