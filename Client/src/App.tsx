
import "./App.css";
import { Navigate, useRoutes } from "react-router-dom";

import Adminlayout from "./layouts/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import OrdersDashboard from "./pages/admin/OdersDashboard";
import ListCategory from "./pages/admin/category/ListCategory";
import AddCategory from "./pages/admin/category/AddCategory";
import EditCategory from "./pages/admin/category/EditCategory";
import AttributeDashboard from "./pages/admin/attribute/AttributeDashboard";
import ProductDashboard from "./pages/admin/products/ProductDashboard";
import ProductCreate from "./pages/admin/products/ProductCreate";
import ProductEdit from "./pages/admin/products/ProductEdit";
import ProductDetail from "./pages/admin/products/ProductDetail";

function App() {
  const RedirectToAdmin = () => <Navigate to="/admin" replace />;
  const NotFound = () => <div>Not Found</div>;

  const router = useRoutes([
    {
      path: "/",
      Component: RedirectToAdmin,
    },
    {
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
