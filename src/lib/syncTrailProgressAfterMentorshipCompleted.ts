import { supabase } from "@/integrations/supabase/client";

const RH_ALIASES = ["rh", "hr", "recursos-humanos", "recursos_humanos", "recursos humanos", "human-resources"];

function slugMatchesRequired(required: string, slug: string): boolean {
  const r = required.toLowerCase().trim();
  const s = slug.toLowerCase().trim();
  if (!r || !s) return false;
  if (s === r || s.includes(r) || r.includes(s)) return true;
  const rIsRh = RH_ALIASES.some((a) => r === a || r.includes(a));
  const sIsRh = RH_ALIASES.some((a) => s === a || s.includes(a));
  if (rIsRh && sIsRh) return true;
  return false;
}

function extractTagSlugs(
  rows: { tags?: { slug?: string | null } | { slug?: string | null }[] | null }[] | null,
): string[] {
  const slugs: string[] = [];
  for (const row of rows || []) {
    const t = row.tags;
    if (!t) continue;
    if (Array.isArray(t)) {
      for (const x of t) {
        if (x?.slug) slugs.push(x.slug);
      }
    } else if (typeof t === "object" && "slug" in t && t.slug) {
      slugs.push(t.slug);
    }
  }
  return slugs;
}

/**
 * When a mentorship is marked completed, auto-complete matching "mentoria" trail steps
 * (tags_mentor_requeridas vs mentor tag slugs) and refresh progresso_trilha for each affected trail.
 * Works when called as the mentee (RLS). For mentor callers, use RPC sync_trail_mentoria_for_completed_session.
 */
export async function syncTrailProgressAfterMentorshipCompleted(
  menteeUserId: string,
  sessionMentorId: string,
): Promise<string[]> {
  const trailTitles: string[] = [];

  const { data: mentorTags, error: tagsError } = await supabase
    .from("mentor_tags")
    .select("tag_id, tags(id, slug)")
    .eq("mentor_id", sessionMentorId);

  if (tagsError) {
    console.error("syncTrail: mentor_tags", tagsError);
    return trailTitles;
  }

  const tagSlugs = extractTagSlugs(mentorTags ?? []);

  const { data: activeTrails, error: trailsError } = await supabase
    .from("progresso_trilha")
    .select("trilha_id")
    .eq("mentorado_id", menteeUserId)
    .is("concluido_em", null);

  if (trailsError || !activeTrails?.length) {
    return trailTitles;
  }

  const trilhaIds = activeTrails.map((t) => t.trilha_id);

  const { data: mentoriaSteps, error: stepsError } = await supabase
    .from("passos_trilha")
    .select("id, trilha_id, tags_mentor_requeridas, ordem")
    .in("trilha_id", trilhaIds)
    .eq("tipo", "mentoria");

  if (stepsError || !mentoriaSteps?.length) {
    return trailTitles;
  }

  for (const step of mentoriaSteps) {
    const { data: existing } = await supabase
      .from("progresso_passo")
      .select("id")
      .eq("mentorado_id", menteeUserId)
      .eq("passo_id", step.id)
      .eq("completado", true)
      .maybeSingle();

    if (existing) continue;

    const requiredTags = step.tags_mentor_requeridas || [];
    const hasMatch =
      requiredTags.length === 0 ||
      requiredTags.some((tag: string) => tagSlugs.some((s) => slugMatchesRequired(tag, s)));

    if (!hasMatch) continue;

    const { error: upsertError } = await supabase.from("progresso_passo").upsert(
      {
        mentorado_id: menteeUserId,
        passo_id: step.id,
        completado: true,
        completado_em: new Date().toISOString(),
        completado_automaticamente: true,
      },
      { onConflict: "mentorado_id,passo_id" },
    );

    if (upsertError) {
      console.error("syncTrail: progresso_passo upsert", upsertError);
      continue;
    }

    const { data: allSteps } = await supabase.from("passos_trilha").select("id").eq("trilha_id", step.trilha_id);

    const passoIds = (allSteps ?? []).map((s) => s.id);
    let done = 0;
    if (passoIds.length > 0) {
      const { count, error: countError } = await supabase
        .from("progresso_passo")
        .select("id", { count: "exact", head: true })
        .eq("mentorado_id", menteeUserId)
        .eq("completado", true)
        .in("passo_id", passoIds);

      if (!countError && count != null) done = count;
    }

    const total = passoIds.length || 1;
    const pct = Math.round((done / total) * 100);

    const updateData: { progresso_percentual: number; concluido_em?: string } = { progresso_percentual: pct };
    if (done >= total) {
      updateData.concluido_em = new Date().toISOString();
    }

    const { error: progErr } = await supabase
      .from("progresso_trilha")
      .update(updateData)
      .eq("mentorado_id", menteeUserId)
      .eq("trilha_id", step.trilha_id);

    if (progErr) {
      console.error("syncTrail: progresso_trilha", progErr);
      continue;
    }

    const { data: trailInfo } = await supabase.from("trilhas").select("titulo").eq("id", step.trilha_id).maybeSingle();

    if (trailInfo?.titulo) trailTitles.push(trailInfo.titulo);
  }

  return [...new Set(trailTitles)];
}
