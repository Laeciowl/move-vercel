import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Save, X, Loader2, User, Briefcase, GraduationCap, FileText, Clock, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MentorProfileEditorProps {
  mentorId: string;
  name: string;
  area: string;
  description: string;
  education: string | null;
  minAdvanceHours?: number;
  linkedinUrl?: string | null;
  onUpdate: () => void;
}

const areaOptions = [
  "Tecnologia",
  "Marketing",
  "Design",
  "Finanças",
  "Operações",
  "RH / Gestão de Pessoas",
  "Vendas",
  "Empreendedorismo",
  "Jurídico",
  "Engenharia",
  "Comunicação",
  "Outro",
];

const advanceHoursOptions = [
  { value: 12, label: "12 horas" },
  { value: 24, label: "24 horas (padrão)" },
  { value: 48, label: "48 horas" },
  { value: 72, label: "72 horas" },
];

const MentorProfileEditor = ({
  mentorId,
  name,
  area,
  description,
  education,
  minAdvanceHours = 24,
  linkedinUrl = null,
  onUpdate,
}: MentorProfileEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name,
    area,
    description,
    education: education || "",
    minAdvanceHours,
    linkedinUrl: linkedinUrl || "",
  });

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.area.trim() || !formData.description.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validate LinkedIn URL if provided
    if (formData.linkedinUrl && !formData.linkedinUrl.includes("linkedin.com")) {
      toast.error("Informe uma URL válida do LinkedIn");
      return;
    }

    setSaving(true);
    
    const { error } = await supabase
      .from("mentors")
      .update({
        name: formData.name.trim(),
        area: formData.area.trim(),
        description: formData.description.trim(),
        education: formData.education.trim() || null,
        min_advance_hours: formData.minAdvanceHours,
        linkedin_url: formData.linkedinUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mentorId);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Perfil de mentor atualizado!");
      setIsEditing(false);
      onUpdate();
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData({ 
      name, 
      area, 
      description, 
      education: education || "",
      minAdvanceHours,
      linkedinUrl: linkedinUrl || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Seu perfil de mentor
        </h4>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-primary hover:bg-primary/10 gap-1.5"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 bg-accent/30 rounded-xl p-4 border border-border/50"
          >
            <div className="space-y-2">
              <Label htmlFor="mentor-name" className="flex items-center gap-1.5 text-sm">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Nome de exibição *
              </Label>
              <Input
                id="mentor-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome como mentor"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-area" className="flex items-center gap-1.5 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                Área de atuação *
              </Label>
              <select
                id="mentor-area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {areaOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-education" className="flex items-center gap-1.5 text-sm">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                Formação
              </Label>
              <Input
                id="mentor-education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="Ex: Engenharia de Software - USP"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-description" className="flex items-center gap-1.5 text-sm">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Descrição / Bio *
              </Label>
              <Textarea
                id="mentor-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Conte um pouco sobre você, sua experiência e como pode ajudar..."
                className="bg-background min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Antecedência mínima */}
            <div className="space-y-2">
              <Label htmlFor="mentor-advance" className="flex items-center gap-1.5 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Antecedência mínima para agendamentos
              </Label>
              <Select
                value={String(formData.minAdvanceHours)}
                onValueChange={(v) => setFormData({ ...formData, minAdvanceHours: Number(v) })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {advanceHoursOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mentorados só poderão agendar com você respeitando esse tempo mínimo.
              </p>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="mentor-linkedin" className="flex items-center gap-1.5 text-sm">
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                LinkedIn (opcional)
              </Label>
              <Input
                id="mentor-linkedin"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/seuperfil"
                className="bg-background"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 bg-muted/30 rounded-xl p-4 border border-border/50"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Nome</p>
                <p className="text-sm text-foreground">{name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Área</p>
                <p className="text-sm text-foreground">{area}</p>
              </div>
            </div>
            {education && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Formação</p>
                <p className="text-sm text-foreground">{education}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground font-medium">Descrição</p>
              <p className="text-sm text-foreground line-clamp-3">{description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Antecedência</p>
                <p className="text-sm text-foreground">{minAdvanceHours}h</p>
              </div>
              {linkedinUrl && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">LinkedIn</p>
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0A66C2] hover:underline flex items-center gap-1">
                    <Linkedin className="w-3 h-3" /> Perfil
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorProfileEditor;
