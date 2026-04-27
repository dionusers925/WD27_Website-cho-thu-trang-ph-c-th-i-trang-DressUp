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
  }[];
  adminReturnMedia?: string[];
  penaltyNote?: string;
  endDate?: string; 
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

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedOrderForExtend, setSelectedOrderForExtend] = useState<Order | null>(null);
  const [extendDays, setExtendDays] = useState("");
  const [isExtending, setIsExtending] = useState(false);

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
      console.log("Đơn hàng đầu tiên:", response.data[0]);
      console.log("startDate:", response.data[0]?.startDate);
      console.log("endDate:", response.data[0]?.endDate);
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

  const handleExtendOrder = async () => {
    if (!selectedOrderForExtend) return;
    if (!extendDays) {
      alert("Vui lòng chọn ngày kết thúc mới");
      return;
    }
    
    setIsExtending(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) {
        alert("Vui lòng đăng nhập");
        return;
      }

      const formattedDate = new Date(extendDays).toISOString();
      console.log("📅 Gửi ngày:", formattedDate);

      const response = await axios.post(
        `http://localhost:3000/orders/${selectedOrderForExtend._id}/extend`,
        {
          userId: user._id,
          newEndDate: formattedDate,
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        setShowExtendModal(false);
        fetchOrders();
      }
    } catch (error: any) {
      console.error("Lỗi gia hạn:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi gia hạn");
    } finally {
      setIsExtending(false);
    }
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
    "đã gia hạn": { text: "Đã gia hạn", color: "text-blue-600 bg-blue-50" },
    "đã rút ngắn": { text: "Đã rút ngắn", color: "text-orange-600 bg-orange-50" },
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

                  {(order.status === "delivered" || order.status === "renting") && (
                    <button
                      onClick={() => handleReturnOrder(order._id)}
                      className="px-3 py-1.5 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition"
                    >
                      Trả đồ
                    </button>
                  )}

                  {order.status === "renting" && (
                    <button
                      onClick={() => {
                        setSelectedOrderForExtend(order);
                        setExtendDays("");
                        setShowExtendModal(true);
                      }}
                      className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                    >
                      Gia hạn
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-white rounded-t-xl px-4 py-3 border-b flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20">
              {(selectedOrder.penaltyNote || (selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0)) && (
                <div className="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-bl-xl shadow-sm">Minh chứng từ cửa hàng</div>
                  
                  <div className="flex items-center gap-2 mb-4 border-b border-orange-100 pb-3">
                    <span className="text-xl">📷</span>
                    <h3 className="font-black text-orange-600 uppercase tracking-tight text-sm">Hồ sơ khách trả đồ (Đang xử lý)</h3>
                  </div>
                  
                  {selectedOrder.penaltyNote && (
                    <div className="bg-white p-4 rounded-xl border border-orange-100 text-sm text-gray-700 mb-4 italic shadow-sm relative pl-6">
                      <svg className="w-4 h-4 text-orange-300 absolute left-2 top-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM5.884 6.68a1 1 0 10-1.415-1.414l.707-.707a1 1 0 001.415 1.415l-.707.707zm1.414 8.486a1 1 0 00-1.415-1.415l-.707.707a1 1 0 101.415 1.415l.707-.707zM8.25 4.5a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1a.75.75 0 01.75-.75zM15.75 9a.75.75 0 01.75.75h1a.75.75 0 010 1.5h-1a.75.75 0 01-.75-.75v-1a.75.75 0 01.75-.75z" /></svg>
                      <span className="font-black text-orange-600 not-italic block mb-1.5 text-[10px] uppercase tracking-widest">Ghi chú kiểm định:</span>
                      "{selectedOrder.penaltyNote}"
                    </div>
                  )}

                  {selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedOrder.adminReturnMedia.map((url, idx) => {
                        const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes("video");
                        return (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm hover:shadow-md transition-all group">
                            {isVideo ? (
                              <video src={url} controls className="w-full h-full object-cover" />
                            ) : (
                              <img 
                                src={url} 
                                alt="Inspection" 
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500" 
                                onClick={() => window.open(url, '_blank')}
                              />
                            )}
                            <div className="absolute top-1 right-1 bg-orange-500/80 p-1 rounded-full text-white scale-0 group-hover:scale-100 transition-transform">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
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
                          <span>Số lượng: {item.quantity || 1}</span>
                          <span>Size: {item.size || "M"}</span>
                          <span>Màu: {item.color || "Đen"}</span>
                        </div>
                        <p className="text-sm text-gray-500">Tiền cọc: {(item.deposit || 0).toLocaleString()}đ</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{(item.price || 0).toLocaleString()}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{(selectedOrder.total || 0).toLocaleString()}đ</span>
                </div>
              </div>

              {(selectedOrder.penaltyNote || (selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0)) && (
                <div className="border-t pt-4 bg-orange-50/50 -mx-4 px-4 pb-4">
                  <div className="flex items-center justify-between mb-3 border-b border-orange-100 pb-2">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-orange-600">
                      <span className="text-lg">📷</span>
                      Hồ sơ khách trả đồ (Đang xử lý)
                    </h3>
                    <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Thông tin từ cửa hàng</span>
                  </div>
                  
                  {selectedOrder.penaltyNote && (
                    <div className="bg-white p-4 rounded-xl border border-orange-200 text-sm text-gray-700 mb-4 italic shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                      <span className="font-black text-orange-600 not-italic block mb-2 text-[10px] uppercase">Ghi chú từ nhân viên kiểm đồ:</span>
                      "{selectedOrder.penaltyNote}"
                    </div>
                  )}

                  {selectedOrder.adminReturnMedia && selectedOrder.adminReturnMedia.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Minh chứng hình ảnh/video:</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedOrder.adminReturnMedia.map((url, idx) => {
                          const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes("video");
                          return (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-2 border-white bg-white shadow-md hover:shadow-lg transition-all group">
                              {isVideo ? (
                                <video src={url} controls className="w-full h-full object-cover" />
                              ) : (
                                <img 
                                  src={url} 
                                  alt="Inspection" 
                                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500" 
                                  onClick={() => window.open(url, '_blank')}
                                />
                              )}
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      {/* Modal Gia hạn / Rút ngắn */}
      {showExtendModal && selectedOrderForExtend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Thay đổi thời gian thuê</h2>
              <button
                onClick={() => setShowExtendModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ngày bắt đầu:</span> 
                  {selectedOrderForExtend.startDate 
                    ? new Date(selectedOrderForExtend.startDate).toLocaleDateString("vi-VN") 
                    : "Chưa có dữ liệu"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ngày kết thúc hiện tại:</span> 
                  {selectedOrderForExtend.endDate 
                    ? new Date(selectedOrderForExtend.endDate).toLocaleDateString("vi-VN") 
                    : "Chưa có dữ liệu"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Số ngày thuê:</span> 
                  {selectedOrderForExtend.startDate && selectedOrderForExtend.endDate 
                    ? Math.ceil((new Date(selectedOrderForExtend.endDate).getTime() - new Date(selectedOrderForExtend.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    : "Đang tính"} ngày
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Chọn ngày kết thúc mới
                </label>
                <input
                  type="date"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  min={selectedOrderForExtend.startDate ? new Date(selectedOrderForExtend.startDate).toISOString().split("T")[0] : undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Lưu ý:</strong> 
                  <br />- Chọn ngày lớn hơn hiện tại → <span className="text-green-600">Gia hạn (thanh toán thêm)</span>
                  <br />- Chọn ngày nhỏ hơn hiện tại → <span className="text-orange-600">Rút ngắn (hoàn tiền)</span>
                </p>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleExtendOrder}
                disabled={isExtending || !extendDays}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isExtending ? "Đang xử lý..." : "Xác nhận thay đổi"}
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