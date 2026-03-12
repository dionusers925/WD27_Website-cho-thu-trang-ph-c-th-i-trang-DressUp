import { useRoutes } from "react-router-dom";
import "./App.css";
import Adminlayout from "./layouts/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import OrdersDashboard from "./pages/admin/OdersDashboard";
import ListCategory from "./pages/admin/category/ListCategory";
import AddCategory from "./pages/admin/category/AddCategory";
import EditCategory from "./pages/admin/category/EditCategory";
import HomePage from "./pages/client/HomePage";
import DetailPage from "./pages/client/DetailPage";
import PolicyPage from "./pages/client/PolicyPage";
import CartPage from "./pages/client/CartPage";
import LayoutClient from "./layouts/client/LayoutClient";

function App() {
  const router = useRoutes([
    {
      path: "/admin",
      Component: Adminlayout,
      children: [
        { path: "", Component: Dashboard },
        { path: "order", Component: OrdersDashboard },
        { path: "categories", Component: ListCategory },
        { path: "categories/add", Component: AddCategory },
        { path: "categories/:id", Component: EditCategory },
      ],
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
  ]);

  return router;
}

export default App;
