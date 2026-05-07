import { useEffect, useState } from "react";
import { request } from "@/integrations/api/client";

interface DomainStatus {
  hostname: string;
  status: "pending" | "active" | "failed";
  verified_at?: string | null;
}

export function CustomDomainBadge() {
  const [status, setStatus] = useState<DomainStatus | null>(null);

  useEffect(() => {
    request<DomainStatus>(`/api/v1/admin/custom_domain`)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  if (status.status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-100 text-green-800">
        ✓ {status.hostname}
      </span>
    );
  }

  if (status.status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-100 text-amber-800">
        ⏳ {status.hostname} (verifying)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-100 text-red-800">
      ✗ {status.hostname}
    </span>
  );
}
