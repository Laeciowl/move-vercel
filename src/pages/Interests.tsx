import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import MenteeInterestsEditor from "@/components/MenteeInterestsEditor";
import { Button } from "@/components/ui/button";

const Interests = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 pb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/inicio")}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Configure seus Interesses</h1>
          <p className="text-muted-foreground mt-1">
            Selecione as áreas que te interessam para receber recomendações personalizadas de mentores.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border/40 p-6">
          <MenteeInterestsEditor />
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Interests;
