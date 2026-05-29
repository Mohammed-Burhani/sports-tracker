import { supabase } from "@/lib/supabase";
import { Event, EventFormat, EventStatus, Sport } from "@/types";

export interface EventFilters {
  sport?: Sport;
  format?: EventFormat;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  let query = supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (filters?.sport) query = query.eq("sport", filters.sport);
  if (filters?.format) query = query.eq("format", filters.format);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.dateFrom) query = query.gte("start_date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("start_date", filters.dateTo);
  if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createEvent(
  payload: Omit<Event, "id" | "created_at" | "updated_at" | "registered_count">
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(
  id: string,
  payload: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
