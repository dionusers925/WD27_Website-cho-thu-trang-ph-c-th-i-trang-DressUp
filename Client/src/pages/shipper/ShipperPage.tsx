import { useEffect, useRef, useState } from "react";
import axios from "axios";

/* ─── Types ────────────────────────────────────── */
interface OrderItem {
  name?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
  deposit?: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  total?: number;
  items?: OrderItem[];
  shippingAddress?: {
    address?: string;
    ward?: string;
    district?: string;
    province?: string;
    city?: string;
    receiverName?: string;
    receiverPhone?: string;
  };
  note?: string;
  createdAt?: string;
}

/* ─── Helpers ──────────────────────────────────── */
const formatCurrency = (v?: number) =>
  v != null ? new Intl.NumberFormat("vi-VN").format(v) + "đ" : "0đ";
const formatDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString("vi-VN") : "-";
const formatDateTime = (v?: string) =>
  v ? new Date(v).toLocaleString("vi-VN") : "-";

const SHIPPER_STATUSES = ["preparing", "shipped", "delivered"];

const statusMeta: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  preparing: { label: "Đang chuẩn bị", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)", icon: "📦" },
  shipped: { label: "Đang giao", color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: "🚚" },
  delivered: { label: "Đã giao", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: "✅" },
};

const nextStatus: Record<string, string> = { preparing: "shipped", shipped: "delivered" };

/* ─── Component ────────────────────────────────── */
export default function ShipperPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preparing" | "shipped" | "delivered">("preparing");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // proof images: { [orderId]: { file: File, preview: string } }
  const [proofImages, setProofImages] = useState<Record<string, { file: File; preview: string }>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:3000/orders");
      const all: Order[] = Array.isArray(res.data) ? res.data : [];
      setOrders(all.filter((o) => SHIPPER_STATUSES.includes(o.status || "")));
    } catch {
      showToast("Không thể tải danh sách đơn hàng!", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 30000);
    return () => clearInterval(iv);
  }, []);

  /* Chọn ảnh bằng chứng */
  const handlePickImage = (orderId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setProofImages((prev) => ({
        ...prev,
        [orderId]: { file, preview: e.target?.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeProofImage = (orderId: string) => {
    setProofImages((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };

  /* Xác nhận đã giao (với ảnh) */
  const handleConfirmDelivered = async (order: Order) => {
    if (order.status !== "shipped") return;
    const proof = proofImages[order._id];
    if (!proof) {
      showToast("📸 Vui lòng chụp / chọn ảnh bằng chứng giao hàng!", "err");
      return;
    }

    setUpdating(order._id);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedBy = userData?.name || userData?.email || "Shipper";

      // Gửi ảnh dưới dạng base64 kèm status
      await axios.put(`http://localhost:3000/orders/${order._id}`, {
        status: "delivered",
        updatedBy,
        deliveryProof: proof.preview,   // base64 ảnh
      });

      showToast(`✅ Xác nhận giao thành công đơn #${(order.orderNumber || order._id).slice(-6).toUpperCase()}`);
      removeProofImage(order._id);
      fetchOrders();
      setExpandedId(null);
    } catch {
      showToast("❌ Cập nhật thất bại. Thử lại!", "err");
    } finally {
      setUpdating(null);
    }
  };

  /* Xác nhận lấy hàng (preparing → shipped) */
  const handlePickup = async (order: Order) => {
    if (order.status !== "preparing") return;
    setUpdating(order._id);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedBy = userData?.name || userData?.email || "Shipper";
      await axios.put(`http://localhost:3000/orders/${order._id}`, {
        status: "shipped",
        updatedBy,
      });
      showToast(`🚚 Đơn #${(order.orderNumber || order._id).slice(-6).toUpperCase()} → Đang giao`);
      fetchOrders();
      setExpandedId(null);
    } catch {
      showToast("❌ Cập nhật thất bại. Thử lại!", "err");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.status === activeTab &&
      (search === "" ||
        (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone || "").includes(search) ||
        (o.orderNumber || o._id).toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    preparing: orders.filter((o) => o.status === "preparing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const getAddress = (o: Order) => {
    const sa = o.shippingAddress;
    if (!sa) return o.customerAddress || "—";
    const parts = [sa.address, sa.ward, sa.district, sa.province || sa.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : o.customerAddress || "—";
  };

  /* ── RENDER ── */
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#e2e8f0" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "ok" ? "#16a34a" : "#dc2626", color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "slideIn .25s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>🚚</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>DressUp Shipper</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Cổng giao hàng nội bộ</div>
          </div>
        </div>
        <button onClick={fetchOrders} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          🔄 Làm mới
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {(["preparing", "shipped", "delivered"] as const).map((s) => {
            const m = statusMeta[s];
            return (
              <div key={s} onClick={() => setActiveTab(s)} style={{ background: activeTab === s ? m.bg : "rgba(255,255,255,0.04)", border: `1.5px solid ${activeTab === s ? m.color : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "14px 12px", textAlign: "center", cursor: "pointer", transition: "all .2s" }}>
                <div style={{ fontSize: 22 }}>{m.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: activeTab === s ? m.color : "#e2e8f0", lineHeight: 1.2 }}>{counts[s]}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: activeTab === s ? m.color : "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#475569" }}>🔍</span>
          <input type="text" placeholder="Tìm tên, SĐT hoặc mã đơn..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px 12px 42px", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
        </div>

        {/* Tab label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}>
            <span style={{ fontSize: 18 }}>{statusMeta[activeTab].icon}</span>
            {statusMeta[activeTab].label}
            <span style={{ background: statusMeta[activeTab].bg, color: statusMeta[activeTab].color, border: `1px solid ${statusMeta[activeTab].color}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
              {filtered.length}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>Tự động làm mới mỗi 30s</div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#475569", fontSize: 15 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Đang tải đơn hàng...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{statusMeta[activeTab].icon}</div>
            <div style={{ color: "#475569", fontWeight: 700, fontSize: 14 }}>Không có đơn {statusMeta[activeTab].label.toLowerCase()}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((order) => {
              const isExpanded = expandedId === order._id;
              const isUpdating = updating === order._id;
              const m = statusMeta[order.status || ""];
              const address = getAddress(order);
              const receiverName = order.shippingAddress?.receiverName || order.customerName || "Khách hàng";
              const receiverPhone = order.shippingAddress?.receiverPhone || order.customerPhone || "";
              const isShipped = order.status === "shipped";
              const isPreparing = order.status === "preparing";
              const proof = proofImages[order._id];

              return (
                <div key={order._id} style={{ background: "rgba(255,255,255,0.04)", border: `1.5px solid ${isExpanded ? m.color : "rgba(255,255,255,0.08)"}`, borderRadius: 16, overflow: "hidden", transition: "border-color .2s" }}>

                  {/* Card header – click to expand */}
                  <div onClick={() => setExpandedId(isExpanded ? null : order._id)} style={{ padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, border: `1.5px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 13, color: "#94a3b8" }}>#{(order.orderNumber || order._id).slice(-6).toUpperCase()}</span>
                        <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}`, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{m.label}</span>
                        {isShipped && proof && (
                          <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>📸 Có ảnh</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{receiverName}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {address}</div>
                    </div>
                    <div style={{ color: "#475569", fontSize: 18, transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s", flexShrink: 0 }}>▾</div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "18px 18px 20px" }}>

                      {/* Contact */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Người nhận</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{receiverName}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Số điện thoại</div>
                          {receiverPhone
                            ? <a href={`tel:${receiverPhone}`} style={{ fontWeight: 800, fontSize: 14, color: "#38bdf8", textDecoration: "none" }}>📞 {receiverPhone}</a>
                            : <span style={{ color: "#475569", fontSize: 13 }}>—</span>}
                        </div>
                      </div>

                      {/* Address */}
                      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16, marginTop: 1 }}>📍</span>
                        <div>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Địa chỉ giao hàng</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{address}</div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Ngày lấy đồ</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#a3e635" }}>{formatDate(order.startDate)}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Ngày trả đồ</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#f87171" }}>{formatDate(order.endDate)}</div>
                        </div>
                      </div>

                      {/* Items */}
                      {order.items && order.items.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>📋 Sản phẩm ({order.items.length})</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name || "Sản phẩm"}</div>
                                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Size: {item.size || "-"} · Màu: {item.color || "-"} · SL: {item.quantity ?? 1}</div>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", textAlign: "right" }}>
                                  {formatCurrency(item.price)}
                                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>Cọc: {formatCurrency(item.deposit)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: order.note ? 12 : 16 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#a5b4fc" }}>💰 Tổng đơn hàng</span>
                        <span style={{ fontWeight: 900, fontSize: 16, color: "#818cf8" }}>{formatCurrency(order.total)}</span>
                      </div>

                      {order.note && (
                        <div style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fde68a", fontStyle: "italic" }}>
                          📝 {order.note}
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: "#334155", marginBottom: 16 }}>Đặt lúc: {formatDateTime(order.createdAt)}</div>

                      {/* ── CTA: PREPARING → lấy hàng ── */}
                      {isPreparing && (
                        <button disabled={isUpdating} onClick={() => handlePickup(order)}
                          style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: isUpdating ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: isUpdating ? "not-allowed" : "pointer", boxShadow: isUpdating ? "none" : "0 4px 20px rgba(99,102,241,0.4)", transition: "all .2s" }}>
                          {isUpdating ? "⏳ Đang cập nhật..." : "🚚 Xác nhận lấy hàng →"}
                        </button>
                      )}

                      {/* ── CTA: SHIPPED → upload ảnh + xác nhận đã giao ── */}
                      {isShipped && (
                        <div style={{ marginTop: 4 }}>
                          {/* Upload zone */}
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                              <span>📸</span> Ảnh bằng chứng giao hàng <span style={{ color: "#f87171" }}>*</span>
                            </div>

                            {/* Preview khi đã chọn ảnh */}
                            {proof ? (
                              <div style={{ position: "relative" }}>
                                <img src={proof.preview} alt="proof" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, border: "2px solid rgba(34,197,94,0.4)", display: "block" }} />
                                {/* Nút xóa ảnh */}
                                <button onClick={() => removeProofImage(order._id)}
                                  style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: "rgba(220,38,38,0.85)", border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                                  ✕
                                </button>
                                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(22,163,74,0.9)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                                  ✅ Ảnh đã chọn
                                </div>
                              </div>
                            ) : (
                              /* Drop zone */
                              <div
                                onClick={() => fileInputRefs.current[order._id]?.click()}
                                style={{ border: "2px dashed rgba(168,85,247,0.4)", borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: "rgba(168,85,247,0.05)", transition: "all .2s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,85,247,0.10)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(168,85,247,0.05)")}
                              >
                                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#c084fc", marginBottom: 4 }}>Chụp hoặc chọn ảnh có san</div>
                                <div style={{ fontSize: 12, color: "#64748b" }}>Ảnh xác nhận đã giao khách</div>
                              </div>
                            )}

                            {/* Hidden file input */}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              ref={(el) => { fileInputRefs.current[order._id] = el; }}
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePickImage(order._id, file);
                                e.target.value = "";
                              }}
                            />

                            {/* Nút chọn lại nếu đã có ảnh */}
                            {proof && (
                              <button
                                onClick={() => fileInputRefs.current[order._id]?.click()}
                                style={{ marginTop: 8, width: "100%", padding: "9px 0", borderRadius: 10, border: "1px solid rgba(168,85,247,0.35)", background: "rgba(168,85,247,0.08)", color: "#c084fc", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                                🔄 Chọn ảnh khác
                              </button>
                            )}
                          </div>

                          {/* Nút xác nhận đã giao */}
                          <button
                            disabled={isUpdating || !proof}
                            onClick={() => handleConfirmDelivered(order)}
                            style={{
                              width: "100%",
                              padding: "15px 0",
                              borderRadius: 12,
                              border: "none",
                              background: !proof
                                ? "rgba(34,197,94,0.2)"
                                : isUpdating
                                  ? "rgba(34,197,94,0.3)"
                                  : "linear-gradient(135deg,#16a34a,#22c55e)",
                              color: !proof ? "#475569" : "#fff",
                              fontWeight: 800,
                              fontSize: 15,
                              cursor: !proof || isUpdating ? "not-allowed" : "pointer",
                              boxShadow: proof && !isUpdating ? "0 4px 20px rgba(34,197,94,0.35)" : "none",
                              transition: "all .2s",
                              letterSpacing: 0.3,
                            }}>
                            {isUpdating ? "⏳ Đang xác nhận..." : !proof ? "📸 Cần chụp ảnh trước" : "✅ Xác nhận đã giao xong"}
                          </button>
                        </div>
                      )}

                      {/* Delivered */}
                      {order.status === "delivered" && (
                        <div style={{ textAlign: "center", padding: "12px 0", color: "#22c55e", fontWeight: 700, fontSize: 14 }}>
                          ✅ Đơn hàng đã hoàn thành giao
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "#1e293b", fontWeight: 600 }}>
          DressUp Shipper Portal © {new Date().getFullYear()}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        input[type=text]:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        @keyframes slideIn {
          from { opacity:0; transform: translateX(20px); }
          to   { opacity:1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
