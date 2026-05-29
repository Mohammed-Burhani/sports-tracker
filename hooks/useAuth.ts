import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile, Organization } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { getProfile } from "@/lib/api/dashboard";

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  return {
    session,
    user,
    profile: profileQuery.data as (Profile & { organization: Organization }) | undefined,
    isLoading: session === undefined || profileQuery.isLoading,
    isAuthenticated: !!session,
    signOut: () => supabase.auth.signOut(),
  };
}
