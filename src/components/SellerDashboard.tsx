"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  History,
  User,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Package,
  Layers,
  FileText,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { UNIT_CONFIG } from "@/utils/unitConverter";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  dimension: "WEIGHT" | "VOLUME" | "COUNT";
  baseUnit: string;
  stock: string; // Decimal representation from API
  price: string; // Decimal representation from API
  priceUnit: string;
}

interface CartItem {
  product: Product;
  quantity: string;
  unit: string;
  calculatedPrice: number;
}

interface OrderItem {
  id: string;
  productId: string;
  orderedQuantity: string;
  orderedUnit: string;
  baseQuantity: string;
  pricePerUnit: string;
  priceUnit: string;
  subtotal: string;
  product: {
    name: string;
    sku: string;
    dimension: string;
    baseUnit: string;
  };
}

interface Order {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function SellerDashboard({ user }: { user: SessionUser }) {
  const router = useRouter();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dimension, setDimension] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Get units for a product's dimension
  const getSupportedUnits = (dim: "WEIGHT" | "VOLUME" | "COUNT") => {
    return Object.entries(UNIT_CONFIG)
      .filter(([_, info]) => (info as any).dimension === dim)
      .map(([code]) => code);
  };

  // Convert unit & calculate subtotal on client side
  const calculateClientSubtotal = useCallback((
    qtyStr: string,
    orderedUnit: string,
    priceStr: string,
    priceUnit: string
  ): number => {
    const qty = parseFloat(qtyStr);
    const price = parseFloat(priceStr);
    if (isNaN(qty) || isNaN(price) || qty <= 0) return 0;

    const orderedFactor = UNIT_CONFIG[orderedUnit] ? UNIT_CONFIG[orderedUnit].factor.toNumber() : 1;
    const priceFactor = UNIT_CONFIG[priceUnit] ? UNIT_CONFIG[priceUnit].factor.toNumber() : 1;

    // quantity in base units = qty * orderedFactor
    const qtyInBase = qty * orderedFactor;
    // quantity in price units = qtyInBase / priceFactor
    const qtyInPriceUnit = qtyInBase / priceFactor;

    return qtyInPriceUnit * price;
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (category !== "All") queryParams.set("category", category);
      if (dimension !== "All") queryParams.set("dimension", dimension);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);

      // Extract unique categories for filter
      if (category === "All" && !search && dimension === "All") {
        const uniqueCategories = ["All", ...new Set(data.map((p: Product) => p.category))] as string[];
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  }, [search, category, dimension]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrderHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Cart Handlers
  const addToCart = (product: Product) => {
    const exists = cart.find((item) => item.product.id === product.id);
    if (exists) return;

    // Use priceUnit as the initial ordered unit
    const initialUnit = product.priceUnit;
    const initialQty = "1";
    const subtotal = calculateClientSubtotal(initialQty, initialUnit, product.price, product.priceUnit);

    setCart([...cart, { product, quantity: initialQty, unit: initialUnit, calculatedPrice: subtotal }]);
  };

  const updateCartQty = (productId: string, quantityStr: string) => {
    // allow typing decimals or empty string temporarily
    if (quantityStr !== "" && isNaN(parseFloat(quantityStr))) return;

    setCart(
      cart.map((item) => {
        if (item.product.id !== productId) return item;
        const subtotal = calculateClientSubtotal(quantityStr, item.unit, item.product.price, item.product.priceUnit);
        return { ...item, quantity: quantityStr, calculatedPrice: subtotal };
      })
    );
  };

  const updateCartUnit = (productId: string, unit: string) => {
    setCart(
      cart.map((item) => {
        if (item.product.id !== productId) return item;
        const subtotal = calculateClientSubtotal(item.quantity, unit, item.product.price, item.product.priceUnit);
        return { ...item, unit, calculatedPrice: subtotal };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.calculatedPrice, 0);

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Check if any cart item has invalid quantities
    const invalidItems = cart.some((item) => {
      const val = parseFloat(item.quantity);
      return isNaN(val) || val <= 0;
    });

    if (invalidItems) {
      setErrorMessage("Please enter a valid quantity greater than 0 for all items");
      return;
    }

    setPlacingOrder(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          items: cart.map((item) => ({
            productId: item.product.id,
            orderedQuantity: item.quantity,
            orderedUnit: item.unit,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setSuccessMessage("Your quotation/order has been placed successfully and is pending admin review.");
      setCart([]);
      setNotes("");
      fetchOrders();
      fetchProducts(); // Refresh products in case stock updates (though stock deducts on approval, always good to sync)
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong placing the order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.headerLeft}>
          <Layers size={24} color="var(--color-primary)" />
          <h2 style={styles.logoText}>
            AasaMedChem <span style={styles.roleTag}>Seller Portal</span>
          </h2>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <User size={16} />
            <span>{user.username}</span>
            <span style={styles.emailText}>({user.email})</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main style={styles.mainGrid}>
        {/* Left Side: Product Browser */}
        <section style={styles.leftCol}>
          <div className="glass-panel" style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Product Catalog</h3>
            <p style={styles.sectionDesc}>Search medicinal components and select for quotation</p>

            {/* Search & Filters */}
            <div style={styles.filterRow}>
              <div style={styles.searchBox}>
                <Search size={18} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search name, SKU, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.selectsWrapper}>
                <div style={styles.filterGroup}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                    style={styles.filterSelect}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "All" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <select
                    value={dimension}
                    onChange={(e) => setDimension(e.target.value)}
                    className="form-select"
                    style={styles.filterSelect}
                  >
                    <option value="All">All Dimensions</option>
                    <option value="WEIGHT">Weight</option>
                    <option value="VOLUME">Volume</option>
                    <option value="COUNT">Count</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div style={styles.productGrid}>
            {loadingProducts ? (
              <div style={styles.loader}>Loading products...</div>
            ) : products.length === 0 ? (
              <div style={styles.noData}>No products found matching filters.</div>
            ) : (
              products.map((product) => {
                const inCart = cart.some((item) => item.product.id === product.id);
                return (
                  <div key={product.id} className="glass-panel" style={styles.productCard}>
                    <div style={styles.productCardHeader}>
                      <span style={styles.skuBadge}>{product.sku}</span>
                      <span style={styles.categoryBadge}>{product.category}</span>
                    </div>
                    <h4 style={styles.productName}>{product.name}</h4>
                    <p style={styles.productDesc}>
                      {product.description || "No description provided."}
                    </p>

                    <div style={styles.productPricingDetails}>
                      <div>
                        <span style={styles.labelTitle}>Base Price:</span>{" "}
                        <span style={styles.priceHighlight}>
                          ₹{parseFloat(product.price).toFixed(2)}
                        </span>{" "}
                        <span style={styles.priceUnitHighlight}>/ {product.priceUnit}</span>
                      </div>
                      <div style={styles.stockDetails}>
                        <span style={styles.labelTitle}>Available Stock:</span>{" "}
                        <span>
                          {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                        </span>
                      </div>
                    </div>

                    <button
                      className={`btn ${inCart ? "btn-secondary" : "btn-primary"}`}
                      onClick={() => addToCart(product)}
                      disabled={inCart || parseFloat(product.stock) <= 0}
                      style={styles.addToCartBtn}
                    >
                      <Plus size={16} />
                      {parseFloat(product.stock) <= 0 ? "Out of Stock" : inCart ? "Added to Cart" : "Add to Order"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Side: Order Creator & Cart */}
        <section style={styles.rightCol}>
          <div className="glass-panel" style={styles.cartCard}>
            <div style={styles.cartHeader}>
              <div style={styles.cartHeaderTitle}>
                <ShoppingCart size={20} color="var(--color-primary)" />
                <h3>Quotation Cart</h3>
              </div>
              <span style={styles.cartCount}>{cart.length} item(s)</span>
            </div>

            {successMessage && <div style={styles.successAlert}>{successMessage}</div>}
            {errorMessage && <div style={styles.errorAlert}>{errorMessage}</div>}

            {cart.length === 0 ? (
              <div style={styles.emptyCart}>
                <ShoppingCart size={48} style={styles.emptyCartIcon} />
                <p>Your cart is empty.</p>
                <p style={styles.emptyCartSub}>Select products from the catalog to build a quotation.</p>
              </div>
            ) : (
              <>
                <div style={styles.cartItemsList}>
                  {cart.map((item) => (
                    <div key={item.product.id} style={styles.cartItem}>
                      <div style={styles.cartItemMeta}>
                        <div style={styles.cartItemNameWrapper}>
                          <h4 style={styles.cartItemName}>{item.product.name}</h4>
                          <span style={styles.cartItemSku}>{item.product.sku}</span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          style={styles.removeBtn}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Flex Unit Input Panel */}
                      <div style={styles.cartItemCalculationRow}>
                        <div style={styles.qtyInputBox}>
                          <label style={styles.miniLabel}>Quantity</label>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(item.product.id, e.target.value)}
                            style={styles.cartQtyInput}
                            placeholder="0.00"
                          />
                        </div>

                        <div style={styles.unitSelectBox}>
                          <label style={styles.miniLabel}>Unit</label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateCartUnit(item.product.id, e.target.value)}
                            style={styles.cartUnitSelect}
                          >
                            {getSupportedUnits(item.product.dimension).map((code) => (
                              <option key={code} value={code}>
                                {code}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.itemMathPreview}>
                          <div style={styles.itemMathLabel}>
                            <Calculator size={12} />
                            <span>Live Pricing Conversion</span>
                          </div>
                          <div style={styles.itemMathFormula}>
                            {item.quantity || "0"} {item.unit} @ ₹
                            {parseFloat(item.product.price).toFixed(2)}/{item.product.priceUnit}
                          </div>
                          <div style={styles.itemSubtotal}>
                            ₹{item.calculatedPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes & Submission */}
                <div style={styles.cartFooter}>
                  <div className="form-group" style={{ marginBottom: "15px" }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Order Notes / Instructions</label>
                    <textarea
                      placeholder="Add any specific requirements, delivery notes or chemical purity requirements..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={styles.notesTextarea}
                    />
                  </div>

                  <div style={styles.cartSummary}>
                    <span style={styles.totalLabel}>Total Amount:</span>
                    <span style={styles.totalValue}>
                      ₹
                      {cartTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    style={styles.placeOrderBtn}
                  >
                    {placingOrder ? "Placing Order..." : "Submit Quotation / Order"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Order History */}
      <section style={styles.historySection} className="glass-panel">
        <div style={styles.historyHeader}>
          <History size={20} color="var(--color-secondary)" />
          <h3>My Quotations & Orders History</h3>
        </div>

        {loadingOrders ? (
          <div style={styles.loader}>Loading order history...</div>
        ) : orderHistory.length === 0 ? (
          <div style={styles.emptyHistory}>No orders placed yet.</div>
        ) : (
          <div style={styles.historyTableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Order ID / Date</th>
                  <th style={styles.th}>Products Ordered</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Notes</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map((order) => (
                  <tr key={order.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.orderIdText}>{order.id.slice(0, 8)}...</div>
                      <div style={styles.orderDateText}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.orderProductsList}>
                        {order.items.map((item) => (
                          <div key={item.id} style={styles.orderProductItem}>
                            <strong>{item.product.name}</strong> -{" "}
                            {parseFloat(item.orderedQuantity).toString()} {item.orderedUnit}
                            {" "}
                            <span style={styles.priceConversionExplain}>
                              (Converted: {parseFloat(item.baseQuantity).toFixed(2)} {item.product.baseUnit} | Rate: ₹{parseFloat(item.pricePerUnit).toFixed(2)}/{item.priceUnit})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span
                        className={`badge ${
                          order.status === "PENDING"
                            ? "badge-pending"
                            : order.status === "APPROVED"
                            ? "badge-approved"
                            : "badge-rejected"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.notesText}>{order.notes || "—"}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                      ₹{parseFloat(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dashboardContainer: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  header: {
    padding: "20px 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoText: {
    fontSize: "1.4rem",
    fontWeight: 800,
    margin: 0,
  },
  roleTag: {
    fontSize: "0.8rem",
    fontWeight: 600,
    background: "var(--color-primary-glow)",
    color: "var(--color-primary)",
    padding: "3px 8px",
    borderRadius: "6px",
    marginLeft: "10px",
    verticalAlign: "middle",
    textTransform: "uppercase",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "var(--text-main)",
  },
  emailText: {
    color: "var(--text-muted)",
    fontSize: "0.8rem",
  },
  logoutBtn: {
    padding: "8px 16px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 450px",
    gap: "30px",
    alignItems: "start",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sectionHeader: {
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    marginBottom: "4px",
  },
  sectionDesc: {
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    marginBottom: "20px",
  },
  filterRow: {
    display: "flex",
    flexDirection: "row",
    gap: "15px",
    width: "100%",
  },
  searchBox: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-dim)",
  },
  searchInput: {
    width: "100%",
    background: "rgba(17, 24, 39, 0.4)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-sm)",
    color: "#ffffff",
    padding: "10px 15px 10px 42px",
    fontSize: "0.9rem",
    outline: "none",
  },
  selectsWrapper: {
    display: "flex",
    gap: "10px",
  },
  filterGroup: {
    width: "160px",
  },
  filterSelect: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "0.88rem",
    background: "rgba(17, 24, 39, 0.4)",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  productCard: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  productCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  skuBadge: {
    fontSize: "0.75rem",
    background: "rgba(255,255,255,0.06)",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "var(--text-muted)",
    fontFamily: "monospace",
  },
  categoryBadge: {
    fontSize: "0.75rem",
    background: "rgba(6, 182, 212, 0.1)",
    color: "var(--color-primary)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  productName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "8px",
  },
  productDesc: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    lineHeight: "1.4",
    marginBottom: "20px",
    flex: 1,
  },
  productPricingDetails: {
    background: "rgba(255, 255, 255, 0.02)",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    fontSize: "0.85rem",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  labelTitle: {
    color: "var(--text-dim)",
  },
  priceHighlight: {
    fontWeight: 700,
    color: "var(--color-primary)",
    fontSize: "1rem",
  },
  priceUnitHighlight: {
    color: "var(--text-muted)",
    fontSize: "0.8rem",
  },
  stockDetails: {
    color: "var(--text-main)",
  },
  addToCartBtn: {
    width: "100%",
    padding: "10px",
  },
  rightCol: {
    position: "sticky",
    top: "30px",
  },
  cartCard: {
    padding: "30px 24px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
  },
  cartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "15px",
  },
  cartHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  cartCount: {
    fontSize: "0.8rem",
    background: "var(--color-primary-glow)",
    color: "var(--color-primary)",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    fontWeight: 700,
  },
  emptyCart: {
    padding: "50px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "var(--text-muted)",
    gap: "12px",
  },
  emptyCartIcon: {
    color: "var(--text-dim)",
    opacity: 0.3,
  },
  emptyCartSub: {
    fontSize: "0.8rem",
  },
  cartItemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "25px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  cartItem: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "16px",
  },
  cartItemMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  cartItemNameWrapper: {
    display: "flex",
    flexDirection: "column",
  },
  cartItemName: {
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  cartItemSku: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    color: "var(--text-dim)",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    cursor: "pointer",
    transition: "color 0.15s ease",
    padding: "4px",
  },
  cartItemCalculationRow: {
    display: "grid",
    gridTemplateColumns: "100px 100px 1fr",
    gap: "12px",
    alignItems: "start",
  },
  qtyInputBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  miniLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "var(--text-dim)",
    letterSpacing: "0.03em",
  },
  cartQtyInput: {
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid var(--border-color)",
    color: "#fff",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    width: "100%",
    outline: "none",
  },
  unitSelectBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  cartUnitSelect: {
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid var(--border-color)",
    color: "#fff",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    width: "100%",
    outline: "none",
    cursor: "pointer",
  },
  itemMathPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    textAlign: "right",
    height: "100%",
    justifyContent: "center",
  },
  itemMathLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.65rem",
    color: "var(--text-dim)",
    textTransform: "uppercase",
  },
  itemMathFormula: {
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    fontFamily: "monospace",
    marginTop: "2px",
  },
  itemSubtotal: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--color-primary)",
    marginTop: "4px",
  },
  cartFooter: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "20px",
  },
  notesTextarea: {
    width: "100%",
    height: "80px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-sm)",
    color: "#fff",
    padding: "10px",
    fontSize: "0.85rem",
    outline: "none",
    resize: "none",
  },
  cartSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  totalLabel: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#fff",
  },
  totalValue: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--color-primary)",
    textShadow: "0 0 15px var(--color-primary-glow)",
  },
  placeOrderBtn: {
    width: "100%",
    padding: "12px",
  },
  successAlert: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid var(--color-success)",
    color: "#a7f3d0",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
    marginBottom: "15px",
    textAlign: "center",
  },
  errorAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid var(--color-error)",
    color: "#fca5a5",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
    marginBottom: "15px",
    textAlign: "center",
  },
  historySection: {
    padding: "30px 24px",
  },
  historyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  emptyHistory: {
    padding: "30px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  },
  historyTableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeaderRow: {
    borderBottom: "2px solid var(--border-color)",
  },
  th: {
    padding: "12px 16px",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
    fontWeight: 700,
  },
  tableRow: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background-color 0.15s ease",
  },
  td: {
    padding: "16px",
    verticalAlign: "middle",
  },
  orderIdText: {
    fontFamily: "monospace",
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  orderDateText: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    marginTop: "2px",
  },
  orderProductsList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  orderProductItem: {
    fontSize: "0.85rem",
  },
  priceConversionExplain: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
  },
  notesText: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  loader: {
    padding: "40px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  noData: {
    padding: "40px",
    textAlign: "center",
    color: "var(--text-muted)",
    gridColumn: "1 / -1",
  },
};
