import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMentorCheck = () => {
  const { user } = useAuth();
  const [isMentor, setIsMentor] = useState(false);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMentorStatus = async () => {
      if (!user?.email) {
        setIsMentor(false);
        setMentorId(null);
        setLoading(false);
        return;
      }

      // Check if user is an approved mentor by email
      const { data, error } = await supabase
        .from("mentors")
        .select("id, status")
        .eq("email", user.email)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        console.error("Error checking mentor status:", error);
        setIsMentor(false);
        setMentorId(null);
      } else {
        setIsMentor(!!data);
        setMentorId(data?.id || null);
      }
      setLoading(false);
    };

    checkMentorStatus();
  }, [user]);

  return { isMentor, mentorId, loading };
};
