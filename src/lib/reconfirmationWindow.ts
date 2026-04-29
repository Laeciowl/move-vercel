/** Minutes from now until session start (negative if already started). */
export function minutesUntilSessionStart(scheduledAtIso: string): number {
  return (new Date(scheduledAtIso).getTime() - Date.now()) / 60_000;
}

/** Alinhado ao e-mail de reconfirmação: aviso é enviado 6h antes do início. */
const SIX_HOURS_MIN = 6 * 60;
const THREE_HOURS_MIN = 3 * 60;

/**
 * Mentorado pode reconfirmar a partir de 6h antes e deve fazê-lo com mais de 3h até o início
 * (mais de 180 minutos — alinhado a handle-reconfirmation e ao cancelamento automático).
 */
export function menteeReconfirmationUiOpen(scheduledAtIso: string): boolean {
  const m = minutesUntilSessionStart(scheduledAtIso);
  return m <= SIX_HOURS_MIN && m > THREE_HOURS_MIN;
}

/** Servidor: ainda é possível confirmar presença (prazo não expirou). */
export function menteeReconfirmationDeadlineNotPassed(scheduledAtIso: string): boolean {
  return minutesUntilSessionStart(scheduledAtIso) > THREE_HOURS_MIN;
}
