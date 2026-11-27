import { supabase, supabaseConfigError } from "./supabase.js";

// Supabase-backed authentication. The app's user shape is
//   { name, age, gender, contact, email, abhaId, isVerified }
// so every function here returns that shape, falling back to `user_metadata`
// when the optional `profiles` table is absent or unreadable.

const PROFILE_TABLE = "profiles";

export const authAvailable = Boolean(supabase);

// Supabase returns machine-y messages; translate the ones a patient actually
// hits into something actionable.
const friendly = (message = "") => {
  const text = String(message);
  if (/Invalid login credentials/i.test(text)) return "Email or password is incorrect.";
  if (/Email not confirmed/i.test(text)) return "Confirm your email address first — check your inbox for the link.";
  if (/User already registered/i.test(text)) return "An account with this email already exists. Sign in instead.";
  if (/Password should be at least/i.test(text)) return "Password is too short — use at least 6 characters.";
  if (/rate limit|too many/i.test(text)) return "Too many attempts. Wait a minute and try again.";
  if (/Error sending (confirmation|magic( link)?|recovery|signup|invite) email|error sending email/i.test(text))
    return (
      "Supabase could not send the email. Your project's mail sender rejected it — check " +
      "Authentication → Logs for the exact reason, and verify the SMTP settings under " +
      "Authentication → SMTP Settings. If you have not set up custom SMTP yet, the built-in " +
      "sender often refuses: use email + password instead, or add SMTP."
    );
  if (/smtp|mailer|sender/i.test(text))
    return (
      "The project's email sender is not working. Check Authentication → SMTP Settings and " +
      "Authentication → Logs, or use email + password instead."
    );
  if (/Failed to fetch|NetworkError/i.test(text)) return "Could not reach the database. Check your connection and the Supabase URL.";
  return text;
};

export const toAppUser = (authUser, profile = null) => {
  const meta = authUser?.user_metadata || {};
  const source = profile || {};
  return {
    name: source.full_name || meta.full_name || "Patient",
    age: String(source.age || meta.age || "") || "—",
    gender: source.gender || meta.gender || "Not specified",
    contact: source.phone || meta.phone || "",
    email: authUser?.email || meta.email || "",
    abhaId: source.abha_id || meta.abha_id || "",
    isVerified: Boolean(authUser?.email_confirmed_at) || false,
  };
};

export async function fetchProfile(authUser) {
  if (!supabase || !authUser) return null;
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("full_name, age, gender, phone, abha_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    // A missing table or a withheld policy must not block sign-in: the same
    // details are mirrored into user_metadata at registration.
    console.warn(
      `[JEEVAN-NET] Could not read the "${PROFILE_TABLE}" table (${error.message}). ` +
        "Falling back to account metadata. Run supabase/02-patient-records.sql to create it.",
    );
    return null;
  }
  return data;
}

// Writes the profile row. Deliberately non-fatal: if the table has not been
// created yet the account still exists and still signs in.
async function writeProfileRow(authUser, profile) {
  if (!supabase || !authUser) return { saved: false, reason: "no session" };

  const row = {
    id: authUser.id,
    full_name: profile.name,
    age: profile.age === "" || profile.age == null ? null : Number(profile.age),
    gender: profile.gender,
    phone: profile.contact,
  };
  const withAbha = profile.abhaId ? { ...row, abha_id: profile.abhaId } : row;

  let { error } = await supabase.from(PROFILE_TABLE).upsert(withAbha, { onConflict: "id" });

  // The live `profiles` table was created without an `abha_id` column. Retrying
  // without it keeps sign-up and profile edits working until
  // supabase/02-patient-records.sql has been run, instead of failing the write.
  if (error && "abha_id" in withAbha && /abha_id/i.test(error.message)) {
    const retry = await supabase.from(PROFILE_TABLE).upsert(row, { onConflict: "id" });
    error = retry.error;
  }

  if (error) {
    console.warn(
      `[JEEVAN-NET] Profile row not saved (${error.message}). ` +
        "The account was still created; run supabase/02-patient-records.sql to enable profile storage.",
    );
    return { saved: false, reason: error.message };
  }
  return { saved: true, reason: null };
}

export async function signUp({ email, password, name, age, gender, contact, abhaId }) {
  if (!supabase) return { error: "The database is not configured, so accounts cannot be created." };

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      // Mirrored into the account so the profile survives even without the table.
      data: {
        full_name: name.trim(),
        age: String(age),
        gender,
        phone: contact.trim(),
        abha_id: abhaId || null,
      },
    },
  });

  if (error) return { error: friendly(error.message) };

  // With "Confirm email" enabled in Supabase (the default) no session is
  // returned until the link is clicked.
  if (!data.session) {
    return { needsEmailConfirmation: true, email: email.trim(), user: data.user };
  }

  const saved = await writeProfileRow(data.user, { name, age, gender, contact, abhaId });
  return {
    user: toAppUser(data.user, saved.saved ? await fetchProfile(data.user) : null),
    profileSaved: saved.saved,
    profileWarning: saved.saved ? null : saved.reason,
  };
}

export async function signIn({ email, password }) {
  if (!supabase) return { error: "The database is not configured, so sign-in is unavailable." };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { error: friendly(error.message) };

  const profile = await fetchProfile(data.user);
  return { user: toAppUser(data.user, profile) };
}

// Persists edits made in the profile modal to the signed-in patient's own row.
export async function updateMyProfile(profile) {
  if (!supabase) return { error: supabaseConfigError || "The database is not configured." };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { error: "Sign in before updating your profile." };

  const saved = await writeProfileRow(data.user, profile);
  if (!saved.saved) return { error: `Could not save your profile: ${saved.reason}` };

  return {
    user: {
      ...toAppUser(data.user),
      name: profile.name,
      age: String(profile.age ?? ""),
      gender: profile.gender,
      contact: profile.contact,
      abhaId: profile.abhaId || data.user.user_metadata?.abha_id || "",
    },
  };
}

export async function signOutOfDatabase() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error ? friendly(error.message) : null };
}

// Restores a session on page load. Resolves to null when nobody is signed in.
export async function restoreSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  const profile = await fetchProfile(data.session.user);
  return toAppUser(data.session.user, profile);
}

export function onAuthStateChange(handler) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    handler(event, session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}
