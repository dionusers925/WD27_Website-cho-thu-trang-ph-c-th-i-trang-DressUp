import { useEffect, useState, useMemo } from "react";
import { Card, Table, Select, Space } from "antd";
import { DollarOutlined, CalendarOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;

interface Order {
  _id: string;
  status: string;
  total?: number;
  createdAt: string;
}

interface RevenueData {
  date: string;
  totalRevenue: number;
  orderCount: number;
  timestamp: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

const TotalRevenueDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"day" | "month" | "year">("day");

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
    const revenueMap: Record<string, RevenueData> = {};

    orders.forEach((order) => {
      if (order.status !== "completed") return;

      const dateObj = new Date(order.createdAt);
      if (isNaN(dateObj.getTime())) return;

      let dateKey = "";
      let timestamp = 0;

      if (filterType === "day") {
        dateKey = dateObj.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
        timestamp = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
      } else if (filterType === "month") {
        dateKey = `Tháng ${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        timestamp = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime();
      } else if (filterType === "year") {
        dateKey = `Năm ${dateObj.getFullYear()}`;
        timestamp = new Date(dateObj.getFullYear(), 0, 1).getTime();
      }

      if (!revenueMap[dateKey]) {
        revenueMap[dateKey] = {
          date: dateKey,
          totalRevenue: 0,
          orderCount: 0,
          timestamp,
        };
      }

      revenueMap[dateKey].totalRevenue += Number(order.total) || 0;
      revenueMap[dateKey].orderCount += 1;
    });

    return Object.values(revenueMap).sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, filterType]);

  const totalRevenue = useMemo(
    () => data.reduce((sum, item) => sum + item.totalRevenue, 0),
    [data]
  );

  const totalOrders = useMemo(
    () => data.reduce((sum, item) => sum + item.orderCount, 0),
    [data]
  );

  const columns = [
    {
      title: filterType === "day" ? "Ngày" : filterType === "month" ? "Tháng" : "Năm",
      dataIndex: "date",
      key: "date",
      render: (text: string) => <span className="font-semibold text-gray-700">{text}</span>
    },
    {
      title: "Số đơn hàng hoàn tất",
      dataIndex: "orderCount",
      key: "orderCount",
      render: (val: number) => <span className="text-blue-600 font-medium">{val} đơn</span>,
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (val: number) => (
        <span className="font-bold text-emerald-600 text-lg">
          {formatCurrency(val)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tổng doanh thu</h1>
          <p className="text-slate-500 mt-1">Thống kê tổng doanh thu của toàn bộ hệ thống từ các đơn hàng đã hoàn tất.</p>
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
                Tổng doanh thu
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
              <CalendarOutlined style={{ fontSize: "28px" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Tổng đơn hàng thành công
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {totalOrders} <span className="text-lg font-medium text-slate-500">đơn</span>
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Chi tiết doanh thu</h2>
          <Space>
            <span className="text-sm text-slate-500 font-medium">Lọc theo:</span>
            <Select 
              value={filterType} 
              onChange={(val) => setFilterType(val)} 
              style={{ width: 150 }}
              size="large"
            >
              <Option value="day">Theo Ngày</Option>
              <Option value="month">Theo Tháng</Option>
              <Option value="year">Theo Năm</Option>
            </Select>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="date"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TotalRevenueDashboard;
