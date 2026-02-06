import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Users, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ReferralSection = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchOrCreateReferral();
  }, [user]);

  const fetchOrCreateReferral = async () => {
    if (!user) return;

    // Check existing referral
    const { data: existing } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      setReferralCode(existing[0].referral_code);
    } else {
      // Generate a unique code
      const code = `MOVE-${user.id.slice(0, 6).toUpperCase()}`;
      const { error } = await supabase
        .from("referrals")
        .insert({ referrer_id: user.id, referral_code: code });
      if (!error) setReferralCode(code);
    }

    // Count successful referrals
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .not("referred_user_id", "is", null);

    setReferralCount(count || 0);
  };

  const referralLink = referralCode
    ? `${window.location.origin}/cadastro?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Conheça a Movê! Uma plataforma gratuita de mentoria para jovens profissionais. Cadastre-se pelo meu link: ${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Movê - Mentoria", text, url: referralLink });
      } catch {}
    } else {
      handleCopy();
    }
  };

  if (!referralCode) return null;

  return (
    <motion.div
      variants={{ initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 } }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gift className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Indique amigos</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Compartilhe a Movê com amigos e ajude mais jovens a crescer! 🚀
      </p>

      {referralCount > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {referralCount} {referralCount === 1 ? "amigo indicado" : "amigos indicados"}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30 mb-3">
        <input
          readOnly
          value={referralLink}
          className="flex-1 bg-transparent text-xs text-muted-foreground truncate outline-none"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 h-8 w-8 p-0 rounded-lg"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <Button
        onClick={handleShare}
        size="sm"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar link
      </Button>
    </motion.div>
  );
};

export default ReferralSection;
