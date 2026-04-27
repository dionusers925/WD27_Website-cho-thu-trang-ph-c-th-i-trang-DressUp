import { useEffect, useState, useMemo } from "react";
import { Card, Table, Image, Tag, Input, Space, Button } from "antd";
import { SearchOutlined, DollarOutlined, RiseOutlined } from "@ant-design/icons";
import axios from "axios";
import { Link } from "react-router-dom";

interface OrderItem {
  _id?: string;
  productId?: {
    _id?: string;
    name?: string;
    images?: string[];
  };
  name?: string;
  price?: number;
  quantity?: number;
}

interface Order {
  _id: string;
  status: string;
  paymentStatus: string;
  startDate?: string;
  endDate?: string;
  items?: OrderItem[];
  total?: number;
}

interface ProductRevenueData {
  id: string;
  name: string;
  image: string;
  revenue: number;
  rentCount: number;
  quantityRented: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

const calcRentalDays = (start?: string, end?: string) => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

const ProductRevenueDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/orders");
        setOrders(res.data);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const data = useMemo(() => {
    const revenueMap: Record<string, ProductRevenueData> = {};

    orders.forEach((order) => {
      // Chỉ tính các đơn hàng đã hoàn tất
      if (order.status !== "completed") return;

      const rentalDays = calcRentalDays(order.startDate, order.endDate);

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!item.productId || typeof item.productId === "string") return;

          const pId = item.productId._id;
          if (!pId) return;

          if (!revenueMap[pId]) {
            revenueMap[pId] = {
              id: pId,
              name: item.productId.name || item.name || "Sản phẩm",
              image: item.productId.images?.[0] || "",
              revenue: 0,
              rentCount: 0,
              quantityRented: 0,
            };
          }

          const price = Number(item.price || 0);
          const qty = Number(item.quantity || 1);

          revenueMap[pId].revenue += price * qty * rentalDays;
          revenueMap[pId].quantityRented += qty;
          revenueMap[pId].rentCount += 1;
        });
      }
    });

    let result = Object.values(revenueMap).sort((a, b) => b.revenue - a.revenue);

    if (searchText) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return result;
  }, [orders, searchText]);

  const totalRevenue = useMemo(
    () => data.reduce((sum, item) => sum + item.revenue, 0),
    [data]
  );

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (img: string) => (
        <Image
          width={50}
          height={65}
          src={img}
          fallback="https://via.placeholder.com/50x65?text=No+Image"
          style={{ objectFit: "cover", borderRadius: "4px" }}
        />
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ProductRevenueData) => (
        <Link
          to={`/admin/products/${record.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {name}
        </Link>
      ),
    },
    {
      title: "Số lượt thuê",
      dataIndex: "rentCount",
      key: "rentCount",
      sorter: (a: ProductRevenueData, b: ProductRevenueData) => a.rentCount - b.rentCount,
      render: (val: number) => <Tag color="blue">{val} lần</Tag>,
    },
    {
      title: "Số lượng đã cho thuê",
      dataIndex: "quantityRented",
      key: "quantityRented",
      sorter: (a: ProductRevenueData, b: ProductRevenueData) => a.quantityRented - b.quantityRented,
      render: (val: number) => <span>{val} SP</span>,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a: ProductRevenueData, b: ProductRevenueData) => a.revenue - b.revenue,
      render: (val: number) => (
        <span className="font-bold text-emerald-600">
          {formatCurrency(val)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Doanh thu sản phẩm</h1>
          <p className="text-slate-500 mt-1">Thống kê doanh thu theo từng sản phẩm từ các đơn hàng đã hoàn tất.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarOutlined style={{ fontSize: "28px" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Tổng doanh thu SP (Đã hoàn tất)
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {formatCurrency(totalRevenue)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <RiseOutlined style={{ fontSize: "28px" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Sản phẩm đã phát sinh doanh thu
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {data.length} <span className="text-lg font-medium text-slate-500">sản phẩm</span>
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        <div className="mb-4 flex justify-between items-center">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: "8px" }}
            size="large"
          />
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default ProductRevenueDashboard;
