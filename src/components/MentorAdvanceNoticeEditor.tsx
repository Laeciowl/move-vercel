import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MentorAdvanceNoticeEditorProps {
  mentorId: string;
  minAdvanceHours: number;
  onUpdate: () => void;
}

const OPTIONS = [12, 24, 48, 72] as const;

export default function MentorAdvanceNoticeEditor({
  mentorId,
  minAdvanceHours,
  onUpdate,
}: MentorAdvanceNoticeEditorProps) {
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(String(minAdvanceHours ?? 24));

  const handleSave = async () => {
    setSaving(true);
    const next = Number(value);

    const { error } = await supabase
      .from("mentors")
      .update({ min_advance_hours: next, updated_at: new Date().toISOString() })
      .eq("id", mentorId);

    if (error) {
      toast.error("Erro ao salvar antecedência: " + error.message);
      setSaving(false);
      return;
    }

    toast.success("Antecedência mínima atualizada!");
    onUpdate();
    setSaving(false);
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Antecedência mínima
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Mentorados só poderão agendar respeitando esse tempo.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="bg-background sm:w-56">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((h) => (
              <SelectItem key={h} value={String(h)}>
                {h} horas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} disabled={saving} className="sm:w-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
