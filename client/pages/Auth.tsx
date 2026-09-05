import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Plane } from "lucide-react";

const demoEmail = "pugal@tripmate.demo";
const demoPassword = "TripMate@123";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();

    const password = String(data.get("password") ?? "");

    const name = String(data.get("name") ?? "").trim();

    const confirmPassword = String(
      data.get("confirmPassword") ?? "",
    );

    if (
      !email ||
      !password ||
      (!isLogin && password !== confirmPassword)
    ) {
      setError(
        !isLogin && password !== confirmPassword
          ? "Passwords must match."
          : "Enter your email and password.",
      );
      return;
    }

    if (
      isLogin &&
      email !== demoEmail &&
      !window.localStorage.getItem(`tripmate-user:${email}`)
    ) {
      setError(
        "No demo account exists for this email. Create an account or use the demo account.",
      );
      return;
    }

    // Get the saved name for an existing account
    const savedName = window.localStorage.getItem(
      `tripmate-name:${email}`,
    );

    const loggedInName = isLogin
      ? email === demoEmail
        ? "Pugal"
        : savedName || email.split("@")[0]
      : name || "Pugal";

    // Store the logged-in user
    window.localStorage.setItem(
      "tripmate-auth",
      JSON.stringify({
        email,
        name: loggedInName,
      }),
    );

    // Save account information during registration
    if (!isLogin) {
      window.localStorage.setItem(
        `tripmate-user:${email}`,
        "created",
      );

      window.localStorage.setItem(
        `tripmate-name:${email}`,
        loggedInName,
      );
    }

    navigate("/");
  };

  const useDemo = () => {
    window.localStorage.setItem(
      "tripmate-auth",
      JSON.stringify({
        email: demoEmail,
        name: "Pugal",
      }),
    );

    navigate("/");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span>
            <Plane size={17} />
          </span>
          tripmate
          <small>AI</small>
        </div>

        <p className="eyebrow">
          INTELLIGENT ENTERPRISE TRAVEL
        </p>

        <h1>
          {isLogin
            ? "Welcome back"
            : "Create your TripMate account"}
        </h1>

        <p className="auth-copy">
          {isLogin
            ? "Sign in to monitor and manage your connected business journey."
            : "Start planning and protecting your next business journey."}
        </p>

        <form onSubmit={submit}>
          {!isLogin && (
            <>
              <label>
                Full Name
                <input
                  name="name"
                  required
                  placeholder="Pugal"
                />
              </label>

              <label>
                Company
                <input
                  name="company"
                  required
                  placeholder="Enterprise Client"
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91"
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="pugal@tripmate.demo"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </label>

          {!isLogin && (
            <>
              <label>
                Confirm Password
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                />
              </label>

              <label className="auth-check">
                <input type="checkbox" required /> I agree to
                the Terms and Privacy Policy
              </label>
            </>
          )}

          {isLogin && (
            <div className="auth-options">
              <label className="auth-check">
                <input type="checkbox" />
                Remember me
              </label>

              <button type="button">
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="auth-error">{error}</p>
          )}

          <button
            className="auth-submit"
            type="submit"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        {isLogin && (
          <button
            className="auth-demo"
            onClick={useDemo}
          >
            <CheckCircle2 size={15} />
            Use Demo Account
          </button>
        )}

        <p className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <Link
            to={isLogin ? "/register" : "/login"}
          >
            {isLogin ? "Create account" : "Sign in"}
          </Link>
        </p>

        {isLogin && (
          <p className="auth-hint">
            Demo: {demoEmail} · {demoPassword}
          </p>
        )}
      </section>
    </main>
  );
}