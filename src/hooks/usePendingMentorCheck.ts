import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePendingMentorCheck = () => {
  const { user } = useAuth();
  const [isPendingMentor, setIsPendingMentor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPendingMentorStatus = async () => {
      if (!user?.email) {
        setIsPendingMentor(false);
        setLoading(false);
        return;
      }

      // Check if user has a pending mentor application
      const { data, error } = await supabase
        .from("mentors")
        .select("id, status")
        .eq("email", user.email)
        .eq("status", "pending")
        .maybeSingle();

      if (error) {
        console.error("Error checking pending mentor status:", error);
        setIsPendingMentor(false);
      } else {
        setIsPendingMentor(!!data);
      }
      setLoading(false);
    };

    checkPendingMentorStatus();
  }, [user]);

  return { isPendingMentor, loading };
};
