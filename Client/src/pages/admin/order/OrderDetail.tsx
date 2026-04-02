import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

interface OrderItem {
  _id?: string;
  productId?: {
    _id?: string;
    name?: string;
    images?: string[];
  } | string;
  name?: string;
  size?: string;
  color?: string;
  deposit?: number;
  quantity?: number;
  price?: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
  total?: number;
  subtotal?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  lateDays?: number;
  lateFee?: number;
  damageFee?: number;
  penaltyNote?: string;
  overdueDays?: number;
  damageErrors?: string[];
  lostItems?: string[];
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  items?: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  bankName?: string;
  bankAccount?: string;
  note?: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ?";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const statusBadge = (status?: string) => {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    delivered: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    fee_incurred: "bg-orange-100 text-orange-800",
  };
  return styles[status ?? ""] || "bg-gray-100 text-gray-800";
};

const paymentStatusLabel = (value?: string) => {
  if (!value) return "Ch?a thanh to?n";
  if (value === "pending") return "Ch?a thanh to?n";
  if (value === "paid" || value === "completed" || value === "success")
    return "Ho?n th?nh";
  return value;
};

const paymentBadge = (value?: string) => {
  const key = paymentStatusLabel(value);
  if (key === "Ho?n th?nh") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

const paymentLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "cash" || value === "cod") return "Ti?n m?t";
  return value;
};

const calcRentalDays = (start?: string, end?: string) => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [lateFee, setLateFee] = useState<number>(0);
  const [damageFee, setDamageFee] = useState<number>(0);
  const [status, setStatus] = useState<string>("pending");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [overdueDays, setOverdueDays] = useState<number | "">("");
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [lostItemIds, setLostItemIds] = useState<string[]>([]);
  const [penaltyNote, setPenaltyNote] = useState<string>("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`http://localhost:3000/orders/${id}`);
        const data = res.data as Order;
        setOrder(data);

        setLateFee(Number(data.lateFee ?? 0) || 0);
        setDamageFee(Number(data.damageFee ?? 0) || 0);
        setStatus(data.status || "pending");
        setPaymentStatus(data.paymentStatus || "pending");
        const resolvedOverdue =
          (data as any).overdueDays ?? (data as any).lateDays ?? "";
        setOverdueDays(resolvedOverdue ? Number(resolvedOverdue) : "");
        setSelectedErrors(
          Array.isArray((data as any).damageErrors)
            ? (data as any).damageErrors
            : []
        );
        setLostItemIds(
          Array.isArray((data as any).lostItems) ? (data as any).lostItems : []
        );
        setPenaltyNote(data.penaltyNote || "");
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Kh?ng t?m th?y ??n h?ng";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleUpdateOrder = async () => {
    if (!id) return;
    setIsUpdating(true);
    try {
      const payload: any = {
        lateFee,
        damageFee,
        status,
        paymentStatus,
        damageErrors: selectedErrors,
        lostItems: lostItemIds,
        penaltyNote,
      };

      if (overdueDays === "") {
        payload.overdueDays = 0;
        payload.lateDays = 0;
      } else {
        payload.overdueDays = Number(overdueDays) || 0;
        payload.lateDays = Number(overdueDays) || 0;
      }

      const res = await axios.put(`http://localhost:3000/orders/${id}`, payload);
      const updated = res.data as Order;
      setOrder(updated);
      setStatus(updated.status || status);
      setPaymentStatus(updated.paymentStatus || paymentStatus);
      setLateFee(Number(updated.lateFee ?? lateFee) || 0);
      setDamageFee(Number(updated.damageFee ?? damageFee) || 0);
      setPenaltyNote(updated.penaltyNote || penaltyNote);
      setOverdueDays(
        (updated as any).overdueDays
          ? Number((updated as any).overdueDays)
          : overdueDays
      );
      setSelectedErrors(
        Array.isArray((updated as any).damageErrors)
          ? (updated as any).damageErrors
          : selectedErrors
      );
      setLostItemIds(
        Array.isArray((updated as any).lostItems)
          ? (updated as any).lostItems
          : lostItemIds
      );
      alert("C?p nh?t ??n h?ng th?nh c?ng!");
    } catch (err) {
      alert("Kh?ng th? l?u chi ph?. Vui l?ng ki?m tra l?i server.");
    } finally {
      setIsUpdating(false);
    }
  };

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order?.items : []),
    [order]
  );
  const rentalDays = useMemo(
    () => calcRentalDays(order?.startDate, order?.endDate),
    [order?.startDate, order?.endDate]
  );

  const rentalSubtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return sum + price * quantity * rentalDays;
      }, 0),
    [items, rentalDays]
  );

  const depositTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const deposit = Number(item.deposit ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return sum + deposit * quantity;
      }, 0),
    [items]
  );

  const getItemKey = (item: OrderItem, idx: number) =>
    item._id || `idx_${idx}`;

  const lostDepositTotal = useMemo(
    () =>
      items.reduce((sum, item, idx) => {
        const key = getItemKey(item, idx);
        if (lostItemIds.includes(key)) {
          return sum + Number(item.deposit ?? 0) * Number(item.quantity ?? 1);
        }
        return sum;
      }, 0),
    [items, lostItemIds]
  );

  const displayTotal = useMemo(() => {
    const feeTotal = lateFee + damageFee + lostDepositTotal;
    if (status === "completed") {
      return rentalSubtotal + feeTotal;
    }
    return rentalSubtotal + depositTotal + feeTotal;
  }, [status, rentalSubtotal, depositTotal, lateFee, damageFee, lostDepositTotal]);

  const customerName =
    order?.customerName ||
    (typeof order?.userId === "object" ? order?.userId?.name : undefined) ||
    order?.shippingAddress?.name ||
    "Kh?ch t?i qu?y";

  const customerPhone =
    order?.customerPhone ||
    order?.shippingAddress?.phone ||
    (typeof order?.userId === "object" ? order?.userId?.email : "Ch?a c?p nh?t");

  const customerAddress =
    order?.customerAddress || order?.shippingAddress?.address || "??n t?i qu?y / Kh?ng giao h?ng";

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen font-sans">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          ?ang t?i chi ti?t ??n h?ng...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen font-sans">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-red-600 font-semibold">
            {error || "Kh?ng t?m th?y ??n h?ng"}
          </div>
          <button
            onClick={() => navigate("/admin/order")}
            className="mt-4 px-4 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#377abd" }}
          >
            Quay l?i danh s?ch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <button
            onClick={() => navigate("/admin/order")}
            className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-800"
          >
            ? Quay l?i
          </button>
        </div>
        <button
          onClick={handleUpdateOrder}
          disabled={isUpdating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all disabled:bg-gray-400"
        >
          {isUpdating ? "?ang l?u..." : "L?u thay ??i"}
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            ??n h?ng #{order.orderNumber || order._id}
          </h1>
          <div className="text-xs text-gray-500">
            ??t h?ng l?c {formatDateTime(order.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold outline-none cursor-pointer border-none shadow-sm ${statusBadge(status)}`}
          >
            <option value="pending">Ch? x? l?</option>
            <option value="confirmed">?? x?c nh?n</option>
            <option value="shipped">?ang giao</option>
            <option value="delivered">?? giao</option>
            <option value="fee_incurred">Ph?t sinh ph?</option>
            <option value="completed">Ho?n t?t</option>
            <option value="cancelled">?? h?y</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold outline-none cursor-pointer border-none shadow-sm ${paymentBadge(paymentStatus)}`}
          >
            <option value="pending">Ch?a thanh to?n</option>
            <option value="paid">?? thanh to?n</option>
            <option value="success">Ho?n th?nh</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm lg:col-span-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
            Th?ng tin kh?ch h?ng
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">Kh?ch h?ng</div>
              <div className="font-semibold text-gray-800">{customerName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">S? ?i?n tho?i</div>
              <div className="font-semibold text-gray-800">{customerPhone}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">??a ch?</div>
              <div className="font-semibold text-gray-800">{customerAddress}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Ph??ng th?c giao</div>
              <div className="font-semibold text-gray-800">??n thu? t?i qu?y / Kh?ng giao h?ng</div>
            </div>
            {order.bankName && (
              <div>
                <div className="text-xs text-gray-400">Ng?n h?ng</div>
                <div className="font-semibold text-gray-800">{order.bankName}</div>
              </div>
            )}
            {order.bankAccount && (
              <div>
                <div className="text-xs text-gray-400">S? t?i kho?n</div>
                <div className="font-semibold text-gray-800">{order.bankAccount}</div>
              </div>
            )}
          </div>
          {order.note && (
            <div className="mt-4 text-sm text-gray-700">
              <div className="text-xs text-gray-400 mb-1">Ghi ch?</div>
              {order.note}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold">
            Chi ph? ph?t sinh
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">Ph?t qu? ng?y</label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <input
                    type="number"
                    value={overdueDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOverdueDays(val === "" ? "" : Number(val));
                      if (val !== "") {
                        const days = Number(val);
                        const rentPerDay = rentalSubtotal / rentalDays;
                        setLateFee(Math.round(rentPerDay * days));
                      }
                    }}
                    placeholder="S? ng?y"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none transition-all pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">ng?y</span>
                </div>
                <div className="relative w-2/3">
                  <input
                    type="number"
                    value={lateFee === 0 ? "" : lateFee}
                    onChange={(e) => setLateFee(Number(e.target.value) || 0)}
                    placeholder="Th?nh ti?n"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none transition-all font-semibold text-red-600 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">?</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">
                Ph?t ?? h? h?ng (Tr? ti?n c?c)
              </label>

              <div className="mb-3 grid grid-cols-1 gap-2 border border-gray-100 p-3 rounded-lg bg-gray-50/50">
                {[
                  { id: "stain", label: "V?t b?n kh? gi?t", fee: 30000 },
                  { id: "tear_minor", label: "R?ch/x??c nh?", fee: 50000 },
                  { id: "tear_major", label: "R?ch l?n/H?ng kh?a", fee: 100000 },
                  { id: "burn", label: "Ch?y/Th?ng", fee: 200000 },
                  { id: "lost_item", label: "M?t ??/Ph? ki?n", fee: 300000 },
                ].map((error) => (
                  <label
                    key={error.id}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                      checked={selectedErrors.includes(error.id)}
                      onChange={(e) => {
                        let newErrors = [...selectedErrors];
                        let currentDamageFee = damageFee;

                        if (e.target.checked) {
                          newErrors.push(error.id);
                          currentDamageFee += error.fee;
                        } else {
                          newErrors = newErrors.filter((id) => id !== error.id);
                          currentDamageFee = Math.max(0, currentDamageFee - error.fee);
                        }

                        setSelectedErrors(newErrors);
                        setDamageFee(currentDamageFee);
                      }}
                    />
                    <span className="text-gray-700 flex-1">{error.label}</span>
                    <span className="text-red-500 font-semibold text-xs border bg-white px-2 py-0.5 rounded">
                      +{formatCurrency(error.fee).replace(" ?", "?")}
                    </span>
                  </label>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={damageFee === 0 ? "" : damageFee}
                  onChange={(e) => setDamageFee(Number(e.target.value) || 0)}
                  placeholder="0 (Nh?p t? do ho?c ch?n l?i)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none transition-all font-semibold text-red-600 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ?
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">Ghi ch? ph?t</label>
              <textarea
                value={penaltyNote}
                onChange={(e) => setPenaltyNote(e.target.value)}
                placeholder="Ghi ch? th?m v? ph? ph?t sinh..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none transition-all"
                rows={2}
              />
            </div>
          </div>
          <div className="h-px bg-gray-100 my-4"></div>
          <div className="flex items-center justify-between text-sm font-bold text-red-600 mb-3 bg-red-50 p-2 rounded-lg border border-red-100">
            <span>T?ng l?i ph?t sinh (C?ng th?m):</span>
            <span className="text-base">{formatCurrency(lateFee + damageFee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Ti?n thu? g?c:</span>
            <span className="font-medium text-gray-800">{formatCurrency(rentalSubtotal)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">
                S?n ph?m ({items.length})
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Thu?: {formatDate(order.startDate)} - {formatDate(order.endDate)} ? {rentalDays} ng?y
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Kh?ng c? s?n ph?m trong ??n h?ng.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const product =
                  typeof item.productId === "object" ? item.productId : null;
                const name = product?.name || item.name || "S?n ph?m";
                const quantity = Number(item.quantity ?? 1);
                const price = Number(item.price ?? 0);
                const deposit = Number(item.deposit ?? 0);
                const itemTotal = (price * rentalDays + deposit) * quantity;
                const itemKey = getItemKey(item, idx);
                const isLost = lostItemIds.includes(itemKey);

                const toggleLost = () => {
                  setLostItemIds((prev) =>
                    isLost ? prev.filter((k) => k !== itemKey) : [...prev, itemKey]
                  );
                };

                return (
                  <div
                    key={item._id || idx}
                    className={`flex items-start justify-between gap-4 border rounded-lg p-3 transition-all ${
                      isLost ? "border-red-300 bg-red-50/60" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <label
                        className="flex flex-col items-center gap-1 cursor-pointer pt-0.5"
                        title="??nh d?u s?n ph?m b? m?t"
                      >
                        <input
                          type="checkbox"
                          checked={isLost}
                          onChange={toggleLost}
                          className="w-4 h-4 accent-red-600 cursor-pointer"
                        />
                        <span className="text-[9px] text-red-500 font-bold uppercase leading-tight text-center">
                          M?t
                        </span>
                      </label>

                      <div className="flex-1">
                        <div
                          className={`font-semibold ${
                            isLost ? "text-red-700 line-through opacity-70" : "text-gray-800"
                          }`}
                        >
                          {name}
                          {isLost && (
                            <span
                              className="ml-2 text-xs font-bold text-red-600 no-underline"
                              style={{ textDecoration: "none" }}
                            >
                              ? M?t
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Size: {item.size || "-"} ? M?u: {item.color || "-"} ? SL: {quantity}
                        </div>
                        {isLost && (
                          <div className="text-xs text-red-600 font-semibold mt-1 bg-red-100 px-2 py-0.5 rounded inline-block">
                            Gi? c?c: {formatCurrency(deposit * quantity)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-sm shrink-0">
                      <div
                        className={`font-semibold ${
                          isLost ? "text-gray-400 line-through" : "text-gray-800"
                        }`}
                      >
                        {formatCurrency(price)}/ng?y
                      </div>
                      <div className={`text-xs mt-0.5 ${isLost ? "text-red-500 font-semibold" : "text-gray-500"}`}>
                        C?c {formatCurrency(deposit)}
                      </div>
                      <div className="text-xs text-gray-400">T?ng {formatCurrency(itemTotal)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
            Thanh to?n
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Ph??ng th?c</span>
            <span className="font-semibold text-gray-800 uppercase">
              {paymentLabel(order.paymentMethod)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span>Tr?ng th?i</span>
            <span className="font-semibold text-gray-800">
              {paymentStatusLabel(paymentStatus)}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-[#0f1b33] text-white p-4">
            <div className="flex items-center justify-between text-sm opacity-80">
              <span>Ph? thu? + Ph?t</span>
              <span className="font-semibold">
                {formatCurrency(rentalSubtotal + lateFee + damageFee)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 opacity-80">
              <span>Ti?n ??t c?c c?a kh?ch</span>
              <span className={`font-semibold ${status === "completed" ? "line-through opacity-50" : ""}`}>
                {formatCurrency(depositTotal)}
              </span>
            </div>
            {lostDepositTotal > 0 && (
              <div className="flex items-center justify-between text-sm mt-2 text-red-400 font-semibold">
                <span>?? Gi? c?c (s?n ph?m m?t)</span>
                <span>+{formatCurrency(lostDepositTotal)}</span>
              </div>
            )}
            {status === "completed" && (
              <div className="flex items-center justify-between text-sm mt-2 text-emerald-400 font-semibold">
                <span>Kh?ch nh?n l?i c?c (Sau khi tr?)</span>
                <span>
                  {formatCurrency(
                    Math.max(0, depositTotal - lateFee - damageFee - lostDepositTotal)
                  )}
                </span>
              </div>
            )}
            <div className="h-px bg-white/20 my-3"></div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span>
                {status === "completed" ? "T?NG TH?C THU DOANH THU" : "T?NG ??N (G?M C?C)"}
              </span>
              <span className="text-xl text-yellow-400">{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
