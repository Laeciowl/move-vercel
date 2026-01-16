import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, CheckCircle, Upload, X, Plus, Video, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import MentorDisclaimerModal from "@/components/MentorDisclaimerModal";

const emailSchema = z.string().email("E-mail inválido").max(255);
const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100);

const volunteerCategories = [
  { 
    value: "aulas_lives", 
    label: "Aulas ao vivo / Lives", 
    icon: Video,
    description: "Compartilhe conhecimento através de aulas e transmissões ao vivo"
  },
  { 
    value: "templates_arquivos", 
    label: "Templates / Arquivos", 
    icon: FileText,
    description: "Crie guias, modelos de currículo, planilhas e materiais úteis"
  },
  { 
    value: "mentoria", 
    label: "Mentoria individual", 
    icon: Users,
    description: "Ofereça orientação personalizada 1:1 para jovens em busca de crescimento"
  },
];

const dayOptions = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

interface Availability {
  day: string;
  times: string[];
}

interface ContentSubmission {
  category: "aulas_lives" | "templates_arquivos";
  title: string;
  description: string;
  contentType: "link" | "file";
  url: string;
  file: File | null;
}

const Volunteer = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    area: "",
    categories: [] as string[],
    // Mentor-specific fields
    description: "",
    education: "",
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  // Content submissions state
  const [contentSubmissions, setContentSubmissions] = useState<ContentSubmission[]>([]);
  const [activeContentIndex, setActiveContentIndex] = useState<number | null>(null);

  const isMentorApplication = formData.categories.includes("mentoria");
  const isContentCreator = formData.categories.includes("aulas_lives") || formData.categories.includes("templates_arquivos");

  const handleCategoryToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((v) => v !== value)
        : [...prev.categories, value],
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addAvailability = () => {
    setAvailability([...availability, { day: "monday", times: [] }]);
  };

  const removeAvailability = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateAvailabilityDay = (index: number, day: string) => {
    const newAvailability = [...availability];
    newAvailability[index].day = day;
    setAvailability(newAvailability);
  };

  const toggleTime = (index: number, time: string) => {
    const newAvailability = [...availability];
    const times = newAvailability[index].times;
    if (times.includes(time)) {
      newAvailability[index].times = times.filter((t) => t !== time);
    } else {
      newAvailability[index].times = [...times, time].sort();
    }
    setAvailability(newAvailability);
  };

  // Content submission handlers
  const addContentSubmission = (category: "aulas_lives" | "templates_arquivos") => {
    setContentSubmissions([
      ...contentSubmissions,
      {
        category,
        title: "",
        description: "",
        contentType: category === "aulas_lives" ? "link" : "file",
        url: "",
        file: null,
      },
    ]);
    setActiveContentIndex(contentSubmissions.length);
  };

  const removeContentSubmission = (index: number) => {
    setContentSubmissions(contentSubmissions.filter((_, i) => i !== index));
    if (activeContentIndex === index) {
      setActiveContentIndex(null);
    }
  };

  const updateContentSubmission = (index: number, field: keyof ContentSubmission, value: any) => {
    const newSubmissions = [...contentSubmissions];
    newSubmissions[index] = { ...newSubmissions[index], [field]: value };
    setContentSubmissions(newSubmissions);
  };

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 10MB");
        return;
      }
      updateContentSubmission(index, "file", file);
      updateContentSubmission(index, "url", file.name);
    }
  };

  const validateForm = (): boolean => {
    try {
      nameSchema.parse(formData.name);
      emailSchema.parse(formData.email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }

    if (!formData.area.trim()) {
      toast.error("Por favor, informe sua área de atuação");
      return false;
    }

    if (formData.categories.length === 0) {
      toast.error("Por favor, selecione pelo menos uma categoria");
      return false;
    }

    // Validation for mentors
    if (isMentorApplication) {
      if (!formData.description.trim()) {
        toast.error("Por favor, adicione uma descrição sobre você");
        return false;
      }
      if (availability.length === 0) {
        toast.error("Por favor, adicione pelo menos um dia de disponibilidade");
        return false;
      }
      const hasValidAvailability = availability.every((a) => a.times.length > 0);
      if (!hasValidAvailability) {
        toast.error("Por favor, selecione pelo menos um horário para cada dia");
        return false;
      }
    }

    // Validation for content creators
    if (isContentCreator && contentSubmissions.length > 0) {
      for (const submission of contentSubmissions) {
        if (!submission.title.trim()) {
          toast.error("Por favor, adicione um título para cada conteúdo");
          return false;
        }
        if (!submission.description.trim()) {
          toast.error("Por favor, adicione uma descrição para cada conteúdo");
          return false;
        }
        if (submission.contentType === "link" && !submission.url.trim()) {
          toast.error("Por favor, adicione o link para cada conteúdo");
          return false;
        }
        if (submission.contentType === "file" && !submission.file) {
          toast.error("Por favor, faça upload do arquivo para cada conteúdo");
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // If it's a mentor application and disclaimer not yet accepted, show modal
    if (isMentorApplication && !disclaimerAccepted) {
      setShowDisclaimerModal(true);
      return;
    }

    await submitApplication();
  };

  const handleDisclaimerAccept = async () => {
    setDisclaimerAccepted(true);
    setShowDisclaimerModal(false);
    await submitApplication();
  };

  const submitApplication = async () => {
    setLoading(true);

    try {
      // Insert into volunteer_applications
      const { data: volunteerData, error: volunteerError } = await supabase
        .from("volunteer_applications")
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          area: formData.area.trim(),
          how_to_help: formData.categories.join(", "),
          categories: formData.categories,
        })
        .select()
        .single();

      if (volunteerError) {
        throw volunteerError;
      }

      // If they want to be a mentor, also insert into mentors table
      if (isMentorApplication) {
        let photoUrl: string | null = null;

        // Upload photo if provided
        if (photoFile) {
          const fileExt = photoFile.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("mentor-photos")
            .upload(fileName, photoFile);

          if (uploadError) {
            console.error("Photo upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("mentor-photos")
              .getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
          }
        }

        const { error: mentorError } = await supabase.from("mentors").insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          area: formData.area.trim(),
          description: formData.description.trim(),
          education: formData.education.trim() || null,
          photo_url: photoUrl,
          availability: JSON.parse(JSON.stringify(availability)),
          disclaimer_accepted: true,
          disclaimer_accepted_at: new Date().toISOString(),
        }]);

        if (mentorError) {
          console.error("Mentor insert error:", mentorError);
          toast.warning("Aplicação de voluntário enviada, mas houve um erro ao criar perfil de mentor");
        }
      }

      // Upload content submissions if any
      if (contentSubmissions.length > 0) {
        for (const submission of contentSubmissions) {
          let contentUrl = submission.url;

          // Upload file if it's a file submission
          if (submission.contentType === "file" && submission.file) {
            const fileExt = submission.file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("volunteer-content")
              .upload(fileName, submission.file);

            if (uploadError) {
              console.error("Content file upload error:", uploadError);
              continue;
            }

            const { data: urlData } = supabase.storage
              .from("volunteer-content")
              .getPublicUrl(fileName);
            contentUrl = urlData.publicUrl;
          }

          const { error: submissionError } = await supabase
            .from("volunteer_submissions")
            .insert({
              volunteer_id: volunteerData.id,
              volunteer_email: formData.email.trim(),
              volunteer_name: formData.name.trim(),
              category: submission.category,
              title: submission.title.trim(),
              description: submission.description.trim(),
              content_type: submission.contentType,
              content_url: contentUrl,
            });

          if (submissionError) {
            console.error("Content submission error:", submissionError);
          }
        }
      }

      setSubmitted(true);
      toast.success("Aplicação enviada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card rounded-3xl shadow-card p-10 text-center"
        >
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Obrigado por querer ajudar! 💙
          </h2>
          <p className="text-muted-foreground mb-8">
            {isMentorApplication 
              ? "Recebemos sua inscrição como mentor. Após aprovação, seu perfil ficará visível para os participantes agendarem mentorias."
              : isContentCreator
              ? "Recebemos sua inscrição e seus conteúdos. Após aprovação pela equipe, eles ficarão disponíveis para todos os participantes."
              : "Recebemos sua inscrição como voluntário. Em breve entraremos em contato para alinhar como você pode contribuir com o projeto Movê."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-hero text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity"
          >
            Voltar ao início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl shadow-card p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Seja um Voluntário</h1>
              <p className="text-muted-foreground">Ajude a transformar vidas</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-8">
            O Movê é feito por pessoas que acreditam no poder da educação. 
            Se você quer compartilhar seu conhecimento e fazer a diferença na vida de jovens 
            brasileiros, junte-se a nós como voluntário.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Seu nome completo"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="seu@email.com"
                required
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Área de atuação *
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: Marketing, RH, Tecnologia, Finanças..."
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Como você gostaria de ajudar? * <span className="text-muted-foreground font-normal">(múltipla escolha)</span>
              </label>
              <div className="space-y-3">
                {volunteerCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <label
                      key={category.value}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        formData.categories.includes(category.value)
                          ? "border-primary bg-accent"
                          : "border-input hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.value)}
                        onChange={() => handleCategoryToggle(category.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          formData.categories.includes(category.value)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{category.label}</span>
                        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-1 ${
                          formData.categories.includes(category.value)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {formData.categories.includes(category.value) && (
                          <CheckCircle className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Content Submissions Section */}
            {isContentCreator && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 pt-6 border-t border-border"
              >
                <div className="bg-accent/50 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    📚 Submeta seus conteúdos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Envie links de aulas/lives ou faça upload de templates e materiais. 
                    Todos os conteúdos passam por aprovação antes de serem publicados.
                  </p>
                </div>

                {/* Existing submissions */}
                {contentSubmissions.map((submission, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-input rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        {submission.category === "aulas_lives" ? (
                          <><Video className="w-4 h-4 text-primary" /> Aula/Live</>
                        ) : (
                          <><FileText className="w-4 h-4 text-primary" /> Template/Arquivo</>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeContentSubmission(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={submission.title}
                        onChange={(e) => updateContentSubmission(index, "title", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ex: Como montar um currículo profissional"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Descrição *
                      </label>
                      <textarea
                        value={submission.description}
                        onChange={(e) => updateContentSubmission(index, "description", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                        placeholder="Descreva o que o participante vai aprender com este conteúdo..."
                        maxLength={500}
                      />
                    </div>

                    {submission.category === "aulas_lives" ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Link do vídeo *
                        </label>
                        <input
                          type="url"
                          value={submission.url}
                          onChange={(e) => updateContentSubmission(index, "url", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Cole o link do YouTube, Vimeo ou outra plataforma
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Tipo de conteúdo
                        </label>
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => updateContentSubmission(index, "contentType", "file")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              submission.contentType === "file"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Upload de arquivo
                          </button>
                          <button
                            type="button"
                            onClick={() => updateContentSubmission(index, "contentType", "link")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              submission.contentType === "link"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Link externo
                          </button>
                        </div>

                        {submission.contentType === "file" ? (
                          <div>
                            {submission.file ? (
                              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <FileText className="w-5 h-5 text-primary" />
                                <span className="flex-1 text-sm truncate">{submission.file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateContentSubmission(index, "file", null);
                                    updateContentSubmission(index, "url", "");
                                  }}
                                  className="text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                                <span className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, PPT (máx. 10MB)</span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                  onChange={(e) => handleContentFileChange(e, index)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        ) : (
                          <input
                            type="url"
                            value={submission.url}
                            onChange={(e) => updateContentSubmission(index, "url", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="https://drive.google.com/..."
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Add content buttons */}
                <div className="flex flex-wrap gap-3">
                  {formData.categories.includes("aulas_lives") && (
                    <button
                      type="button"
                      onClick={() => addContentSubmission("aulas_lives")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input hover:border-primary/50 text-sm font-medium text-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar aula/live
                    </button>
                  )}
                  {formData.categories.includes("templates_arquivos") && (
                    <button
                      type="button"
                      onClick={() => addContentSubmission("templates_arquivos")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input hover:border-primary/50 text-sm font-medium text-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar template/arquivo
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Mentor-specific fields */}
            {isMentorApplication && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 pt-6 border-t border-border"
              >
                <div className="bg-accent/50 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    🎓 Informações do Mentor
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preencha os campos abaixo para criar seu perfil de mentor. 
                    Após aprovação, você ficará visível para os participantes agendarem mentorias.
                  </p>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Foto de perfil
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-input rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Envie uma foto profissional (máx. 5MB)
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sobre você *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                    placeholder="Conte um pouco sobre sua experiência, o que você faz, e como pode ajudar..."
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description.length}/500 caracteres
                  </p>
                </div>

                {/* Education */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Formação
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: MBA em Marketing Digital - USP"
                    maxLength={200}
                  />
                </div>

                {/* Availability */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                      Disponibilidade *
                    </label>
                    <button
                      type="button"
                      onClick={addAvailability}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar dia
                    </button>
                  </div>

                  {availability.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Adicione os dias e horários em que você está disponível para mentorias.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {availability.map((avail, index) => (
                        <div key={index} className="border border-input rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <select
                              value={avail.day}
                              onChange={(e) => updateAvailabilityDay(index, e.target.value)}
                              className="px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              {dayOptions.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeAvailability(index)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {timeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => toggleTime(index, time)}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                  avail.times.includes(time)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-hero text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Quero ser voluntário"
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Mentor Disclaimer Modal */}
      <MentorDisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        onAccept={handleDisclaimerAccept}
      />
    </div>
  );
};

export default Volunteer;