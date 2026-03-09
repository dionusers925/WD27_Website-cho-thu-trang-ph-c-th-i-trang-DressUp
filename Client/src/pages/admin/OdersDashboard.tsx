import { Card, Col, Row, Table, Tag, Button } from "antd";
import {
  ShoppingCartOutlined,
  SyncOutlined,
  CarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import FooterMenu from "../../layouts/admin/components/FooterMenu";

const orders = [
  {
    key: "1",
    id: 1,
    customer: "Nguyễn Văn A",
    status: "pending",
    date: "2026-01-26",
    amount: 450000,
    price: 150000,
  },
  {
    key: "2",
    id: 2,
    customer: "Nguyễn Văn A",
    status: "pending",
    date: "2026-01-26",
    amount: 450000,
    price: 150000,
  },
  {
    key: "3",
    id: 3,
    customer: "Trần Thị B",
    status: "paid",
    date: "2026-01-27",
    amount: 350000,
    price: 350000,
  },
];

const statusColor: Record<string, string> = {
  pending: "blue",
  paid: "green",
  shipped: "orange",
  completed: "green",
  cancelled: "red",
};

const columns = [
  {
    title: " ID",
    dataIndex: "id",
    render: (_: any, __: any, index: number) => index + 1,
  },
  {
    title: "Customer",
    dataIndex: "customer",
  },
  {
    title: "Status",
    dataIndex: "status",
    render: (status: string) => (
      <Tag color={statusColor[status]}>{status.toUpperCase()}</Tag>
    ),
  },
  {
    title: "Date",
    dataIndex: "date",
  },
  {
    title: "Amount",
    dataIndex: "amount",
    render: (amount: number) => amount.toLocaleString("vi-VN") + " ₫",
  },
  {
    title: "Price",
    dataIndex: "price",
    render: (price: number) => price.toLocaleString("vi-VN") + " ₫",
  },
  {
    title: "Phone",
    dataIndex: "phone",
  },
  {
    title: "Action",
    render: () => <Button type="primary">View</Button>,
  },
];

const OrdersDashboard = () => {
  const summaryData = [
    {
      title: "New Orders",
      value: orders.filter((o) => o.status === "pending").length,
      icon: <ShoppingCartOutlined />,
    },
    {
      title: "Completed Orders",
      value: orders.filter((o) => o.status === "completed").length,
      icon: <CarOutlined />,
    },
    {
      title: "Cancelled Orders",
      value: orders.filter((o) => o.status === "cancelled").length,
      icon: <DollarOutlined />,
    },
    {
      title: "Paid",
      value: orders.filter((o) => o.status === "paid").length,
      icon: <DollarOutlined />,
    },
  ];

  return (
    <>
      <div style={{ padding: 24 }}>
        <Row gutter={16}>
          {summaryData.map((item) => (
            <Col span={6} key={item.title}>
              <Card>
                <Row align="middle" justify="space-between">
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{item.title}</h4>
                    <h2 style={{ margin: 0 }}>{item.value}</h2>
                  </div>
                  <div style={{ fontSize: 28, color: "#1677ff" }}>
                    {item.icon}
                  </div>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="Recent Orders" style={{ marginTop: 24 }}>
          <Table columns={columns} dataSource={orders} pagination={false} />
        </Card>
      </div>

      <div>
        <FooterMenu />
      </div>
    </>
  );
};

export default OrdersDashboard;
