import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, CheckCircle, Clock, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MenteeRow {
  user_id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
  onboarding_quiz_passed: boolean;
  first_mentorship_booked: boolean;
  first_session_date: string | null;
  total_sessions: number;
  daysToFirst: number | null;
  status: "ativo" | "pendente" | "mentor";
  is_mentor: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  pendingCount: number;
}

const AdminMenteeBreakdownDialog = ({ open, onOpenChange, activeCount, pendingCount }: Props) => {
  const [mentees, setMentees] = useState<MenteeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "ativo" | "pendente" | "mentor">("all");
  const [search, setSearch] = useState("");

  const fetchMentees = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const [profilesRes, sessionsRes, mentorsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, name, photo_url, created_at, onboarding_quiz_passed, first_mentorship_booked"),
        supabase.from("mentor_sessions").select("user_id, completed_at, status"),
        supabase.from("mentors").select("email"),
      ]);

      const profiles = profilesRes.data || [];
      const sessions = sessionsRes.data || [];
      const mentorEmails = new Set((mentorsRes.data || []).map((m: any) => m.email?.toLowerCase()));

      // Fetch emails for all profile user_ids to cross-reference with mentors
      const userIds = profiles.map((p: any) => p.user_id);
      const emailChunks: { user_id: string; email: string }[] = [];
      // Fetch in chunks of 50
      for (let i = 0; i < userIds.length; i += 50) {
        const chunk = userIds.slice(i, i + 50);
        const { data } = await supabase.rpc("get_mentee_emails", { session_user_ids: chunk });
        if (data) emailChunks.push(...data);
      }
      const userEmailMap = new Map(emailChunks.map((e) => [e.user_id, e.email?.toLowerCase()]));


      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMentees(rows);
      setLoaded(true);
    } catch (err) {
      console.error("Error fetching mentee breakdown:", err);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  useEffect(() => {
    if (open) fetchMentees();
  }, [open, fetchMentees]);

  const filtered = mentees.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>👥 Mentorados por Etapa</DialogTitle>
          <DialogDescription>
            {activeCount} ativos · {pendingCount} pendentes · {activeCount + pendingCount} total
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-shrink-0">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-7">Todos ({mentees.length})</TabsTrigger>
                <TabsTrigger value="ativo" className="text-xs px-3 h-7">Ativos ({mentees.filter(m => m.status === "ativo").length})</TabsTrigger>
                <TabsTrigger value="pendente" className="text-xs px-3 h-7">Pendentes ({mentees.filter(m => m.status === "pendente").length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum mentorado encontrado</p>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={m.photo_url || undefined} alt={m.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                      {m.status === "ativo" ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600 flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5 mr-0.5" /> Pendente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                      <span>Entrou: {format(new Date(m.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {m.first_session_date ? (
                        <span>1ª mentoria: {format(new Date(m.first_session_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      ) : (
                        <span className="italic">Sem mentoria realizada</span>
                      )}
                      {m.daysToFirst !== null && (
                        <span className="font-medium text-primary">{m.daysToFirst}d até 1ª</span>
                      )}
                      {m.total_sessions > 0 && (
                        <span className="font-medium text-foreground">{m.total_sessions} sessões</span>
                      )}
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
                    {m.onboarding_quiz_passed && <span className="text-emerald-600">✓ Quiz</span>}
                    {m.first_mentorship_booked && <span className="text-emerald-600">✓ Agendou</span>}
                    {!m.onboarding_quiz_passed && !m.first_mentorship_booked && m.total_sessions === 0 && (
                      <span className="text-amber-500">Sem atividade</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMenteeBreakdownDialog;
