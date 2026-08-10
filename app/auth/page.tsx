"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      setMessage(error);
      window.history.replaceState({}, "", "/auth");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        window.location.assign("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.session) {
          window.location.assign("/");
        } else {
          setMessage(
            "Account created. Check your email to confirm your account."
          );
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to authentication."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setGoogleLoading(true);
    setMessage("");

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setMessage(error.message);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to Google authentication."
      );
      setGoogleLoading(false);
    }
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <div className="badge">REFERRAL EXCHANGE</div>

        <h1>
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h1>

        <p className="authDescription">
          {mode === "login"
            ? "Sign in to manage your trades and reputation."
            : "Create an account to start trading referrals."}
        </p>

        <button
          className="googleButton"
          onClick={loginWithGoogle}
          type="button"
          disabled={googleLoading || loading}
        >
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>

          <button
            className="primary authSubmit"
            disabled={loading || googleLoading}
            type="submit"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {message && <div className="authMessage">{message}</div>}

        <button
          className="switchAuth"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
