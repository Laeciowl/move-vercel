import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Save, X, Loader2, User, Briefcase, GraduationCap, FileText, Camera, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MentorProfileEditorProps {
  mentorId: string;
  photoUrl?: string | null;
  name: string;
  description: string;
  education: string | null;
  linkedinUrl?: string | null;
  onUpdate: () => void;
}

const MentorProfileEditor = ({
  mentorId,
  photoUrl = null,
  name,
  description,
  education,
  linkedinUrl = null,
  onUpdate,
}: MentorProfileEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    photoUrl: photoUrl || "",
    name,
    description,
    education: education || "",
    linkedinUrl: linkedinUrl || "",
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${mentorId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("mentor-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("mentor-photos").getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      setFormData((prev) => ({ ...prev, photoUrl: urlWithCacheBuster }));

      const { error: updateError } = await supabase
        .from("mentors")
        .update({ photo_url: urlWithCacheBuster, updated_at: new Date().toISOString() })
        .eq("id", mentorId);

      if (updateError) throw updateError;

      toast.success("Foto do mentor atualizada!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar foto: " + (error?.message || "tente novamente"));
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

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
        photo_url: formData.photoUrl.trim() || null,
        name: formData.name.trim(),
        area: formData.area.trim(),
        description: formData.description.trim(),
        education: formData.education.trim() || null,
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
      photoUrl: photoUrl || "",
      name, 
      area, 
      description, 
      education: education || "",
      linkedinUrl: linkedinUrl || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Perfil
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
              <Label className="flex items-center gap-1.5 text-sm">
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                Foto (opcional)
              </Label>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border border-border/50 flex items-center justify-center">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Foto do mentor" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="gap-2"
                  >
                    {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Alterar foto
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">JPG/PNG até 5MB.</p>
                </div>
              </div>
            </div>

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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border border-border/50 flex items-center justify-center shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto do mentor" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Nome</p>
                <p className="text-sm text-foreground truncate">{name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Área</p>
                <p className="text-sm text-foreground">{area}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Formação</p>
                <p className="text-sm text-foreground">{education || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Descrição</p>
              <p className="text-sm text-foreground line-clamp-3">{description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
