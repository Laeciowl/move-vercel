import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HelpCircle, Loader2, MessageCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import AppLayout from "@/components/AppLayout";
import PlatformGuide from "@/components/PlatformGuide";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Help = () => {
  const { user, loading: authLoading } = useAuth();
  const { isVolunteer } = useVolunteerCheck();
  const navigate = useNavigate();

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-button">
            <HelpCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Tudo que você precisa saber sobre a plataforma</p>
          </div>
        </div>

        {/* Content with Tabs */}
        <Tabs defaultValue={isVolunteer ? "mentor" : "mentee"} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="mentee">Para Mentorados</TabsTrigger>
            <TabsTrigger value="mentor">Para Mentores</TabsTrigger>
          </TabsList>

          <TabsContent value="mentee">
            <PlatformGuide userType="mentee" />
          </TabsContent>

          <TabsContent value="mentor">
            <PlatformGuide userType="mentor" />
          </TabsContent>
        </Tabs>

        {/* Support Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Precisa de ajuda?</h3>
              <p className="text-sm text-muted-foreground">Fale com a gente pelo WhatsApp</p>
            </div>
          </div>
          <a
            href="https://www.linkedin.com/in/laecio-rodrigues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl">
              <ExternalLink className="w-4 h-4" />
              Falar com Suporte no LinkedIn
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Help;
