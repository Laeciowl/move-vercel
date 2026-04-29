import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface MenteeNpsLoginPopupProps {
  enabled: boolean;
  userType: "mentor" | "mentorado";
}

const MenteeNpsLoginPopup = ({ enabled, userType }: MenteeNpsLoginPopupProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const snoozeStorageKey = useMemo(() => {
    if (!user) return null;
    return `move:nps:login-popup-snooze-until:v1:${user.id}`;
  }, [user]);

  const snoozeForThirtyDays = () => {
    if (!snoozeStorageKey) return;

    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + 30);
    localStorage.setItem(snoozeStorageKey, dismissedUntil.toISOString());
  };

  const isSnoozed = () => {
    if (!snoozeStorageKey) return false;
    const raw = localStorage.getItem(snoozeStorageKey);
    if (!raw) return false;

    const dismissedUntilMs = new Date(raw).getTime();
    if (Number.isNaN(dismissedUntilMs)) {
      localStorage.removeItem(snoozeStorageKey);
      return false;
    }

    return Date.now() < dismissedUntilMs;
  };

  useEffect(() => {
    if (!enabled || !user || !snoozeStorageKey) {
      setOpen(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("nps_respostas")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (cancelled) return;

      // If user has already answered NPS, never show the popup again.
      if (!error && (data?.length ?? 0) > 0) {
        setOpen(false);
        return;
      }

      if (isSnoozed()) {
        setOpen(false);
        return;
      }

      setOpen(true);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, snoozeStorageKey, user]);

  const handleDismiss = () => {
    snoozeForThirtyDays();
    setOpen(false);
  };

  const handleGoToNps = () => {
    setOpen(false);
    navigate("/avaliar", { state: { userTypeFromPopup: userType } });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          if (open) {
            handleDismiss();
          }
          return;
        }
        setOpen(true);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ei! Queremos sua opinião 🧡</DialogTitle>
          <DialogDescription>
            Seu feedback ajuda a gente a melhorar cada vez mais a sua experiência na Movê. Pode nos avaliar rapidinho?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleGoToNps}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Avaliar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200"
            >
              Agora não
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenteeNpsLoginPopup;
