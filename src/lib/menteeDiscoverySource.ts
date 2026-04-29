import type { Enums } from "@/integrations/supabase/types";

export type MenteeDiscoverySource = Enums<"mentee_discovery_source">;

/** Opções do cadastro (texto longo). */
export const MENTEE_DISCOVERY_SOURCE_OPTIONS: { value: MenteeDiscoverySource; label: string }[] = [
  { value: "indicacao", label: "Indicação (amigo, familiar, colega…)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "redes_sociais", label: "Redes sociais (Instagram, TikTok, etc.)" },
  { value: "outro", label: "Outro (Google, evento, e-mail…)" },
];

/** Rótulos curtos para admin / gráficos. */
export const MENTEE_DISCOVERY_SHORT_LABELS: Record<MenteeDiscoverySource, string> = {
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  redes_sociais: "Redes sociais",
  outro: "Outro",
};

export function getMenteeDiscoveryShortLabel(
  source: MenteeDiscoverySource | null | undefined
): string | null {
  if (source == null) return null;
  return MENTEE_DISCOVERY_SHORT_LABELS[source] ?? null;
}
