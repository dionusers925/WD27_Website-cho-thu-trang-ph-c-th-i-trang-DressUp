import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface OrderItem {
  productId: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  };
  name?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  deposit: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "returning" | "renting" | "fee_incurred" | "completed" | "cancelled" |"returned";
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  customerName?: string;
  startDate?: string;       
  customerPhone?: string;
  customerAddress?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  statusHistory?: {
    status: string;
    updatedBy?: string;
    date: string;
    notes?: string;
  }[];
  adminReturnMedia?: string[];
  penaltyNote?: string;
  endDate?: string;
  shippingAddress?: {
    receiverName?: string;
    receiverPhone?: string;
    name?: string;
    phone?: string;
    line1?: string;
    address?: string;
  };
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    note?: string;
  };
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingInspection, setViewingInspection] = useState<Order | null>(null);

  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) {
        alert("Vui lòng đăng nhập");
        navigate("/auth/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/orders/my-orders?userId=${user._id}`
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Lỗi lấy lịch sử đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveOrder = async (orderId: string) => {
    if (!confirm("Bạn xác nhận đã nhận được đồ?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) {
        alert("Vui lòng đăng nhập");
        return;
      }

      await axios.put(
        `http://localhost:3000/orders/${orderId}`,
        {
          status: "renting",
          updatedBy: user.name || user.email || "Khách hàng"
        }
      );

      alert("Đã xác nhận nhận đồ thành công!");
      fetchOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleReturnOrder = (orderId: string) => {
    setReturnOrderId(orderId);
    setReturnFiles([]);
  };

  const handleReturnFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReturnFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeReturnFile = (index: number) => {
    setReturnFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReturnRequest = async () => {
    if (!returnOrderId) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) {
        alert("Vui lòng đăng nhập");
        return;
      }

      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of returnFiles) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const dataUrl = await base64Promise;

        const uploadRes = await axios.post("http://localhost:3000/api/uploads", {
          dataUrl,
          fileName: file.name,
        });

        if (uploadRes.data.url) {
          uploadedUrls.push(uploadRes.data.url);
        }
      }

      await axios.put(`http://localhost:3000/orders/${returnOrderId}`, {
        status: "returning",
        updatedBy: user.name || user.email || "Khách hàng",
        returnMedia: uploadedUrls,
      });

      alert("Đã gửi yêu cầu trả đồ thành công!");
      setReturnOrderId(null);
      setReturnFiles([]);
      fetchOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: "Chờ xác nhận", color: "text-yellow-600 bg-yellow-50" },
      confirmed: { text: "Đã xác nhận", color: "text-blue-600 bg-blue-50" },
      shipped: { text: "Đang giao", color: "text-purple-600 bg-purple-50" },
      delivered: { text: "Đã giao", color: "text-green-600 bg-green-50" },
      returning: { text: "Đang trả đồ", color: "text-orange-600 bg-orange-50" },
      picked_up: { text: "Đã lấy đơn", color: "text-blue-600 bg-blue-50" },
      returned: { text: "Đã trả đồ", color: "text-teal-600 bg-teal-50" },
      renting: { text: "Đang thuê", color: "text-cyan-600 bg-cyan-50" },
      fee_incurred: { text: "Phát sinh phí", color: "text-red-600 bg-red-50" },
      completed: { text: "Hoàn thành", color: "text-green-600 bg-green-50" },
      cancelled: { text: "Đã hủy", color: "text-gray-600 bg-gray-50" },
    };
    return statusMap[status] || { text: status, color: "text-gray-600 bg-gray-50" };
  };

  const getPaymentStatusText = (status: string) => {
    return status === "paid" ? "Đã thanh toán" : "Chưa thanh toán";
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-28 pb-12 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Lịch sử đơn hàng</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = getStatusText(order.status);
            return (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="text-gray-500 text-sm">Mã đơn hàng</span>
                    <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Ngày đặt</span>
                    <p className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Tổng tiền</span>
                    <p className="text-lg font-bold text-blue-600">
                      {(order.total || 0).toLocaleString()}đ
                    </p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Thanh toán</span>
                    <p className={`text-sm font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-red-500"}`}>
                      {getPaymentStatusText(order.paymentStatus)}
                    </p>
                  </div>

                  {order.status === 'returned' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setViewingInspection(order); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-black animate-pulse border border-orange-400 uppercase tracking-tighter hover:bg-orange-600 transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Xem hồ sơ kiểm đồ
                    </button>
                  )}

                  {(order.status === "shipped" || order.status === "delivered") && (
                    <button
                      onClick={() => handleReceiveOrder(order._id)}
                      className="px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition"
                    >
                      Đã nhận
                    </button>
                  )}

                  {order.status === "renting" && (
                    <button
                      onClick={() => handleReturnOrder(order._id)}
                      className="px-3 py-1.5 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition"
                    >
                      Trả đồ
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Xem chi tiết →
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <img
                        src={item.productId?.images?.[0] || "/placeholder.jpg"}
                        alt={item.name || item.productId?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name || item.productId?.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-500 mt-1">
                          <span>Số lượng: {item.quantity || 1}</span>
                          <span>Size: {item.size || "M"}</span>
                          <span>Màu: {item.color || "Đen"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(item.price || 0).toLocaleString()}đ</p>
                        <p className="text-sm text-gray-500">Tiền cọc: {(item.deposit || 0).toLocaleString()}đ</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-gray-400 text-sm text-center">
                      + {order.items.length - 2} sản phẩm khác
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-white px-4 md:px-6 py-3 md:py-4 border-b flex justify-between items-center shrink-0 sticky top-0 z-10">
              <h2 className="text-lg md:text-xl font-bold">Chi tiết đơn hàng #{selectedOrder.orderNumber}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 bg-gray-50/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider">Mã đơn</p>
                  <p className="font-mono text-xs md:text-sm font-medium break-all">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider">Ngày đặt</p>
                  <p className="text-xs md:text-sm">{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider">Trạng thái</p>
                  <p className={`text-xs md:text-sm font-semibold ${getStatusText(selectedOrder.status).color} inline-block px-2 py-0.5 rounded-full`}>
                    {getStatusText(selectedOrder.status).text}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider">Thanh toán</p>
                  <p className="text-xs md:text-sm">{selectedOrder.paymentMethod === "vnpay" ? "VNPay" : "Tiền mặt"}</p>
                </div>
              </div>

              {(() => {
                const firstItem = selectedOrder.items?.[0] as any;
                const startDate = firstItem?.rental?.startDate;
                const endDate = firstItem?.rental?.endDate;
                const days = firstItem?.rental?.days;
                if (!startDate || !endDate) return null;
                return (
                  <div className="bg-blue-50/50 p-3 md:p-4 rounded-xl border border-blue-100">
                    <p className="text-blue-600 text-[11px] md:text-xs font-semibold uppercase tracking-wider mb-2">📅 Thời gian thuê</p>
                    <p className="text-sm md:text-base font-medium">
                      {new Date(startDate).toLocaleDateString("vi-VN")} → {new Date(endDate).toLocaleDateString("vi-VN")}
                      <span className="ml-2 text-blue-500">({days} ngày)</span>
                    </p>
                  </div>
                );
              })()}

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm md:text-base mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Thông tin nhận hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs md:text-sm">
                  {(() => {
                    const customerName = (selectedOrder as any).customerInfo?.fullName ||
                      selectedOrder.customerName ||
                      selectedOrder.shippingAddress?.receiverName ||
                      "Khách hàng";
                    
                    const customerPhone = (selectedOrder as any).customerInfo?.phone ||
                      selectedOrder.customerPhone ||
                      selectedOrder.shippingAddress?.receiverPhone ||
                      "Chưa cập nhật";
                    
                    const customerAddress = (selectedOrder as any).customerInfo?.address ||
                      selectedOrder.customerAddress ||
                      selectedOrder.shippingAddress?.line1 ||
                      "Chưa cập nhật";
                    
                    return (
                      <>
                        <p><span className="text-gray-500">Người nhận:</span> {customerName}</p>
                        <p><span className="text-gray-500">SĐT:</span> {customerPhone}</p>
                        <p><span className="text-gray-500">Địa chỉ:</span> {customerAddress}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {(selectedOrder.bankName || selectedOrder.bankAccount || selectedOrder.bankHolder) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm md:text-base mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Thông tin nhận hoàn cọc
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs md:text-sm">
                    {selectedOrder.bankName && <p><span className="text-gray-500">Ngân hàng:</span> {selectedOrder.bankName}</p>}
                    {selectedOrder.bankAccount && <p><span className="text-gray-500">Số TK:</span> {selectedOrder.bankAccount}</p>}
                    {selectedOrder.bankHolder && <p><span className="text-gray-500">Chủ TK:</span> {selectedOrder.bankHolder}</p>}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm md:text-base mb-3">Sản phẩm ({selectedOrder.items.length})</h3>
                <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 md:gap-4 pb-3 border-b">
                      <img
                        src={item.productId?.images?.[0] || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base truncate">{item.name || item.productId?.name}</h4>
                        <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-500 mt-1">
                          <span>SL: {item.quantity || 1}</span>
                          <span>Size: {item.size || "M"}</span>
                          <span>Màu: {item.color || "Đen"}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Cọc: {(item.deposit || 0).toLocaleString()}đ</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-blue-600 text-sm md:text-base">{(item.price || 0).toLocaleString()}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between py-2 font-bold text-base md:text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{(selectedOrder.total || 0).toLocaleString()}đ</span>
                </div>
              </div>

              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm md:text-base mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Lịch sử đơn hàng
                  </h3>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getStatusText(history.status).color}`}>
                            {getStatusText(history.status).text}
                          </span>
                          <time className="text-[10px] md:text-xs text-gray-500">
                            {new Date(history.date || new Date()).toLocaleString("vi-VN")}
                          </time>
                        </div>
                        {history.notes && (
                          <p className="text-xs text-gray-500 mt-1">{history.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Trả Đồ */}
      {returnOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-lg w-full flex flex-col overflow-hidden">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">Yêu cầu trả đồ</h2>
              <button
                onClick={() => setReturnOrderId(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                Vui lòng cung cấp hình ảnh/video thực tế của sản phẩm trước khi gửi trả (nếu có).
              </p>

              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleReturnFilesChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition w-full"
                >
                  + Tải ảnh/video lên
                </button>
              </div>

              {returnFiles.length > 0 && (
                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                  {returnFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <button
                        onClick={() => removeReturnFile(idx)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 border-t p-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setReturnOrderId(null)}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitReturnRequest}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải lên...
                  </>
                ) : (
                  "Xác nhận trả đồ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM NHANH HỒ SƠ KIỂM ĐỒ */}
      {viewingInspection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
          <div className={`bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-2 transition-all ${['completed', 'fee_incurred'].includes(viewingInspection.status) ? "border-emerald-200 ring-4 ring-emerald-50" : "border-orange-200 ring-4 ring-orange-50"}`}>
            <div className={`text-[11px] font-black uppercase tracking-[0.2em] p-5 border-b flex justify-between items-center transition-colors ${['completed', 'fee_incurred'].includes(viewingInspection.status) ? "text-emerald-700 bg-emerald-50/30 border-emerald-100" : "text-orange-600 bg-orange-50/30 border-orange-100"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{['completed', 'fee_incurred'].includes(viewingInspection.status) ? "✅" : "📷"}</span>
                {['completed', 'fee_incurred'].includes(viewingInspection.status) ? "Hồ sơ kiểm đồ đã lưu" : "Hồ sơ khách trả đồ (Đang xử lý)"}
              </div>
              <button 
                onClick={() => setViewingInspection(null)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all font-bold ${['completed', 'fee_incurred'].includes(viewingInspection.status) ? "bg-emerald-100/50 hover:bg-emerald-200 text-emerald-700" : "bg-orange-100/50 hover:bg-orange-200 text-orange-600"}`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <svg className={`w-3 h-3 ${['completed', 'fee_incurred'].includes(viewingInspection.status) ? "text-emerald-500" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Ghi chú từ cửa hàng
                </label>
                {viewingInspection.penaltyNote ? (
                  <div className={`border-2 p-5 rounded-2xl italic text-gray-800 text-sm shadow-inner relative overflow-hidden group transition-all ${['completed', 'fee_incurred'].includes(viewingInspection.status) ? "bg-emerald-50/20 border-emerald-100" : "bg-orange-50/30 border-orange-100"}`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${['completed', 'fee_incurred'].includes(viewingInspection.status) ? "bg-emerald-400" : "bg-orange-400"}`}></div>
                    <p className="relative z-10 font-medium leading-relaxed">"{viewingInspection.penaltyNote}"</p>
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 rounded-2xl text-[11px] text-gray-400 font-bold uppercase tracking-widest text-center border-2 border-dashed border-gray-100">
                    Chưa có ghi chú kiểm định cụ thể
                  </div>
                )}
              </div>

              {viewingInspection.adminReturnMedia && viewingInspection.adminReturnMedia.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Ảnh / Video minh chứng đã lưu:
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {viewingInspection.adminReturnMedia.map((url, idx) => {
                      const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes("video");
                      return (
                        <div key={idx} className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm hover:shadow-md transition-all group">
                          {isVideo ? (
                            <div className="aspect-video relative bg-black">
                              <video src={url} controls className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="relative overflow-hidden cursor-pointer" onClick={() => window.open(url, '_blank')}>
                              <img 
                                src={url} 
                                alt="Inspection" 
                                className="w-full h-auto max-h-[500px] object-contain transition-transform duration-700 group-hover:scale-105" 
                              />
                              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          )}
                          <div className="absolute top-4 left-4 bg-orange-500/90 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] text-white font-black tracking-widest uppercase border border-white/20 shadow-lg">
                             Minh chứng {idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-white flex justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
              <button 
                onClick={() => setViewingInspection(null)}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
              >
                <span>Xác nhận thông tin</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}