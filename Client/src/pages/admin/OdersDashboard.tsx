import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Variant {
  size: string;
  color: string;
  _id?: string;
}

interface Product {
  _id: string;
  name: string;
  rentalTiers: {
    label: string;
    days: number;
    price: number;
  }[];
  depositDefault: number;
  variants: Variant[];
}

interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  deposit: number;
  size: string;
  color: string;
  quantity?: number;
}

const OrdersDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hasAccount, setHasAccount] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const navigate = useNavigate();

  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentSize, setCurrentSize] = useState("");
  const [currentColor, setCurrentColor] = useState("");
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchOrderCode, setSearchOrderCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const normalizeProduct = (p: any): Product => {
    const rentalTiers = Array.isArray(p?.rentalTiers)
      ? p.rentalTiers
      : Array.isArray(p?.rentalPrices)
        ? p.rentalPrices.map((rp: any) => ({
          label: `${Number(rp?.days ?? 0) || 0} ngày`,
          days: Number(rp?.days ?? 0) || 0,
          price: Number(rp?.price ?? 0) || 0,
        }))
        : [];

    const depositDefault =
      Number(p?.depositDefault ?? p?.depositPrice ?? 0) || 0;

    return {
      _id: String(p?._id ?? ""),
      name: String(p?.name ?? ""),
      rentalTiers,
      depositDefault,
      variants: Array.isArray(p?.variants)
        ? p.variants.map((v: any) => ({
          size: String(v?.size ?? ""),
          color: String(v?.color ?? ""),
          _id: v?._id,
        }))
        : [],
    };
  };

  const normalizeVariants = (variants: any[]): Variant[] =>
    variants
      .map((v: any) => {
        const attrs = Array.isArray(v?.attributes) ? v.attributes : [];
        const nameOf = (a: any) =>
          String(a?.attributeName ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const isSizeAttr = (a: any) => {
          const n = nameOf(a);
          return n.includes("size") || n.includes("kich") || n.includes("co");
        };

        const isColorAttr = (a: any) => {
          const n = nameOf(a);
          return n.includes("color") || n.includes("mau");
        };

        const attrSize = attrs.find(isSizeAttr)?.value;
        const attrColor = attrs.find(isColorAttr)?.value;

        const size = String(v?.size ?? attrSize ?? "").trim();
        const color = String(v?.color ?? attrColor ?? "").trim();

        return { size, color, _id: v?._id };
      })
      .filter((v: Variant) => v.size && v.color);

  const [newOrder, setNewOrder] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    bankAccount: "",
    bankName: "",
    userId: "",
    note: "",
    total: 0,
    paymentMethod: "Tiền mặt",
    shippingMethod: "Nhận tại cửa hàng",
    status: "renting",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    items: [] as OrderItem[],
  });

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        axios.get("http://localhost:3000/orders"),
        axios.get("http://localhost:3000/api/products"),
        axios.get("http://localhost:3000/users").catch(() => ({ data: [] })),
      ]);

      setOrders(ordersRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);

      const productData = productsRes.data as any;
      const normalizedProducts = Array.isArray(productData)
        ? productData
        : Array.isArray(productData?.data?.products)
          ? productData.data.products
          : Array.isArray(productData?.products)
            ? productData.products
            : [];

      setProducts(
        normalizedProducts.map(normalizeProduct).filter((p: Product) => p._id)
      );
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  useEffect(() => {
    const days = calculateDays(newOrder.startDate, newOrder.endDate);

    const finalTotal = newOrder.items.reduce((sum, item) => {
      const rentalPrice = (Number(item.price) || 0) * days;
      const depositPrice = Number(item.deposit) || 0;
      const quantity = Number(item.quantity ?? 1) || 1;
      return sum + (rentalPrice + depositPrice) * quantity;
    }, 0);

    setNewOrder((prev) => ({ ...prev, total: finalTotal }));
  }, [newOrder.items, newOrder.startDate, newOrder.endDate]);

  const addItemToOrder = () => {
    if (!currentProduct || !currentSize || !currentColor) {
      return alert("Vui lòng chọn đầy đủ Sản phẩm, Size và Màu!");
    }

    const itemPrice = Number(currentProduct.rentalTiers?.[0]?.price) || 0;
    const itemDeposit = Number(currentProduct.depositDefault) || 0;

    const matchedVariant = currentProduct.variants.find(
      (v) => v.size === currentSize && v.color === currentColor
    );

    const newItem: OrderItem = {
      productId: currentProduct._id,
      variantId: matchedVariant?._id,
      name: currentProduct.name,
      price: itemPrice,
      deposit: itemDeposit,
      size: currentSize,
      color: currentColor,
      quantity: 1,
    };

    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setCurrentProduct(null);
    setCurrentSize("");
    setCurrentColor("");
    setSearchProductTerm("");
    setShowProductDropdown(false);
  };

  const removeItemFromOrder = (indexToRemove: number) => {
    const updatedItems = newOrder.items.filter((_, index) => index !== indexToRemove);
    setNewOrder((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newOrder.items.length === 0)
      return alert("Vui lòng thêm ít nhất 1 sản phẩm!");

    if (!newOrder.customerPhone) {
      return alert("Vui lòng nhập số điện thoại khách hàng!");
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3000/orders", newOrder);
      alert("✅ Tạo đơn hàng thành công!");
      setShowModal(false);
      fetchData();
      setNewOrder({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        bankAccount: "",
        bankName: "",
        userId: "",
        note: "",
        total: 0,
        paymentMethod: "Tiền mặt",
        shippingMethod: "Nhận tại cửa hàng",
        status: "renting",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        items: [],
      });
      setCurrentProduct(null);
      setCurrentSize("");
      setCurrentColor("");
      setSearchProductTerm("");
      setShowProductDropdown(false);
    } catch (err: any) {
      console.error("Lỗi tạo đơn hàng:", err);
      const message =
        err?.response?.data?.message || err?.message || "Lỗi hệ thống.";
      alert(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-yellow-100 text-yellow-800",
      renting: "bg-cyan-100 text-cyan-800",
      returning: "bg-indigo-100 text-indigo-800",
      picked_up: "bg-blue-100 text-blue-800",
      returned: "bg-teal-100 text-teal-800",
      fee_incurred: "bg-orange-100 text-orange-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const handlePhoneChange = (phone: string) => {
    let updatedOrder = { ...newOrder, customerPhone: phone, userId: "" };

    if (hasAccount && phone.length >= 8) {
      const foundUser = users.find((u: any) => u.phone === phone);
      if (foundUser) {
        updatedOrder.userId = foundUser._id;
        updatedOrder.customerName = foundUser.name || foundUser.fullName || updatedOrder.customerName;

        const userOrders = orders.filter((o: any) => o.userId?._id === foundUser._id || o.userId === foundUser._id || o.customerPhone === phone);
        if (userOrders.length > 0) {
          const lastOrder: any = userOrders[0];
          updatedOrder.customerAddress = lastOrder.customerAddress || updatedOrder.customerAddress;
          updatedOrder.bankName = lastOrder.bankName || updatedOrder.bankName;
          updatedOrder.bankAccount = lastOrder.bankAccount || updatedOrder.bankAccount;
        }
      }
    }
    setNewOrder(updatedOrder);
  };

  const filteredOrders = orders.filter((order: any) => {
    if (!searchOrderCode) return true;
    const shortId = order._id?.slice(-6).toUpperCase() || "";
    const fullId = order._id?.toUpperCase() || "";
    const term = searchOrderCode.toUpperCase().trim();
    return shortId.includes(term) || fullId.includes(term);
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng DressUp</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="text-blue-800 bg-blue-100 px-5 py-2 rounded-xl font-semibold shadow-sm transition-all active:scale-95 border border-blue-200"
          >
            Lịch sử tạo đơn
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#1e3a8a" }}
            className="text-white px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all active:scale-95"
          >
            <span className="text-xl">+</span> Tạo đơn trực tiếp
          </button>
          <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-200">
            Tổng số: {filteredOrders.length}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đơn hàng..."
          className="w-full md:w-1/3 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={searchOrderCode}
          onChange={(e) => {
            setSearchOrderCode(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Mã đơn</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Khách hàng</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Tổng tiền</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Thanh toán</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Trạng thái</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentOrders.map((order: any) => (
              <tr key={order._id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-mono text-sm text-blue-600 font-semibold">
                  {order._id?.slice(-6).toUpperCase()}
                </td>
                <td className="p-4 text-sm">
                  {order.customerName || order.userId?.name || "Khách tại quầy"}
                </td>
                <td className="p-4 text-sm">
                  {(order.total ?? 0).toLocaleString()}đ
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {order.paymentMethod || "Nhận tại cửa hàng"}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status === 'pending' ? 'Chờ xử lý' :
                      order.status === 'confirmed' ? 'Đã xác nhận' :
                        order.status === 'preparing' ? 'Đang chuẩn bị hàng' :
                          order.status === 'shipped' ? 'Đang giao' :
                            order.status === 'delivered' ? 'Đã giao' :
                              order.status === 'renting' ? 'Đang thuê' :
                                order.status === 'returning' ? 'Đang trả đồ' :
                                  order.status === 'picked_up' ? 'Đã lấy đơn' :
                                    order.status === 'returned' ? 'Đã nhận đồ' :
                                      order.status === 'fee_incurred' ? 'Phát sinh phí' :
                                        order.status === 'completed' ? 'Hoàn tất' :
                                          order.status === 'cancelled' ? 'Đã hủy' : (order.status || "pending")}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  <button
                    onClick={() => navigate(`/admin/order/${order._id}`)}
                    className="px-4 text-sm py-1.5 bg-blue-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm border border-blue-100"
                    style={{
                      backgroundColor: "#377abd",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 disabled:opacity-50 transition-all hover:bg-gray-50 active:scale-95"
            >
              Trước
            </button>
            <span className="text-sm text-gray-700 font-bold px-4">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 disabled:opacity-50 transition-all hover:bg-gray-50 active:scale-95"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[95vh]">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">
              Đơn thuê tại quầy
            </h2>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase italic">
                  Thông tin khách hàng
                </p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại khách hàng
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={hasAccount}
                        onChange={() => setHasAccount(true)}
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className="font-semibold text-gray-700">
                        Đã có tài khoản
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!hasAccount}
                        onChange={() => {
                          setHasAccount(false);
                          setNewOrder((prev) => ({ ...prev, userId: "" }));
                        }}
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className="font-semibold text-gray-700">
                        Chưa có tài khoản
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Nhập số điện thoại..."
                      className={`w-full p-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${hasAccount && newOrder.userId
                          ? "border-green-300 ring-1 ring-green-300 bg-green-50"
                          : "border-gray-200"
                        }`}
                      value={newOrder.customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                    />
                    {hasAccount && newOrder.userId && (
                      <p className="text-xs text-green-600 mt-1">
                        Đã tìm thấy khách hàng
                      </p>
                    )}
                    {hasAccount &&
                      newOrder.customerPhone &&
                      newOrder.customerPhone.length >= 8 &&
                      !newOrder.userId && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Không tìm thấy khách hàng
                        </p>
                      )}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập họ và tên..."
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={newOrder.customerName}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, customerName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Địa chỉ *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập địa chỉ..."
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={newOrder.customerAddress}
                      onChange={(e) =>
                        setNewOrder({
                          ...newOrder,
                          customerAddress: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập số tài khoản..."
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={newOrder.bankAccount}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, bankAccount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ngân hàng
                    </label>
                    <select
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={newOrder.bankName}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, bankName: e.target.value })
                      }
                    >
                      <option value="">Chọn ngân hàng...</option>
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="VietinBank">VietinBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="Agribank">Agribank</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="MBBank">MBBank</option>
                      <option value="ACB">ACB</option>
                      <option value="VPBank">VPBank</option>
                      <option value="TPBank">TPBank</option>
                      <option value="Sacombank">Sacombank</option>
                      <option value="VIB">VIB</option>
                      <option value="HDBank">HDBank</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 mb-2 uppercase">
                  Chọn đồ thuê
                </label>

                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm để tìm..."
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchProductTerm}
                    onChange={(e) => {
                      setSearchProductTerm(e.target.value);
                      setShowProductDropdown(true);
                      if (!e.target.value) {
                        setCurrentProduct(null);
                        setCurrentSize("");
                        setCurrentColor("");
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                  />
                  {showProductDropdown && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto mt-1 top-full">
                      {products.filter(
                        (p) =>
                          !searchProductTerm ||
                          p.name.toLowerCase().includes(searchProductTerm.toLowerCase())
                      ).length > 0 ? (
                        products
                          .filter(
                            (p) =>
                              !searchProductTerm ||
                              p.name
                                .toLowerCase()
                                .includes(searchProductTerm.toLowerCase())
                          )
                          .map((p) => (
                            <li
                              key={p._id}
                              className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 text-sm transition-colors"
                              onClick={async () => {
                                setSearchProductTerm(p.name);
                                setShowProductDropdown(false);

                                const id = p._id;
                                const prod = p;
                                if (!id || !prod) {
                                  setCurrentProduct(null);
                                  setCurrentSize("");
                                  setCurrentColor("");
                                  return;
                                }

                                try {
                                  const detailRes = await axios.get(
                                    `http://localhost:3000/api/products/${id}`
                                  );
                                  const detail = detailRes.data as any;
                                  const rawVariants =
                                    Array.isArray(detail?.data?.variants) &&
                                      detail.data.variants.length > 0
                                      ? detail.data.variants
                                      : Array.isArray(detail?.data?.product?.variants) &&
                                        detail.data.product.variants.length > 0
                                        ? detail.data.product.variants
                                        : Array.isArray(detail?.variants) &&
                                          detail.variants.length > 0
                                          ? detail.variants
                                          : [];

                                  const mappedVariants =
                                    normalizeVariants(rawVariants);

                                  const merged: Product = {
                                    ...prod,
                                    variants: mappedVariants,
                                  };

                                  setCurrentProduct(merged);
                                  if (mappedVariants.length === 0) {
                                    setCurrentSize("");
                                    setCurrentColor("");
                                    alert(
                                      "Sản phẩm này chưa có biến thể Size/Màu trong hệ thống."
                                    );
                                    return;
                                  }
                                  const sizes = Array.from(
                                    new Set(merged.variants.map((v) => v.size))
                                  );
                                  setCurrentSize(sizes[0] || "");
                                  const colorsForSize = merged.variants.filter(
                                    (v) => v.size === sizes[0]
                                  );
                                  setCurrentColor(colorsForSize[0]?.color || "");
                                } catch (err) {
                                  console.error("Lỗi lấy chi tiết sản phẩm:", err);
                                  alert(
                                    "Không lấy được chi tiết sản phẩm (size/màu). Vui lòng thử lại."
                                  );
                                  setCurrentProduct(null);
                                  setCurrentSize("");
                                  setCurrentColor("");
                                }
                              }}
                            >
                              <span className="font-semibold text-gray-800 block truncate">
                                {p.name}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                Thuê: {(p.rentalTiers?.[0]?.price ?? 0).toLocaleString()}đ - Cọc: {(p.depositDefault ?? 0).toLocaleString()}đ
                              </span>
                            </li>
                          ))
                      ) : (
                        <li className="p-3 text-sm text-gray-500 text-center">
                          Không tìm thấy sản phẩm...
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase italic">
                      Size
                    </label>
                    <select
                      className="w-full p-2 bg-white border rounded-lg text-xs outline-none"
                      value={currentSize}
                      onChange={(e) => setCurrentSize(e.target.value)}
                      disabled={!currentProduct}
                    >
                      {currentProduct &&
                        Array.from(
                          new Set(currentProduct.variants.map((v) => v.size))
                        ).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase italic">
                      Màu
                    </label>
                    <select
                      className="w-full p-2 bg-white border rounded-lg text-xs outline-none"
                      value={currentColor}
                      onChange={(e) => setCurrentColor(e.target.value)}
                      disabled={!currentProduct}
                    >
                      {currentProduct?.variants
                        .filter((v) => v.size === currentSize)
                        .map((v, i) => (
                          <option key={i} value={v.color}>
                            {v.color}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItemToOrder}
                  style={{ backgroundColor: "#1e3a8a" }}
                  className="w-full py-2 text-white rounded-lg font-bold shadow-sm"
                >
                  + Thêm vào danh sách
                </button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {newOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase italic">
                        Cọc: {item.deposit.toLocaleString()}đ | Thuê: {item.price.toLocaleString()}đ/ngày
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemFromOrder(index)}
                      className="text-red-500 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-2 bg-gray-50 border rounded-xl"
                  value={newOrder.startDate}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, startDate: e.target.value })
                  }
                />
                <input
                  type="date"
                  required
                  min={newOrder.startDate || new Date().toISOString().split("T")[0]}
                  className="w-full p-2 bg-gray-50 border rounded-xl"
                  value={newOrder.endDate}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, endDate: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Ghi chú đơn hàng
                </label>
                <textarea
                  placeholder="Ghi chú thêm về đơn hàng..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none h-16 resize-none"
                  value={newOrder.note}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, note: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tổng cộng (Đã gồm tiền cọc)
                </label>
                <div className="w-full p-3 bg-gray-100 border rounded-xl font-bold text-lg text-blue-900 text-center">
                  {newOrder.total.toLocaleString()} đ
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-gray-400 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: "#1e3a8a" }}
                  className="px-8 py-2 text-white rounded-xl font-semibold shadow-lg"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận tạo đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Lịch sử tạo đơn hàng
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 font-bold hover:text-gray-800 text-xl"
              >
                ✕
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                Chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="space-y-4">
                {[...orders]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || 0).getTime() -
                      new Date(a.createdAt || 0).getTime()
                  )
                  .map((o: any) => (
                    <div
                      key={o._id}
                      className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="font-bold text-blue-800 mb-1">
                          Mã đơn: {o._id?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Khách hàng:{" "}
                          {o.customerName ||
                            o.userId?.name ||
                            "Khách tại quầy"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Ngày tạo:{" "}
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleString("vi-VN")
                            : "Không rõ"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 mb-1">
                          {(o.total ?? 0).toLocaleString()}đ
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          {o.status === "pending"
                            ? "Chờ xử lý"
                            : o.status === "confirmed"
                              ? "Đã xác nhận"
                              : o.status === "shipped"
                                ? "Đang giao"
                                : o.status === "delivered"
                                  ? "Đã giao"
                                  : o.status === "renting"
                                    ? "Đang thuê"
                                    : o.status === "returning"
                                      ? "Đang trả đồ"
                                      : o.status === "returned"
                                        ? "Đã nhận đồ"
                                        : o.status === "fee_incurred"
                                          ? "Phát sinh phí"
                                          : o.status === "completed"
                                            ? "Hoàn tất"
                                            : o.status === "cancelled"
                                              ? "Đã hủy"
                                              : o.status || "pending"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;
