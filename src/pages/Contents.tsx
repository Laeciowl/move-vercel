import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import AppLayout from "@/components/AppLayout";
import ContentLibrary from "@/components/ContentLibrary";
import ContentSubmissionModal from "@/components/ContentSubmissionModal";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contents = () => {
  const { user, loading: authLoading } = useAuth();
  const { isVolunteer } = useVolunteerCheck();
  const navigate = useNavigate();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/inicio")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
          {isVolunteer && (
            <Button
              onClick={() => setShowSubmitModal(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Conteúdo
            </Button>
          )}
        </div>
        <ContentLibrary />
      </div>
      {showSubmitModal && (
        <ContentSubmissionModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => setShowSubmitModal(false)}
          category="aulas_lives"
        />
      )}
    </AppLayout>
  );
};

export default Contents;
