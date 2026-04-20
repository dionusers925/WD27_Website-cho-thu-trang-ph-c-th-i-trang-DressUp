import "./App.css";
import { useRoutes } from "react-router-dom";

import Adminlayout from "./layouts/admin/AdminLayout";
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


import HomePage from "./pages/client/HomePage";
import DetailPage from "./pages/client/DetailPage";
import PolicyPage from "./pages/client/PolicyPage";
import CartPage from "./pages/client/CartPage";
import ProductsPage from "./pages/client/ProductsPage";
import CheckoutPage from "./pages/client/CheckoutCart";
import LayoutClient from "./layouts/client/LayoutClient";
import OrderHistory from "./pages/client/OrderHistory";

import AuthLayout from "./layouts/AuthLayout";
import RegisterPage from "./layouts/RegisterPage";
import LoginPage from "./layouts/LoginPage";
import ProtectedRoute from "./layouts/ProtectedRoute";

import PaymentResult from "./pages/client/PaymentResult";
import ShipperPage from "./pages/shipper/ShipperPage";

function App() {
  const NotFound = () => <div>Not Found</div>;

  const router = useRoutes([
    // PAYMENT
    {
      path: "/payment-result",
      Component: PaymentResult,
    },

    // SHIPPER
    {
      path: "/ship",
      Component: ShipperPage,
    },

    // ADMIN
    {
      path: "/admin",
      Component: ProtectedRoute,
      children: [
        {
          path: "",
          Component: Adminlayout,
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

    // CLIENT
    {
      path: "/",
      Component: LayoutClient,
      children: [
        { index: true, Component: HomePage },
        { path: "detail/:id", Component: DetailPage },
        { path: "policy", Component: PolicyPage },
        { path: "catalog", Component: ProductsPage },
        { path: "cart", Component: CartPage },
        { path: "checkout", Component: CheckoutPage }, 
        { path: "orders", Component: OrderHistory },
      ],
    },

    // AUTH
    {
      path: "/auth",
      Component: AuthLayout,
      children: [
        { path: "login", Component: LoginPage },
        { path: "register", Component: RegisterPage },
      ],
    },

    // NOT FOUND
    {
      path: "*",
      Component: NotFound,
    },
  ]);

  return router;
}

export default App;
