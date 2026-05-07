import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootTenant } from "@/integrations/api/tenant";

// Swap favicon to the tenant's brand icon as early as possible.
// Non-fatal: failure is swallowed inside bootTenant.
bootTenant();

createRoot(document.getElementById("root")!).render(<App />);
