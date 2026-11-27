import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.jsx";
import { supabase, supabaseConfigError } from "./lib/supabase.js";

// Supabase is optional at runtime: the app is a client-side prototype whose
// sign-in gate reads localStorage, so a missing configuration must not stop the
// page from rendering. Report it once and carry on.
if (!supabase) {
  console.warn(`[JEEVAN-NET] ${supabaseConfigError}`);
} else {
  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) console.error("[JEEVAN-NET] Supabase session check failed:", error.message);
      else console.log("[JEEVAN-NET] Supabase reachable. Session:", data.session ?? "none");
    })
    .catch((error) => {
      // A bad URL or blocked network rejects instead of returning `error`.
      console.error("[JEEVAN-NET] Supabase session check threw:", error?.message ?? error);
    });
}

createRoot(document.getElementById("root")).render(<App />);
