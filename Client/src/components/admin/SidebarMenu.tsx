import {
  DashboardOutlined,
  ProductOutlined,
  TagsOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

const SidebarMenu = () => {
  const items: MenuItem[] = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
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
      key: "reviews",
      label: "Quản lý đánh giá",
      icon: <MessageOutlined />,
    },
  ];

  const navigate = useNavigate();

  const handleClick = ({ key }: any) => {
    navigate(`/admin/${key}`);
  };

  return (
    <Menu
      defaultSelectedKeys={["dashboard"]}
      mode="inline"
      theme="dark"
      items={items}
      onClick={handleClick}
    />
  );
};

export default SidebarMenu;
