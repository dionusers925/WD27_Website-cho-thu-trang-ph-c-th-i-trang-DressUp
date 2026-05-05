import {
  DashboardOutlined,
  FundOutlined,
  MessageOutlined,
  ProductOutlined,
  TagsOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

const dashboardKeys = ["", "total-revenue", "revenue"];

const SidebarMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items: MenuItem[] = [
    {
      key: "dashboard-group",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      children: [
        {
          key: "",
          label: "Tổng quan",
        },
        {
          key: "total-revenue",
          label: "Tổng doanh thu",
        },
        {
          key: "revenue",
          label: "Doanh thu sản phẩm",
        },
      ],
    },
    {
      key: "order",
      label: "Quản lý đơn hàng",
      icon: <ProductOutlined />,
    },
    {
      key: "categories",
      label: "Quản lý danh mục",
      icon: <ProductOutlined />,
    },
    {
      key: "attributes",
      label: "Quản lý thuộc tính",
      icon: <TagsOutlined />,
    },
    {
      key: "products",
      label: "Quản lý sản phẩm",
      icon: <ProductOutlined />,
    },
    {
      key: "stock-history",
      label: "Biến động tồn kho",
      icon: <FundOutlined />,
    },
    {
      key: "reviews",
      label: "Quản lý đánh giá",
      icon: <MessageOutlined />,
    },
    {
      key: "banners",
      label: "Quản lý Banner",
      icon: <PictureOutlined />,
    },
  ];

  const handleClick = ({ key }: { key: string }) => {
    if (key === "") {
      navigate("/admin");
      return;
    }

    navigate(`/admin/${key}`);
  };

  const currentPath = location.pathname.replace("/admin", "").replace(/^\//, "");
  const selectedKey = dashboardKeys.includes(currentPath)
    ? currentPath
    : currentPath.split("/")[0];

  return (
    <Menu
      selectedKeys={[selectedKey]}
      defaultOpenKeys={["dashboard-group"]}
      mode="inline"
      theme="dark"
      items={items}
      onClick={handleClick}
    />
  );
};

export default SidebarMenu;
