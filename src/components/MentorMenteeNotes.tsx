import { useState, useEffect } from "react";
import { StickyNote, Save, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MentorMenteeNotesProps {
  mentorId: string;
  menteeUserId: string;
  menteeName: string;
}

const MentorMenteeNotes = ({ mentorId, menteeUserId, menteeName }: MentorMenteeNotesProps) => {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [mentorId, menteeUserId]);

  const fetchNote = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mentor_mentee_notes")
      .select("note")
      .eq("mentor_id", mentorId)
      .eq("mentee_user_id", menteeUserId)
      .maybeSingle();

    if (data) {
      setNote(data.note);
      setSavedNote(data.note);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("mentor_mentee_notes")
      .upsert(
        { mentor_id: mentorId, mentee_user_id: menteeUserId, note },
        { onConflict: "mentor_id,mentee_user_id" }
      );

    if (error) {
      toast.error("Erro ao salvar nota: " + error.message);
    } else {
      toast.success("Nota salva!");
      setSavedNote(note);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("mentor_mentee_notes")
      .delete()
      .eq("mentor_id", mentorId)
      .eq("mentee_user_id", menteeUserId);

    if (error) {
      toast.error("Erro ao remover nota");
    } else {
      setNote("");
      setSavedNote("");
      setEditing(false);
      toast.success("Nota removida");
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="bg-muted/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 text-primary" />
          Notas sobre {menteeName}
        </span>
        {savedNote && !editing && (
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      {editing || !savedNote ? (
        <>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anote observações, progresso, pontos discutidos..."
            className="min-h-[80px] text-sm resize-none"
          />
          <div className="flex gap-2">
            {savedNote && (
              <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={handleDelete} disabled={saving}>
                <Trash2 className="w-3 h-3 mr-1" /> Remover
              </Button>
            )}
            <div className="flex-1" />
            {editing && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setNote(savedNote); setEditing(false); }}>
                Cancelar
              </Button>
            )}
            <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving || !note.trim()}>
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Salvar
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{savedNote}</p>
      )}
    </div>
  );
};

export default MentorMenteeNotes;
