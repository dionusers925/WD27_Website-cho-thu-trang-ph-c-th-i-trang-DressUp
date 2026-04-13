import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCart } from "../../api/cartService";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalRental, setTotalRental] = useState(0);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(35000);
  const [total, setTotal] = useState(0);
  const [isInHanoi, setIsInHanoi] = useState(false);
  
  // 👉 THÊM STATE CHO ĐỊA CHỈ TRẢ ĐỒ
  const [returnAddressSame, setReturnAddressSame] = useState(true);
  const [returnAddress, setReturnAddress] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    note: "",
    bankName: "",      
    bankAccount: "",  
    bankHolder: "", 
  });

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (isInHanoi) {
      setTotal(subtotal + shippingFee);
    } else {
      setTotal(subtotal);
    }
  }, [subtotal, shippingFee, isInHanoi]);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      const items = data?.items || [];
      setCartItems(items);

      const rental = items.reduce(
        (sum: number, item: any) => sum + (item.rentalPrice || 0) * (item.quantity || 1),
        0
      );
      const deposit = items.reduce(
        (sum: number, item: any) => sum + (item.deposit || 0) * (item.quantity || 1),
        0
      );
      
      setTotalRental(rental);
      setTotalDeposit(deposit);
      setSubtotal(rental + deposit);
      setTotal(rental + deposit);
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng:", error);
      setCartItems([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReturnAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnAddress({
      ...returnAddress,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      alert("Vui lòng nhập họ tên");
      return false;
    }
    if (!formData.email.trim()) {
      alert("Vui lòng nhập email");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert("Email không hợp lệ");
      return false;
    }
    if (!formData.phone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return false;
    }
    if (!/^\d{10,11}$/.test(formData.phone)) {
      alert("Số điện thoại không hợp lệ (10-11 số)");
      return false;
    }
    if (!formData.address.trim()) {
      alert("Vui lòng nhập địa chỉ nhận hàng");
      return false;
    }
    if (!isInHanoi) {
      alert("DressUp chỉ giao hàng trong nội thành Hà Nội. Vui lòng xác nhận.");
      return false;
    }

    // 👉 VALIDATE ĐỊA CHỈ TRẢ ĐỒ
    if (!returnAddressSame) {
      if (!returnAddress.fullName.trim()) {
        alert("Vui lòng nhập họ tên người trả đồ");
        return false;
      }
      if (!returnAddress.phone.trim()) {
        alert("Vui lòng nhập số điện thoại người trả đồ");
        return false;
      }
      if (!/^\d{10,11}$/.test(returnAddress.phone)) {
        alert("Số điện thoại trả đồ không hợp lệ (10-11 số)");
        return false;
      }
      if (!returnAddress.address.trim()) {
        alert("Vui lòng nhập địa chỉ trả đồ");
        return false;
      }
    }

    if (!formData.bankName.trim()) {
      alert("Vui lòng nhập tên ngân hàng để nhận hoàn cọc");
      return false;
    }
    if (!formData.bankAccount.trim()) {
      alert("Vui lòng nhập số tài khoản ngân hàng");
      return false;
    }
    if (!formData.bankHolder.trim()) {
      alert("Vui lòng nhập tên chủ tài khoản");
      return false;
    }
    if (!/^\d{8,20}$/.test(formData.bankAccount)) {
      alert("Số tài khoản phải từ 8-20 chữ số");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) {
        alert("Vui lòng đăng nhập lại");
        navigate("/auth/login");
        return;
      }

      const fullAddress = `${formData.address} (Nội thành Hà Nội)`;
      
      // 👉 XỬ LÝ ĐỊA CHỈ TRẢ ĐỒ
      let returnAddressData;
      if (returnAddressSame) {
        returnAddressData = {
          fullName: formData.fullName,
          phone: formData.phone,
          address: fullAddress,
        };
      } else {
        returnAddressData = {
          fullName: returnAddress.fullName,
          phone: returnAddress.phone,
          address: returnAddress.address,
        };
      }

      const formattedItems = cartItems.map((item) => ({
        productId: item.productId || item._id,
        name: item.name,                    
        quantity: item.quantity || 1,
        price: item.rentalPrice,           
        deposit: item.deposit || 0,
        size: item.size,
        color: item.color,
        days: item.days,
      }));

      const response = await axios.post(
        "http://localhost:3000/api/payment/create-payment-url",
        {
          userId: user._id,
          total: total,
          subtotal: subtotal,
          shippingFee: shippingFee,
          items: formattedItems,
          customerInfo: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: fullAddress,
            note: formData.note,
          },
          returnAddress: returnAddressData, // 👈 THÊM ĐỊA CHỈ TRẢ ĐỒ
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          bankHolder: formData.bankHolder,
          paymentMethod: "vnpay",
        }
      );

      window.location.href = response.data.paymentUrl;
    } catch (error: any) {
      console.error("Lỗi thanh toán:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto pt-28 px-4">
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Giỏ hàng của bạn đang trống</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-28 pb-12 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thông tin thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
            {/* Thông tin người nhận */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">
              Thông tin nhận hàng
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ tên"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0987654321"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Địa chỉ nhận hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Số nhà, đường, phường/xã"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="inHanoi"
                  checked={isInHanoi}
                  onChange={(e) => setIsInHanoi(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="inHanoi" className="text-sm text-gray-700">
                  Địa chỉ của tôi nằm trong nội thành Hà Nội <span className="text-red-500">*</span>
                </label>
              </div>

              <p className="text-xs text-gray-400 -mt-2">
                📦 Phí vận chuyển: <span className="font-semibold text-gray-600">35,000đ</span> (cố định trong nội thành Hà Nội)
              </p>
            </div>

            {/* 👉 ĐỊA CHỈ TRẢ ĐỒ */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Địa chỉ trả đồ
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="sameAddress"
                    name="returnAddressOption"
                    checked={returnAddressSame}
                    onChange={() => setReturnAddressSame(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="sameAddress" className="text-sm text-gray-700">
                    Giống địa chỉ nhận hàng
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="differentAddress"
                    name="returnAddressOption"
                    checked={!returnAddressSame}
                    onChange={() => setReturnAddressSame(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="differentAddress" className="text-sm text-gray-700">
                    Địa chỉ khác
                  </label>
                </div>

                {!returnAddressSame && (
                  <div className="ml-6 pl-4 border-l-2 border-blue-200 space-y-4 mt-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Họ tên người trả <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={returnAddress.fullName}
                        onChange={handleReturnAddressChange}
                        placeholder="Họ tên người trả đồ"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={returnAddress.phone}
                        onChange={handleReturnAddressChange}
                        placeholder="Số điện thoại người trả"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Địa chỉ trả đồ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={returnAddress.address}
                        onChange={handleReturnAddressChange}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin ngân hàng */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Thông tin nhận hoàn cọc
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Tên ngân hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Số tài khoản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    placeholder="Số tài khoản ngân hàng"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Chủ tài khoản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankHolder"
                    value={formData.bankHolder}
                    onChange={handleInputChange}
                    placeholder="Tên chủ tài khoản"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-2">
                Ghi chú
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Yêu cầu về giao hàng, thời gian nhận..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </span>
              ) : (
                "Xác nhận và thanh toán"
              )}
            </button>
          </form>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-28">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Đơn hàng của bạn
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {cartItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="text-gray-400 text-xs ml-2">x{item.quantity}</span>
                    <div className="text-xs text-gray-400">
                      {item.days} ngày | Size: {item.size}
                    </div>
                  </div>
                  <span className="text-gray-800 font-medium">
                    {((item.rentalPrice || 0) * (item.quantity || 1)).toLocaleString()}đ
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền thuê</span>
                <span className="text-gray-800">{totalRental.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền cọc</span>
                <span className="text-gray-800">{totalDeposit.toLocaleString()}đ</span>
              </div>
              {isInHanoi && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển (nội thành HN)</span>
                  <span className="text-gray-800">{shippingFee.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Tổng thanh toán</span>
                <span className="text-blue-600">{total.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <span>✓</span>
                <span>Thanh toán qua VNPay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}