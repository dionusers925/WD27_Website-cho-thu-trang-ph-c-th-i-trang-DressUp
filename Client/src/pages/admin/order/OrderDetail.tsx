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
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  items?: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const statusLabel = (value?: string) => {
  switch (value) {
    case "pending":
      return "Chờ xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "shipped":
      return "Đang giao";
    case "delivered":
      return "Đã giao";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    default:
      return value ?? "-";
  }
};

const statusBadge = (status?: string) => {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    delivered: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
  };
  return styles[status ?? ""] || "bg-gray-100 text-gray-800";
};

const paymentStatusLabel = (value?: string) => {
  if (!value) return "Chưa thanh toán";
  if (value === "pending") return "Chưa thanh toán";
  if (value === "paid" || value === "completed" || value === "success") return "Hoàn thành";
  return value;
};

const paymentBadge = (value?: string) => {
  const key = paymentStatusLabel(value);
  if (key === "Hoàn thành") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

const paymentLabel = (value?: string) => {
  if (!value) return "-";
  if (value === "cash" || value === "cod") return "Tiền mặt";
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
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [editLateDays, setEditLateDays] = useState<number>(0);
  const [editDamageFee, setEditDamageFee] = useState<number>(0);
  const [editPenaltyNote, setEditPenaltyNote] = useState<string>("");
  const [selectedDamages, setSelectedDamages] = useState<string[]>([]);
  const [customDamageFee, setCustomDamageFee] = useState<number>(0);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`http://localhost:3000/orders/${id}`);
        const data = res.data as Order;
        setOrder(data);
        setEditStatus(data.status || "pending");
        setEditLateDays(Number(data.lateDays ?? 0) || 0);
        const initialDamageFee = Number(data.damageFee ?? 0) || 0;
        setEditDamageFee(initialDamageFee);
        setSelectedDamages([]);
        setCustomDamageFee(initialDamageFee);
        setEditPenaltyNote(data.penaltyNote || "");
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Không tìm thấy đơn hàng";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleUpdateOrder = async () => {
    if (!order?._id) return;
    setSaving(true);
    try {
      const res = await axios.patch(`http://localhost:3000/orders/${order._id}`, {
        status: editStatus,
        lateDays: editLateDays,
        damageFee: editDamageFee,
        penaltyNote: editPenaltyNote,
      });
      const data = res.data as Order;
      setOrder(data);
      setEditStatus(data.status || editStatus);
      setEditLateDays(Number(data.lateDays ?? 0) || 0);
      setEditDamageFee(Number(data.damageFee ?? 0) || 0);
      setEditPenaltyNote(data.penaltyNote || "");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Không thể cập nhật đơn";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const damageOptions = [
    { key: "stain", label: "Vết bẩn khó giặt", fee: 30000 },
    { key: "scratch", label: "Rách/xước nhỏ", fee: 50000 },
    { key: "broken", label: "Rách lớn/Hỏng khóa", fee: 100000 },
    { key: "burn", label: "Cháy/Thủng", fee: 200000 },
    { key: "lost", label: "Mất đồ/Phụ kiện", fee: 300000 },
  ];

  const damageFeeFromOptions = useMemo(
    () =>
      selectedDamages.reduce((sum, key) => {
        const option = damageOptions.find((item) => item.key === key);
        return sum + (option?.fee ?? 0);
      }, 0),
    [selectedDamages]
  );

  useEffect(() => {
    const totalDamage = damageFeeFromOptions + (Number(customDamageFee ?? 0) || 0);
    setEditDamageFee(totalDamage);
  }, [damageFeeFromOptions, customDamageFee]);

  const penaltyEnabled = editStatus === "completed";

  useEffect(() => {
    if (!penaltyEnabled) {
      setEditLateDays(0);
      setSelectedDamages([]);
      setCustomDamageFee(0);
      setEditDamageFee(0);
      setEditPenaltyNote("");
    }
  }, [penaltyEnabled]);

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

  const rentalPerDay = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return sum + price * quantity;
      }, 0),
    [items]
  );
  const previewLateFee = rentalPerDay * (Number(editLateDays ?? 0) || 0);

  const lateFee = penaltyEnabled ? previewLateFee : 0;
  const damageFee = penaltyEnabled ? Number(editDamageFee ?? 0) || 0 : 0;
  const penaltyTotal = lateFee + damageFee;
  const computedTotal = rentalSubtotal + depositTotal + penaltyTotal;
  const displayTotal = computedTotal > 0 ? computedTotal : Number(order?.total ?? 0);

  const refundDeposit = Math.max(depositTotal - damageFee, 0);
  const totalRevenue = rentalSubtotal + penaltyTotal;

  const customerName =
    order?.customerName ||
    (typeof order?.userId === "object" ? order?.userId?.name : undefined) ||
    order?.shippingAddress?.name ||
    "Khách tại quầy";

  const customerPhone =
    order?.customerPhone ||
    order?.shippingAddress?.phone ||
    (typeof order?.userId === "object" ? order?.userId?.email : "Chưa cập nhật");

  const customerAddress =
    order?.customerAddress || order?.shippingAddress?.address || "Đơn tại quầy / Không giao hàng";

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen font-sans">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          Đang tải chi tiết đơn hàng...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen font-sans">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-red-600 font-semibold">
            {error || "Không tìm thấy đơn hàng"}
          </div>
          <button
            onClick={() => navigate("/admin/order")}
            className="mt-4 px-4 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#377abd" }}
          >
            Quay lại danh sách
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
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Đơn hàng #{order.orderNumber || order._id}
          </h1>
          <div className="text-xs text-gray-500">
            Đặt hàng lúc {formatDateTime(order.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(order.status)}`}>
            {statusLabel(order.status)}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentBadge(order.paymentStatus)}`}>
            {paymentStatusLabel(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm lg:col-span-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
            Thông tin khách hàng
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">Khách hàng</div>
              <div className="font-semibold text-gray-800">{customerName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Số điện thoại</div>
              <div className="font-semibold text-gray-800">{customerPhone}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Địa chỉ</div>
              <div className="font-semibold text-gray-800">{customerAddress}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Phương thức giao</div>
              <div className="font-semibold text-gray-800">Đơn thuê tại quầy / Không giao hàng</div>
            </div>
          </div>
          {order.note && (
            <div className="mt-4 text-sm text-gray-700">
              <div className="text-xs text-gray-400 mb-1">Ghi chú</div>
              {order.note}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
            Chi phí phát sinh
          </div>

          <div className="text-xs font-semibold text-gray-700 mb-2">
            Phạt quá ngày
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min={0}
              className="w-24 p-2 border border-gray-200 rounded-lg text-sm"
              value={editLateDays}
              onChange={(e) => setEditLateDays(Number(e.target.value) || 0)}
              disabled={!penaltyEnabled}
            />
            <span className="text-sm text-gray-500">ngày</span>
            <div className="ml-auto text-sm font-semibold text-red-600">
              {formatCurrency(previewLateFee)}
            </div>
          </div>

          <div className="text-xs font-semibold text-gray-700 mb-2">
            Phạt đồ hư hỏng (Trừ tiền cọc)
          </div>
          <div className="space-y-2 mb-3">
            {damageOptions.map((option) => {
              const checked = selectedDamages.includes(option.key);
              return (
                <label
                  key={option.key}
                  className="flex items-center justify-between gap-2 text-sm text-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!penaltyEnabled}
                      onChange={(e) => {
                        setSelectedDamages((prev) =>
                          e.target.checked
                            ? [...prev, option.key]
                            : prev.filter((key) => key !== option.key)
                        );
                      }}
                    />
                    {option.label}
                  </div>
                  <span className="text-xs text-red-600 border border-red-200 px-2 py-0.5 rounded-md">
                    +{formatCurrency(option.fee)}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min={0}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Nhập phí phạt khác (nếu có)"
              value={customDamageFee}
              onChange={(e) => setCustomDamageFee(Number(e.target.value) || 0)}
              disabled={!penaltyEnabled}
            />
          </div>

          <div className="flex items-center justify-between text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <span>Tổng lỗi phát sinh (Cộng thêm):</span>
            <span>{formatCurrency(penaltyTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span>Tiền thuê gốc:</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(rentalSubtotal)}
            </span>
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Ghi chú phạt</div>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Nhập ghi chú phạt (nếu có)"
              value={editPenaltyNote}
              onChange={(e) => setEditPenaltyNote(e.target.value)}
              disabled={!penaltyEnabled}
            />
            {!penaltyEnabled && (
              <div className="text-[11px] text-gray-400 mt-1">
                Chỉ được nhập chi phí phát sinh khi đơn hàng ở trạng thái Hoàn tất.
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Trạng thái đơn</div>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleUpdateOrder}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: "#377abd" }}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">
                Sản phẩm ({items.length})
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Thuê: {formatDate(order.startDate)} - {formatDate(order.endDate)} · {rentalDays} ngày
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Không có sản phẩm trong đơn hàng.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const product =
                  typeof item.productId === "object" ? item.productId : null;
                const name = product?.name || item.name || "Sản phẩm";
                const quantity = Number(item.quantity ?? 1);
                const price = Number(item.price ?? 0);
                const deposit = Number(item.deposit ?? 0);
                const itemTotal = (price * rentalDays + deposit) * quantity;
                return (
                  <div
                    key={item._id || idx}
                    className="flex items-center justify-between gap-4 border border-gray-100 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Size: {item.size || "-"} · Màu: {item.color || "-"} · SL: {quantity}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-gray-800">{formatCurrency(price)}</div>
                      <div className="text-xs text-gray-500">Cọc {formatCurrency(deposit)}</div>
                      <div className="text-xs text-gray-400">Thành tiền {formatCurrency(itemTotal)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
            Thanh toán
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Phương thức</span>
            <span className="font-semibold text-gray-800 uppercase">
              {paymentLabel(order.paymentMethod)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span>Trạng thái</span>
            <span className="font-semibold text-gray-800">
              {paymentStatusLabel(order.paymentStatus)}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-[#0f1b33] text-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Phí thuê + Phạt</span>
              <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span>Tiền đặt cọc của khách</span>
              <span className="font-semibold">{formatCurrency(depositTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span>Khách nhận lại cọc (Sau khi trừ lỗi)</span>
              <span className="font-semibold">{formatCurrency(refundDeposit)}</span>
            </div>
            <div className="h-px bg-white/20 my-3"></div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span>TỔNG THỰC THU DOANH THU</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
