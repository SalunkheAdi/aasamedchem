"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ShieldAlert, ArrowRight, Activity } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SELLER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
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
          <Activity size={36} color="var(--color-secondary)" />
          <h1 className="gradient-text-alt" style={styles.title}>Join AasaMedChem</h1>
        </div>
        <p style={styles.subtitle}>Register Inventory & Order Portal Account</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.icon} />
              <input
                type="text"
                className="form-input"
                style={styles.input}
                placeholder="choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.icon} />
              <input
                type="email"
                className="form-input"
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={styles.inputWrapper}>
              <ShieldAlert size={18} style={styles.icon} />
              <select
                className="form-select"
                style={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <option value="SELLER">Seller / Standard User</option>
                <option value="ADMIN">Admin / Manager</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ ...styles.submitBtn, background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)" }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register Now"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Already have an account?</span>{" "}
          <Link href="/" style={styles.link}>
            Sign In
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
    fontSize: "1.8rem",
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
  select: {
    width: "100%",
    paddingLeft: "45px",
  },
  submitBtn: {
    marginTop: "20px",
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
    color: "var(--color-secondary)",
    fontWeight: 600,
    transition: "color 0.15s ease",
  },
};
