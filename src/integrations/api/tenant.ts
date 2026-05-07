import { request } from "./client";

interface TenantBootstrap {
  name?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string | null;
}

function setFavicon(url: string | null | undefined): void {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

export async function bootTenant(): Promise<void> {
  try {
    const tenant = await request<TenantBootstrap>("/api/v1/tenant/bootstrap");
    // Prefer an explicit favicon_url; fall back to logo_url as the tab icon
    setFavicon(tenant.favicon_url ?? tenant.logo_url);
  } catch {
    // Non-fatal: platform falls back to the default favicon in index.html
  }
}
