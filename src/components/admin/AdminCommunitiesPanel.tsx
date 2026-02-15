import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CommunityFormModal from "@/components/admin/CommunityFormModal";

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
  created_at: string;
}

const categoryLabels: Record<CommunityCategory, string> = {
  vagas: "💼 Vagas e Oportunidades",
  networking: "🌐 Networking e Conexões",
  conteudo: "📚 Conteúdo e Aprendizado",
  outros: "✨ Outros",
};

const AdminCommunitiesPanel = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Community | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Community | null>(null);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from("partner_communities")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setCommunities((data as Community[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCommunities(); }, []);

  const handleToggleActive = async (community: Community) => {
    const { error } = await supabase
      .from("partner_communities")
      .update({ active: !community.active })
      .eq("id", community.id);
    if (error) toast.error("Erro ao atualizar status");
    else {
      toast.success(community.active ? "Comunidade desativada" : "Comunidade ativada");
      fetchCommunities();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Delete logo from storage if exists
    if (deleteTarget.logo_url) {
      const path = deleteTarget.logo_url.split("/community-logos/")[1];
      if (path) await supabase.storage.from("community-logos").remove([path]);
    }
    const { error } = await supabase.from("partner_communities").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Erro ao excluir comunidade");
    else {
      toast.success("Comunidade excluída com sucesso!");
      fetchCommunities();
    }
    setDeleteTarget(null);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchCommunities();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Comunidades Parceiras</h2>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Adicionar Nova
        </Button>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma comunidade cadastrada. Clique em <strong>Adicionar Nova</strong> para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {communities.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/40">
              {c.logo_url ? (
                <img src={c.logo_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                  {c.category === "vagas" ? "💼" : c.category === "networking" ? "🌐" : c.category === "conteudo" ? "📚" : "✨"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{categoryLabels[c.category]}</p>
                <a href={c.external_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  {c.external_link.substring(0, 40)}... <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{c.active ? "Ativo" : "Inativo"}</span>
                  <Switch checked={c.active} onCheckedChange={() => handleToggleActive(c)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setShowForm(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CommunityFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={handleSaved}
        community={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a comunidade "<strong>{deleteTarget?.name}</strong>"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Comunidade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCommunitiesPanel;
