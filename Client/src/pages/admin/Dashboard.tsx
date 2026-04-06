import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Package, 
  ArrowUpRight,
  DollarSign,
  Activity
} from "lucide-react";

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName?: string;
  userId?: { name: string };
  paymentMethod: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          axios.get("http://localhost:3000/orders"),
          axios.get("http://localhost:3000/users").catch(() => ({ data: [] })),
          axios.get("http://localhost:3000/api/products").catch(() => ({ data: [] })),
        ]);

        const orders: Order[] = ordersRes.data || [];
        const users = usersRes.data || [];
        const productsData = productsRes.data;
        
        let products = [];
        if (Array.isArray(productsData)) {
          products = productsData;
        } else if (Array.isArray(productsData?.data?.products)) {
          products = productsData.data.products;
        } else if (Array.isArray(productsData?.products)) {
          products = productsData.products;
        }

        const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        
        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalUsers: users.length,
          totalProducts: products.length,
        });

        // Set recent orders (last 5)
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      cancelled: "bg-rose-100 text-rose-700 border-rose-200",
      delivered: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải dữ liệu Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-slate-500 mt-1">Theo dõi hoạt động kinh doanh và hiệu suất cửa hàng.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Hệ thống đang hoạt động
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} className="text-blue-600" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tổng doanh thu</p>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-slate-800">
              {stats.totalRevenue.toLocaleString()} ₫
            </h3>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600 font-medium">
              <ArrowUpRight size={16} />
              <span>Cập nhật mới nhất</span>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag size={80} className="text-indigo-600" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tổng đơn hàng</p>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-slate-800">{stats.totalOrders}</h3>
            <div className="flex items-center gap-1 mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-700">
              <Link to="/admin/order" className="flex items-center gap-1">
                Xem chi tiết <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={80} className="text-amber-600" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Khách hàng</p>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-slate-800">{stats.totalUsers}</h3>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600 font-medium">
              <ArrowUpRight size={16} />
              <span>Đang hoạt động</span>
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={80} className="text-rose-600" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sản phẩm</p>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-slate-800">{stats.totalProducts}</h3>
            <div className="flex items-center gap-1 mt-2 text-sm text-rose-600 font-medium hover:text-rose-700">
              <Link to="/admin/products" className="flex items-center gap-1">
                Quản lý kho <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area (Simulated) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Hoạt động gần đây
            </h2>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none">
              <option>7 ngày qua</option>
              <option>Trong tháng</option>
              <option>Trong năm</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[300px] flex items-end gap-2 sm:gap-4 lg:gap-6 pt-10">
            {/* Generating pseudo-bars to simulate a chart */}
            {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
              <div key={i} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {((height * 100000) * 1.5).toLocaleString()} ₫
                </div>
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-500 hover:opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-slate-500 mt-3 font-medium">
                  {`Ngày ${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Đơn hàng mới</h2>
            <Link to="/admin/order" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Xem tất cả
            </Link>
          </div>
          <div className="p-4 flex-1">
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {order.customerName ? order.customerName.charAt(0).toUpperCase() : order.userId?.name?.charAt(0).toUpperCase() || "K"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {order.customerName || order.userId?.name || "Khách tại quầy"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Mã: <span className="font-mono">{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {(order.total || 0).toLocaleString()} ₫
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="bg-slate-100 p-4 rounded-full mb-3">
                  <ShoppingBag className="text-slate-400" size={24} />
                </div>
                <p className="text-slate-600 font-medium">Chưa có đơn hàng nào</p>
                <p className="text-sm text-slate-400">Các đơn hàng mới sẽ xuất hiện ở đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
