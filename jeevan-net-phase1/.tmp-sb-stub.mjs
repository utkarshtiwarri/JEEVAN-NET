// Test-only stand-in for @supabase/supabase-js so auth.js logic can be exercised
// without a network or a real project. Deleted after use.
export const state = {
  signUpResult: null,
  signInResult: null,
  signOutResult: { error: null },
  sessionResult: { data: { session: null }, error: null },
  upsertResult: { error: null },
  selectResult: { data: null, error: null },
  calls: [],
};

export function createClient() {
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
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => ({
      upsert: async (row) => {
        state.calls.push({ fn: "upsert", row });
        return state.upsertResult;
      },
      select: () => ({
        eq: () => ({
          maybeSingle: async () => state.selectResult,
        }),
      }),
    }),
  };
}
