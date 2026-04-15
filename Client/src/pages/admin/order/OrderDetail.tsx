import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";

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
    fullName?: string;
    phone?: string;
  } | string;
  total?: number;
  subtotal?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  items?: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  bankAccount?: string;
  bankName?: string;
  note?: string;
  lateFee?: number;
  damageFee?: number;
  shippingAddress?: {
    address?: string;
    name?: string;
    phone?: string;
    city?: string;
    receiverName?: string;
    receiverPhone?: string;
    line1?: string;
    ward?: string;
    district?: string;
    province?: string;
    country?: string;
  };
  statusHistory?: {
    status: string;
    updatedBy?: string;
    date: string;
  }[];
  paymentStatusHistory?: {
    status: string;
    updatedBy?: string;
    date: string;
  }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";


const statusBadge = (status?: string) => {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    delivered: "bg-yellow-100 text-yellow-800",
    renting: "bg-cyan-100 text-cyan-800",
    returning: "bg-indigo-100 text-indigo-800",
    returned: "bg-teal-100 text-teal-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-sky-100 text-sky-800",
    shipped: "bg-purple-100 text-purple-800",
    fee_incurred: "bg-orange-100 text-orange-800",
  };
  return styles[status ?? ""] || "bg-gray-100 text-gray-800";
};

const paymentStatusLabel = (value?: string) => {
  if (!value) return "Chưa thanh toánn";
  if (value === "pending") return "Chưa thanh toán";
  if (value === "paid") return "Đã thanh toán";
  if (value === "deposit_returned") return "Đã hoàn cọc";
  if (value === "completed" || value === "success") return "Hoàn thành";
  return value;
};

const paymentBadge = (value?: string) => {
  if (value === "paid") return "bg-green-100 text-green-800";
  if (value === "deposit_returned") return "bg-teal-100 text-teal-800";
  if (value === "completed" || value === "success") return "bg-emerald-100 text-emerald-800";
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

const getAvailableStatuses = (currentStatus?: string) => {
  const statuses = [
    "pending",
    "confirmed",
    "preparing",
    "shipped",
    "delivered",
    "renting",
    "returning",
    "returned",
    "fee_incurred",
    "completed",
    "cancelled",
  ];
  const currentIndex = statuses.indexOf(currentStatus || "pending");

  if (currentIndex === -1) return statuses;
  if (currentStatus === "completed") return ["completed"];
  if (currentStatus === "fee_incurred") return ["fee_incurred"];
  if (currentStatus === "cancelled") return ["cancelled"];

  // Trả về trạng thái hiện tại và tất cả các trạng thái phía sau nó
  return statuses.slice(currentIndex);
};

const getAvailablePaymentStatuses = (currentStatus?: string) => {
  switch (currentStatus) {
    case "pending":
      return ["pending", "paid", "deposit_returned", "success"];
    case "paid":
      return ["paid", "deposit_returned", "success"];
    case "deposit_returned":
      return ["deposit_returned", "success"];
    case "success":
    case "completed":
      return [currentStatus];
    default:
      return ["pending", "paid", "deposit_returned", "success"];
  }
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
  const [overdueDays, setOverdueDays] = useState<number | ''>('');
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [lostItemIds, setLostItemIds] = useState<string[]>([]);

  // Kiểm tra đơn đã chốt cứng chưa (không cho sửa)
  const isLocked = useMemo(() => {
    if (!order) return false;
    const isTerminalStatus = order.status === "fee_incurred" || order.status === "completed";
    const isPaymentDone = order.paymentStatus === "success" || order.paymentStatus === "paid" || order.paymentStatus === "completed";
    return isTerminalStatus && isPaymentDone;
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`http://localhost:3000/orders/${id}`);
        const data = res.data as Order;
        setOrder(data);

        let autoDays: number | '' = '';
        let initialLateFee = data.lateFee || 0;

        // Auto calculate overdue days if not locked and not cancelled
        if (data.status !== "completed" && data.status !== "fee_incurred" && data.status !== "cancelled") {
          const end = new Date(data.endDate || "");
          end.setHours(23, 59, 59, 999);

          // If order history has returned state, use that date, else use current time
          const returnedHistory = data.statusHistory?.slice().reverse().find(h => h.status === 'returned' || h.status === 'fee_incurred');
          const referenceDate = returnedHistory ? new Date(returnedHistory.date) : new Date();

          if (referenceDate > end) {
            const diffTime = referenceDate.getTime() - end.getTime();
            const d = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (d > 0) {
              autoDays = d;
              // If no late fee saved yet, auto calculate based on rent per day
              if (initialLateFee === 0) {
                const rDays = calcRentalDays(data.startDate, data.endDate);
                const itemsList = Array.isArray(data.items) ? data.items : [];
                const rSub = itemsList.reduce((sum: number, item: any) => {
                  return sum + Number(item.price ?? 0) * Number(item.quantity ?? 1) * rDays;
                }, 0);
                const rentPerDay = rSub / rDays;
                initialLateFee = Math.round(rentPerDay * d);
              }
            }
          }
        } else {
          autoDays = (data as any).overdueDays || '';
        }

        setLateFee(initialLateFee);
        setDamageFee(data.damageFee || 0);
        setStatus(data.status || "pending");
        setPaymentStatus(data.paymentStatus || "pending");
        setOverdueDays(autoDays);
        setSelectedErrors((data as any).damageErrors || []);
        setLostItemIds((data as any).lostItems || []);
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

  // Hàm xử lý lưu tất cả thay đổi (Phí + Trạng thái)
  const handleUpdateOrder = async () => {
    setIsUpdating(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedBy = userData?.name || userData?.email || "Quản trị viên";

      const res = await axios.put(`http://localhost:3000/orders/${id}`, {
        lateFee,
        damageFee,
        status,
        paymentStatus,
        overdueDays,
        damageErrors: selectedErrors,
        lostItems: lostItemIds,
        updatedBy
      });
      setOrder(res.data); // Cập nhật lại UI sau khi lưu thành công
      alert("Cập nhật đơn hàng thành công!");
    } catch (err) {
      alert("Không thể lưu chi phí. Vui lòng kiểm tra lại server.");
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

  // Tiền cọc bị giữ do sản phẩm mất
  const getItemKey = (item: OrderItem, idx: number) => item._id || `idx_${idx}`;

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



  const customerName =
    order?.customerName ||
    (typeof order?.userId === "object" ? (order?.userId?.fullName || order?.userId?.name) : undefined) ||
    order?.shippingAddress?.receiverName ||
    "Khách tại quầy";

  const customerPhone =
    order?.customerPhone ||
    order?.shippingAddress?.receiverPhone ||
    (typeof order?.userId === "object" ? (order?.userId?.phone || order?.userId?.email) : "Chưa cập nhật");

  const buildAddress = (sa?: any) => {
    if (!sa) return null;
    const parts = [sa.line1 || sa.address, sa.ward, sa.district, sa.province || sa.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const customerAddress =
    order?.customerAddress || buildAddress(order?.shippingAddress) || "Đơn tại quầy / Không giao hàng";

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
        {/* Nút lưu tích hợp cả phí và trạng thái */}
        <button
          onClick={handleUpdateOrder}
          disabled={isUpdating || isLocked}
          className={`px-6 py-2 text-white rounded-lg font-bold text-sm transition-all ${isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            }`}
          title={isLocked ? "Đơn hàng đã chốt và thanh toán hoàn tất, không thể chỉnh sửa" : ""}
        >
          {isUpdating ? "Đang lưu..." : isLocked ? "Đã chốt đơn" : "Lưu thay đổi"}
        </button>
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
          {/* Dropdown thay đổi trạng thái đơn hàng */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLocked}
            className={`px-3 py-1 rounded-full text-xs font-semibold outline-none border-none shadow-sm ${isLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"} ${statusBadge(status)}`}
          >
            <option value="pending" disabled={!getAvailableStatuses(order.status).includes("pending")}>Chờ xử lý</option>
            <option value="confirmed" disabled={!getAvailableStatuses(order.status).includes("confirmed")}>Đã xác nhận</option>
            <option value="preparing" disabled={!getAvailableStatuses(order.status).includes("preparing")}>Đang chuẩn bị hàng</option>
            <option value="shipped" disabled={!getAvailableStatuses(order.status).includes("shipped")}>Đang giao</option>
            <option value="delivered" disabled={!getAvailableStatuses(order.status).includes("delivered")}>Đã giao</option>
            <option value="renting" disabled={!getAvailableStatuses(order.status).includes("renting")}>Đang thuê</option>
            <option value="returning" disabled={!getAvailableStatuses(order.status).includes("returning")}>Đang trả đồ</option>
            <option value="returned" disabled={!getAvailableStatuses(order.status).includes("returned")}>Đã nhận đồ</option>
            <option value="fee_incurred" disabled={!getAvailableStatuses(order.status).includes("fee_incurred")}>Phát sinh phí</option>
            <option value="completed" disabled={!getAvailableStatuses(order.status).includes("completed")}>Hoàn tất</option>
            <option value="cancelled" disabled={!getAvailableStatuses(order.status).includes("cancelled")}>Đã hủy</option>
          </select>

          {/* Dropdown thay đổi trạng thái thanh toán */}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            disabled={isLocked}
            className={`px-3 py-1 rounded-full text-xs font-semibold outline-none border-none shadow-sm ${isLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"} ${paymentBadge(paymentStatus)}`}
          >
            <option value="pending" disabled={!getAvailablePaymentStatuses(order.paymentStatus).includes("pending")}>Chưa thanh toán</option>
            <option value="paid" disabled={!getAvailablePaymentStatuses(order.paymentStatus).includes("paid")}>Đã thanh toán</option>
            <option value="deposit_returned" disabled={!getAvailablePaymentStatuses(order.paymentStatus).includes("deposit_returned")}>Đã hoàn cọc</option>
            <option value="success" disabled={!getAvailablePaymentStatuses(order.paymentStatus).includes("success")}>Hoàn thành</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (Sản phẩm & Lịch sử) */}
        <div className="lg:col-span-2 space-y-6">

          {/* KHỐI THÔNG TIN KHÁCH HÀNG */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Thông tin khách hàng
              </span>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Họ & Tên</div>
                <div className="font-bold text-gray-800 text-base">{customerName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Số ĐT khách</div>
                <div className="font-bold text-blue-600 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-lg inline-block">{customerPhone}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Địa chỉ (Nếu giao)</div>
                <div className="font-medium text-gray-700 leading-snug">{customerAddress}</div>
              </div>
            </div>

            {(order.bankAccount || order.bankName) && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Tài khoản ngân hàng (hoàn cọc)
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {order.bankName && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Ngân hàng:</span>
                      <span className="font-bold text-emerald-700">{order.bankName}</span>
                    </div>
                  )}
                  {order.bankAccount && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Số tài khoản:</span>
                      <span className="font-bold text-emerald-700 tracking-wider">{order.bankAccount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.note && (
              <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
                <div className="text-[10px] font-bold text-yellow-600 uppercase mb-1.5 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Ghi chú từ khách:</div>
                <div className="text-gray-600 italic bg-yellow-50 p-3.5 rounded-lg text-sm border border-yellow-100/50">{order.note}</div>
              </div>
            )}
          </div>

          {/* KHỐI SẢN PHẨM */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Sản phẩm ({items.length})
                </div>
                <div className="text-xs text-gray-500 mt-1.5 font-medium">
                  Thời gian thuê: {formatDate(order.startDate)} - {formatDate(order.endDate)} <span className="mx-2 text-gray-300">|</span> {rentalDays} ngày
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">Không có sản phẩm trong đơn hàng.</div>
            ) : (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const product =
                    typeof item.productId === "object" ? item.productId : null;
                  const name = product?.name || item.name || "Sản phẩm";
                  const quantity = Number(item.quantity ?? 1);
                  const price = Number(item.price ?? 0);
                  const deposit = Number(item.deposit ?? 0);
                  const itemTotal = (price * rentalDays + deposit) * quantity;
                  const itemKey = getItemKey(item, idx);
                  const isLost = lostItemIds.includes(itemKey);

                  const toggleLost = () => {
                    const willBeLost = !isLost;
                    setLostItemIds(prev =>
                      willBeLost ? [...prev, itemKey] : prev.filter(k => k !== itemKey)
                    );
                    // Khi chọn mất đồ, xóa hết các mục lỗi hư hỏng đã chọn
                    if (willBeLost) {
                      setSelectedErrors([]);
                      setDamageFee(0);
                    }
                  };

                  return (
                    <div
                      key={item._id || idx}
                      className={`flex items-start justify-between gap-4 border rounded-xl p-4 transition-all ${isLost
                        ? "border-red-200 bg-red-50/50"
                        : "border-gray-100 bg-gray-50/30"
                        }`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <label className={`flex flex-col items-center gap-1.5 pt-1 ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`} title="Đánh dấu sản phẩm bị mất">
                          <input
                            type="checkbox"
                            checked={isLost}
                            disabled={isLocked}
                            onChange={toggleLost}
                            className={`w-4 h-4 rounded text-red-600 focus:ring-red-500 ${isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                          />
                          <span className="text-[10px] text-red-500 font-bold uppercase leading-tight text-center">Mất</span>
                        </label>

                        <div className="flex-1">
                          <div className={`text-base font-bold mb-1 ${isLost ? "text-red-700 line-through opacity-70" : "text-gray-800"}`}>
                            {product?._id ? (
                              <Link to={`/admin/products/${product._id}`} className="hover:text-blue-600 hover:underline transition-colors" target="_blank" title="Xem chi tiết sản phẩm">
                                {name}
                              </Link>
                            ) : (
                              <span>{name}</span>
                            )}
                            {isLost && <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded no-underline inline-block">⚠ Đã mất</span>}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            Size: {item.size || "-"} <span className="mx-1 text-gray-300">·</span> Màu: {item.color || "-"} <span className="mx-1 text-gray-300">·</span> SL: {quantity}
                          </div>
                          {isLost && (
                            <div className="text-xs text-red-600 font-semibold mt-2 inline-block">
                              * Tịch thu cọc: {formatCurrency(deposit * quantity)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-sm font-semibold mb-1 ${isLost ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {formatCurrency(price)} / ngày
                        </div>
                        <div className={`text-xs mb-2 font-medium ${isLost ? "text-red-500" : "text-gray-500"}`}>
                          Cọc: {formatCurrency(deposit)}
                        </div>
                        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">Thành tiền: {formatCurrency(itemTotal)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LỊCH SỬ TRẠNG THÁI */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Lịch sử thao tác
            </div>

            {(!order.statusHistory || order.statusHistory.length === 0) ? (
              <div className="text-sm text-gray-400 italic text-center py-4">Chưa có lịch sử cập nhật.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {order.statusHistory.map((history, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm group-hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${statusBadge(history.status)}`}>
                          {history.status === 'pending' ? 'Chờ xử lý' :
                            history.status === 'confirmed' ? 'Đã xác nhận' :
                              history.status === 'preparing' ? 'Đang chuẩn bị hàng' :
                                history.status === 'shipped' ? 'Đang giao' :
                                  history.status === 'delivered' ? 'Đã giao' :
                                    history.status === 'renting' ? 'Đang thuê' :
                                      history.status === 'returning' ? 'Đang trả đồ' :
                                        history.status === 'returned' ? 'Đã nhận đồ' :
                                          history.status === 'fee_incurred' ? 'Phát sinh phí' :
                                            history.status === 'completed' ? 'Hoàn tất' :
                                              history.status === 'cancelled' ? 'Đã hủy' : history.status}
                        </span>
                        <time className="text-xs font-semibold text-gray-400">{formatDateTime(history.date)}</time>
                      </div>
                      <div className="text-sm text-gray-600">
                        Người cập nhật: <span className="font-bold text-gray-800">{history.updatedBy || 'Hệ thống'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (Thông tin & Thanh toán) */}
        <div className="space-y-6">



          {/* KHỐI PHÍ PHÁT SINH */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Các Khoản Thu Thêm
            </div>

            <div className={`space-y-4 ${isLocked ? "pointer-events-none opacity-60" : ""}`}>
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-2 block uppercase">Phạt Trễ Hạn</label>
                <div className="flex gap-2">
                  <div className="relative w-1/3">
                    <input
                      type="number"
                      readOnly
                      value={overdueDays}
                      placeholder="Ngày"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-gray-100 outline-none transition-all pr-8 font-medium cursor-not-allowed"
                      title="Hệ thống tự động tính ngày trễ hạn dựa vào thời gian trả đồ"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">ngày</span>
                  </div>
                  <div className="relative w-2/3">
                    <input
                      type="number"
                      readOnly
                      value={lateFee === 0 ? '' : lateFee}
                      placeholder="Số tiền"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 outline-none transition-all font-bold text-red-600 pr-7 cursor-not-allowed"
                      title="Số tiền phạt do hệ thống tự đánh giá tự động dựa theo ngày"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">đ</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-2 block uppercase">Phạt Hư Hỏng (Trừ vô cọc)</label>
                <div className="mb-3 grid grid-cols-1 gap-2 border border-gray-100 p-3 rounded-lg bg-gray-50/50 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {[
                    { id: 'stain', label: 'Vết bẩn khó giặt', fee: 30000 },
                    { id: 'tear_minor', label: 'Rách/xước nhỏ', fee: 50000 },
                    { id: 'tear_major', label: 'Rách lớn/Hỏng khóa', fee: 100000 },
                    { id: 'burn', label: 'Cháy/Thủng', fee: 200000 },
                    { id: 'lost_item', label: 'Mất đồ/Phụ kiện', fee: 300000 },
                  ].map(error => {
                    const isDisabled = lostItemIds.length > 0 || (error.id !== 'lost_item' && selectedErrors.includes('lost_item'));
                    return (
                      <label key={error.id} className={`flex items-start gap-2.5 group ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          disabled={isDisabled}
                          className={`rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 mt-0.5 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                          checked={selectedErrors.includes(error.id)}
                          onChange={(e) => {
                            let newErrors = [...selectedErrors];
                            let currentDamageFee = damageFee;

                            if (e.target.checked) {
                              if (error.id === 'lost_item') {
                                newErrors = ['lost_item'];
                                currentDamageFee = error.fee;
                              } else {
                                newErrors.push(error.id);
                                currentDamageFee += error.fee;
                              }
                            } else {
                              newErrors = newErrors.filter(id => id !== error.id);
                              currentDamageFee = Math.max(0, currentDamageFee - error.fee);
                            }

                            setSelectedErrors(newErrors);
                            setDamageFee(currentDamageFee);
                          }}
                        />
                        <div className="flex-1 flex flex-col">
                          <span className="text-[13px] text-gray-700 font-medium group-hover:text-red-700 transition-colors">{error.label}</span>
                          <span className="text-[11px] font-bold text-red-500 mt-0.5">+{formatCurrency(error.fee).replace(' đ', 'đ')}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    disabled={lostItemIds.length > 0 || selectedErrors.includes('lost_item')}
                    value={damageFee === 0 ? '' : damageFee}
                    onChange={(e) => setDamageFee(Number(e.target.value) || 0)}
                    placeholder="Nhập tổn thất khác..."
                    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none transition-all font-bold text-red-600 pr-7 bg-red-50 focus:bg-white ${(lostItemIds.length > 0 || selectedErrors.includes('lost_item')) ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">đ</span>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-red-50/80 rounded-lg p-3 border border-red-100 flex justify-between items-center">
              <span className="text-xs font-bold text-red-700 uppercase">Tổng phạt:</span>
              <span className="text-base font-black text-red-600">{formatCurrency(lateFee + damageFee)}</span>
            </div>
          </div>

          {/* KHỐI TỔNG KẾT & THANH TOÁN MỚI */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            {/* Header thông tin GD */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phương thức</div>
                <div className="font-bold text-gray-800 uppercase text-sm">{paymentLabel(order.paymentMethod)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trạng thái GD</div>
                <div className={`font-bold text-sm ${paymentStatus === 'success' ? 'text-emerald-600' :
                  paymentStatus === 'paid' ? 'text-green-600' :
                    paymentStatus === 'deposit_returned' ? 'text-teal-600' :
                      'text-blue-600'
                  }`}>
                  {paymentStatusLabel(paymentStatus)}
                </div>
              </div>
            </div>

            {/* BANNER HOÀN CỌC */}
            {(paymentStatus === 'deposit_returned' || paymentStatus === 'success' || paymentStatus === 'completed') && (() => {
              // Tìm entry hoàn cọc gần nhất trong paymentStatusHistory
              const refundEntry = order.paymentStatusHistory
                ? [...order.paymentStatusHistory].reverse().find(
                  h => h.status === 'deposit_returned' || h.status === 'success' || h.status === 'completed'
                )
                : undefined;
              return (
                <div className="mx-4 my-3 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-black text-teal-700 uppercase tracking-wider mb-1.5">Tiền cọ đã hoàn lại cho khách</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-teal-600">
                        {formatCurrency(Math.max(0, depositTotal - damageFee - lostDepositTotal))}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[12px] text-teal-700/80 font-medium">
                      <div className="flex justify-between">
                        <span>Cọ ban đầu:</span>
                        <span className="font-bold">{formatCurrency(depositTotal)}</span>
                      </div>
                      {(damageFee + lostDepositTotal) > 0 && (
                        <div className="flex justify-between text-red-500">
                          <span>Trừ khấu trừ (hư hỏng/mất đồ):</span>
                          <span className="font-bold">- {formatCurrency(damageFee + lostDepositTotal)}</span>
                        </div>
                      )}
                    </div>
                    {refundEntry && (
                      <div className="mt-3 pt-3 border-t border-teal-200 flex items-center gap-2 text-[11px] text-teal-600">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>Hoàn cọc bởi: <strong className="text-teal-800">{refundEntry.updatedBy || 'Hệ thống'}</strong></span>
                        <span className="ml-auto text-teal-400 font-medium">{formatDateTime(refundEntry.date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* PHẦN 1: TỔNG ĐƠN KHÁCH TRẢ BAN ĐẦU */}
            <div className="p-5 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">1. Đơn Gốc (Lúc Đặt Hàng)</h3>
              </div>

              <div className="space-y-2.5 text-[13px] text-gray-600 font-medium pl-3.5">
                <div className="flex justify-between items-center">
                  <span>Tổng tiền thuê:</span>
                  <span className="font-bold text-gray-800">{formatCurrency(rentalSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-700 bg-blue-50/50 p-1 rounded">
                  <span>Tiền cọc giữ đồ:</span>
                  <span className="font-bold">{formatCurrency(depositTotal)}</span>
                </div>
              </div>
            </div>

            {/* PHẦN 2: DOANH THU THỰC NHẬN CỦA SHOP */}
            <div className="p-5 bg-gradient-to-br from-[#0B1528] to-[#1A2C4E] text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-yellow-400 rounded-full"></div>
                <h3 className="text-xs font-black text-yellow-50 uppercase tracking-widest">2. Thực Thu Cuối Cùng (Shop)</h3>
              </div>

              <div className="space-y-3 text-[13px] text-gray-300 font-medium pl-3.5">
                <div className="flex justify-between items-center">
                  <span>Tiền thuê gốc:</span>
                  <span className="font-bold text-white">{formatCurrency(rentalSubtotal)}</span>
                </div>

                {(lateFee + damageFee + lostDepositTotal > 0) && (
                  <div className="flex justify-between items-center text-red-300 bg-red-900/40 px-2 py-1.5 rounded border border-red-500/20">
                    <div className="flex flex-col">
                      <span>Thu thêm (Lỗi/Quá hạn):</span>
                      {lostDepositTotal > 0 && <span className="text-[10px] text-red-400 italic mt-0.5">*Bao gồm {formatCurrency(lostDepositTotal)} cọc bị tịch thu</span>}
                    </div>
                    <span className="font-bold">+{formatCurrency(lateFee + damageFee + lostDepositTotal)}</span>
                  </div>
                )}

                {(paymentStatus === 'deposit_returned' || status === 'completed') && (
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/10 text-emerald-300">
                    <span>Trả cọc khách (Còn lại):</span>
                    <span className="font-bold">{formatCurrency(Math.max(0, depositTotal - damageFee - lostDepositTotal))}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-3 mt-1 border-t border-white/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-yellow-400 uppercase tracking-wide">Doanh Thu Tổng:</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-normal">(Tiền thuê + Thu thêm)</span>
                  </div>
                  <span className="text-[22px] leading-none font-black text-yellow-400 drop-shadow-md">
                    {formatCurrency(rentalSubtotal + lateFee + damageFee + lostDepositTotal)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;