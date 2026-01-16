import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, BookOpen, Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMentorsPanel from "@/components/admin/AdminMentorsPanel";
import AdminContentPanel from "@/components/admin/AdminContentPanel";
import AdminVolunteersPanel from "@/components/admin/AdminVolunteersPanel";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gradient">Painel Admin</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie mentores, conteúdos e voluntários da plataforma Movê
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="mentors" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="mentors" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Mentores</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Materiais</span>
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="gap-2">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Voluntários</span>
              </TabsTrigger>
            </TabsList>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <TabsContent value="mentors" className="mt-0">
                <AdminMentorsPanel />
              </TabsContent>
              <TabsContent value="content" className="mt-0">
                <AdminContentPanel />
              </TabsContent>
              <TabsContent value="volunteers" className="mt-0">
                <AdminVolunteersPanel />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
