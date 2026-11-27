import { createClient } from "@supabase/supabase-js";

// Vite only inlines variables prefixed with VITE_, and only ones present when the
// dev server or build starts. Values come from jeevan-net-phase1/.env (or
// .env.local) and are never committed.
//
// Aliases are accepted on purpose. Supabase's own snippets use different names
// across products and dashboard generations:
//   URL      : VITE_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL
//   API key  : VITE_SUPABASE_ANON_KEY (legacy JWT), VITE_SUPABASE_PUBLISHABLE_KEY
//              (new sb_publishable_... keys), and their NEXT_PUBLIC_ forms.
// A name Vite cannot see is otherwise the single most common cause of an
// "unconfigured" client, so both spellings resolve.
const env = import.meta.env;

const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";

const apiKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const urlLooksRight = /^https:\/\/[^\s/]+\.supabase\.co\/?$/.test(url.trim());
// Both a legacy anon JWT and a new publishable key are accepted; the service_role
// key is never allowed in a browser bundle because it bypasses row-level security.
const keyLooksUsable = apiKey.trim().length > 20 && !/"role"\s*:\s*"service_role"/.test(
  (() => {
    const part = apiKey.split(".")[1];
    if (!part) return "";
    try {
      return atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return "";
    }
  })(),
);

export const supabaseConfigError = !env.VITE_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL
  ? "No Supabase URL found. Add VITE_SUPABASE_URL to jeevan-net-phase1/.env and restart the dev server (Vite reads env only at startup)."
  : !url.trim()
    ? "VITE_SUPABASE_URL is empty in .env."
    : !urlLooksRight
      ? `VITE_SUPABASE_URL does not look like a Supabase project URL (got "${url}"). Expected https://<project-ref>.supabase.co`
      : !apiKey.trim()
        ? "No API key found. Set VITE_SUPABASE_ANON_KEY (legacy) or VITE_SUPABASE_PUBLISHABLE_KEY (new) in .env, then restart the dev server."
        : !keyLooksUsable
          ? "The Supabase API key is not usable: it is too short or is a service_role key. Use the anon / publishable key from Project Settings -> API."
          : null;

export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = isSupabaseConfigured
  ? createClient(url.trim(), apiKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Exposed so the entry point can report a configuration problem once, in one
// place, instead of each call site inventing its own message.
export function warnIfUnconfigured() {
  if (supabaseConfigError) console.warn(`[JEEVAN-NET] ${supabaseConfigError}`);
}
