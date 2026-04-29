import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type MenteeAttendanceStatsRow = {
  total_completed?: number;
  total_no_shows?: number;
  attendance_rate?: number;
  penalty_status: string | null;
  blocked_until: string | null;
};

/**
 * Bloqueio efetivo para novo agendamento (alinha com trigger em mentor_sessions).
 * aviso_1: só alerta, pode agendar. Após blocked_until, libera mesmo se status antigo permanecer no banco.
 */
export function getMenteeBookingBlock(
  row: MenteeAttendanceStatsRow | null | undefined,
): { blocked: boolean; message?: string } {
  if (!row) return { blocked: false };
  const status = row.penalty_status || "ativo";

  if (status === "banido") {
    return {
      blocked: true,
      message:
        "Sua conta não pode agendar mentorias no momento. Entre em contato pelo suporte: movecarreiras@gmail.com",
    };
  }

  if (status === "bloqueado_7d" || status === "bloqueado_30d") {
    if (row.blocked_until) {
      const until = new Date(row.blocked_until);
      if (until.getTime() > Date.now()) {
        return {
          blocked: true,
          message: `Agendamento suspenso até ${format(until, "dd/MM/yyyy", { locale: ptBR })} por faltas sem aviso prévio nas mentorias.`,
        };
      }
    }
  }

  return { blocked: false };
}
