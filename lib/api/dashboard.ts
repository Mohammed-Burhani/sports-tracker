import { supabase } from "@/lib/supabase";
import { DashboardStats, ActivityItem } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";
  const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [eventsMonth, sessionsToday, upcomingEvents, ongoingEvents, recentSessions] =
    await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("start_date", monthStart),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("date", today),
      supabase
        .from("events")
        .select("*")
        .gte("start_date", today)
        .lte("start_date", next7Days)
        .neq("status", "cancelled")
        .order("start_date")
        .limit(10),
      supabase
        .from("events")
        .select("*")
        .eq("status", "ongoing")
        .order("start_date")
        .limit(10),
      supabase
        .from("sessions")
        .select("id, name, status, updated_at, event:events(name, sport)")
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

  // Total registered participants across active events
  const { data: activeEvents } = await supabase
    .from("events")
    .select("registered_count")
    .in("status", ["published", "ongoing"]);

  const totalRegistered =
    activeEvents?.reduce((sum, e) => sum + (e.registered_count ?? 0), 0) ?? 0;

  const recentActivity: ActivityItem[] = (recentSessions.data ?? []).map((s: any) => ({
    id: s.id,
    session_id: s.id,
    session_name: s.name,
    event_name: s.event?.name ?? "",
    sport: s.event?.sport ?? "table_tennis",
    status: s.status,
    changed_at: s.updated_at,
  }));

  return {
    eventsThisMonth: eventsMonth.count ?? 0,
    sessionsToday: sessionsToday.count ?? 0,
    totalRegisteredParticipants: totalRegistered,
    upcomingEvents: upcomingEvents.data ?? [],
    ongoingEvents: ongoingEvents.data ?? [],
    recentActivity,
  };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}
