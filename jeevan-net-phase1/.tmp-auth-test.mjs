// <define:import.meta.env>
var define_import_meta_env_default = { VITE_SUPABASE_URL: "https://testref.supabase.co", VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.sig" };

// .tmp-sb-stub.mjs
var state = {
  signUpResult: null,
  signInResult: null,
  signOutResult: { error: null },
  sessionResult: { data: { session: null }, error: null },
  upsertResult: { error: null },
  selectResult: { data: null, error: null },
  calls: []
};
function createClient() {
  return {
    auth: {
      signUp: async (args) => {
        state.calls.push({ fn: "signUp", args });
        return state.signUpResult;
      },
      signInWithPassword: async (args) => {
        state.calls.push({ fn: "signIn", args });
        return state.signInResult;
      },
      signOut: async () => {
        state.calls.push({ fn: "signOut" });
        return state.signOutResult;
      },
      getSession: async () => state.sessionResult,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {
      } } } })
    },
    from: () => ({
      upsert: async (row) => {
        state.calls.push({ fn: "upsert", row });
        return state.upsertResult;
      },
      select: () => ({
        eq: () => ({
          maybeSingle: async () => state.selectResult
        })
      })
    })
  };
}

// src/lib/supabase.js
var env = define_import_meta_env_default;
var url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
var apiKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
var urlLooksRight = /^https:\/\/[^\s/]+\.supabase\.co\/?$/.test(url.trim());
var keyLooksUsable = apiKey.trim().length > 20 && !/"role"\s*:\s*"service_role"/.test(
  (() => {
    const part = apiKey.split(".")[1];
    if (!part) return "";
    try {
      return atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return "";
    }
  })()
);
var supabaseConfigError = !env.VITE_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL ? "No Supabase URL found. Add VITE_SUPABASE_URL to jeevan-net-phase1/.env and restart the dev server (Vite reads env only at startup)." : !url.trim() ? "VITE_SUPABASE_URL is empty in .env." : !urlLooksRight ? `VITE_SUPABASE_URL does not look like a Supabase project URL (got "${url}"). Expected https://<project-ref>.supabase.co` : !apiKey.trim() ? "No API key found. Set VITE_SUPABASE_ANON_KEY (legacy) or VITE_SUPABASE_PUBLISHABLE_KEY (new) in .env, then restart the dev server." : !keyLooksUsable ? "The Supabase API key is not usable: it is too short or is a service_role key. Use the anon / publishable key from Project Settings -> API." : null;
var isSupabaseConfigured = !supabaseConfigError;
var supabase = isSupabaseConfigured ? createClient(url.trim(), apiKey.trim(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

// src/lib/auth.js
var PROFILE_TABLE = "profiles";
var authAvailable = Boolean(supabase);
var friendly = (message = "") => {
  const text = String(message);
  if (/Invalid login credentials/i.test(text)) return "Email or password is incorrect.";
  if (/Email not confirmed/i.test(text)) return "Confirm your email address first \u2014 check your inbox for the link.";
  if (/User already registered/i.test(text)) return "An account with this email already exists. Sign in instead.";
  if (/Password should be at least/i.test(text)) return "Password is too short \u2014 use at least 6 characters.";
  if (/rate limit|too many/i.test(text)) return "Too many attempts. Wait a minute and try again.";
  if (/Error sending (confirmation|magic( link)?|recovery|signup|invite) email|error sending email/i.test(text))
    return "Supabase could not send the email. Your project's mail sender rejected it \u2014 check Authentication \u2192 Logs for the exact reason, and verify the SMTP settings under Authentication \u2192 SMTP Settings. If you have not set up custom SMTP yet, the built-in sender often refuses: use email + password instead, or add SMTP.";
  if (/smtp|mailer|sender/i.test(text))
    return "The project's email sender is not working. Check Authentication \u2192 SMTP Settings and Authentication \u2192 Logs, or use email + password instead.";
  if (/Failed to fetch|NetworkError/i.test(text)) return "Could not reach the database. Check your connection and the Supabase URL.";
  return text;
};
var toAppUser = (authUser, profile = null) => {
  const meta = authUser?.user_metadata || {};
  const source = profile || {};
  return {
    name: source.full_name || meta.full_name || "Patient",
    age: String(source.age || meta.age || "") || "\u2014",
    gender: source.gender || meta.gender || "Not specified",
    contact: source.phone || meta.phone || "",
    email: authUser?.email || meta.email || "",
    abhaId: source.abha_id || meta.abha_id || "",
    isVerified: Boolean(authUser?.email_confirmed_at) || false
  };
};
async function fetchProfile(authUser) {
  if (!supabase || !authUser) return null;
  const { data, error } = await supabase.from(PROFILE_TABLE).select("full_name, age, gender, phone, abha_id").eq("id", authUser.id).maybeSingle();
  if (error) {
    console.warn(
      `[JEEVAN-NET] Could not read the "${PROFILE_TABLE}" table (${error.message}). Falling back to account metadata. Run supabase/02-patient-records.sql to create it.`
    );
    return null;
  }
  return data;
}
async function writeProfileRow(authUser, profile) {
  if (!supabase || !authUser) return { saved: false, reason: "no session" };
  const row = {
    id: authUser.id,
    full_name: profile.name,
    age: profile.age === "" || profile.age == null ? null : Number(profile.age),
    gender: profile.gender,
    phone: profile.contact
  };
  const withAbha = profile.abhaId ? { ...row, abha_id: profile.abhaId } : row;
  let { error } = await supabase.from(PROFILE_TABLE).upsert(withAbha, { onConflict: "id" });
  if (error && "abha_id" in withAbha && /abha_id/i.test(error.message)) {
    const retry = await supabase.from(PROFILE_TABLE).upsert(row, { onConflict: "id" });
    error = retry.error;
  }
  if (error) {
    console.warn(
      `[JEEVAN-NET] Profile row not saved (${error.message}). The account was still created; run supabase/02-patient-records.sql to enable profile storage.`
    );
    return { saved: false, reason: error.message };
  }
  return { saved: true, reason: null };
}
async function signUp({ email, password, name, age, gender, contact, abhaId }) {
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
        abha_id: abhaId || null
      }
    }
  });
  if (error) return { error: friendly(error.message) };
  if (!data.session) {
    return { needsEmailConfirmation: true, email: email.trim(), user: data.user };
  }
  const saved = await writeProfileRow(data.user, { name, age, gender, contact, abhaId });
  return {
    user: toAppUser(data.user, saved.saved ? await fetchProfile(data.user) : null),
    profileSaved: saved.saved,
    profileWarning: saved.saved ? null : saved.reason
  };
}
async function signIn({ email, password }) {
  if (!supabase) return { error: "The database is not configured, so sign-in is unavailable." };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) return { error: friendly(error.message) };
  const profile = await fetchProfile(data.user);
  return { user: toAppUser(data.user, profile) };
}
async function signOutOfDatabase() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error ? friendly(error.message) : null };
}
async function restoreSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  const profile = await fetchProfile(data.session.user);
  return toAppUser(data.session.user, profile);
}

// .tmp-auth-entry.mjs
var problems = 0;
var expect = (cond, label, extra = "") => {
  if (cond) console.log(`  OK   ${label}`);
  else {
    problems += 1;
    console.log(`  FAIL ${label}${extra ? ` \u2014 ${extra}` : ""}`);
  }
};
console.log("configuration");
expect(authAvailable === true, "client is available with env present");
console.log("toAppUser mapping");
var mapped = toAppUser(
  {
    id: "u1",
    email: "asha@example.com",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    user_metadata: { full_name: "Asha Rao", age: "34", gender: "Female", phone: "+91 90000 00000" }
  },
  null
);
expect(mapped.name === "Asha Rao", "name from metadata");
expect(mapped.age === "34", "age from metadata");
expect(mapped.contact === "+91 90000 00000", "phone from metadata");
expect(mapped.email === "asha@example.com", "email from auth user");
expect(mapped.isVerified === true, "verified when email_confirmed_at present");
var fromRow = toAppUser(
  { id: "u2", email: "x@y.z", user_metadata: { full_name: "Meta Name" } },
  { full_name: "Row Name", age: 61, gender: "Male", phone: "123", abha_id: "ABHA-1" }
);
expect(fromRow.name === "Row Name", "profiles row wins over metadata");
expect(fromRow.abhaId === "ABHA-1", "abha id carried through");
expect(fromRow.isVerified === false, "unverified without email_confirmed_at");
console.log("sign in \u2014 error translation");
state.signInResult = { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
var res = await signIn({ email: "a@b.c", password: "nope" });
expect(res.error === "Email or password is incorrect.", "invalid credentials translated", res.error);
expect(state.calls.at(-1).args.email === "a@b.c", "email passed through");
state.signInResult = { data: { user: null }, error: { message: "Email not confirmed" } };
res = await signIn({ email: "a@b.c", password: "nope" });
expect(/Confirm your email/.test(res.error), "unconfirmed email explained", res.error);
console.log("sign in \u2014 success");
state.signInResult = {
  data: { user: { id: "u1", email: "asha@example.com", email_confirmed_at: "x", user_metadata: { full_name: "Asha" } } },
  error: null
};
state.selectResult = { data: null, error: { message: 'relation "profiles" does not exist' } };
res = await signIn({ email: "asha@example.com", password: "secret" });
expect(Boolean(res.user), "returns a user");
expect(res.user.name === "Asha", "falls back to metadata when table missing");
console.log("sign up \u2014 needs confirmation");
state.calls.length = 0;
state.signUpResult = { data: { user: { id: "u3", email: "new@example.com" }, session: null }, error: null };
res = await signUp({ email: "new@example.com", password: "secret1", name: "New Person", age: "40", gender: "Male", contact: "999" });
expect(res.needsEmailConfirmation === true, "reports pending confirmation");
expect(res.email === "new@example.com", "returns the email to show");
expect(!state.calls.some((c) => c.fn === "upsert"), "no profile write before confirmation");
var signUpCall = state.calls.find((c) => c.fn === "signUp");
expect(signUpCall.args.options.data.full_name === "New Person", "name sent as metadata");
expect(signUpCall.args.options.data.age === "40", "age sent as metadata");
console.log("sign up \u2014 immediate session");
state.calls.length = 0;
state.signUpResult = {
  data: { user: { id: "u4", email: "ok@example.com", email_confirmed_at: "x", user_metadata: { full_name: "Ok Person", age: "50", gender: "Female", phone: "111" } }, session: { access_token: "t" } },
  error: null
};
state.upsertResult = { error: null };
state.selectResult = { data: { full_name: "Ok Person", age: 50, gender: "Female", phone: "111", abha_id: null }, error: null };
res = await signUp({ email: "ok@example.com", password: "secret1", name: "Ok Person", age: "50", gender: "Female", contact: "111" });
expect(Boolean(res.user), "returns signed-in user");
expect(res.profileSaved === true, "profile row saved");
expect(res.user.age === "50", "profile row mapped back");
var upsert = state.calls.find((c) => c.fn === "upsert");
expect(upsert.row.age === 50, "age written as integer, not string", String(upsert.row.age));
console.log("sign up \u2014 profile table missing");
state.calls.length = 0;
state.upsertResult = { error: { message: 'relation "profiles" does not exist' } };
res = await signUp({ email: "ok@example.com", password: "secret1", name: "Ok Person", age: "50", gender: "Female", contact: "111" });
expect(Boolean(res.user), "account still succeeds without the table");
expect(res.profileSaved === false, "reports the profile was not saved");
expect(/profiles/.test(res.profileWarning || ""), "warning names the missing table");
console.log("sign up \u2014 duplicate email");
state.signUpResult = { data: { user: null }, error: { message: "User already registered" } };
res = await signUp({ email: "dup@example.com", password: "secret1", name: "Dup", age: "30", gender: "Male", contact: "1" });
expect(/already exists/.test(res.error), "duplicate email explained", res.error);
console.log("sign out + restore");
state.signOutResult = { error: null };
expect((await signOutOfDatabase()).error === null, "sign out succeeds");
state.sessionResult = { data: { session: { user: { id: "u1", email: "a@b.c", user_metadata: { full_name: "Asha" } } } }, error: null };
state.selectResult = { data: null, error: null };
var restored = await restoreSession();
expect(restored?.name === "Asha", "session restored on reload");
state.sessionResult = { data: { session: null }, error: null };
expect(await restoreSession() === null, "no session returns null");
console.log(problems === 0 ? "\nOK - auth logic behaves." : `
${problems} problem(s).`);
process.exit(problems === 0 ? 0 : 1);
