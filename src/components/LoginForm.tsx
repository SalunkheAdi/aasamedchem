"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Activity } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel-elevated animate-fade-in" style={styles.card}>
        <div style={styles.logoArea}>
          <Activity size={36} color="var(--color-primary)" />
          <h1 className="gradient-text" style={styles.title}>AasaMedChem</h1>
        </div>
        <p style={styles.subtitle}>Inventory & Order Management Portal</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.icon} />
              <input
                type="text"
                className="form-input"
                style={styles.input}
                placeholder="enter email or username"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.icon} />
              <input
                type="password"
                className="form-input"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don't have an account?</span>{" "}
          <Link href="/register" style={styles.link}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "0.95rem",
    textAlign: "center",
    marginBottom: "30px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-dim)",
  },
  input: {
    width: "100%",
    paddingLeft: "45px",
  },
  submitBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "12px",
  },
  errorAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid var(--color-error)",
    color: "#fca5a5",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.88rem",
    marginBottom: "20px",
    textAlign: "center",
  },
  footer: {
    marginTop: "30px",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "var(--text-muted)",
  },
  link: {
    color: "var(--color-primary)",
    fontWeight: 600,
    transition: "color 0.15s ease",
  },
};
