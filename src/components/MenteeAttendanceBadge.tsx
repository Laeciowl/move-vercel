import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, ShieldAlert, Ban } from "lucide-react";

interface MenteeAttendanceBadgeProps {
  menteeUserId: string;
  compact?: boolean;
}

interface AttendanceStats {
  total_completed: number;
  total_no_shows: number;
  attendance_rate: number;
  penalty_status: string;
  blocked_until: string | null;
}

const MenteeAttendanceBadge = ({ menteeUserId, compact = false }: MenteeAttendanceBadgeProps) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [menteeUserId]);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .rpc("get_mentee_attendance_stats", { mentee_id: menteeUserId });

    if (!error && data && data.length > 0) {
      setStats(data[0] as unknown as AttendanceStats);
    }
    setLoading(false);
  };

  if (loading || !stats) return null;

  const totalSessions = stats.total_completed + stats.total_no_shows;
  
  // Don't show if no history
  if (totalSessions === 0) return null;

  const getStatusConfig = () => {
    if (stats.penalty_status === "banido") {
      return {
        icon: <Ban className="w-3.5 h-3.5" />,
        label: "Conta suspensa",
        color: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
        emoji: "⚫",
      };
    }
    if (stats.penalty_status === "bloqueado_30d" || stats.penalty_status === "bloqueado_7d") {
      return {
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
        label: `Suspenso`,
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
        emoji: "🔴",
      };
    }
    if (stats.attendance_rate >= 90) {
      return {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: "Excelente histórico",
        color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
        emoji: "🟢",
      };
    }
    if (stats.attendance_rate >= 70) {
      return {
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        label: `Atenção: ${stats.total_no_shows} falta${stats.total_no_shows > 1 ? "s" : ""}`,
        color: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700",
        emoji: "🟡",
      };
    }
    return {
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      label: "Histórico preocupante",
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
      emoji: "🔴",
    };
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  }

  return (
    <div className={`rounded-lg p-3 space-y-2 border ${config.color}`}>
      <p className="text-xs font-semibold flex items-center gap-1">
        📊 Histórico de comparecimento
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold">{stats.total_completed}</p>
          <p className="text-[10px] opacity-80">Realizadas</p>
        </div>
        <div>
          <p className="text-lg font-bold">{stats.total_no_shows}</p>
          <p className="text-[10px] opacity-80">Faltas</p>
        </div>
        <div>
          <p className="text-lg font-bold">{stats.attendance_rate}%</p>
          <p className="text-[10px] opacity-80">Presença</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        {config.emoji} <span className="text-xs font-medium">{config.label}</span>
      </div>
      {stats.penalty_status !== "ativo" && stats.penalty_status !== "aviso_1" && stats.blocked_until && (
        <p className="text-[10px] opacity-70">
          Bloqueado até {new Date(stats.blocked_until).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
};

export default MenteeAttendanceBadge;
