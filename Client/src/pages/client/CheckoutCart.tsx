import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getCart } from "../../api/cartService";

const HANOI_DISTRICTS = [
  { id: "namtuliem", name: "Quận Nam Từ Liêm", fee: 20000},
  { id: "bactuliem", name: "Quận Bắc Từ Liêm", fee: 25000},
  { id: "caugiay", name: "Quận Cầu Giấy", fee: 30000},
  { id: "thanhxuan", name: "Quận Thanh Xuân", fee: 40000},
  { id: "hadong", name: "Quận Hà Đông", fee: 40000},
  { id: "badinh", name: "Quận Ba Đình", fee: 50000},
  { id: "dongda", name: "Quận Đống Đa", fee: 45000},
  { id: "haibatrung", name: "Quận Hai Bà Trưng", fee: 65000},
  { id: "hoankiem", name: "Quận Hoàn Kiếm", fee: 65000},
  { id: "tayho", name: "Quận Tây Hồ", fee: 55000},
  { id: "hoangmai", name: "Quận Hoàng Mai", fee: 60000},
  { id: "longbien", name: "Quận Long Biên", fee: 70000 },
];

const getShippingFee = (districtId: string): number => {
  const district = HANOI_DISTRICTS.find(d => d.id === districtId);
  return district?.fee || 35000;
};

const getDistrictName = (districtId: string): string => {
  const district = HANOI_DISTRICTS.find(d => d.id === districtId);
  return district?.name || "";
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalRental, setTotalRental] = useState(0);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [returnAddressSame, setReturnAddressSame] = useState(true);
  const [returnAddress, setReturnAddress] = useState({
    fullName: "",
    phone: "",
    districtId: "",
    specificAddress: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    districtId: "",
    specificAddress: "",
    note: "",
    bankName: "",
    bankAccount: "",
    bankHolder: "",
  });

  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedItems) {
      console.log("📦 Nhận từ CartPage:", state.selectedItems);
      setCartItems(state.selectedItems);
      setTotalRental(state.totalRental || 0);
      setTotalDeposit(state.totalDeposit || 0);
      setSubtotal((state.totalRental || 0) + (state.totalDeposit || 0));
      setTotal(state.total || 0);
    } else {
      fetchCart();
    }
  }, [location]);

  useEffect(() => {
    if (formData.districtId) {
      setShippingFee(getShippingFee(formData.districtId));
    } else {
      setShippingFee(0);
    }
  }, [formData.districtId]);

  useEffect(() => {
    setTotal(subtotal + shippingFee);
  }, [subtotal, shippingFee]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReturnAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.districtId) {
      alert("Vui lòng chọn quận/huyện");
      return false;
    }
    if (!formData.specificAddress.trim()) {
      alert("Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường)");
      return false;
    }

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
        alert("Số điện thoại trả đồ không hợp lệ");
        return false;
      }
      if (!returnAddress.districtId) {
        alert("Vui lòng chọn quận/huyện trả đồ");
        return false;
      }
      if (!returnAddress.specificAddress.trim()) {
        alert("Vui lòng nhập địa chỉ cụ thể để trả đồ");
        return false;
      }
    }

    if (!formData.bankName.trim()) {
      alert("Vui lòng nhập tên ngân hàng để nhận hoàn cọc");
      return false;
    }
    if (!formData.bankAccount.trim()) {
      alert("Vui lòng nhập số tài khoản");
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

  const getFullAddress = (districtId: string, specificAddress: string) => {
    const districtName = getDistrictName(districtId);
    return `${specificAddress}, ${districtName}, Hà Nội`;
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

      const fullAddress = getFullAddress(formData.districtId, formData.specificAddress);

      let returnAddressData = null;
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
          address: getFullAddress(returnAddress.districtId, returnAddress.specificAddress),
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
        startDate: item.startDate,
        endDate: item.endDate,
      }));

      console.log("📤 Gửi lên server các item với ngày thuê:");
      formattedItems.forEach(item => {
        console.log(`  - ${item.name}: ${item.startDate} → ${item.endDate} (${item.days} ngày)`);
      });

      const response = await axios.post(
        "http://localhost:3000/api/payment/create-payment-url",
        {
          userId: user._id,
          total,
          subtotal,
          shippingFee,
          items: formattedItems,
          customerInfo: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: fullAddress,
            note: formData.note,
          },
          returnAddress: returnAddressData,
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
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            🚚 <strong>Thông báo vận chuyển:</strong> DressUp chỉ giao hàng trong 
            <strong> nội thành Hà Nội</strong>. Phí ship được tính theo khoảng cách thực tế từ shop tại 
            <strong> Trịnh Văn Bô, Nam Từ Liêm</strong>.
          </p>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông tin thanh toán</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">
                  1. Thông tin người nhận
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Họ tên *"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email *"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Số điện thoại *"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  
                  <select
                    name="districtId"
                    value={formData.districtId}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">-- Chọn Quận/Huyện * --</option>
                    {HANOI_DISTRICTS.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="specificAddress"
                      value={formData.specificAddress}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường * (Ví dụ: 12 ngõ 120 Yên Lãng)"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">
                  2. Địa chỉ trả đồ
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={returnAddressSame}
                      onChange={() => setReturnAddressSame(true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Giống địa chỉ nhận hàng</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={!returnAddressSame}
                      onChange={() => setReturnAddressSame(false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Địa chỉ khác</span>
                  </label>

                  {!returnAddressSame && (
                    <div className="ml-6 pl-4 border-l-2 border-blue-200 space-y-3 mt-3">
                      <input
                        type="text"
                        name="fullName"
                        value={returnAddress.fullName}
                        onChange={handleReturnAddressChange}
                        placeholder="Họ tên người trả *"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={returnAddress.phone}
                        onChange={handleReturnAddressChange}
                        placeholder="Số điện thoại *"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <select
                        name="districtId"
                        value={returnAddress.districtId}
                        onChange={handleReturnAddressChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">-- Chọn Quận/Huyện trả đồ * --</option>
                        {HANOI_DISTRICTS.map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name="specificAddress"
                        value={returnAddress.specificAddress}
                        onChange={handleReturnAddressChange}
                        placeholder="Số nhà, tên đường *"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">
                  3. Thông tin nhận hoàn cọc
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Tên ngân hàng *"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    placeholder="Số tài khoản *"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    name="bankHolder"
                    value={formData.bankHolder}
                    onChange={handleInputChange}
                    placeholder="Chủ tài khoản *"
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">
                  4. Ghi chú
                </h2>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Yêu cầu về giao hàng, thời gian nhận..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </section>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Xác nhận và thanh toán"}
              </button>
            </form>
          </div>

          <div className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-28">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">
                Đơn hàng
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-600">{item.name}</span>
                      <span className="text-gray-400 text-xs ml-1">x{item.quantity}</span>
                      <div className="text-xs text-gray-400">
                        {item.days} ngày | {item.size}
                      </div>
                      {item.startDate && (
                        <div className="text-xs text-gray-400">
                          {new Date(item.startDate).toLocaleDateString('vi-VN')} → {new Date(item.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-800 font-medium">
                      {((item.rentalPrice || 0) * (item.quantity || 1)).toLocaleString()}đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiền thuê</span>
                  <span>{totalRental.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiền cọc</span>
                  <span>{totalDeposit.toLocaleString()}đ</span>
                </div>
                {shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phí ship</span>
                    <span className="text-gray-800">{shippingFee.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{total.toLocaleString()}đ</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t text-center text-xs text-green-600">
                ✓ Thanh toán qua VNPay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}