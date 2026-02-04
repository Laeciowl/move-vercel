import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Users, Heart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatData {
  totalMentors: number;
  totalMembers: number;
  totalSessions: number;
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

  return <span ref={ref}>{count}</span>;
};

const StatsSection = () => {
  const [stats, setStats] = useState<StatData>({
    totalMentors: 0,
    totalMembers: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [mentorsResult, membersResult, sessionsResult] = await Promise.all([
          // Approved mentors count
          supabase
            .from("mentors_public")
            .select("*", { count: "exact", head: true }),
          // Total community members (all profiles)
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true }),
          // Total completed sessions
          supabase.rpc("get_total_completed_sessions"),
        ]);

        setStats({
          totalMentors: mentorsResult.count || 0,
          totalMembers: membersResult.count || 0,
          totalSessions: sessionsResult.data || 0,
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
      icon: Heart,
      value: stats.totalMentors,
      label: "Mentores voluntários",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
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
  ];

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

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-6 md:p-8 shadow-card text-center border border-border/50"
            >
              <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>
                {loading ? (
                  <span className="opacity-50">...</span>
                ) : (
                  <AnimatedCounter value={stat.value} />
                )}
              </div>
              <p className="text-muted-foreground font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
