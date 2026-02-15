import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type CommunityCategory = "vagas" | "networking" | "conteudo" | "outros";

interface Community {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  category: CommunityCategory;
  external_link: string;
  active: boolean;
  sort_order: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  community: Community | null;
}

const CommunityFormModal = ({ open, onClose, onSaved, community }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CommunityCategory>("vagas");
  const [externalLink, setExternalLink] = useState("");
  const [active, setActive] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description);
      setCategory(community.category);
      setExternalLink(community.external_link);
      setActive(community.active);
      setLogoUrl(community.logo_url);
      setLogoPreview(community.logo_url);
      setLogoFile(null);
    } else {
      setName("");
      setDescription("");
      setCategory("vagas");
      setExternalLink("");
      setActive(true);
      setLogoUrl(null);
      setLogoPreview(null);
      setLogoFile(null);
    }
    setErrors({});
  }, [community, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: "Arquivo deve ter no máximo 2MB" }));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: "Formato inválido. Use JPG, PNG ou WebP" }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors(prev => { const n = { ...prev }; delete n.logo; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    else if (name.length > 50) e.name = "Máximo 50 caracteres";
    if (!description.trim()) e.description = "Descrição é obrigatória";
    else if (description.length < 20) e.description = "Mínimo 20 caracteres";
    else if (description.length > 200) e.description = "Máximo 200 caracteres";
    if (!externalLink.trim()) e.externalLink = "Link é obrigatório";
    else {
      try { new URL(externalLink); } catch { e.externalLink = "URL inválida"; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    let finalLogoUrl = logoUrl;

    // Upload new logo if selected
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("community-logos").upload(path, logoFile);
      if (uploadError) {
        toast.error("Erro ao enviar logo: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("community-logos").getPublicUrl(path);
      finalLogoUrl = urlData.publicUrl;

      // Delete old logo if replacing
      if (community?.logo_url) {
        const oldPath = community.logo_url.split("/community-logos/")[1];
        if (oldPath) await supabase.storage.from("community-logos").remove([oldPath]);
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      category,
      external_link: externalLink.trim(),
      active,
      logo_url: finalLogoUrl,
    };

    let error;
    if (community) {
      ({ error } = await supabase.from("partner_communities").update(payload).eq("id", community.id));
    } else {
      ({ error } = await supabase.from("partner_communities").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(community ? "Comunidade atualizada!" : "✅ Comunidade adicionada com sucesso!");
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{community ? "Editar Comunidade" : "Adicionar Comunidade Parceira"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Logo */}
          <div>
            <Label className="mb-2 block">Logo / Foto da Comunidade</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-border" />
                  <button
                    onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Upload</span>
                </button>
              )}
              {logoPreview && (
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Trocar</Button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
            {errors.logo && <p className="text-xs text-destructive mt-1">{errors.logo}</p>}
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP (máx 2MB)</p>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="comm-name">Nome da Comunidade *</Label>
            <Input id="comm-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tem Vaga?" maxLength={50} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            <p className="text-xs text-muted-foreground mt-1">{name.length}/50</p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="comm-desc">Descrição *</Label>
            <Textarea id="comm-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que a comunidade oferece..." maxLength={200} rows={3} />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">{description.length}/200</p>
          </div>

          {/* Category */}
          <div>
            <Label className="mb-2 block">Categoria *</Label>
            <RadioGroup value={category} onValueChange={v => setCategory(v as CommunityCategory)} className="gap-3">
              <div className="flex items-center gap-2"><RadioGroupItem value="vagas" id="cat-vagas" /><Label htmlFor="cat-vagas">💼 Vagas e Oportunidades</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="networking" id="cat-net" /><Label htmlFor="cat-net">🌐 Networking e Conexões</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="conteudo" id="cat-cont" /><Label htmlFor="cat-cont">📚 Conteúdo e Aprendizado</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="outros" id="cat-outros" /><Label htmlFor="cat-outros">✨ Outros</Label></div>
            </RadioGroup>
          </div>

          {/* External Link */}
          <div>
            <Label htmlFor="comm-link">Link Externo *</Label>
            <Input id="comm-link" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..." />
            {errors.externalLink && <p className="text-xs text-destructive mt-1">{errors.externalLink}</p>}
            <p className="text-xs text-muted-foreground mt-1">WhatsApp, Discord, site, etc.</p>
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <Checkbox id="comm-active" checked={active} onCheckedChange={v => setActive(!!v)} />
            <Label htmlFor="comm-active">Ativo (visível para mentorados)</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {community ? "Salvar Alterações" : "Salvar Comunidade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityFormModal;
