import "./App.css";
import { useRoutes } from "react-router-dom";
import Adminlayout from "./layouts/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import OrdersDashboard from "./pages/admin/OdersDashboard";
import ListCategory from "./pages/admin/category/ListCategory";
import AddCategory from "./pages/admin/category/AddCategory";
import EditCategory from "./pages/admin/category/EditCategory";

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
  ]);

  return router;
}

export default App;
