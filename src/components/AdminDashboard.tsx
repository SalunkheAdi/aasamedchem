"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  LogOut,
  ChevronDown,
  Layers,
  Calculator,
  RefreshCw,
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
  stock: string;
  price: string;
  priceUnit: string;
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
  userId: string;
  user: {
    username: string;
    email: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminDashboard({ user }: { user: SessionUser }) {
  const router = useRouter();

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // UI view controls
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [pName, setPName] = useState("");
  const [pSku, setPSku] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState("General");
  const [pDimension, setPDimension] = useState<"WEIGHT" | "VOLUME" | "COUNT">("WEIGHT");
  const [pBaseUnit, setPBaseUnit] = useState("g");
  const [pStock, setPStock] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pPriceUnit, setPPriceUnit] = useState("kg");

  // Loaders / Alerts
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks order actions
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Get units list for a dimension
  const getUnitsForDimension = (dim: "WEIGHT" | "VOLUME" | "COUNT") => {
    return Object.entries(UNIT_CONFIG)
      .filter(([_, info]) => (info as any).dimension === dim)
      .map(([code]) => code);
  };

  // Sync unit configurations when dimension changes
  useEffect(() => {
    if (pDimension === "WEIGHT") {
      setPBaseUnit("g");
      setPPriceUnit("kg");
    } else if (pDimension === "VOLUME") {
      setPBaseUnit("mL");
      setPPriceUnit("L");
    } else {
      setPBaseUnit("items");
      setPPriceUnit("items");
    }
  }, [pDimension]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load inventory");
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load orders");
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    await Promise.all([fetchProducts(), fetchOrders()]);
    setLoading(false);
  }, [fetchProducts, fetchOrders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Edit click
  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setPName(product.name);
    setPSku(product.sku);
    setPDesc(product.description || "");
    setPCategory(product.category);
    setPDimension(product.dimension);
    setPBaseUnit(product.baseUnit);
    setPStock(parseFloat(product.stock).toString());
    setPPrice(parseFloat(product.price).toString());
    setPPriceUnit(product.priceUnit);
    setShowProductForm(true);
  };

  // Clear Form
  const resetForm = () => {
    setEditingProductId(null);
    setPName("");
    setPSku("");
    setPDesc("");
    setPCategory("General");
    setPDimension("WEIGHT");
    setPBaseUnit("g");
    setPStock("");
    setPPrice("");
    setPPriceUnit("kg");
    setShowProductForm(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Submit product create/update
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pName || !pSku || pStock === "" || pPrice === "") {
      setErrorMsg("Please fill in all required fields");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const payload = {
      name: pName,
      sku: pSku,
      description: pDesc,
      category: pCategory,
      dimension: pDimension,
      baseUnit: pBaseUnit,
      stock: pStock,
      price: pPrice,
      priceUnit: pPriceUnit,
    };

    try {
      let res;
      if (editingProductId) {
        // Edit product
        res = await fetch(`/api/products/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new product
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      setSuccessMsg(editingProductId ? "Product updated successfully!" : "Product created successfully!");
      resetForm();
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process product submit");
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product from inventory?")) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      setSuccessMsg("Product deleted successfully!");
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // Process order status (APPROVE / REJECT)
  const handleOrderStatus = async (orderId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(orderId + "-" + status);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific stock error details
        const msg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Failed to update order status";
        throw new Error(msg);
      }

      setSuccessMsg(`Order ${status === "APPROVED" ? "approved" : "rejected"} successfully!`);
      fetchOrders();
      fetchProducts(); // Refresh products to reflect stock updates!
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong processing order");
    } finally {
      setActionLoading(null);
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
          <Layers size={24} color="var(--color-secondary)" />
          <h2 style={styles.logoText}>
            AasaMedChem <span style={styles.roleTag}>Admin Portal</span>
          </h2>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <User size={16} />
            <span>Admin ({user.username})</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div style={styles.overviewRow}>
        <div className="glass-panel" style={styles.overviewCard}>
          <Package size={24} color="var(--color-primary)" />
          <div>
            <div style={styles.cardVal}>{products.length}</div>
            <div style={styles.cardTitle}>Total Products</div>
          </div>
        </div>

        <div className="glass-panel" style={styles.overviewCard}>
          <FileText size={24} color="var(--color-secondary)" />
          <div>
            <div style={styles.cardVal}>
              {orders.filter((o) => o.status === "PENDING").length}
            </div>
            <div style={styles.cardTitle}>Pending Quotations</div>
          </div>
        </div>

        <div className="glass-panel" style={styles.overviewCard}>
          <CheckCircle size={24} color="var(--color-success)" />
          <div>
            <div style={styles.cardVal}>
              {orders.filter((o) => o.status === "APPROVED").length}
            </div>
            <div style={styles.cardTitle}>Approved Orders</div>
          </div>
        </div>
      </div>

      {/* Control Tabs */}
      <div style={styles.controlTabRow}>
        <div style={styles.tabsWrapper}>
          <button
            onClick={() => {
              setActiveTab("inventory");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`btn ${activeTab === "inventory" ? "btn-primary" : "btn-secondary"}`}
            style={styles.tabBtn}
          >
            <Package size={16} />
            <span>Inventory Management</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`btn ${
              activeTab === "orders"
                ? "btn-primary"
                : "btn-secondary"
            }`}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "orders" ? { background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)" } : {}),
            }}
          >
            <FileText size={16} />
            <span>Quotations & Orders</span>
          </button>
        </div>

        <div style={styles.actionsWrapper}>
          <button onClick={loadData} className="btn btn-secondary" style={styles.actionIconBtn}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          {activeTab === "inventory" && (
            <button
              onClick={() => {
                resetForm();
                setShowProductForm(!showProductForm);
              }}
              className="btn btn-primary"
              style={styles.addProductBtn}
            >
              <Plus size={16} />
              <span>{showProductForm ? "Cancel" : "Add Product"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

      {/* Product Add/Edit Form Modal/Section */}
      {activeTab === "inventory" && showProductForm && (
        <form onSubmit={handleProductSubmit} className="glass-panel" style={styles.formContainer}>
          <h3 style={styles.formTitle}>
            {editingProductId ? "Modify Product Details" : "Register New Product"}
          </h3>
          <div style={styles.formGrid}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Acetonitrile 99% Purity"
                className="form-input"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                placeholder="e.g. CHM-ACN-001"
                className="form-input"
                value={pSku}
                onChange={(e) => setPSku(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                placeholder="e.g. Solvents, Acids, Reagents"
                className="form-input"
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dimension *</label>
              <select
                className="form-select"
                value={pDimension}
                onChange={(e) => setPDimension(e.target.value as any)}
              >
                <option value="WEIGHT">WEIGHT (g, kg)</option>
                <option value="VOLUME">VOLUME (mL, L)</option>
                <option value="COUNT">COUNT (items)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Base Storage Unit (Inventory Tracking) *</label>
              <select
                className="form-select"
                value={pBaseUnit}
                onChange={(e) => setPBaseUnit(e.target.value)}
              >
                {getUnitsForDimension(pDimension).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stock *</label>
              <input
                type="text"
                placeholder={`Stock level (in ${pBaseUnit})`}
                className="form-input"
                value={pStock}
                onChange={(e) => setPStock(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rate / Base Price (INR) *</label>
              <input
                type="text"
                placeholder="Rate value (e.g. 500.00)"
                className="form-input"
                value={pPrice}
                onChange={(e) => setPPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pricing Rate Unit *</label>
              <select
                className="form-select"
                value={pPriceUnit}
                onChange={(e) => setPPriceUnit(e.target.value)}
              >
                {getUnitsForDimension(pDimension).map((unit) => (
                  <option key={unit} value={unit}>
                    per {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Product Description</label>
              <textarea
                placeholder="Add chemical details, storage guidelines, hazards etc."
                className="form-input"
                style={{ height: "80px", resize: "none" }}
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-secondary"
              style={{ minWidth: "100px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: "150px" }}
              disabled={loading}
            >
              {editingProductId ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div style={styles.loader}>Loading system data...</div>
      ) : activeTab === "inventory" ? (
        /* 1. Inventory View */
        <div className="glass-panel animate-fade-in" style={styles.contentSection}>
          <h3 style={styles.contentTitle}>Active Inventory Catalog</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>SKU</th>
                  <th style={styles.th}>Product Details</th>
                  <th style={styles.th}>Category / Dimension</th>
                  <th style={styles.th}>Current Stock (Base Unit)</th>
                  <th style={styles.th}>Base Rate</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.noData}>No products in inventory. Add one above.</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isLowStock = parseFloat(product.stock) <= 1000 && product.dimension !== "COUNT";
                    return (
                      <tr key={product.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <span style={styles.skuText}>{product.sku}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.prodNameText}>{product.name}</div>
                          <div style={styles.prodDescText}>{product.description || "—"}</div>
                        </td>
                        <td style={styles.td}>
                          <div>{product.category}</div>
                          <div style={styles.dimensionLabel}>{product.dimension}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontWeight: 700,
                              color: isLowStock ? "var(--color-warning)" : "#fff",
                            }}>
                              {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                            </span>
                            {isLowStock && (
                              <span title="Low stock warning">
                                <AlertTriangle size={14} color="var(--color-warning)" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 600 }}>₹{parseFloat(product.price).toFixed(2)}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}> / {product.priceUnit}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={styles.actionButtonsWrapper}>
                            <button
                              onClick={() => handleEditClick(product)}
                              style={styles.iconBtn}
                              title="Edit product"
                            >
                              <Edit size={16} color="var(--color-primary)" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              style={styles.iconBtn}
                              title="Delete product"
                            >
                              <Trash2 size={16} color="var(--color-error)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 2. Orders & Quotations View */
        <div className="glass-panel animate-fade-in" style={styles.contentSection}>
          <h3 style={styles.contentTitle}>Incoming Order Dashboard</h3>
          {orders.length === 0 ? (
            <div style={styles.noData}>No orders or quotations have been placed.</div>
          ) : (
            <div style={styles.ordersList}>
              {orders.map((order) => (
                <div key={order.id} style={styles.orderCard}>
                  {/* Order Top Bar */}
                  <div style={styles.orderCardHeader}>
                    <div style={styles.orderCardMeta}>
                      <span style={styles.orderCardId}>ORDER #{order.id.slice(0, 8).toUpperCase()}</span>
                      <span style={styles.orderCardDate}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div style={styles.orderCardUser}>
                      <User size={14} style={{ color: "var(--text-dim)" }} />
                      <span>{order.user.username}</span>
                      <span style={styles.userEmail}>({order.user.email})</span>
                    </div>

                    <div>
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
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div style={styles.orderItemsTableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeaderRow}>
                          <th style={styles.th}>Product Details</th>
                          <th style={styles.th}>Dimension</th>
                          <th style={styles.th}>Quantity Ordered</th>
                          <th style={styles.th}>Conversion Verification (Base Unit)</th>
                          <th style={styles.th}>Rate</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>Subtotal (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => {
                          const baseQty = parseFloat(item.baseQuantity);
                          const currentProduct = products.find((p) => p.id === item.productId);
                          const hasStock = currentProduct ? parseFloat(currentProduct.stock) >= baseQty : false;

                          return (
                            <tr key={item.id} style={styles.tableRow}>
                              <td style={styles.td}>
                                <div style={styles.orderItemName}>{item.product.name}</div>
                                <div style={styles.orderItemSku}>{item.product.sku}</div>
                              </td>
                              <td style={styles.td}>
                                <span style={styles.dimensionLabel}>{item.product.dimension}</span>
                              </td>
                              <td style={styles.td}>
                                <strong style={{ color: "#fff" }}>
                                  {parseFloat(item.orderedQuantity).toString()} {item.orderedUnit}
                                </strong>
                              </td>
                              <td style={styles.td}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span>{baseQty.toFixed(2)} {item.product.baseUnit}</span>
                                  {order.status === "PENDING" && (
                                    <span style={{
                                      fontSize: "0.72rem",
                                      padding: "1px 5px",
                                      borderRadius: "3px",
                                      fontWeight: 600,
                                      backgroundColor: hasStock ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                      color: hasStock ? "var(--color-success)" : "var(--color-error)",
                                    }}>
                                      {hasStock ? "Stock OK" : "Insufficient Stock"}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={styles.td}>
                                <span>₹{parseFloat(item.pricePerUnit).toFixed(2)} / {item.priceUnit}</span>
                              </td>
                              <td style={{ ...styles.td, textAlign: "right", fontWeight: 700 }}>
                                ₹{parseFloat(item.subtotal).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Math Verification Row */}
                  <div style={styles.mathVerificationPanel}>
                    <div style={styles.mathPanelTitle}>
                      <Calculator size={14} />
                      <span>Internal Pricing Calculation Verification</span>
                    </div>
                    <div style={styles.mathItems}>
                      {order.items.map((item, idx) => {
                        const qty = parseFloat(item.orderedQuantity);
                        const rate = parseFloat(item.pricePerUnit);
                        const isUnitSame = item.orderedUnit === item.priceUnit;

                        // Conversion description
                        let conversionExplain = "";
                        if (!isUnitSame) {
                          const orderFactor = UNIT_CONFIG[item.orderedUnit] ? UNIT_CONFIG[item.orderedUnit].factor.toNumber() : 1;
                          const rateFactor = UNIT_CONFIG[item.priceUnit] ? UNIT_CONFIG[item.priceUnit].factor.toNumber() : 1;
                          conversionExplain = `[${qty} ${item.orderedUnit} * ${orderFactor} (to Base) / ${rateFactor} (to Rate Unit)] = ${(
                            (qty * orderFactor) /
                            rateFactor
                          ).toFixed(4)} ${item.priceUnit}`;
                        } else {
                          conversionExplain = `${qty} ${item.orderedUnit} (No conversion needed)`;
                        }

                        return (
                          <div key={item.id} style={styles.mathItemRow}>
                            <span>Item {idx + 1}: {item.product.name}</span>
                            <span style={styles.mathExplain}>
                              {conversionExplain} * ₹{rate.toFixed(2)} = <strong>₹{parseFloat(item.subtotal).toFixed(2)}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Card Footer */}
                  <div style={styles.orderCardFooter}>
                    <div style={styles.orderNotesArea}>
                      <strong>Notes:</strong>{" "}
                      <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                        {order.notes || "No custom instructions provided."}
                      </span>
                    </div>

                    <div style={styles.orderSummaryPanel}>
                      <div style={styles.orderTotalBox}>
                        <span style={styles.totalLabel}>Total Quotation Amount:</span>
                        <span style={styles.totalValue}>₹{parseFloat(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>

                      {order.status === "PENDING" && (
                        <div style={styles.orderActionButtons}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleOrderStatus(order.id, "REJECTED")}
                            disabled={actionLoading !== null}
                            style={styles.rejectBtn}
                          >
                            <XCircle size={16} />
                            <span>{actionLoading === order.id + "-REJECTED" ? "Processing..." : "Reject Quotation"}</span>
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOrderStatus(order.id, "APPROVED")}
                            disabled={actionLoading !== null}
                            style={styles.approveBtn}
                          >
                            <CheckCircle size={16} />
                            <span>{actionLoading === order.id + "-APPROVED" ? "Deducting..." : "Approve & Dispatch"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    background: "var(--color-secondary-glow)",
    color: "var(--color-secondary)",
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
  logoutBtn: {
    padding: "8px 16px",
  },
  overviewRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  overviewCard: {
    padding: "24px 30px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  cardVal: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: "1.2",
  },
  cardTitle: {
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  controlTabRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabsWrapper: {
    display: "flex",
    gap: "10px",
  },
  tabBtn: {
    padding: "12px 24px",
    gap: "10px",
  },
  actionsWrapper: {
    display: "flex",
    gap: "12px",
  },
  actionIconBtn: {
    padding: "10px 18px",
  },
  addProductBtn: {
    padding: "10px 20px",
  },
  formContainer: {
    padding: "30px",
  },
  formTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: "20px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "10px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "30px",
    borderTop: "1px solid var(--border-color)",
    paddingTop: "20px",
  },
  contentSection: {
    padding: "30px 24px",
  },
  contentTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: "20px",
  },
  tableWrapper: {
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
  skuText: {
    fontFamily: "monospace",
    fontSize: "0.88rem",
    background: "rgba(255,255,255,0.06)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  prodNameText: {
    fontWeight: 700,
    color: "#fff",
    fontSize: "0.95rem",
  },
  prodDescText: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginTop: "2px",
  },
  dimensionLabel: {
    fontSize: "0.75rem",
    background: "rgba(255,255,255,0.06)",
    color: "var(--text-muted)",
    padding: "2px 6px",
    borderRadius: "4px",
    display: "inline-block",
    marginTop: "4px",
  },
  actionButtonsWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  iconBtn: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--border-color)",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all var(--transition-fast)",
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  orderCard: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    background: "rgba(255, 255, 255, 0.01)",
    overflow: "hidden",
  },
  orderCardHeader: {
    background: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid var(--border-color)",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },
  orderCardMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  orderCardId: {
    fontWeight: 800,
    fontSize: "0.9rem",
    color: "var(--color-secondary)",
  },
  orderCardDate: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
  },
  orderCardUser: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    color: "var(--text-main)",
  },
  userEmail: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
  },
  orderItemsTableWrapper: {
    padding: "0 20px",
  },
  orderItemName: {
    fontWeight: 700,
    fontSize: "0.9rem",
  },
  orderItemSku: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    color: "var(--text-dim)",
  },
  mathVerificationPanel: {
    margin: "15px 24px",
    padding: "16px",
    background: "rgba(6, 182, 212, 0.03)",
    border: "1px dashed rgba(6, 182, 212, 0.2)",
    borderRadius: "var(--radius-sm)",
  },
  mathPanelTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "var(--color-primary)",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  mathItems: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  mathItemRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    flexWrap: "wrap",
    gap: "10px",
  },
  mathExplain: {
    fontFamily: "monospace",
    color: "var(--text-main)",
  },
  orderCardFooter: {
    background: "rgba(255, 255, 255, 0.01)",
    borderTop: "1px solid var(--border-color)",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  orderNotesArea: {
    fontSize: "0.85rem",
  },
  orderSummaryPanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  orderTotalBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  orderActionButtons: {
    display: "flex",
    gap: "12px",
  },
  rejectBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid var(--color-error)",
    color: "var(--color-error)",
  },
  approveBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#0b0f19",
    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
  },
  errorAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid var(--color-error)",
    color: "#fca5a5",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
    marginBottom: "20px",
    textAlign: "center",
  },
  successAlert: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid var(--color-success)",
    color: "#a7f3d0",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
    marginBottom: "20px",
    textAlign: "center",
  },
  loader: {
    padding: "50px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  noData: {
    padding: "50px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
};
