import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Users, BookOpen, Loader2, FileCheck, Bug, BarChart3, Image, Calendar, Handshake, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import AdminContentPanel from "@/components/admin/AdminContentPanel";
import AdminVolunteersPanel from "@/components/admin/AdminVolunteersPanel";
import AdminSubmissionsPanel from "@/components/admin/AdminSubmissionsPanel";
import AdminBugReportsPanel from "@/components/admin/AdminBugReportsPanel";
import AdminMetricsPanel from "@/components/admin/AdminMetricsPanel";
import AdminMentorCardsPanel from "@/components/admin/AdminMentorCardsPanel";
import AdminMentorSessionsPanel from "@/components/admin/AdminMentorSessionsPanel";
import AdminCommunitiesPanel from "@/components/admin/AdminCommunitiesPanel";
import AdminQualityPanel from "@/components/admin/AdminQualityPanel";

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
      navigate("/inicio");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando painel...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <motion.div 
        className="max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-button">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Painel Admin</h1>
              <p className="text-muted-foreground">
                Gerencie voluntários, conteúdos e submissões da plataforma Movê
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="volunteers" className="w-full">
            <TabsList className="grid w-full grid-cols-9 mb-6 bg-card/80 backdrop-blur-sm border border-border/50 p-1 rounded-2xl h-auto overflow-x-auto">
              <TabsTrigger 
                value="metrics" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Métricas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sessions" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Mentorias</span>
              </TabsTrigger>
              <TabsTrigger 
                value="volunteers" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Voluntários</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cards" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="submissions" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <FileCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Submissões</span>
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Materiais</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bugs" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <Bug className="w-4 h-4" />
                <span className="hidden sm:inline">Erros</span>
              </TabsTrigger>
              <TabsTrigger 
                value="communities" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <Handshake className="w-4 h-4" />
                <span className="hidden sm:inline">Comunidades</span>
              </TabsTrigger>
              <TabsTrigger 
                value="quality" 
                className="gap-2 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button transition-all duration-300"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Qualidade</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div 
                key="tab-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-card border border-border/50 p-6"
              >
                <TabsContent value="metrics" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminMetricsPanel />
                </TabsContent>
                <TabsContent value="sessions" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminMentorSessionsPanel />
                </TabsContent>
                <TabsContent value="volunteers" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminVolunteersPanel />
                </TabsContent>
                <TabsContent value="cards" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminMentorCardsPanel />
                </TabsContent>
                <TabsContent value="submissions" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminSubmissionsPanel />
                </TabsContent>
                <TabsContent value="content" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminContentPanel />
                </TabsContent>
                <TabsContent value="bugs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminBugReportsPanel />
                </TabsContent>
                <TabsContent value="communities" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminCommunitiesPanel />
                </TabsContent>
                <TabsContent value="quality" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <AdminQualityPanel />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Admin;
