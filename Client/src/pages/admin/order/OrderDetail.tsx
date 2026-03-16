import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      if (!id) return;
      const res = await axios.get(`http://localhost:3000/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error("Lỗi 404: Không tìm thấy đơn hàng trên server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // --- HÀM THAY ĐỔI TRẠNG THÁI ---
  const handleUpdateStatus = async (newStatus: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái đơn hàng sang ${newStatus === 'completed' ? '"Hoàn thành"' : newStatus}?`)) return;
    
    setUpdating(true);
    try {
      await axios.put(`http://localhost:3000/orders/${id}`, { status: newStatus });
      await fetchOrderDetail();
      alert("Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      alert("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.");
    } finally {
      setUpdating(false);
    }
  };

  // --- XỬ LÝ DỮ LIỆU ---
  const unwrapMongoDate = (value: any) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "object") {
      // Mongo Extended JSON shapes
      if (value.$date) {
        const d = value.$date;
        if (typeof d === "string" || typeof d === "number" || d instanceof Date) return d;
        if (d && typeof d === "object" && typeof d.$numberLong === "string") return Number(d.$numberLong);
        return d;
      }
      if (typeof value.$numberLong === "string") return Number(value.$numberLong);
      if (value.date) return value.date;
    }
    return value;
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(unwrapMongoDate(dateString) as any);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString('vi-VN');
  };

  const orderDate = formatDate(order?.createdAt);
  const calculateDays = (start: any, end: any) => {
    if (!start || !end) return 0;
    const s = new Date(unwrapMongoDate(start) as any);
    const e = new Date(unwrapMongoDate(end) as any);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const rentals = (order?.items || [])
    .map((it: any) => it?.rental)
    .filter(Boolean);

  const startMsList = rentals
    .map((r: any) => new Date(unwrapMongoDate(r?.startDate) as any).getTime())
    .filter((t: number) => !Number.isNaN(t));

  const endMsList = rentals
    .map((r: any) => new Date(unwrapMongoDate(r?.endDate) as any).getTime())
    .filter((t: number) => !Number.isNaN(t));

  const earliestStartMs =
    startMsList.length > 0 ? Math.min(...startMsList) : NaN;

  const latestEndMs =
    endMsList.length > 0 ? Math.max(...endMsList) : NaN;

  const fallbackStart = order?.startDate;
  const fallbackEnd = order?.endDate;

  const rentalDaysFromItems = Number(
    rentals.reduce((sum: number, r: any) => sum + (Number(r?.days) || 0), 0)
  );

  const derivedEndMs =
    Number.isFinite(latestEndMs)
      ? latestEndMs
      : Number.isFinite(earliestStartMs) && rentalDaysFromItems > 0
        ? earliestStartMs + (rentalDaysFromItems - 1) * 24 * 60 * 60 * 1000
        : NaN;

  const rentalStartDate = Number.isFinite(earliestStartMs)
    ? formatDate(new Date(earliestStartMs))
    : formatDate(fallbackStart);

  const rentalEndDate = Number.isFinite(derivedEndMs)
    ? formatDate(new Date(derivedEndMs))
    : formatDate(fallbackEnd || (Number.isFinite(earliestStartMs) ? new Date(earliestStartMs) : null));

  const rentalDaysFromRange = calculateDays(
    Number.isFinite(earliestStartMs) ? new Date(earliestStartMs) : fallbackStart,
    Number.isFinite(derivedEndMs) ? new Date(derivedEndMs) : fallbackEnd
  );

  // Yêu cầu: tổng số ngày thuê = cộng tổng từng item
  const rentalDays =
    rentalDaysFromItems ||
    rentalDaysFromRange ||
    (rentalStartDate !== "Chưa cập nhật" ? 1 : 0);
  
  const total = Number(order?.total || 0);
  const depositFromOrder = Number(order?.totalDeposit || order?.shippingAddress?.totalDeposit || 0);
  const depositFromItems = Number(
    order?.items?.reduce((sum: number, item: any) => sum + (Number(item?.deposit) || 0), 0) || 0
  );
  const deposit = depositFromOrder > 0 ? depositFromOrder : depositFromItems;
  const depositRefunded = Number(order?.depositRefunded ?? (order?.status === "completed" ? deposit : 0));
  // Một số nguồn dữ liệu tách cọc (có `totalDeposit`), một số đã gộp cọc vào `total`.
  const hasSeparateDepositField = Number(order?.totalDeposit || order?.shippingAddress?.totalDeposit || 0) > 0;
  const grossCollected = hasSeparateDepositField ? total + deposit : total;
  const rentalFee = hasSeparateDepositField ? total : Math.max(total - deposit, 0);

  const displayRentalFee = rentalFee.toLocaleString();
  const displayDeposit = deposit.toLocaleString();
  const isCompleted = order?.status === "completed";
  const keptDeposit = Math.max(deposit - (isCompleted ? depositRefunded : 0), 0);
  // Thực nhận:
  // - Chưa completed: đang giữ tiền đã thu (gross)
  // - Completed: gross - tiền cọc đã hoàn (nếu hoàn thiếu thì phần giữ lại vẫn nằm trong net)
  const netCollected = isCompleted ? Math.max(grossCollected - depositRefunded, 0) : grossCollected;
  const displayNetCollected = netCollected.toLocaleString();
  const displayDepositRefunded = (isCompleted ? depositRefunded : deposit).toLocaleString();
  const displayKeptDeposit = keptDeposit.toLocaleString();

  if (loading) return <div className="p-10 text-center animate-pulse">Đang tải...</div>;
  
  if (!order) return (
    <div className="p-10 text-center">
      <p className="text-red-500 font-bold">Không tìm thấy đơn hàng này.</p>
      <button onClick={() => navigate(-1)} className="text-blue-500 underline mt-2">Quay lại</button>
    </div>
  );

  const customerName =
    order?.userId?.name ||
    order?.shippingAddress?.receiverName ||
    order?.shippingAddress?.name ||
    "Khách tại quầy";
  const customerPhone =
    order?.userId?.phone ||
    order?.shippingAddress?.receiverPhone ||
    order?.shippingAddress?.phone ||
    "";

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-700 font-sans">
      {/* Header đơn giống screenshot: breadcrumb + mã đơn + trạng thái + button */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <span>⟵</span>
              <span>Quay lại danh sách</span>
            </button>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900">
                Đơn hàng #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
              </h1>
              <span className="text-xs text-slate-400">
                Đặt hàng lúc {orderDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === "completed"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100"
              }`}
            >
              {order.status === "completed" ? "Hoàn thành" : "Chờ xử lý"}
            </span>
            {order.status !== "completed" && (
              <button
                onClick={() => handleUpdateStatus("completed")}
                disabled={updating}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:bg-slate-400"
              >
                {updating ? "Đang xử lý..." : "Hoàn thành"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body 2 hàng giống layout: Thông tin KH + Sản phẩm + Tổng quan + Thanh toán */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Hàng 1: Thông tin khách hàng + Tổng quan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Thông tin khách hàng */}
          <div className="bg-white border rounded-lg p-5 lg:col-span-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase mb-4">
              Thông tin khách hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Tên người nhận</p>
                <p className="font-semibold">
                  {customerName || "Không có tên khách"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Số điện thoại</p>
                <p className="font-semibold">
                  {customerPhone || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p className="text-slate-400 text-xs mb-1">Địa chỉ giao hàng</p>
              <p className="font-medium">
                {order.shippingAddress?.line1 ||
                  order.shippingAddress?.address ||
                  "Đơn thuê tại quầy / Không giao hàng"}
              </p>
            </div>
          </div>

          {/* Tổng quan */}
          <div className="bg-white border rounded-lg p-5 text-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase mb-4">
              Tổng quan
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền thuê</span>
                <span className="font-semibold">{displayRentalFee}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-semibold">
                  {(order.shippingFee || 0).toLocaleString()} đ
                </span>
              </div>
            </div>
            <div className="mt-3 border-t pt-3 flex justify-between items-center">
              <span className="text-xs uppercase text-slate-500 font-semibold">
                Tổng thanh toán
              </span>
              <span className="text-lg font-bold text-slate-900">
                {grossCollected.toLocaleString()} đ
              </span>
            </div>
          </div>
        </div>

        {/* Hàng 2: Sản phẩm + Thanh toán */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sản phẩm */}
          <div className="bg-white border rounded-lg p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase">
                Sản phẩm ({order.items?.length || 0})
              </h2>
              <p className="text-xs text-slate-400">
                Thời gian thuê: {rentalStartDate} → {rentalEndDate} ·{" "}
                {rentalDays} ngày
              </p>
            </div>
            <div className="divide-y">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex justify-between text-sm">
                  <div>
                    <p className="font-semibold">
                      {item.name || "Sản phẩm thuê"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.size || "F"} · {item.color || "N/A"} ·{" "}
                      {item.rental?.days || 1} ngày
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {(item.lineTotal || item.price || 0).toLocaleString()}đ
                    </p>
                    <p className="text-xs text-slate-400">
                      Cọc: {(item.deposit || 0).toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thanh toán */}
          <div className="bg-white border rounded-lg p-5 text-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase mb-4">
              Thanh toán
            </h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-semibold uppercase">
                  {order.paymentMethod || "Tiền mặt"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái</span>
                <span
                  className={`font-semibold ${
                    order.paymentStatus === "paid"
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                >
                  {order.paymentStatus === "paid"
                    ? "Đã thanh toán"
                    : order.paymentStatus || "Chưa thanh toán"}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Phí thuê</span>
                <span className="font-bold">{displayRentalFee}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">
                  {isCompleted ? "Cọc đã hoàn" : "Tiền đặt cọc"}
                </span>
                <span className={isCompleted ? "text-rose-300 font-bold" : "text-emerald-300 font-bold"}>
                  {isCompleted ? "-" : "+"}
                  {displayDepositRefunded}đ
                </span>
              </div>
              {isCompleted && keptDeposit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Cọc giữ lại</span>
                  <span className="text-amber-300 font-bold">
                    +{displayKeptDeposit}đ
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-xs uppercase text-slate-400 font-semibold">
                  Thực nhận
                </span>
                <span className="text-xl font-bold">
                  {displayNetCollected}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;