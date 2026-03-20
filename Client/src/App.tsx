import { useRoutes, Navigate } from "react-router-dom";
import ProtectedRoute from "./layouts/ProtectedRoute";

// Admin
import Adminlayout from "./layouts/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import OrdersDashboard from "./pages/admin/OdersDashboard";
import ListCategory from "./pages/admin/category/ListCategory";
import AddCategory from "./pages/admin/category/AddCategory";
import EditCategory from "./pages/admin/category/EditCategory";

// Client
import LayoutClient from "./layouts/client/LayoutClient";
import HomePage from "./pages/client/HomePage";
import DetailPage from "./pages/client/DetailPage";
import PolicyPage from "./pages/client/PolicyPage";
import CartPage from "./pages/client/CartPage";

// Auth
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./layouts/LoginPage";
import RegisterPage from "./layouts/RegisterPage";
import AttributeDashboard from "./pages/admin/attribute/AttributeDashboard";
import ProductDashboard from "./pages/admin/products/ProductDashboard";
import ProductCreate from "./pages/admin/products/ProductCreate";
import ProductEdit from "./pages/admin/products/ProductEdit";
import ProductDetail from "./pages/admin/products/ProductDetail";
import ReviewsDashboard from "./pages/admin/ReviewsDashboard";

function App() {
  const NotFound = () => <div>Not Found</div>;
  const router = useRoutes([
    {
      // path: "/admin",
      // Component: ProtectedRoute, // bọc bảo vệ
      // children: [
      //   {
      path: "/admin",
      Component: Adminlayout,
      children: [
        { index: true, Component: Dashboard },
        { path: "order", Component: OrdersDashboard },
        { path: "categories", Component: ListCategory },
        { path: "categories/add", Component: AddCategory },
        { path: "categories/:id", Component: EditCategory },
        { path: "attributes", Component: AttributeDashboard },
        // PRODUCTS
        { path: "products", Component: ProductDashboard },
        { path: "products/new", Component: ProductCreate },
        { path: "products/:id/edit", Component: ProductEdit },
        { path: "products/:id", Component: ProductDetail },
        // REVIEWS
        { path: "reviews", Component: ReviewsDashboard },
      ],
      //   },
      // ],
    },

    {
      path: "/",
      Component: LayoutClient,
      children: [
        { path: "", Component: HomePage },
        { path: "detail/:id", Component: DetailPage },
        { path: "policy", Component: PolicyPage },
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

    { path: "/login", element: <Navigate to="/auth/login" replace /> }, // nếu ai truy cập /login
    {
      path: "*",
      Component: NotFound,
    },
  ]);

  return router;
}

export default App;
