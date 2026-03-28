import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Maintenance from "@/pages/Maintenance";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Volunteer from "./pages/Volunteer";
import VolunteerOnboarding from "./pages/VolunteerOnboarding";
import Mentors from "./pages/Mentors";
import MentorAgenda from "./pages/MentorAgenda";
import MentorProfile from "./pages/MentorProfile";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import ForMentees from "./pages/ForMentees";
import ForMentors from "./pages/ForMentors";
import Achievements from "./pages/Achievements";
import Contents from "./pages/Contents";
import Help from "./pages/Help";
import Communities from "./pages/Communities";
import Trails from "./pages/Trails";
import TrailDetail from "./pages/TrailDetail";
import SavedContents from "./pages/SavedContents";
import DevPlan from "./pages/DevPlan";
import Nps from "./pages/Nps";
import Interests from "./pages/Interests";
import MinhasMentorias from "./pages/MinhasMentorias";
import Reconfirmar from "./pages/Reconfirmar";
import NotFound from "./pages/NotFound";
import OnboardingTour from "./components/OnboardingTour";
import GoogleCalendarCallbackHandler from "./components/GoogleCalendarCallbackHandler";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const GlobalOnboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (
      profile &&
      !profile.onboarding_completed &&
      profile.onboarding_quiz_passed &&
      user
    ) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "voluntario")
        .maybeSingle()
        .then(({ data }) => {
          if (!data) setShowOnboarding(true);
        });
    } else {
      setShowOnboarding(false);
    }
  }, [profile, user]);

  if (!showOnboarding) return null;

  return (
    <OnboardingTour
      onComplete={() => {
        setShowOnboarding(false);
        refreshProfile();
      }}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {MAINTENANCE_MODE ? (
            <Routes>
              <Route path="*" element={<Maintenance />} />
            </Routes>
          ) : (
            <>
              <GoogleCalendarCallbackHandler />
              <GlobalOnboarding />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/cadastro" element={<Signup />} />
                <Route path="/dashboard" element={<Home />} />
                <Route path="/inicio" element={<Home />} />
                <Route path="/voluntario" element={<Volunteer />} />
                <Route
                  path="/onboarding-voluntario"
                  element={<VolunteerOnboarding />}
                />
                <Route path="/mentores" element={<Mentors />} />
                <Route path="/mentor/agenda" element={<MentorAgenda />} />
                <Route path="/mentor/perfil" element={<MentorProfile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/para-mentorados" element={<ForMentees />} />
                <Route path="/para-mentores" element={<ForMentors />} />
                <Route path="/conquistas" element={<Achievements />} />
                <Route path="/conteudos" element={<Contents />} />
                <Route path="/conteudos/salvos" element={<SavedContents />} />
                <Route path="/trilhas" element={<Trails />} />
                <Route path="/trilhas/:id" element={<TrailDetail />} />
                <Route path="/ajuda" element={<Help />} />
                <Route path="/comunidades" element={<Communities />} />
                <Route path="/plano" element={<DevPlan />} />
                <Route path="/avaliar" element={<Nps />} />
                <Route path="/interesses" element={<Interests />} />
                <Route path="/minhas-mentorias" element={<MinhasMentorias />} />
                <Route path="/reconfirmar" element={<Reconfirmar />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
