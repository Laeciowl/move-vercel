import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MentorSession {
  id: string;
  mentor_id: string;
  user_id: string;
  scheduled_at: string;
  duration: number | null;
  status: string | null;
}

const isCompleted = (session: MentorSession): boolean => {
  if (session.status === "cancelled") return false;
  const endTime = new Date(session.scheduled_at);
  endTime.setMinutes(endTime.getMinutes() + (session.duration || 30));
  return endTime <= new Date();
};

export const useMyMentorSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("mentor_sessions")
      .select("id, mentor_id, user_id, scheduled_at, duration, status")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false });

    if (data) {
      setSessions(data as MentorSession[]);
    }
    setLoading(false);
  };

  const completedSessions = sessions.filter(isCompleted);
  const upcomingSessions = sessions.filter((s) => {
    if (s.status === "cancelled") return false;
    const endTime = new Date(s.scheduled_at);
    endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
    return endTime > new Date();
  });

  return {
    sessions,
    completedSessions,
    completedCount: completedSessions.length,
    upcomingSessions,
    loading,
    refresh: fetchSessions,
  };
};
