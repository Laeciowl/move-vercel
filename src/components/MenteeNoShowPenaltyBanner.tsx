import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Ban, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMenteeBookingBlock, type MenteeAttendanceStatsRow } from "@/lib/menteePenaltyBooking";

type BannerKind = "punitive" | "warning";

interface BannerState {
  kind: BannerKind;
  message: string;
  lastForgivenAt: string | null;
}

/**
 * Alerta no painel do mentorado: faltas (no-show) e período punitivo / bloqueio de agendamento.
 */
const MenteeNoShowPenaltyBanner = ({ userId }: { userId: string }) => {
  const [state, setState] = useState<BannerState | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      const [statsRes, penRes] = await Promise.all([
        supabase.rpc("get_mentee_attendance_stats", { mentee_id: userId }),
        supabase
          .from("mentee_penalties")
          .select("last_forgiven_at, total_no_shows, status, blocked_until, block_reason")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const statsRow = statsRes.data?.length ? (statsRes.data[0] as MenteeAttendanceStatsRow) : null;
      const pen = penRes.data;

      const block = getMenteeBookingBlock(statsRow);
      const noShows = statsRow?.total_no_shows ?? pen?.total_no_shows ?? 0;
      const status = (statsRow?.penalty_status || pen?.status || "ativo") as string;
      const lastForgivenAt = pen?.last_forgiven_at ?? null;

      const punitive =
        block.blocked ||
        status === "banido" ||
        ((status === "bloqueado_7d" || status === "bloqueado_30d") &&
          !!pen?.blocked_until &&
          new Date(pen.blocked_until).getTime() > Date.now());

      if (punitive) {
        setState({
          kind: "punitive",
          message:
            block.message ??
            "No momento você não pode agendar novas mentorias por causa de faltas sem aviso prévio. Em caso de dúvida, fale com o suporte: movecarreiras@gmail.com",
          lastForgivenAt,
        });
        return;
      }

      if (noShows > 0 && status === "aviso_1") {
        setState({
          kind: "warning",
          message: `Você tem ${noShows} falta${noShows !== 1 ? "s" : ""} registrada${noShows !== 1 ? "s" : ""} (sem comparecimento / sem aviso). Uma nova falta pode gerar suspensão temporária dos agendamentos. Combine sempre com o mentor e use cancelamento ou reconfirmação quando precisar.`,
          lastForgivenAt,
        });
        return;
      }

      setState(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!state) return null;

  const Icon = state.kind === "punitive" ? Ban : AlertTriangle;
  const wrapperClass =
    state.kind === "punitive"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : "border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border px-4 py-3 ${wrapperClass}`}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2">
            {state.kind === "punitive" ? "Agendamento suspenso — faltas nas mentorias" : "Atenção: histórico de faltas"}
          </p>
          <p className="text-sm leading-relaxed opacity-95">{state.message}</p>
          {state.lastForgivenAt && (
            <p className="text-xs flex items-center gap-1.5 opacity-90 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              Último perdão registrado pela equipe em{" "}
              {new Date(state.lastForgivenAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              . Novas faltas voltam a contar para penalidade.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MenteeNoShowPenaltyBanner;
