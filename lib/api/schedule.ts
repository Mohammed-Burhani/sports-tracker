import { supabase } from "@/lib/supabase";

export interface GenerateScheduleResponse {
  success: boolean;
  teams_created: number;
  courts_created: number;
  matches_created: number;
  rounds_created: number;
  error?: string;
}

export async function triggerScheduleGeneration(
  eventId: string
): Promise<GenerateScheduleResponse> {
  console.log('triggerScheduleGeneration called with eventId:', eventId);
  
  try {
    // First, delete existing schedule data
    console.log('Deleting existing matches...');
    await supabase.from("matches").delete().eq("event_id", eventId);
    
    console.log('Deleting existing standings...');
    await supabase.from("standings").delete().eq("event_id", eventId);
    
    console.log('Deleting existing format config...');
    await supabase.from("event_format_config").delete().eq("event_id", eventId);
    
    console.log('Deleting existing courts...');
    await supabase.from("courts").delete().eq("event_id", eventId);
    
    console.log('Deleting existing teams...');
    await supabase.from("teams").delete().eq("event_id", eventId);
    
    console.log('Invoking Supabase function: generate-event-schedule');
    const { data, error } = await supabase.functions.invoke(
      "generate-event-schedule",
      {
        body: { event_id: eventId },
      }
    );

    console.log('Supabase function response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }
    
    console.log('Schedule generation successful:', data);
    return data;
  } catch (err: any) {
    console.error('triggerScheduleGeneration caught error:', err);
    console.error('Error stack:', err.stack);
    throw err;
  }
}
