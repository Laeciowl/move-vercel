import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Tag, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface InterestsNotificationBannerProps {
  onOpenInterestsEditor: () => void;
}

const InterestsNotificationBanner = ({ onOpenInterestsEditor }: InterestsNotificationBannerProps) => {
  const { user } = useAuth();
  const [hasInterests, setHasInterests] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    checkInterests();
  }, [user]);

  const checkInterests = async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from("mentee_interests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!error) {
      setHasInterests((count ?? 0) > 0);
    }
    setLoading(false);
  };

  // Subscribe to changes in mentee_interests
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("mentee_interests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mentee_interests",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          checkInterests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Don't show if loading, already has interests, or dismissed
  if (loading || hasInterests || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-orange-500/5 to-amber-500/10 border border-primary/20 p-5"
      >
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated background glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative flex items-start gap-4">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-button flex-shrink-0"
          >
            <Tag className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">Personalize sua experiência!</h3>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.span>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Selecione seus interesses para receber recomendações de mentores que combinam com você e encontrar o match perfeito para sua carreira!
            </p>

            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={onOpenInterestsEditor}
                size="sm"
                className="rounded-xl bg-gradient-hero text-primary-foreground shadow-button hover:opacity-90 gap-2"
              >
                Definir interesses
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <span className="text-xs text-muted-foreground">
                ⚡ Leva menos de 1 minuto
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InterestsNotificationBanner;
