import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface MentorQuality {
  id: string;
  name: string;
  area: string;
  photo_url: string | null;
  avgRating: number;
  totalReviews: number;
  positivePercent: number;
  distribution: number[]; // [1star, 2star, 3star, 4star, 5star]
  publicFeedbacks: number;
  recentFeedbacks: { comment: string | null; rating: number; is_public: boolean; created_at: string }[];
}

type FilterStatus = "all" | "attention" | "good" | "excellent";

const ratingEmojis = ["😞", "😐", "🙂", "😊", "😍"];

const AdminQualityPanel = () => {
  const [mentors, setMentors] = useState<MentorQuality[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [overallStats, setOverallStats] = useState({ avg: 0, satisfaction: 0, totalReviews: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch all reviews with mentor info
    const { data: reviews } = await supabase
      .from("session_reviews")
      .select("mentor_id, rating, comment, review_publico, created_at")
      .order("created_at", { ascending: false });

    const { data: allMentors } = await supabase
      .from("mentors")
      .select("id, name, area, photo_url")
      .eq("status", "approved");

    if (!reviews || !allMentors) {
      setLoading(false);
      return;
    }

    // Group by mentor
    const mentorReviewsMap = new Map<string, typeof reviews>();
    reviews.forEach((r) => {
      const existing = mentorReviewsMap.get(r.mentor_id) || [];
      existing.push(r);
      mentorReviewsMap.set(r.mentor_id, existing);
    });

    const mentorQualities: MentorQuality[] = allMentors
      .filter((m) => mentorReviewsMap.has(m.id))
      .map((m) => {
        const mReviews = mentorReviewsMap.get(m.id) || [];
        const ratings = mReviews.map((r) => r.rating);
        const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const positive = ratings.filter((r) => r >= 4).length;
        const positivePercent = ratings.length > 0 ? Math.round((positive / ratings.length) * 100) : 0;
        const dist = [0, 0, 0, 0, 0];
        ratings.forEach((r) => { if (r >= 1 && r <= 5) dist[r - 1]++; });
        const publicCount = mReviews.filter((r) => r.review_publico && r.comment?.trim()).length;

        return {
          id: m.id,
          name: m.name,
          area: m.area,
          photo_url: m.photo_url,
          avgRating: Math.round(avg * 10) / 10,
          totalReviews: ratings.length,
          positivePercent,
          distribution: dist,
          publicFeedbacks: publicCount,
          recentFeedbacks: mReviews.slice(0, 3).map((r) => ({
            comment: r.comment,
            rating: r.rating,
            is_public: r.review_publico ?? false,
            created_at: r.created_at,
          })),
        };
      })
      .sort((a, b) => a.avgRating - b.avgRating);

    setMentors(mentorQualities);

    // Overall stats
    const allRatings = reviews.map((r) => r.rating);
    const totalAvg = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
    const totalSatisfaction = allRatings.length > 0
      ? Math.round((allRatings.filter((r) => r >= 4).length / allRatings.length) * 100)
      : 0;
    setOverallStats({ avg: Math.round(totalAvg * 10) / 10, satisfaction: totalSatisfaction, totalReviews: allRatings.length });

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCategory = (avg: number) => {
    if (avg <= 3.5) return "attention";
    if (avg <= 4.0) return "good";
    return "excellent";
  };

  const filtered = filter === "all" ? mentors : mentors.filter((m) => getCategory(m.avgRating) === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">📊 Qualidade das Mentorias</h3>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{overallStats.avg} ⭐</div>
            <p className="text-sm text-muted-foreground">Média geral</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{overallStats.satisfaction}%</div>
            <p className="text-sm text-muted-foreground">Satisfação (notas 4-5)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{overallStats.totalReviews}</div>
            <p className="text-sm text-muted-foreground">Total de avaliações</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
          <SelectTrigger className="w-[200px] h-8 text-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border z-50">
            <SelectItem value="all">Todos os mentores</SelectItem>
            <SelectItem value="attention">🔴 Atenção (≤3.5)</SelectItem>
            <SelectItem value="good">🟡 Bom (3.5-4.0)</SelectItem>
            <SelectItem value="excellent">🟢 Excelente (≥4.0)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} mentor{filtered.length !== 1 ? "es" : ""}</span>
      </div>

      {/* Mentor Cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum mentor com avaliações nesta categoria.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((m) => {
            const cat = getCategory(m.avgRating);
            const catColor = cat === "attention" ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : cat === "good" ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" : "border-green-300 bg-green-50/50 dark:bg-green-950/20";
            const catIcon = cat === "attention" ? "🔴" : cat === "good" ? "🟡" : "🟢";

            return (
              <Card key={m.id} className={`border ${catColor}`}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{catIcon} {m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.area}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">⭐ {m.avgRating}</p>
                      <p className="text-xs text-muted-foreground">{m.totalReviews} avaliações</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={m.positivePercent >= 70 ? "text-green-600" : m.positivePercent >= 50 ? "text-amber-600" : "text-red-600"}>
                      {m.positivePercent}% positivas
                    </span>
                    <span>•</span>
                    <span>{m.publicFeedbacks} feedbacks públicos</span>
                  </div>

                  {/* Distribution */}
                  <div className="flex items-center gap-2 text-xs">
                    {ratingEmojis.map((emoji, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        {emoji} <strong>{m.distribution[i]}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Recent feedbacks */}
                  {m.recentFeedbacks.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border/30">
                      <p className="text-xs font-medium text-muted-foreground">Últimos feedbacks:</p>
                      {m.recentFeedbacks.map((f, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          • {f.comment ? `"${f.comment.slice(0, 80)}${f.comment.length > 80 ? "..." : ""}"` : "(sem comentário)"}
                          <span className="ml-1 text-[10px]">({f.is_public ? "público" : "privado"})</span>
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminQualityPanel;
