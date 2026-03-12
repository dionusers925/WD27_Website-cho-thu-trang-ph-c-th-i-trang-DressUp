import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Image,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../../../services/product.service";
import { Product } from "../../../types/product";
import "./product.css";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " VND";
const imageFallback =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2256%22%20height%3D%2276%22%3E%3Crect%20width%3D%2256%22%20height%3D%2276%22%20fill%3D%22%23eee6e0%22/%3E%3Ctext%20x%3D%2228%22%20y%3D%2238%22%20font-size%3D%228%22%20fill%3D%22%238a7f78%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%3ENo%20Image%3C/text%3E%3C/svg%3E";

const conditionLabel = (value?: string) => {
  switch (value) {
    case "new":
      return "Mới";
    case "good":
      return "Tốt";
    case "used":
      return "Đã sử dụng";
    case "damaged":
      return "Cần sửa";
    default:
      return value ?? "-";
  }
};

const statusColor = (value?: string) => {
  if (value === "active") return "green";
  if (value === "draft") return "orange";
  if (value === "archived") return "default";
  return "default";
};
const statusLabel = (value?: string) => {
  if (value === "active") return "Hoạt động";
  if (value === "draft") return "Lưu trữ";
  if (value === "archived") return "Ngưng";
  return "Lưu trữ";
};

const ProductDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts({ page, limit, search });
      const data = res.data?.data ?? {};
      setProducts(Array.isArray(data.products) ? data.products : []);
      setTotal(Number(data.total ?? 0));
    } catch (error) {
      message.error("Không thể tải danh sách sản phẩm");
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, limit, search]);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "Hình",
      width: 90,
      render: (record: Product) => (
        <Image
          width={56}
          height={76}
          src={record.images?.[0]}
          fallback={imageFallback}
        />
      ),
    },
    {
      title: "Tên sản phẩm",
      render: (record: Product) => (
        <div>
          <div className="product-cell-title">{record.name}</div>
          <div className="product-cell-sub">{record.slug}</div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      render: (record: Product) =>
        record.categoryId?.name ?? (record as any).categoryId ?? "-",
    },
    {
      title: "Giá thuê",
      render: (record: Product) => {
        const prices = record.rentalPrices ?? [];
        const minPrice =
          prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
        return formatCurrency(minPrice);
      },
    },
    {
      title: "Đặt cọc",
      render: (record: Product) => formatCurrency(record.depositPrice ?? 0),
    },
    {
      title: "Tình trạng",
      render: (record: Product) => <Tag>{conditionLabel(record.condition)}</Tag>,
    },
    {
      title: "Trạng thái",
      render: (record: Product) => (
        <Tag color={statusColor(record.status)}>
          {statusLabel(record.status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      render: (record: Product) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/admin/products/${record.slug || record._id}`)
            }
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/products/${record._id}/edit`)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="product-page product-list">
      <div className="product-page-header">
        <div>
          <div className="product-title">Quản lý sản phẩm</div>
          <div className="product-subtitle">{total} sản phẩm</div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/products/new")}
        >
          Thêm sản phẩm
        </Button>
      </div>

      <Card className="product-card product-list-toolbar">
        <div className="product-filter-bar">
          <Input
            placeholder="Tìm theo tên, slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 280 }}
          />
          <div className="product-toolbar-right">
            <span>Hiển thị</span>
            <Select
              value={limit}
              style={{ width: 90 }}
              onChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="product-card product-table-card">
        <Table
          rowKey="_id"
          columns={columns as any}
          dataSource={products}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setLimit(nextPageSize ?? limit);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ProductDashboard;
