import React, { useState } from "react";
import { IconLogo, IconUser, IconLock, IconShield, IconMail, IconPhone, IconCheckCircle } from "../Icons.jsx";
import { DEMO_ABHA_ID, defaultUser } from "../data/patients.js";
import { signIn, signUp, authAvailable } from "../lib/auth.js";
import { supabaseConfigError } from "../lib/supabase.js";

// Two paths on purpose:
//  - Database accounts (email + password) when Supabase is configured.
//  - A local demonstration session so the prototype can still be shown with no
//    database, no network and no account.
const DEMO_PASSWORD = "jeevan123";
const MIN_PASSWORD = 6;

function EyeIcon({ hidden }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {hidden ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.2A10 10 0 0 1 12 6c5 0 9 4.5 9 6 0 .9-1.2 2.4-3 3.8" />
          <path d="M6.4 7.7C4.2 9.1 3 10.6 3 12c0 1.5 4 6 9 6 1.4 0 2.7-.3 3.9-.9" />
        </>
      ) : (
        <>
          <path d="M3 12c0-1.5 4-6 9-6s9 4.5 9 6-4 6-9 6-9-4.5-9-6z" />
          <circle cx="12" cy="12" r="2.6" />
        </>
      )}
    </svg>
  );
}

function SigninArt() {
  return (
    <div className="signin-art" aria-hidden="true">
      <span className="signin-mesh" />
      <span className="signin-orb" />
      <span className="signin-corner signin-corner-tl" />
      <span className="signin-corner signin-corner-tr" />
      <span className="signin-corner signin-corner-bl" />
      <span className="signin-corner signin-corner-br" />
      <svg className="signin-rings" viewBox="0 0 560 560" fill="none" focusable="false">
        <circle cx="280" cy="280" r="150" stroke="#2dd4bf" strokeOpacity="0.16" />
        <circle cx="280" cy="280" r="204" stroke="#2dd4bf" strokeOpacity="0.13" />
        <circle cx="280" cy="280" r="256" stroke="#2dd4bf" strokeOpacity="0.09" strokeDasharray="2 10" />
        <circle cx="280" cy="280" r="100" stroke="#38bdf8" strokeOpacity="0.14" />
        <path d="M280 262v36M262 280h36" stroke="#5eead4" strokeOpacity="0.3" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <svg className="signin-pulse" viewBox="0 0 1200 120" fill="none" focusable="false">
        <path d="M0 60h196l20-28 24 56 22-40 16 10h146" stroke="#5eead4" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M424 60h776" stroke="#5eead4" strokeOpacity="0.16" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

const emptySignUp = {
  name: "",
  email: "",
  contact: "",
  age: "",
  gender: "Male",
  password: "",
  confirm: "",
};

export function Login({ onSignIn, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(emptySignUp);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!authAvailable) {
      setError(supabaseConfigError || "The database is not configured.");
      return;
    }

    setBusy(true);
    const result = await signIn({ email, password });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onSignIn(result.user, keepSignedIn);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");

    if (!form.name.trim()) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Enter a valid email address.");
    if (!form.contact.trim()) return setError("Enter a mobile number.");
    if (!form.age || Number(form.age) < 1 || Number(form.age) > 120) return setError("Enter an age between 1 and 120.");
    if (form.password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (form.password !== form.confirm) return setError("The two passwords do not match.");
    if (!authAvailable) return setError(supabaseConfigError || "The database is not configured.");

    setBusy(true);
    const result = await signUp({
      email: form.email,
      password: form.password,
      name: form.name,
      age: form.age,
      gender: form.gender,
      contact: form.contact,
    });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setNotice(
        `Account created for ${result.email}. Confirm it from the link we emailed you, then sign in. ` +
          "No email arrived? Turn off \"Confirm email\" in Supabase → Authentication → Providers → Email for demos.",
      );
      setMode("signin");
      setEmail(result.email);
      setPassword("");
      return;
    }

    onSignIn(result.user, keepSignedIn);
  };

  const handleDemo = () => onSignIn({ ...defaultUser, isVerified: true }, false);
  const handleGuest = () => onSignIn({ ...defaultUser }, false);

  return (
    <div className="signin-page">
      <aside className="signin-aside">
        <SigninArt />
        <div className="signin-hero">
          <div className="signin-lockup">
            <span className="signin-mark"><IconLogo size={90} /></span>
            <div className="signin-wordmark">JEEVAN-NET</div>
            <span className="signin-pill">Healthcare, connected.</span>
          </div>
          <p className="signin-motto">
            <span className="signin-motto-rule" aria-hidden="true" />
            <span className="signin-motto-lead">From Symptom to Solution</span>
            <span className="signin-motto-accent">Before It&rsquo;s Too Late.</span>
          </p>
        </div>
        <p className="signin-mission">India&rsquo;s Intelligent Healthcare Response Network</p>
      </aside>

      <main className="signin-main">
        <div className="signin-card">
          <div className="signin-tabs" role="tablist" aria-label="Sign in or create an account">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={`signin-tab ${mode === "signin" ? "is-active" : ""}`}
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`signin-tab ${mode === "signup" ? "is-active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} noValidate>
              <span className="signin-eyebrow">WELCOME BACK</span>
              <h1 className="signin-title">Sign in to JEEVAN-NET</h1>
              <p className="signin-sub">Access your healthcare dashboard.</p>

              {error && <div className="signin-alert" role="alert">{error}</div>}
              {notice && <div className="signin-notice" role="status">{notice}</div>}

              <div className="signin-field">
                <span className="signin-field-icon"><IconMail size={17} /></span>
                <label className="signin-sr" htmlFor="signin-email">Email address</label>
                <input
                  id="signin-email"
                  className="signin-input"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="signin-field">
                <span className="signin-field-icon"><IconLock size={17} /></span>
                <label className="signin-sr" htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  className="signin-input signin-input-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="signin-eye"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>

              <label className="signin-remember">
                <input type="checkbox" checked={keepSignedIn} onChange={(event) => setKeepSignedIn(event.target.checked)} />
                <span>Remember me</span>
              </label>

              <button type="submit" className="signin-submit" disabled={busy}>
                {busy ? "Signing in…" : "Sign In"}
              </button>

              <p className="signin-switch">
                New here?{" "}
                <button type="button" className="signin-link" onClick={() => switchMode("signup")}>
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} noValidate>
              <span className="signin-eyebrow">NEW PATIENT</span>
              <h1 className="signin-title">Create your account</h1>
              <p className="signin-sub">Saved to your database so your record follows you.</p>

              {error && <div className="signin-alert" role="alert">{error}</div>}
              {notice && <div className="signin-notice" role="status">{notice}</div>}

              <div className="signin-field">
                <span className="signin-field-icon"><IconUser size={17} /></span>
                <label className="signin-sr" htmlFor="signup-name">Full name</label>
                <input id="signup-name" className="signin-input" type="text" autoComplete="name" placeholder="Full name" value={form.name} onChange={update("name")} />
              </div>

              <div className="signin-field">
                <span className="signin-field-icon"><IconMail size={17} /></span>
                <label className="signin-sr" htmlFor="signup-email">Email address</label>
                <input id="signup-email" className="signin-input" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update("email")} />
              </div>

              <div className="signin-field">
                <span className="signin-field-icon"><IconPhone size={17} /></span>
                <label className="signin-sr" htmlFor="signup-contact">Mobile number</label>
                <input id="signup-contact" className="signin-input" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.contact} onChange={update("contact")} />
              </div>

              <div className="signin-row">
                <div className="signin-field">
                  <label className="signin-sr" htmlFor="signup-age">Age in years</label>
                  <input id="signup-age" className="signin-input signin-input-plain" type="number" min="1" max="120" placeholder="Age" value={form.age} onChange={update("age")} />
                </div>
                <div className="signin-field">
                  <label className="signin-sr" htmlFor="signup-gender">Gender</label>
                  <select id="signup-gender" className="signin-input signin-input-plain signin-select" value={form.gender} onChange={update("gender")}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="signin-field">
                <span className="signin-field-icon"><IconLock size={17} /></span>
                <label className="signin-sr" htmlFor="signup-password">Password</label>
                <input id="signup-password" className="signin-input" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={`Password (${MIN_PASSWORD}+ characters)`} value={form.password} onChange={update("password")} />
              </div>

              <div className="signin-field">
                <span className="signin-field-icon"><IconLock size={17} /></span>
                <label className="signin-sr" htmlFor="signup-confirm">Confirm password</label>
                <input id="signup-confirm" className="signin-input" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm password" value={form.confirm} onChange={update("confirm")} />
              </div>

              <button type="submit" className="signin-submit" disabled={busy}>
                {busy ? "Creating account…" : "Create Account"}
              </button>

              <p className="signin-switch">
                Already registered?{" "}
                <button type="button" className="signin-link" onClick={() => switchMode("signin")}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          <div className="signin-divider"><span>or</span></div>

          <button type="button" className="signin-demo" onClick={handleDemo}>
            Use Demo Account
          </button>
          <button type="button" className="signin-guest" onClick={handleGuest}>
            Continue as guest
          </button>

          <p className="signin-privacy">
            <IconShield size={12} />
            <span>
              {authAvailable
                ? "Accounts are stored in your Supabase project. Passwords are hashed by Supabase Auth and never stored by this app."
                : `Database not connected — only the demo account is available. ${supabaseConfigError || ""}`}
            </span>
          </p>

          {authAvailable && (
            <p className="signin-status">
              <IconCheckCircle size={12} /> Database connected
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
