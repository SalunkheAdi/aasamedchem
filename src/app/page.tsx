"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Activity,
  LogIn,
  UserPlus,
  LayoutDashboard,
  ShoppingCart,
  User,
  MessageSquare,
  ShieldCheck,
  Globe,
  Truck,
  Award,
  Mail,
  Phone,
} from "lucide-react";

// Custom AASAMEDCHEM Logo Icon Component
function LogoIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Deep blue chevron representing the 'A' shape */}
      <path
        d="M20 75 L45 20 L58 20 L80 75 L66 75 L52 40 L34 75 Z"
        fill="#1e40af"
      />
      {/* Light blue crossing curve / helix line */}
      <path
        d="M15 62 C35 48, 60 72, 85 52"
        stroke="#38bdf8"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Another matching curve */}
      <path
        d="M15 48 C35 34, 60 58, 85 38"
        stroke="#2563eb"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

// Custom DNA Helix Component
function DnaHelix() {
  const points = [];
  const N = 26;
  const r = (v: number) => parseFloat(v.toFixed(3));
  
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const cx = 50 + t * 500;
    const cy = 380 - t * 330 - Math.sin(t * Math.PI) * 40;
    
    const nx = 0.55;
    const ny = 0.83;
    
    const angle = t * Math.PI * 5;
    const offset = 35 * Math.sin(angle);
    
    points.push({
      x1: r(cx + nx * offset),
      y1: r(cy + ny * offset),
      x2: r(cx - nx * offset),
      y2: r(cy - ny * offset),
      opacity: r(0.15 + 0.85 * (Math.cos(angle) + 1) / 2),
    });
  }

  const path1 = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x1} ${p.y1}`).join(" ");
  const path2 = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x2} ${p.y2}`).join(" ");

  return (
    <svg viewBox="0 0 600 400" fill="none" style={styles.dnaSvg}>
      {points.map((p, idx) => (
        <line
          key={idx}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke="#60a5fa"
          strokeWidth="1.5"
          opacity={r(p.opacity * 0.4)}
        />
      ))}
      {points.map((p, idx) => (
        <g key={`joints-${idx}`}>
          <circle cx={p.x1} cy={p.y1} r="3" fill="#60a5fa" opacity={p.opacity} />
          <circle cx={p.x2} cy={p.y2} r="3" fill="#3b82f6" opacity={p.opacity} />
        </g>
      ))}
      <path d={path1} stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d={path2} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Authentication State
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Categories State
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Filters State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Check auth session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setSession(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setCheckingAuth(false));
  }, []);

  // Fetch unique categories on mount
  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const unique = ["All", ...new Set(data.map((p: any) => p.category))] as string[];
          setCategories(unique);
        }
      })
      .catch(console.error);
  }, []);

  const handleOrderRedirect = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleBrowseRedirect = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryParams = new URLSearchParams();
    if (search) queryParams.set("search", search);
    if (category !== "All") queryParams.set("category", category);

    if (session) {
      router.push(`/dashboard?${queryParams.toString()}`);
    } else {
      router.push(`/login?${queryParams.toString()}`);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 1. Header Section */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          {/* Logo */}
          <Link href="/" style={styles.logoLink}>
            <LogoIcon />
            <h1 style={styles.logoTitle}>
              AASA<span style={styles.logoMedChem}>MEDCHEM</span>
            </h1>
          </Link>

          {/* Navigation links */}
          <nav style={styles.nav}>
            <Link href="/" style={styles.navLinkActive}>Home</Link>
            <a href="#search-section" style={styles.navLink}>Search</a>
            <a href="#how-it-works-section" style={styles.navLink}>About Us</a>
            <a href="#contact-section" style={styles.navLink}>Contact Us</a>
          </nav>

          {/* Authentication buttons */}
          <div style={styles.authButtons}>
            {checkingAuth ? (
              <span style={styles.loadingText}>Syncing...</span>
            ) : session ? (
              <Link href="/dashboard" className="btn btn-primary" style={styles.dashboardBtn}>
                <LayoutDashboard size={16} />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-primary" style={styles.loginHeaderBtn}>
                  <LogIn size={15} />
                  <span>Log in</span>
                </Link>
                <Link href="/register" className="btn btn-secondary" style={styles.signUpHeaderBtn}>
                  <UserPlus size={15} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Search & Filter Bar */}
      <div id="search-section" style={styles.searchBarWrapper}>
        <form onSubmit={handleSearchSubmit} style={styles.searchBarContainer}>
          <div style={styles.searchBarBox}>
            <input
              type="text"
              placeholder="Search for excipients, compounds, reagents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchCircleBtn}>
              <Search size={18} color="#fff" />
            </button>
          </div>

          <div style={styles.categoryDropdownWrapper}>
            <span style={styles.filterByLabel}>Filter by category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
              style={styles.categorySelect}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* 3. Hero Layout Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroGrid}>
          {/* Left Column */}
          <div style={styles.heroLeftCol}>
            <h2 style={styles.heroTitle}>
              Efficient <br />
              Marketplace for <br />
              <span style={styles.heroHighlightText}>Pharmaceutical <br />raw Materials</span>
            </h2>
            <p style={styles.heroSubtitle}>
              Deal in high-quality APIs with shorter credit cycles, faster delivery and transparency through data driven analytics on your dashboard.
            </p>
            <div style={styles.heroActions}>
              <button onClick={handleBrowseRedirect} className="btn btn-primary" style={styles.browseBtn}>
                Browse Products
              </button>
              <button onClick={handleOrderRedirect} className="btn btn-secondary" style={styles.buyerSupplierBtn}>
                Be a Buyer or Supplier
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.heroRightCol}>
            <DnaHelix />
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works-section" style={styles.howItWorksSection}>
        <div style={styles.centerHeader}>
          <h2 style={styles.sectionHeading}>How It Works</h2>
          <p style={styles.sectionSubheading}>
            Four simple steps to get your pharmaceutical products from AasaMedChem
          </p>
        </div>

        <div style={styles.timelineWrapper}>
          {/* Central Line */}
          <div style={styles.centralLine}>
            <div style={{ ...styles.timelineDotOnLine, bottom: "0px", backgroundColor: "#cbd5e1", width: "12px", height: "12px", left: "-5px" }}></div>
          </div>

          {/* Row 1 */}
          <div style={styles.timelineRow}>
            {/* Left Col: Text */}
            <div style={styles.timelineLeftCol}>
              <div style={styles.stepHeaderRow}>
                <h3 style={styles.stepTitle}>Register Your Account</h3>
                <span style={styles.stepNumLarge}>01</span>
              </div>
              <p style={styles.stepText}>
                Create your business account with AasaMedChem. Quick verification process to ensure secure B2B transactions and access to our pharmaceutical product catalog.
              </p>
            </div>

            {/* Center Col: Icon Circle */}
            <div style={styles.timelineCenterCircle}>
              <User size={20} color="#fff" />
            </div>

            {/* Right Col: Card */}
            <div style={styles.timelineRightCol}>
              <div style={{ ...styles.illustrationCard, backgroundColor: "#eff6ff" }}>
                <div style={styles.innerCardWrapper}>
                  <div style={styles.userCardBox}>
                    <User size={38} color="#2563eb" style={{ opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div style={styles.timelineRow}>
            {/* Left Col: Text */}
            <div style={styles.timelineLeftCol}>
              <div style={styles.stepHeaderRow}>
                <h3 style={styles.stepTitle}>Search for Products</h3>
                <span style={styles.stepNumLarge}>02</span>
              </div>
              <p style={styles.stepText}>
                Browse our extensive catalog of pharmaceutical products. Use advanced filters to find exactly what you need - from APIs to finished formulations.
              </p>
            </div>

            {/* Center Col: Icon Circle */}
            <div style={styles.timelineCenterCircle}>
              <Search size={20} color="#fff" />
            </div>

            {/* Right Col: Card */}
            <div style={styles.timelineRightCol}>
              <div style={{ ...styles.illustrationCard, backgroundColor: "#faf5ff" }}>
                <div style={styles.innerCardWrapper}>
                  <div style={styles.searchCardBox}>
                    <Search size={22} color="#8b5cf6" style={{ margin: "0 0 10px 0", alignSelf: "flex-start" }} />
                    <div style={styles.placeholderLineLarge}></div>
                    <div style={styles.placeholderLineSmall}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div style={styles.timelineRow}>
            {/* Left Col: Text */}
            <div style={styles.timelineLeftCol}>
              <div style={styles.stepHeaderRow}>
                <h3 style={styles.stepTitle}>Make a Deal via Admin Chat</h3>
                <span style={styles.stepNumLarge}>03</span>
              </div>
              <p style={styles.stepText}>
                Connect directly with our admin team through real-time chat. Negotiate pricing, discuss specifications, and finalize your order details seamlessly.
              </p>
            </div>

            {/* Center Col: Icon Circle */}
            <div style={styles.timelineCenterCircle}>
              <MessageSquare size={20} color="#fff" />
            </div>

            {/* Right Col: Card */}
            <div style={styles.timelineRightCol}>
              <div style={{ ...styles.illustrationCard, backgroundColor: "#f0fdf4" }}>
                <div style={styles.innerCardWrapper}>
                  <div style={styles.chatCardBox}>
                    <div style={styles.chatIconWrapper}>
                      <MessageSquare size={22} color="#10b981" />
                    </div>
                    <div style={styles.chatMsgAdmin}>Admin message</div>
                    <div style={styles.chatMsgUser}>Your reply</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why Choose Our Marketplace Section */}
      <section style={styles.whyChooseSection}>
        <div style={styles.centerHeader}>
          <span style={styles.featureLabel}>FEATURE 8</span>
          <h2 style={styles.sectionHeading}>Why choose our marketplace</h2>
          <p style={styles.sectionSubheading}>
            We provide a secure, efficient platform for pharmaceutical businesses to source APIs.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          {/* Feature 1 */}
          <div style={styles.featureItem}>
            <div style={styles.featureIconBox}>
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <h4 style={styles.featureTitle}>Verified Suppliers</h4>
              <p style={styles.featureText}>
                All our suppliers undergo rigorous verification processes to ensure quality and reliability.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={styles.featureItem}>
            <div style={styles.featureIconBox}>
              <Globe size={20} color="#fff" />
            </div>
            <div>
              <h4 style={styles.featureTitle}>Global Sourcing</h4>
              <p style={styles.featureText}>
                Access pharmaceutical APIs from manufacturers across the globe with transparent pricing.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={styles.featureItem}>
            <div style={styles.featureIconBox}>
              <Truck size={20} color="#fff" />
            </div>
            <div>
              <h4 style={styles.featureTitle}>Fast Delivery</h4>
              <p style={styles.featureText}>
                Efficient logistics network ensures timely delivery of pharmaceutical ingredients.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={styles.featureItem}>
            <div style={styles.featureIconBox}>
              <Award size={20} color="#fff" />
            </div>
            <div>
              <h4 style={styles.featureTitle}>Quality Assurance</h4>
              <p style={styles.featureText}>
                Comprehensive quality documentation and certificates with every shipment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact-section" style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerLeft}>
            <h4 style={{ color: "#fff", marginBottom: "8px" }}>AasaMedChem Portal</h4>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Pharmaceutical raw material logistics and inventory catalog systems.</p>
          </div>
          <div style={styles.footerRight}>
            <div style={styles.contactItem}>
              <Mail size={14} color="#38bdf8" />
              <span>info@aasamedchem.com</span>
            </div>
            <div style={styles.contactItem}>
              <Phone size={14} color="#38bdf8" />
              <span>+91 22 2345 6789</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    width: "100%",
    background: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerContainer: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  logoTitle: {
    fontSize: "1.4rem",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#1e3a8a",
    margin: 0,
  },
  logoMedChem: {
    color: "#2563eb",
    fontWeight: 500,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },
  navLink: {
    color: "#475569",
    fontWeight: 600,
    fontSize: "0.95rem",
    textDecoration: "none",
    transition: "color 0.15s ease",
  },
  navLinkActive: {
    color: "#2563eb",
    fontWeight: 700,
    fontSize: "0.95rem",
    textDecoration: "none",
    borderBottom: "2px solid #2563eb",
    paddingBottom: "4px",
  },
  authButtons: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  loadingText: {
    fontSize: "0.85rem",
    color: "#64748b",
  },
  loginHeaderBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: "var(--radius-full)",
    padding: "10px 22px",
    fontSize: "0.88rem",
    fontWeight: 600,
  },
  signUpHeaderBtn: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    borderRadius: "var(--radius-full)",
    padding: "10px 22px",
    fontSize: "0.88rem",
    fontWeight: 600,
    border: "none",
  },
  dashboardBtn: {
    borderRadius: "var(--radius-full)",
    padding: "10px 22px",
  },
  searchBarWrapper: {
    width: "100%",
    padding: "24px 0",
    display: "flex",
    justifyContent: "center",
  },
  searchBarContainer: {
    width: "100%",
    maxWidth: "800px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    padding: "0 24px",
  },
  searchBarBox: {
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(37, 99, 235, 0.08)",
    borderRadius: "var(--radius-full)",
    border: "1px solid #e2e8f0",
  },
  searchInput: {
    width: "100%",
    padding: "16px 60px 16px 24px",
    borderRadius: "var(--radius-full)",
    border: "none",
    outline: "none",
    fontSize: "1rem",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  searchCircleBtn: {
    position: "absolute",
    right: "6px",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "50%",
    width: "46px",
    height: "46px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s ease",
  },
  categoryDropdownWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  filterByLabel: {
    fontSize: "0.88rem",
    color: "#64748b",
  },
  categorySelect: {
    padding: "8px 30px 8px 14px",
    fontSize: "0.85rem",
    borderColor: "#e2e8f0",
    borderRadius: "var(--radius-sm)",
  },
  heroSection: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "60px 24px 80px 24px",
    width: "100%",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "50px",
    alignItems: "center",
  },
  heroLeftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  heroTitle: {
    fontSize: "3.6rem",
    fontWeight: 900,
    lineHeight: "1.1",
    color: "#0f172a",
    letterSpacing: "-0.04em",
    margin: 0,
  },
  heroHighlightText: {
    color: "#2563eb",
  },
  heroSubtitle: {
    fontSize: "1.1rem",
    color: "#475569",
    lineHeight: "1.6",
    maxWidth: "500px",
    margin: 0,
  },
  heroRightCol: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dnaSvg: {
    width: "100%",
    maxWidth: "500px",
    height: "auto",
  },
  heroActions: {
    display: "flex",
    gap: "16px",
    marginTop: "10px",
  },
  browseBtn: {
    padding: "14px 28px",
    fontSize: "0.95rem",
    borderRadius: "8px",
  },
  buyerSupplierBtn: {
    padding: "14px 28px",
    fontSize: "0.95rem",
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    border: "none",
  },
  howItWorksSection: {
    maxWidth: "1400px",
    margin: "80px auto",
    padding: "0 24px",
    width: "100%",
  },
  centerHeader: {
    textAlign: "center",
    marginBottom: "50px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  sectionHeading: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionSubheading: {
    fontSize: "1.05rem",
    color: "#64748b",
    maxWidth: "600px",
    lineHeight: "1.5",
  },
  timelineWrapper: {
    position: "relative",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 0",
  },
  centralLine: {
    position: "absolute",
    left: "50%",
    top: "10px",
    bottom: "10px",
    width: "2px",
    background: "linear-gradient(to bottom, #2563eb 0%, #8b5cf6 33.3%, #f97316 66.6%, #cbd5e1 100%)",
    transform: "translateX(-50%)",
  },
  timelineDotOnLine: {
    position: "absolute",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    left: "-5px",
  },
  timelineRow: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    marginBottom: "80px",
  },
  timelineLeftCol: {
    width: "42%",
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  timelineRightCol: {
    width: "42%",
    display: "flex",
    justifyContent: "flex-start",
  },
  timelineCenterCircle: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(37,99,235,0.2)",
    zIndex: 2,
  },
  stepHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "flex-end",
  },
  stepTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  stepNumLarge: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "#cbd5e1",
    lineHeight: 1,
    opacity: 0.7,
  },
  stepText: {
    fontSize: "0.95rem",
    color: "#475569",
    lineHeight: "1.6",
    maxWidth: "480px",
  },
  illustrationsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  illustrationCard: {
    borderRadius: "var(--radius-lg)",
    padding: "16px",
    height: "120px",
    width: "240px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(15,23,42,0.02)",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.03)",
  },
  innerCardWrapper: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userCardBox: {
    width: "90px",
    height: "70px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    border: "1px solid rgba(15, 23, 42, 0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  searchCardBox: {
    width: "180px",
    height: "65px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    border: "1px solid rgba(15, 23, 42, 0.03)",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  placeholderLineLarge: {
    height: "4px",
    backgroundColor: "#8b5cf6",
    opacity: 0.15,
    borderRadius: "2px",
    width: "90%",
    marginBottom: "5px",
  },
  placeholderLineSmall: {
    height: "4px",
    backgroundColor: "#8b5cf6",
    opacity: 0.15,
    borderRadius: "2px",
    width: "60%",
  },
  chatCardBox: {
    width: "180px",
    height: "75px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    border: "1px solid rgba(15, 23, 42, 0.03)",
    padding: "8px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  chatIconWrapper: {
    position: "absolute",
    left: "8px",
    top: "8px",
  },
  chatMsgAdmin: {
    fontSize: "0.68rem",
    backgroundColor: "#f0fdf4",
    color: "#10b981",
    padding: "3px 8px",
    borderRadius: "6px",
    alignSelf: "flex-start",
    marginLeft: "24px",
    fontWeight: 600,
  },
  chatMsgUser: {
    fontSize: "0.68rem",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "3px 8px",
    borderRadius: "6px",
    alignSelf: "flex-end",
    fontWeight: 600,
  },
  whyChooseSection: {
    maxWidth: "1400px",
    margin: "80px auto",
    padding: "0 24px",
    width: "100%",
  },
  featureLabel: {
    fontSize: "0.78rem",
    fontWeight: 800,
    color: "#2563eb",
    letterSpacing: "0.15em",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    columnGap: "80px",
    rowGap: "40px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  featureItem: {
    display: "flex",
    gap: "20px",
  },
  featureIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(37,99,235,0.2)",
  },
  featureTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "6px",
  },
  featureText: {
    fontSize: "0.88rem",
    color: "#475569",
    lineHeight: "1.5",
  },
  catalogSection: {
    maxWidth: "1400px",
    margin: "0 auto 60px auto",
    padding: "40px 30px",
    backgroundColor: "#f8fafc",
  },
  catalogHeader: {
    marginBottom: "30px",
  },
  catalogTitle: {
    fontSize: "1.4rem",
    fontWeight: 800,
    marginBottom: "6px",
  },
  catalogDesc: {
    color: "#64748b",
    fontSize: "0.9rem",
    lineHeight: "1.5",
  },
  catalogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },
  catalogCard: {
    padding: "24px",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e2e8f0",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  cardSku: {
    fontSize: "0.75rem",
    fontFamily: "monospace",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  cardCat: {
    fontSize: "0.75rem",
    color: "#2563eb",
    background: "#eff6ff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: 600,
  },
  cardName: {
    fontSize: "1.08rem",
    fontWeight: 700,
    marginBottom: "8px",
  },
  cardDesc: {
    fontSize: "0.85rem",
    color: "#64748b",
    lineHeight: "1.4",
    marginBottom: "20px",
    flex: 1,
  },
  cardPricingInfo: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid #edf2f7",
  },
  pricingRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  cardPriceLabel: {
    color: "#64748b",
  },
  cardPriceVal: {
    fontWeight: 700,
    color: "#2563eb",
  },
  cardPriceUnit: {
    color: "#64748b",
  },
  cardStockVal: {
    fontWeight: 600,
    color: "#1e293b",
  },
  orderBtn: {
    width: "100%",
    padding: "10px",
  },
  loader: {
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
  },
  emptyCatalog: {
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
  },
  footer: {
    backgroundColor: "#0f172a",
    padding: "40px 0",
    marginTop: "auto",
  },
  footerContainer: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  footerLeft: {
    display: "flex",
    flexDirection: "column",
  },
  footerRight: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#cbd5e1",
    fontSize: "0.85rem",
  },
};
