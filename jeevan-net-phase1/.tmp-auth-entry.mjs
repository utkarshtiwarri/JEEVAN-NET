// Entry bundled by scripts/check-auth-logic.mjs. Asserts the auth logic.
import { state } from "./.tmp-sb-stub.mjs";
import { signUp, signIn, signOutOfDatabase, restoreSession, toAppUser, authAvailable } from "./src/lib/auth.js";

let problems = 0;
const expect = (cond, label, extra = "") => {
  if (cond) console.log(`  OK   ${label}`);
  else {
    problems += 1;
    console.log(`  FAIL ${label}${extra ? ` — ${extra}` : ""}`);
  }
};

console.log("configuration");
expect(authAvailable === true, "client is available with env present");

console.log("toAppUser mapping");
const mapped = toAppUser(
  {
    id: "u1",
    email: "asha@example.com",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    user_metadata: { full_name: "Asha Rao", age: "34", gender: "Female", phone: "+91 90000 00000" },
  },
  null,
);
expect(mapped.name === "Asha Rao", "name from metadata");
expect(mapped.age === "34", "age from metadata");
expect(mapped.contact === "+91 90000 00000", "phone from metadata");
expect(mapped.email === "asha@example.com", "email from auth user");
expect(mapped.isVerified === true, "verified when email_confirmed_at present");

const fromRow = toAppUser(
  { id: "u2", email: "x@y.z", user_metadata: { full_name: "Meta Name" } },
  { full_name: "Row Name", age: 61, gender: "Male", phone: "123", abha_id: "ABHA-1" },
);
expect(fromRow.name === "Row Name", "profiles row wins over metadata");
expect(fromRow.abhaId === "ABHA-1", "abha id carried through");
expect(fromRow.isVerified === false, "unverified without email_confirmed_at");

console.log("sign in — error translation");
state.signInResult = { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
let res = await signIn({ email: "a@b.c", password: "nope" });
expect(res.error === "Email or password is incorrect.", "invalid credentials translated", res.error);
expect(state.calls.at(-1).args.email === "a@b.c", "email passed through");

state.signInResult = { data: { user: null }, error: { message: "Email not confirmed" } };
res = await signIn({ email: "a@b.c", password: "nope" });
expect(/Confirm your email/.test(res.error), "unconfirmed email explained", res.error);

console.log("sign in — success");
state.signInResult = {
  data: { user: { id: "u1", email: "asha@example.com", email_confirmed_at: "x", user_metadata: { full_name: "Asha" } } },
  error: null,
};
state.selectResult = { data: null, error: { message: 'relation "profiles" does not exist' } };
res = await signIn({ email: "asha@example.com", password: "secret" });
expect(Boolean(res.user), "returns a user");
expect(res.user.name === "Asha", "falls back to metadata when table missing");

console.log("sign up — needs confirmation");
state.calls.length = 0;
state.signUpResult = { data: { user: { id: "u3", email: "new@example.com" }, session: null }, error: null };
res = await signUp({ email: "new@example.com", password: "secret1", name: "New Person", age: "40", gender: "Male", contact: "999" });
expect(res.needsEmailConfirmation === true, "reports pending confirmation");
expect(res.email === "new@example.com", "returns the email to show");
expect(!state.calls.some((c) => c.fn === "upsert"), "no profile write before confirmation");

const signUpCall = state.calls.find((c) => c.fn === "signUp");
expect(signUpCall.args.options.data.full_name === "New Person", "name sent as metadata");
expect(signUpCall.args.options.data.age === "40", "age sent as metadata");

console.log("sign up — immediate session");
state.calls.length = 0;
state.signUpResult = {
  data: { user: { id: "u4", email: "ok@example.com", email_confirmed_at: "x", user_metadata: { full_name: "Ok Person", age: "50", gender: "Female", phone: "111" } }, session: { access_token: "t" } },
  error: null,
};
state.upsertResult = { error: null };
state.selectResult = { data: { full_name: "Ok Person", age: 50, gender: "Female", phone: "111", abha_id: null }, error: null };
res = await signUp({ email: "ok@example.com", password: "secret1", name: "Ok Person", age: "50", gender: "Female", contact: "111" });
expect(Boolean(res.user), "returns signed-in user");
expect(res.profileSaved === true, "profile row saved");
expect(res.user.age === "50", "profile row mapped back");
const upsert = state.calls.find((c) => c.fn === "upsert");
expect(upsert.row.age === 50, "age written as integer, not string", String(upsert.row.age));

console.log("sign up — profile table missing");
state.calls.length = 0;
state.upsertResult = { error: { message: 'relation "profiles" does not exist' } };
res = await signUp({ email: "ok@example.com", password: "secret1", name: "Ok Person", age: "50", gender: "Female", contact: "111" });
expect(Boolean(res.user), "account still succeeds without the table");
expect(res.profileSaved === false, "reports the profile was not saved");
expect(/profiles/.test(res.profileWarning || ""), "warning names the missing table");

console.log("sign up — duplicate email");
state.signUpResult = { data: { user: null }, error: { message: "User already registered" } };
res = await signUp({ email: "dup@example.com", password: "secret1", name: "Dup", age: "30", gender: "Male", contact: "1" });
expect(/already exists/.test(res.error), "duplicate email explained", res.error);

console.log("sign out + restore");
state.signOutResult = { error: null };
expect((await signOutOfDatabase()).error === null, "sign out succeeds");
state.sessionResult = { data: { session: { user: { id: "u1", email: "a@b.c", user_metadata: { full_name: "Asha" } } } }, error: null };
state.selectResult = { data: null, error: null };
const restored = await restoreSession();
expect(restored?.name === "Asha", "session restored on reload");
state.sessionResult = { data: { session: null }, error: null };
expect((await restoreSession()) === null, "no session returns null");

console.log(problems === 0 ? "\nOK - auth logic behaves." : `\n${problems} problem(s).`);
process.exit(problems === 0 ? 0 : 1);
