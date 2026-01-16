import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useVolunteerCheck = () => {
  const { user } = useAuth();
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVolunteerStatus = async () => {
      if (!user) {
        setIsVolunteer(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "voluntario")
        .maybeSingle();

      if (error) {
        console.error("Error checking volunteer status:", error);
        setIsVolunteer(false);
      } else {
        setIsVolunteer(!!data);
      }
      setLoading(false);
    };

    checkVolunteerStatus();
  }, [user]);

  return { isVolunteer, loading };
};
