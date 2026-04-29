import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import AppLayout from "@/components/AppLayout";
import MentorshipSection from "@/components/MentorshipSection";
import MenteeNoShowPenaltyBanner from "@/components/MenteeNoShowPenaltyBanner";
import { Loader2 } from "lucide-react";

const MinhasMentorias = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-6 space-y-4">
        {!isAdmin && <MenteeNoShowPenaltyBanner userId={user.id} />}
        <MentorshipSection />
      </div>
    </AppLayout>
  );
};

export default MinhasMentorias;
