import { supabase } from "@/lib/supabase";
import { TeamCaptainSession, CaptainTeamDetails } from "@/types";

export interface VerifyTeamCodeResult {
  team_id: string;
  team_name: string;
  event_id: string;
  event_name: string;
  captain_member_id: string | null;
  captain_name: string | null;
}

/**
 * Verify team access code and get basic team info
 */
export async function verifyTeamCode(
  accessCode: string
): Promise<VerifyTeamCodeResult | null> {
  const { data, error } = await supabase.rpc("verify_team_code", {
    p_access_code: accessCode.toUpperCase().trim(),
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return data[0];
}

/**
 * Create captain session after code verification
 */
export async function createCaptainSession(
  teamId: string,
  accessCode: string,
  memberId?: string,
  deviceId?: string
): Promise<TeamCaptainSession> {
  const { data, error } = await supabase
    .from("team_captain_sessions")
    .insert({
      team_id: teamId,
      member_id: memberId || null,
      access_code: accessCode.toUpperCase().trim(),
      device_id: deviceId || null,
      last_active_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get detailed captain team information
 */
export async function getCaptainTeamDetails(
  teamId: string
): Promise<CaptainTeamDetails | null> {
  const { data, error } = await supabase.rpc("get_captain_team_details", {
    p_team_id: teamId,
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return data[0];
}

/**
 * Update session last active time
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("team_captain_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw error;
}

/**
 * Get active captain session from local storage
 */
export function getActiveCaptainSession(): {
  sessionId: string;
  teamId: string;
} | null {
  try {
    const stored = localStorage.getItem("captain_session");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Store captain session in local storage
 */
export function storeCaptainSession(sessionId: string, teamId: string): void {
  localStorage.setItem(
    "captain_session",
    JSON.stringify({ sessionId, teamId })
  );
}

/**
 * Clear captain session
 */
export function clearCaptainSession(): void {
  localStorage.removeItem("captain_session");
}

/**
 * Get team access code (admin only)
 */
export async function getTeamAccessCode(teamId: string): Promise<string> {
  const { data, error } = await supabase
    .from("teams")
    .select("access_code")
    .eq("id", teamId)
    .single();

  if (error) throw error;
  return data.access_code;
}
