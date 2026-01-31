import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calendar, User, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionWithDetails {
  id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  duration: number | null;
  mentor_id: string;
  user_id: string;
  mentor_name: string | null;
  mentor_area: string | null;
  mentee_name: string | null;
  mentee_email: string | null;
  created_at: string;
}

const AdminSessionsPanel = () => {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      // First fetch all sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("mentor_sessions")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Fetch mentor details
      const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];
      const { data: mentorsData } = await supabase
        .from("mentors")
        .select("id, name, area")
        .in("id", mentorIds);

      // Fetch mentee profiles
      const userIds = [...new Set(sessionsData.map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name");

      // Get mentee emails using RPC
      const { data: emailsData } = await supabase
        .rpc("get_mentee_emails", { session_user_ids: userIds });

      // Create lookup maps
      const mentorMap = new Map(mentorsData?.map(m => [m.id, m]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const emailMap = new Map(emailsData?.map((e: { user_id: string; email: string }) => [e.user_id, e.email]) || []);

      // Combine data
      const sessionsWithDetails: SessionWithDetails[] = sessionsData.map(session => {
        const mentor = mentorMap.get(session.mentor_id);
        const profile = profileMap.get(session.user_id);
        
        return {
          id: session.id,
          scheduled_at: session.scheduled_at,
          status: session.status,
          duration: session.duration,
          mentor_id: session.mentor_id,
          user_id: session.user_id,
          mentor_name: mentor?.name || "Mentor não encontrado",
          mentor_area: mentor?.area || null,
          mentee_name: profile?.name || "Mentorado não encontrado",
          mentee_email: emailMap.get(session.user_id) || null,
          created_at: session.created_at,
        };
      });

      setSessions(sessionsWithDetails);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Realizada</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">Agendada</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sessões de Mentoria ({sessions.length})</h3>
      
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma sessão registrada</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-card border rounded-xl p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Mentor info */}
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Mentor:</span>
                    <span>{session.mentor_name}</span>
                    {session.mentor_area && (
                      <Badge variant="outline" className="text-xs">{session.mentor_area}</Badge>
                    )}
                  </div>
                  
                  {/* Mentee info */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">Mentorado:</span>
                    <span>{session.mentee_name}</span>
                    {session.mentee_email && (
                      <span className="text-sm text-muted-foreground">({session.mentee_email})</span>
                    )}
                  </div>
                  
                  {/* Date info */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">Data:</span>
                    <span>
                      {format(new Date(session.scheduled_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {session.duration && (
                      <span className="text-sm text-muted-foreground">({session.duration} min)</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(session.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSessionsPanel;
