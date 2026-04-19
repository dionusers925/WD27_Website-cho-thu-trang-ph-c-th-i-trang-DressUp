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
  status: "pending" | "confirmed" | "shipped" | "delivered" | "returning" | "fee_incurred" | "completed" | "cancelled";
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  statusHistory?: {
    status: string;
    updatedBy?: string;
    date: string;
  }[];
  adminReturnMedia?: string[];
  penaltyNote?: string;
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  // Hàm xử lý nhận đồ
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

  // Hàm xử lý trả đồ (mở modal)
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

      // Upload từng file
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
                {/* Header đơn hàng */}
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
                      {order.total.toLocaleString()}đ
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

                  {/* Thông báo mới từ cửa hàng */}
                  {order.status === 'returned' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-black animate-pulse border border-orange-200 uppercase tracking-tighter">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Có thông báo kiểm đồ
                    </div>
                  )}

                  {/* Nút đã nhận */}
                  {(order.status === "shipped" || order.status === "delivered") && (
                    <button
                      onClick={() => handleReceiveOrder(order._id)}
                      className="px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition"
                    >
                      ✅ Đã nhận
                    </button>
                  )}

                  {/* Nút trả đồ - hiển thị khi đang thuê */}
                  {(order.status === "delivered" || order.status === "renting") && (
                    <button
                      onClick={() => handleReturnOrder(order._id)}
                      className="px-3 py-1.5 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition"
                    >
                      📦 Trả đồ
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Xem chi tiết →
                  </button>
                </div>

                {/* Danh sách sản phẩm */}
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
                          <span>Số lượng: {item.quantity}</span>
                          <span>Size: {item.size || "M"}</span>
                          <span>Màu: {item.color || "Đen"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.price.toLocaleString()}đ</p>
                        <p className="text-sm text-gray-500">Tiền cọc: {item.deposit?.toLocaleString()}đ</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header - cố định ở trên, thêm rounded-t-xl */}
            <div className="bg-white rounded-t-xl px-4 py-3 border-b flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Nội dung cuộn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Thông báo nổi bật khi đã nhận đồ */}
              {selectedOrder.status === 'returned' && (
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg border border-orange-400 flex items-start gap-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 shadow-inner">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-sm uppercase tracking-wider mb-1">Cửa hàng đã nhận được đồ!</div>
                    <p className="text-xs text-orange-50 font-medium leading-relaxed">
                      Nhân viên đã hoàn tất kiểm tra tình trạng đồ bạn trả. Vui lòng xem kỹ ghi chú và hình ảnh minh chứng phía dưới để biết chi tiết về tình trạng sản phẩm và các phí phát sinh (nếu có).
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Mã đơn hàng</p>
                  <p className="font-mono">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Ngày đặt</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Trạng thái</p>
                  <p className={getStatusText(selectedOrder.status).color}>
                    {getStatusText(selectedOrder.status).text}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Thanh toán</p>
                  <p>{selectedOrder.paymentMethod === "vnpay" ? "VNPay" : "Tiền mặt"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Thông tin nhận hàng</h3>
                <p><span className="text-gray-500">Người nhận:</span> {selectedOrder.customerName || "Khách hàng"}</p>
                <p><span className="text-gray-500">SĐT:</span> {selectedOrder.customerPhone || "Chưa cập nhật"}</p>
                <p><span className="text-gray-500">Địa chỉ:</span> {selectedOrder.customerAddress || "Chưa cập nhật"}</p>
              </div>

              {/* Thông tin ngân hàng */}
              {(selectedOrder.bankName || selectedOrder.bankAccount || selectedOrder.bankHolder) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Thông tin nhận hoàn cọc</h3>
                  {selectedOrder.bankName && <p><span className="text-gray-500">Ngân hàng:</span> {selectedOrder.bankName}</p>}
                  {selectedOrder.bankAccount && <p><span className="text-gray-500">Số tài khoản:</span> {selectedOrder.bankAccount}</p>}
                  {selectedOrder.bankHolder && <p><span className="text-gray-500">Chủ tài khoản:</span> {selectedOrder.bankHolder}</p>}
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Sản phẩm</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pb-3 border-b">
                      <img
                        src={item.productId?.images?.[0] || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name || item.productId?.name}</h4>
                        <div className="flex gap-3 text-sm text-gray-500">
                          <span>Số lượng: {item.quantity}</span>
                          <span>Size: {item.size || "M"}</span>
                          <span>Màu: {item.color || "Đen"}</span>
                        </div>
                        <p className="text-sm text-gray-500">Tiền cọc: {item.deposit?.toLocaleString()}đ</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{item.price.toLocaleString()}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{selectedOrder.total.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Kiểm tra từ cửa hàng (Minh chứng Admin) */}
              {(selectedOrder.penaltyNote || (selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0)) && (
                <div className="border-t pt-4 bg-orange-50/30 -mx-4 px-4 pb-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04 bonus 11.955 11.955 0 01-1.539 1.118l1.035 1.035a2.121 2.121 0 003 0l6.364-6.364a2.121 2.121 0 000-3z" /></svg>
                    Kiểm tra từ cửa hàng
                  </h3>
                  
                  {selectedOrder.penaltyNote && (
                    <div className="bg-white p-3 rounded-lg border border-orange-100 text-sm text-gray-700 mb-3 italic shadow-sm">
                      <span className="font-bold text-orange-600 not-italic block mb-1">Ghi chú từ nhân viên:</span>
                      "{selectedOrder.penaltyNote}"
                    </div>
                  )}

                  {selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedOrder.adminReturnMedia.map((url, idx) => {
                        const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes("video");
                        return (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-orange-200 bg-white shadow-sm">
                            {isVideo ? (
                              <video src={url} controls className="w-full h-full object-cover" />
                            ) : (
                              <img 
                                src={url} 
                                alt="Inspection" 
                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                                onClick={() => window.open(url, '_blank')}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Lịch sử đơn hàng */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Lịch sử đơn hàng
                  </h3>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="relative flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 z-10">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getStatusText(history.status).color}`}>
                              {getStatusText(history.status).text}
                            </span>
                            <time className="text-xs font-semibold text-gray-500">
                              {new Date(history.date || new Date()).toLocaleString("vi-VN")}
                            </time>
                          </div>

                          {/* Hiển thị đính kèm cho khách xem nếu là trạng thái 'returned' */}
                          {history.status === 'returned' && (
                            <div className="mt-2 bg-orange-50/50 border border-orange-100 rounded-lg p-2.5">
                              <div className="text-[10px] font-bold text-orange-600 uppercase mb-1.5 font-sans">Minh chứng từ cửa hàng:</div>
                              {selectedOrder.penaltyNote && (
                                <div className="text-xs text-gray-700 italic mb-2 px-2 py-1.5 bg-white/80 rounded border border-orange-50">
                                  "{selectedOrder.penaltyNote}"
                                </div>
                              )}
                              {selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0 && (
                                <div className="grid grid-cols-5 gap-1.5">
                                  {selectedOrder.adminReturnMedia.map((url, i) => {
                                    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes("video");
                                    return (
                                      <div key={i} className="aspect-square rounded border border-orange-200 overflow-hidden bg-white shadow-sm">
                                        {isVideo ? (
                                          <video src={url} className="w-full h-full object-cover" />
                                        ) : (
                                          <img 
                                            src={url} 
                                            alt="Inspection" 
                                            className="w-full h-full object-cover cursor-pointer" 
                                            onClick={() => window.open(url, '_blank')}
                                          />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
    </div>
  );
}