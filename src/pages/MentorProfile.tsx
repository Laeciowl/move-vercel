import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Save, Loader2, Camera, Linkedin, Award, Download,
  Briefcase, GraduationCap, FileText, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorTags } from "@/hooks/useTags";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MentorTagsEditor from "@/components/MentorTagsEditor";
import MentorCertificate from "@/components/MentorCertificate";
import MentorFeaturedAchievementsEditor from "@/components/MentorFeaturedAchievementsEditor";

interface MentorData {
  id: string;
  name: string;
  email: string;
  area: string;
  description: string;
  education: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  anos_experiencia: number | null;
  sessions_completed_count: number;
  status: string;
}

interface MentorStats {
  completedSessions: number;
  uniqueMentees: number;
  totalMinutes: number;
  satisfactionPercent: number;
}

const MentorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVolunteer, loading: checkingVolunteer } = useVolunteerCheck();
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [stats, setStats] = useState<MentorStats>({ completedSessions: 0, uniqueMentees: 0, totalMinutes: 0, satisfactionPercent: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mentorTags } = useMentorTags(mentorData?.id || null);

  const [formData, setFormData] = useState({
    name: "",
    area: "",
    description: "",
    education: "",
    linkedinUrl: "",
    anosExperiencia: "",
  });

  useEffect(() => {
    if (!user?.email || checkingVolunteer) return;
    if (!isVolunteer) {
      navigate("/inicio");
      return;
    }
    fetchData();
  }, [user?.email, isVolunteer, checkingVolunteer]);

  const fetchData = async () => {
    if (!user?.email) return;

    const { data: mentor } = await supabase
      .from("mentors")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (!mentor) {
      navigate("/inicio");
      return;
    }

    setMentorData({
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      area: mentor.area,
      description: mentor.description,
      education: mentor.education,
      photo_url: mentor.photo_url,
      linkedin_url: (mentor as any).linkedin_url,
      anos_experiencia: (mentor as any).anos_experiencia,
      sessions_completed_count: mentor.sessions_completed_count,
      status: mentor.status,
    });

    setFormData({
      name: mentor.name,
      area: mentor.area || "",
      description: mentor.description || "",
      education: mentor.education || "",
      linkedinUrl: (mentor as any).linkedin_url || "",
      anosExperiencia: (mentor as any).anos_experiencia?.toString() || "",
    });

    // Fetch stats
    const { data: sessions } = await supabase
      .from("mentor_sessions")
      .select("user_id, duration, status")
      .eq("mentor_id", mentor.id);

    if (sessions) {
      const completed = sessions.filter(s => s.status === "completed");
      const uniqueMentees = new Set(completed.map(s => s.user_id)).size;
      const totalMinutes = completed.reduce((sum, s) => sum + (s.duration || 30), 0);

      // Fetch satisfaction from reviews
      const { data: reviews } = await supabase
        .from("session_reviews")
        .select("rating")
        .eq("mentor_id", mentor.id);

      const totalReviews = reviews?.length || 0;
      const goodReviews = reviews?.filter(r => r.rating >= 4).length || 0;
      const satisfactionPercent = totalReviews > 0 ? Math.round((goodReviews / totalReviews) * 100) : 0;

      setStats({
        completedSessions: completed.length,
        uniqueMentees,
        totalMinutes,
        satisfactionPercent,
      });
    }

    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mentorData) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${mentorData.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("mentor-photos")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("mentor-photos").getPublicUrl(fileName);
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      await supabase.from("mentors").update({ photo_url: urlWithCacheBuster }).eq("id", mentorData.id);
      setMentorData(prev => prev ? { ...prev, photo_url: urlWithCacheBuster } : prev);
      toast.success("Foto atualizada!");
    } catch (error: any) {
      toast.error("Erro ao salvar foto: " + (error?.message || "tente novamente"));
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!mentorData || !formData.name.trim() || !formData.description.trim() || !formData.area.trim()) {
      toast.error("Preencha nome, cargo/empresa e descrição");
      return;
    }
    if (formData.linkedinUrl && !formData.linkedinUrl.includes("linkedin.com")) {
      toast.error("Informe uma URL válida do LinkedIn");
      return;
    }

    const anosExp = formData.anosExperiencia ? parseInt(formData.anosExperiencia) : null;
    if (anosExp !== null && (anosExp < 0 || anosExp > 70)) {
      toast.error("Anos de experiência deve ser entre 0 e 70");
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
        linkedin_url: formData.linkedinUrl.trim() || null,
        anos_experiencia: anosExp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mentorData.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
      fetchData();
    }
    setSaving(false);
  };

  if (loading || checkingVolunteer) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!mentorData) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate("/inicio")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-semibold text-foreground">Meu Perfil de Mentor</h1>
        </div>

        {/* SEÇÃO 1: Informações Básicas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/40 p-6 space-y-5"
        >
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Informações Básicas
          </h2>

          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-border flex items-center justify-center shrink-0">
              {mentorData.photo_url ? (
                <img src={mentorData.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="gap-2">
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                Alterar foto
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <p className="text-xs text-muted-foreground mt-1">JPG/PNG até 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Cargo | Empresa *
              </Label>
              <Input id="area" value={formData.area} onChange={e => setFormData(p => ({ ...p, area: e.target.value }))} placeholder="Ex: Product Manager | Itaú Unibanco" />
              <p className="text-xs text-muted-foreground">Aparece em destaque no seu card público</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="education" className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" /> Formação
              </Label>
              <Input id="education" value={formData.education} onChange={e => setFormData(p => ({ ...p, education: e.target.value }))} placeholder="Ex: Engenharia - USP" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" /> LinkedIn
              </Label>
              <Input id="linkedin" value={formData.linkedinUrl} onChange={e => setFormData(p => ({ ...p, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/seuperfil" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience" className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Anos de Experiência
              </Label>
              <Input id="experience" type="number" min={0} max={70} value={formData.anosExperiencia} onChange={e => setFormData(p => ({ ...p, anosExperiencia: e.target.value }))} placeholder="Ex: 5" />
              <p className="text-xs text-muted-foreground">Quantos anos de experiência na sua área?</p>
            </div>
          </div>

          {/* SEÇÃO 2: Sobre Mim */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="bio" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Sobre Mim *
            </Label>
            <Textarea
              id="bio"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value.slice(0, 500) }))}
              placeholder="Fale sobre você, sua trajetória e como pode ajudar mentorados..."
              className="min-h-[150px] resize-none"
              rows={5}
            />
            <p className="text-xs text-muted-foreground text-right">{formData.description.length}/500</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </Button>
        </motion.div>

        {/* SEÇÃO 3: Áreas de Atuação (Tags) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/40 p-6"
        >
          <MentorTagsEditor mentorId={mentorData.id} onUpdate={fetchData} />
          <div className="mt-4">
            <MentorFeaturedAchievementsEditor mentorId={mentorData.id} />
          </div>
        </motion.div>

        {/* SEÇÃO 4: Seu Impacto */}
        {stats.completedSessions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border/40 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Suas Estatísticas
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{stats.completedSessions}</div>
                <div className="text-sm text-muted-foreground">mentorias realizadas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats.uniqueMentees}</div>
                <div className="text-sm text-muted-foreground">mentorados únicos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats.satisfactionPercent}%</div>
                <div className="text-sm text-muted-foreground">satisfação*</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">*Baseado em feedbacks internos (4-5 estrelas)</p>
          </motion.div>
        )}

        {/* SEÇÃO 5: Certificado */}
        {mentorData.status === "approved" && stats.completedSessions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border/40 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Certificado de Mentor Movê
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Reconhecemos seu impacto como mentor voluntário!</p>
            <MentorCertificate
              mentorName={mentorData.name}
              mentorPhotoUrl={mentorData.photo_url}
              uniqueMentees={stats.uniqueMentees}
              completedSessions={stats.completedSessions}
              totalMinutes={stats.totalMinutes}
            />
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default MentorProfile;
