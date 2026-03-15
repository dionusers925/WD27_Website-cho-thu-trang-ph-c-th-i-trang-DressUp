<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  name: string;
  price: number;
  deposit: number;
  size: string;
  color: string;
}

const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentSize, setCurrentSize] = useState("");
  const [currentColor, setCurrentColor] = useState("");

  const [newOrder, setNewOrder] = useState({
    userId: "",
    total: 0,
    paymentMethod: "Tiền mặt",
    shippingMethod: "Nhận tại cửa hàng", 
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    items: [] as OrderItem[],
  });

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get("http://localhost:3000/orders"),
        axios.get("http://localhost:3000/api/products")
      ]);

      setOrders(ordersRes.data);

      const productData = productsRes.data as any;
      const normalizedProducts = Array.isArray(productData)
        ? productData
        : Array.isArray(productData?.products)
        ? productData.products
        : [];

      setProducts(normalizedProducts);
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
      return sum + rentalPrice + depositPrice;
    }, 0);

    setNewOrder(prev => ({ ...prev, total: finalTotal }));
  }, [newOrder.items, newOrder.startDate, newOrder.endDate]);

  const addItemToOrder = () => {
    if (!currentProduct || !currentSize || !currentColor) {
      return alert("Vui lòng chọn đầy đủ Sản phẩm, Size và Màu!");
    }

    const itemPrice = Number(currentProduct.rentalTiers?.[0]?.price) || 0;
    const itemDeposit = Number(currentProduct.depositDefault) || 0;

    const newItem: OrderItem = {
      productId: currentProduct._id,
      name: currentProduct.name,
      price: itemPrice,
      deposit: itemDeposit,
      size: currentSize,
      color: currentColor
    };

    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentProduct(null);
    setCurrentSize("");
    setCurrentColor("");
  };

  const removeItemFromOrder = (indexToRemove: number) => {
    const updatedItems = newOrder.items.filter((_, index) => index !== indexToRemove);
    setNewOrder(prev => ({ ...prev, items: updatedItems }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.items.length === 0) return alert("Vui lòng thêm ít nhất 1 sản phẩm!");
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/orders", newOrder);
      alert("✅ Tạo đơn hàng thành công!");
      setShowModal(false);
      fetchData();
      setNewOrder({
        userId: "",
        total: 0,
        paymentMethod: "Tiền mặt",
        shippingMethod: "Nhận tại cửa hàng",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        items: []
      });
    } catch (err) {
      alert("❌ Lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng DressUp</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#1e3a8a' }} className="text-white px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all active:scale-95">
            <span className="text-xl">+</span> Tạo đơn trực tiếp
          </button>
          <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-200">
            Tổng số: {orders.length}
          </span>
        </div>
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
            {orders.map((order: any) => (
              <tr key={order._id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-mono text-sm text-blue-600 font-semibold">{order._id?.slice(-6).toUpperCase()}</td>
                <td className="p-4 text-sm ">{order.userId?.name || "Khách tại quầy"}</td>
                <td className="p-4 text-sm ">{(order.total ?? 0).toLocaleString()}đ</td>

                <td className="p-4 text-sm text-gray-600">{order.paymentMethod || "Nhận tại cửa hàng"}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                    {order.status || 'pending'}
                  </span>
                </td>
                <td className="p-4 text-sm ">
                  <button
                    onClick={() => navigate(`/admin/order/${order._id}`)}
                    className="px-4 text-sm py-1.5 bg-blue-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm border border-blue-100" style={{
                      backgroundColor: '#377abd',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[95vh]">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Đơn thuê tại quầy</h2>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">ID Khách hàng</label>
                <input type="text" required placeholder="Dán ID khách..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newOrder.userId} onChange={(e) => setNewOrder({ ...newOrder, userId: e.target.value })} />
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 mb-2 uppercase">Chọn đồ thuê</label>

                <select
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentProduct?._id || ""}
                  onChange={(e) => {
                    const prod = products.find(p => p._id === e.target.value) as Product;
                    if (prod) {
                      setCurrentProduct(prod);
                      const sizes = Array.from(new Set(prod.variants.map(v => v.size)));
                      setCurrentSize(sizes[0] || "");
                      const colorsForSize = prod.variants.filter(v => v.size === sizes[0]);
                      setCurrentColor(colorsForSize[0]?.color || "");
                    }
                  }}
                >
                  <option value="">-- Click chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Thuê: {p.rentalTiers?.[0]?.price.toLocaleString()}đ - Cọc: {p.depositDefault.toLocaleString()}đ)
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase italic">Size</label>
                    <select className="w-full p-2 bg-white border rounded-lg text-xs outline-none" value={currentSize} onChange={(e) => setCurrentSize(e.target.value)} disabled={!currentProduct}>
                      {currentProduct && Array.from(new Set(currentProduct.variants.map(v => v.size))).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase italic">Màu</label>
                    <select className="w-full p-2 bg-white border rounded-lg text-xs outline-none" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} disabled={!currentProduct}>
                      {currentProduct?.variants.filter(v => v.size === currentSize).map((v, i) => <option key={i} value={v.color}>{v.color}</option>)}
                    </select>
                  </div>
                </div>

                <button type="button" onClick={addItemToOrder} style={{ backgroundColor: '#1e3a8a' }} className="w-full py-2 text-white rounded-lg font-bold shadow-sm">
                  + Thêm vào danh sách
                </button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {newOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase italic">Cọc: {item.deposit.toLocaleString()}đ | Thuê: {item.price.toLocaleString()}đ/ngày</p>
                    </div>
                    <button type="button" onClick={() => removeItemFromOrder(index)} className="text-red-500 font-bold">✕</button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="w-full p-2 bg-gray-50 border rounded-xl" value={newOrder.startDate} onChange={(e) => setNewOrder({ ...newOrder, startDate: e.target.value })} />
                <input type="date" required className="w-full p-2 bg-gray-50 border rounded-xl" value={newOrder.endDate} onChange={(e) => setNewOrder({ ...newOrder, endDate: e.target.value })} />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tổng cộng (Đã gồm tiền cọc)</label>
                <div className="w-full p-3 bg-gray-100 border rounded-xl font-bold text-lg text-blue-900 text-center">
                  {newOrder.total.toLocaleString()} đ
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-400 font-semibold">Hủy</button>
                <button type="submit" disabled={loading} style={{ backgroundColor: '#1e3a8a' }} className="px-8 py-2 text-white rounded-xl font-semibold shadow-lg">
                  {loading ? "Đang xử lý..." : "Xác nhận tạo đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;
=======
import { Card, Col, Row, Table, Tag, Button } from "antd";
import {
  ShoppingCartOutlined,
  SyncOutlined,
  CarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import FooterMenu from "../../layouts/admin/components/FooterMenu";

const orders = [
  {
    key: "1",
    id: 1,
    customer: "Nguyễn Văn A",
    status: "pending",
    date: "2026-01-26",
    amount: 450000,
    price: 150000,
  },
  {
    key: "2",
    id: 2,
    customer: "Nguyễn Văn A",
    status: "pending",
    date: "2026-01-26",
    amount: 450000,
    price: 150000,
  },
  {
    key: "3",
    id: 3,
    customer: "Trần Thị B",
    status: "paid",
    date: "2026-01-27",
    amount: 350000,
    price: 350000,
  },
];

const statusColor: Record<string, string> = {
  pending: "blue",
  paid: "green",
  shipped: "orange",
  completed: "green",
  cancelled: "red",
};

const columns = [
  {
    title: " ID",
    dataIndex: "id",
    render: (_: any, __: any, index: number) => index + 1,
  },
  {
    title: "Customer",
    dataIndex: "customer",
  },
  {
    title: "Status",
    dataIndex: "status",
    render: (status: string) => (
      <Tag color={statusColor[status]}>{status.toUpperCase()}</Tag>
    ),
  },
  {
    title: "Date",
    dataIndex: "date",
  },
  {
    title: "Amount",
    dataIndex: "amount",
    render: (amount: number) => amount.toLocaleString("vi-VN") + " ₫",
  },
  {
    title: "Price",
    dataIndex: "price",
    render: (price: number) => price.toLocaleString("vi-VN") + " ₫",
  },
  {
    title: "Phone",
    dataIndex: "phone",
  },
  {
    title: "Action",
    render: () => <Button type="primary">View</Button>,
  },
];

const OrdersDashboard = () => {
  const summaryData = [
    {
      title: "New Orders",
      value: orders.filter((o) => o.status === "pending").length,
      icon: <ShoppingCartOutlined />,
    },
    {
      title: "Completed Orders",
      value: orders.filter((o) => o.status === "completed").length,
      icon: <CarOutlined />,
    },
    {
      title: "Cancelled Orders",
      value: orders.filter((o) => o.status === "cancelled").length,
      icon: <DollarOutlined />,
    },
    {
      title: "Paid",
      value: orders.filter((o) => o.status === "paid").length,
      icon: <DollarOutlined />,
    },
  ];

  return (
    <>
      <div style={{ padding: 24 }}>
        <Row gutter={16}>
          {summaryData.map((item) => (
            <Col span={6} key={item.title}>
              <Card>
                <Row align="middle" justify="space-between">
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{item.title}</h4>
                    <h2 style={{ margin: 0 }}>{item.value}</h2>
                  </div>
                  <div style={{ fontSize: 28, color: "#1677ff" }}>
                    {item.icon}
                  </div>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="Recent Orders" style={{ marginTop: 24 }}>
          <Table columns={columns} dataSource={orders} pagination={false} />
        </Card>
      </div>

      <div>
        <FooterMenu />
      </div>
    </>
  );
};

export default OrdersDashboard;
>>>>>>> c48e5aef6fbe32aa5c5d0ca3514c99b2e8493df4
