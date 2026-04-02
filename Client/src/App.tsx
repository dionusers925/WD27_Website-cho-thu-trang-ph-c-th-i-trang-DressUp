import "./App.css";
import { useRoutes } from "react-router-dom";

// ADMIN
import AdminLayout from "./layouts/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import OrdersDashboard from "./pages/admin/OdersDashboard";
import OrderDetail from "./pages/admin/order/OrderDetail";
import ListCategory from "./pages/admin/category/ListCategory";
import AddCategory from "./pages/admin/category/AddCategory";
import EditCategory from "./pages/admin/category/EditCategory";
import AttributeDashboard from "./pages/admin/attribute/AttributeDashboard";
import ProductDashboard from "./pages/admin/products/ProductDashboard";
import ProductCreate from "./pages/admin/products/ProductCreate";
import ProductEdit from "./pages/admin/products/ProductEdit";
import ProductDetail from "./pages/admin/products/ProductDetail";
import ReviewsDashboard from "./pages/admin/ReviewsDashboard";
import StockHistoryDashboard from "./pages/admin/stock/StockHistoryDashboard";

// CLIENT
import LayoutClient from "./layouts/client/LayoutClient";
import HomePage from "./pages/client/HomePage";
import DetailPage from "./pages/client/DetailPage";
import PolicyPage from "./pages/client/PolicyPage";
import CartPage from "./pages/client/CartPage";
import ProductsPage from "./pages/client/ProductsPage";
import PaymentResult from "./pages/client/PaymentResult";

// AUTH
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./layouts/LoginPage";
import RegisterPage from "./layouts/RegisterPage";
import ProtectedRoute from "./layouts/ProtectedRoute";

function App() {
  const NotFound = () => <div>Not Found</div>;

  const router = useRoutes([
    {
      path: "/payment-result",
      Component: PaymentResult,
    },

    {
      path: "/admin",
      Component: ProtectedRoute,
      children: [
        {
          Component: AdminLayout,
          children: [
            { index: true, Component: Dashboard },

            // ORDER
            { path: "order", Component: OrdersDashboard },
            { path: "order/:id", Component: OrderDetail },

            // CATEGORY
            { path: "categories", Component: ListCategory },
            { path: "categories/add", Component: AddCategory },
            { path: "categories/:id", Component: EditCategory },

            // ATTRIBUTE
            { path: "attributes", Component: AttributeDashboard },

            // PRODUCTS
            { path: "products", Component: ProductDashboard },
            { path: "products/new", Component: ProductCreate },
            { path: "products/:id/edit", Component: ProductEdit },
            { path: "products/:id", Component: ProductDetail },
            { path: "stock-history", Component: StockHistoryDashboard },

            // REVIEWS
            { path: "reviews", Component: ReviewsDashboard },
          ],
        },
      ],
    },

    {
      path: "/",
      Component: LayoutClient,
      children: [
        { index: true, Component: HomePage },
        { path: "detail/:id", Component: DetailPage },
        { path: "policy", Component: PolicyPage },
        { path: "catalog", Component: ProductsPage },
        { path: "cart", Component: CartPage },
      ],
    },

    {
      path: "/auth",
      Component: AuthLayout,
      children: [
        { path: "login", Component: LoginPage },
        { path: "register", Component: RegisterPage },
      ],
    },

    {
      path: "*",
      Component: NotFound,
    },
  ]);

  return router;
}

export default App;
