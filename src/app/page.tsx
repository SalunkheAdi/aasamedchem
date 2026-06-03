"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Activity, LogIn, UserPlus, LayoutDashboard, ShoppingCart, Info, Mail, Phone, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  dimension: string;
  baseUnit: string;
  stock: string;
  price: string;
  priceUnit: string;
}

// Custom DNA Helix Component utilizing mathematical sine-wave rendering
function DnaHelix() {
  const points = [];
  const N = 26;
  
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Curves from bottom-left (50, 380) to top-right (550, 50)
    const cx = 50 + t * 500;
    const cy = 380 - t * 330 - Math.sin(t * Math.PI) * 40; // organic curve upward
    
    // Normal vector pointing perpendicular to the curve
    const nx = 0.55;
    const ny = 0.83;
    
    const angle = t * Math.PI * 5; // 2.5 full cycles
    const offset = 35 * Math.sin(angle); // Amplitude of 35px
    
    points.push({
      x1: cx + nx * offset,
      y1: cy + ny * offset,
      x2: cx - nx * offset,
      y2: cy - ny * offset,
      opacity: 0.15 + 0.85 * (Math.cos(angle) + 1) / 2, // depth fading
    });
  }

  // Build svg path string for both backbones
  const path1 = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x1} ${p.y1}`).join(" ");
  const path2 = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x2} ${p.y2}`).join(" ");

  return (
    <svg viewBox="0 0 600 400" fill="none" style={styles.dnaSvg}>
      {/* Rungs (cross-connections) */}
      {points.map((p, idx) => (
        <line
          key={idx}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke="#2563eb"
          strokeWidth="1.5"
          opacity={p.opacity * 0.4}
        />
      ))}
      
      {/* Rung connection joints */}
      {points.map((p, idx) => (
        <g key={`joints-${idx}`}>
          <circle cx={p.x1} cy={p.y1} r="3" fill="#2563eb" opacity={p.opacity} />
          <circle cx={p.x2} cy={p.y2} r="3" fill="#1e40af" opacity={p.opacity} />
        </g>
      ))}

      {/* Main double strand backbones */}
      <path d={path1} stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d={path2} stroke="#1e40af" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Authentication State
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (category !== "All") queryParams.set("category", category);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);

      // Extract unique categories for filter
      if (category === "All" && !search) {
        const unique = ["All", ...new Set(data.map((p: Product) => p.category))] as string[];
        setCategories(unique);
      }
    } catch (error) {
      console.error("Error fetching products on landing:", error);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOrderRedirect = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      alert("Please Log In or Sign Up to configure quotations and place orders.");
      router.push("/login");
    }
  };

  const handleBrowseScroll = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 1. Header Section */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          {/* Logo */}
          <Link href="/" style={styles.logoLink}>
            <Activity size={28} color="#2563eb" />
            <h1 style={styles.logoTitle}>
              AASA<span style={styles.logoMedChem}>MEDCHEM</span>
            </h1>
          </Link>

          {/* Navigation links */}
          <nav style={styles.nav}>
            <Link href="/" style={styles.navLinkActive}>Home</Link>
            <a href="#catalog-section" style={styles.navLink}>Search</a>
            <a href="#about-section" style={styles.navLink}>About Us</a>
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
      <div style={styles.searchBarWrapper}>
        <div style={styles.searchBarContainer}>
          <div style={styles.searchBarBox}>
            <input
              type="text"
              placeholder="Search for excipients, compounds, reagents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <button onClick={fetchProducts} style={styles.searchCircleBtn}>
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
        </div>
      </div>

      {/* 3. Hero Layout Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroGrid}>
          {/* Left Column Text details */}
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
              <button onClick={handleBrowseScroll} className="btn btn-primary" style={styles.browseBtn}>
                Browse Products
              </button>
              <button onClick={handleOrderRedirect} className="btn btn-secondary" style={styles.buyerSupplierBtn}>
                Be a Buyer or Supplier
              </button>
            </div>
          </div>

          {/* Right Column: Mathematical DNA Graphic */}
          <div style={styles.heroRightCol}>
            <DnaHelix />
          </div>
        </div>
      </section>

      {/* 4. Chemical Catalog List Section (Search & Filter results) */}
      <section id="catalog-section" style={styles.catalogSection} className="glass-panel">
        <div style={styles.catalogHeader}>
          <h3 style={styles.catalogTitle}>Medicinal & Chemical Inventory</h3>
          <p style={styles.catalogDesc}>Browse our active stock lists. Log in to place quotations and configure custom weight/volume parameters.</p>
        </div>

        {loading ? (
          <div style={styles.loader}>Searching active inventories...</div>
        ) : products.length === 0 ? (
          <div style={styles.emptyCatalog}>
            <p>No chemicals matching "{search}" were found.</p>
          </div>
        ) : (
          <div style={styles.catalogGrid}>
            {products.map((product) => (
              <div key={product.id} style={styles.catalogCard} className="glass-panel">
                <div style={styles.cardHeaderRow}>
                  <span style={styles.cardSku}>{product.sku}</span>
                  <span style={styles.cardCat}>{product.category}</span>
                </div>
                <h4 style={styles.cardName}>{product.name}</h4>
                <p style={styles.cardDesc}>{product.description || "API/excipient compound details available on order sheet."}</p>
                
                <div style={styles.cardPricingInfo}>
                  <div style={styles.pricingRow}>
                    <span style={styles.cardPriceLabel}>Rate / Base Price:</span>
                    <span style={styles.cardPriceVal}>₹{parseFloat(product.price).toFixed(2)}</span>
                    <span style={styles.cardPriceUnit}> / {product.priceUnit}</span>
                  </div>
                  <div style={styles.pricingRow}>
                    <span style={styles.cardPriceLabel}>Available Stock:</span>
                    <span style={styles.cardStockVal}>
                      {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                    </span>
                  </div>
                </div>

                <button onClick={handleOrderRedirect} className="btn btn-primary" style={styles.orderBtn}>
                  <ShoppingCart size={15} />
                  <span>Request Quote</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about-section" style={styles.infoSection}>
        <div style={styles.infoGrid}>
          <div className="glass-panel" style={styles.infoCard}>
            <Info size={28} color="#2563eb" style={{ marginBottom: "15px" }} />
            <h4>High Purity Quality Control</h4>
            <p>All compounds and excipients are sourced from verified manufacturers under strict pharmaceutical compliance. Full batch reports, certifications, and high-precision weights are recorded directly in our systems.</p>
          </div>
          <div className="glass-panel" style={styles.infoCard}>
            <Activity size={28} color="#2563eb" style={{ marginBottom: "15px" }} />
            <p style={{ display: "none" }}></p>
            <h4>Optimized Credit & Dispatch</h4>
            <p>Admin dashboards facilitate seamless quotation reviews. Approved orders trigger instant warehouse stock deductions to ensure real-time precision and zero double-allocation of critical chemical materials.</p>
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
    padding: "40px 24px 80px 24px",
    width: "100%",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "40px",
    alignItems: "center",
  },
  heroLeftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  heroTitle: {
    fontSize: "3.2rem",
    fontWeight: 800,
    lineHeight: "1.15",
    color: "#0f172a",
    letterSpacing: "-0.04em",
  },
  heroHighlightText: {
    color: "#2563eb",
  },
  heroSubtitle: {
    fontSize: "1.12rem",
    color: "#475569",
    lineHeight: "1.6",
    maxWidth: "500px",
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
  heroRightCol: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dnaSvg: {
    width: "100%",
    maxWidth: "550px",
    height: "auto",
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
  infoSection: {
    maxWidth: "1400px",
    margin: "0 auto 60px auto",
    padding: "0 24px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  },
  infoCard: {
    padding: "30px",
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
