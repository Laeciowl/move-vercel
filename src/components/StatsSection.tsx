import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Users, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Valor de mercado que a comunidade teria pago pelas horas de mentoria doadas.
// Taxa: R$ 300 / hora. valor = (minutos / 60) * 300.
const HOURLY_VALUE_BRL = 300;

interface StatData {
  totalMembers: number;
  totalSessions: number;
  totalMinutes: number;
}

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}</span>;
};

const StatsSection = () => {
  const [stats, setStats] = useState<StatData>({
    totalMembers: 0,
    totalSessions: 0,
    totalMinutes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel using secure RPC functions
        const [membersResult, sessionsResult, minutesResult] = await Promise.all([
          // Total community members via secure RPC
          supabase.rpc("get_public_members_count"),
          // Total completed sessions via secure RPC
          supabase.rpc("get_total_completed_sessions"),
          // Total minutes mentored across all completed sessions via secure RPC
          supabase.rpc("get_total_mentor_minutes"),
        ]);

        setStats({
          totalMembers: membersResult.data || 0,
          totalSessions: sessionsResult.data || 0,
          totalMinutes: minutesResult.data || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      icon: Users,
      value: stats.totalMembers,
      label: "Membros na comunidade",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Calendar,
      value: stats.totalSessions,
      label: "Sessões realizadas",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Clock,
      value: stats.totalMinutes,
      label: "Minutos que mudaram o mundo",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  // Valor doado em mentoria, derivado do total de minutos concluídos.
  const donatedHours = Math.floor(stats.totalMinutes / 60);
  const donatedValueBRL = Math.round((stats.totalMinutes / 60) * HOURLY_VALUE_BRL);
  const updatedLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Números Movê
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nossa comunidade cresce a cada dia com pessoas que acreditam no poder da mentoria
          </p>
        </motion.div>

        {/* Três cards compactos no topo — três colunas no mobile e no desktop. */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-5xl mx-auto">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-4 md:p-8 shadow-card text-center border border-border/50"
            >
              <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4`}>
                <stat.icon className={`w-5 h-5 md:w-7 md:h-7 ${stat.color}`} />
              </div>
              <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${stat.color} mb-1 md:mb-2`}>
                {loading ? (
                  <span className="opacity-50">...</span>
                ) : (
                  <AnimatedCounter value={stat.value} />
                )}
              </div>
              <p className="text-muted-foreground font-medium text-xs md:text-base leading-tight">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Card largo de impacto — valor total doado em mentoria (R$). */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl p-8 md:p-12 shadow-card text-center border border-border/50 max-w-5xl mx-auto mt-4 md:mt-6"
        >
          <div className="text-5xl md:text-7xl font-bold text-orange-500 mb-3">
            {loading ? (
              <span className="opacity-50">R$ ...</span>
            ) : (
              <>R$ <AnimatedCounter value={donatedValueBRL} /></>
            )}
          </div>
          <p className="text-lg md:text-2xl font-semibold text-foreground mb-5">
            em mentoria gratuita doada
          </p>
          <div className="w-16 h-1 bg-orange-500 rounded-full mx-auto mb-5" />
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Equivalente a {donatedHours.toLocaleString("pt-BR")} horas de mentoria de carreira entregues gratuitamente
          </p>
          <p className="text-xs md:text-sm text-muted-foreground/60 mt-4">
            Atualizado em {updatedLabel}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
