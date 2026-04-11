import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Col, Image, Input, Row, Select, Table, Tag, message } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { getProduct, getProductVariantHistory } from "../../../services/product.service";
import type { Product, VariantStockHistory } from "../../../types/product";
import "./product.css";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " VND";
const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};
const imageFallback =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22320%22%20height%3D%22420%22%3E%3Crect%20width%3D%22320%22%20height%3D%22420%22%20fill%3D%22%23eee6e0%22/%3E%3Ctext%20x%3D%22160%22%20y%3D%22210%22%20font-size%3D%2214%22%20fill%3D%22%238a7f78%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%3ENo%20Image%3C/text%3E%3C/svg%3E";
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
const statusLabel = (value?: string) => {
  if (value === "active") return "Hoạt động";
  if (value === "draft") return "Tạm ngừng";
  if (value === "archived") return "Lưu trữ";
  return value ?? "-";
};
const statusColor = (value?: string) => {
  if (value === "active") return "green";
  if (value === "draft") return "orange";
  if (value === "archived") return "default";
  return "default";
};
const historyActionLabel = (value?: string) => {
  switch (value) {
    case "initial":
      return "Khởi tạo";
    case "update":
      return "Cập nhật";
    case "added":
      return "Thêm biến thể";
    case "removed":
      return "Xóa biến thể";
    case "rent":
      return "Cho thuê";
    case "adjust":
      return "Điều chỉnh";
    case "returned":
      return "Đã trả";
    default:
      return value ?? "-";
  }
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<VariantStockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(8);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySku, setHistorySku] = useState("");
  const [historyAction, setHistoryAction] = useState<string | undefined>(
    undefined
  );

  const fetchProduct = async () => {
    if (!id) return;
    try {
      const res = await getProduct(id);
      const data = res.data;
      const payload = data?.data ?? data;
      const productData = payload?.product ?? payload;
      const variants = payload?.variants ?? productData?.variants ?? [];
      setProduct(productData ? ({ ...productData, variants } as Product) : null);
    } catch (error) {
      message.error("Tải sản phẩm thất bại");
    }
  };

  const fetchHistory = async () => {
    if (!id) return;
    try {
      setHistoryLoading(true);
      const res = await getProductVariantHistory(id, {
        page: historyPage,
        limit: historyLimit,
        sku: historySku.trim() ? historySku.trim() : undefined,
        action: historyAction,
      });
      const payload = res.data?.data ?? {};
      setHistory(Array.isArray(payload.items) ? payload.items : []);
      setHistoryTotal(Number(payload.total ?? 0));
    } catch (error) {
      message.error("Không thể tải lịch sử tồn kho");
      setHistory([]);
      setHistoryTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    fetchHistory();
  }, [id, historyPage, historyLimit, historySku, historyAction]);

  const minRentalPrice = useMemo(() => {
    const prices = product?.rentalPrices ?? [];
    if (prices.length === 0) return 0;
    return Math.min(...prices.map((p) => p.price));
  }, [product]);
  const variantCount = useMemo(
    () => (product?.variants ?? []).length,
    [product]
  );

  const totalAvailable = useMemo(
    () =>
      (product?.variants ?? []).reduce(
        (sum, v: any) => sum + (Number(v.stock ?? 0) || 0),
        0
      ),
    [product]
  );

  const totalBorrowed = useMemo(
    () =>
      (product?.variants ?? []).reduce(
        (sum, v: any) => sum + (Number(v.reservedStock ?? 0) || 0),
        0
      ),
    [product]
  );

  const totalAll = totalAvailable + totalBorrowed;

  const historyColumns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      width: 130,
      render: (value: string) => value || "-",
    },
    {
      title: "Size",
      dataIndex: "size",
      width: 80,
      render: (value: string) => value || "-",
    },
    {
      title: "Màu",
      dataIndex: "color",
      width: 100,
      render: (value: string) => value || "-",
    },
    {
      title: "Trước",
      dataIndex: "oldStock",
      width: 70,
      render: (value: number) => value ?? 0,
    },
    {
      title: "Sau",
      dataIndex: "newStock",
      width: 70,
      render: (value: number) => value ?? 0,
    },
    {
      title: "Thay đổi",
      dataIndex: "change",
      width: 90,
      render: (value: number) => {
        const changeValue = Number(value ?? 0);
        const color =
          changeValue > 0 ? "green" : changeValue < 0 ? "red" : "default";
        const label =
          changeValue > 0 ? `+${changeValue}` : String(changeValue);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Hành động",
      dataIndex: "action",
      width: 120,
      render: (value: string) => (
        <Tag color="geekblue">{historyActionLabel(value)}</Tag>
      ),
    },
  ];

  if (!product) return null;

  return (
    <div className="product-page product-detail">
      <div className="product-page-header">
        <div>
          <div className="product-title">{product.name}</div>
          <div className="product-subtitle">{product.slug}</div>
        </div>
        <div className="product-toolbar">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
          >
            Chỉnh sửa
          </Button>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={10}>
          <Card className="product-card product-image-card">
            <Image width="100%" src={product.images?.[0]} fallback={imageFallback} />
            <Row gutter={8} style={{ marginTop: 10 }}>
              {product.images?.map((img, index) => (
                <Col span={6} key={`${img}-${index}`}>
                  <Image src={img} fallback={imageFallback} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={14}>
          <Card className="product-card product-section" title="Thông tin cơ bản">
            <div className="product-info-row">
              <span>ID:</span>
              <span>{product._id}</span>
            </div>
            <div className="product-info-row">
              <span>Thương hiệu:</span>
              <span>{product.brand ?? "-"}</span>
            </div>
            <div className="product-info-row">
              <span>Chất liệu:</span>
              <span>{product.material ?? "-"}</span>
            </div>
            <div className="product-info-row">
              <span>Nhóm màu:</span>
              <span>{product.colorGroup ?? "-"}</span>
            </div>
            <div className="product-info-row">
              <span>Danh mục:</span>
              <span>
                {product.categoryId?.name ?? (product as any).categoryId ?? "-"}
              </span>
            </div>
            <div className="product-info-row">
              <span>Số lượng biến thể:</span>
              <span>{variantCount}</span>
            </div>
            <div className="product-info-row">
              <span>Tình trạng:</span>
              <span>
                <Tag>{conditionLabel(product.condition)}</Tag>
              </span>
            </div>
            <div className="product-info-row">
              <span>Trạng thái:</span>
              <span>
                <Tag color={statusColor(product.status)}>
                  {statusLabel(product.status)}
                </Tag>
              </span>
            </div>
          </Card>

          <Card className="product-card product-section" title="Giá thuê">
            <div className="product-info-row">
              <span>Giá tối thiểu:</span>
              <span>{formatCurrency(minRentalPrice)}</span>
            </div>
            <div className="product-info-row">
              <span>Tiền đặt cọc:</span>
              <span>{formatCurrency(product.depositPrice ?? 0)}</span>
            </div>
            <div className="product-info-list">
              {(product.rentalPrices ?? []).map((r, index) => (
                <div key={index}>
                  {r.days} ngày : {formatCurrency(r.price)}
                </div>
              ))}
            </div>
          </Card>

          <Card className="product-card product-section" title="Biến thể">
            {(product.variants ?? []).length === 0 && (
              <div className="product-variants-empty">Chưa có biến thể</div>
            )}
            {(product.variants ?? []).length > 0 && (
              <div className="product-variant-summary">
                <div className="product-variant-summary-item">
                  <div className="product-variant-summary-label">
                    Tổng sản phẩm khách đang thuê
                  </div>
                  <div className="product-variant-summary-value">
                    {totalBorrowed}
                  </div>
                </div>
                <div className="product-variant-summary-item">
                  <div className="product-variant-summary-label">
                    Tổng sản phẩm còn lại sau khi cho thuê
                  </div>
                  <div className="product-variant-summary-value">
                    {totalAvailable}
                  </div>
                </div>
                <div className="product-variant-summary-item">
                  <div className="product-variant-summary-label">
                    Tổng sản phẩm (đang thuê + còn lại)
                  </div>
                  <div className="product-variant-summary-value">
                    {totalAll}
                  </div>
                </div>
              </div>
            )}
            <div className="product-info-list">
              {(product.variants ?? []).map((v, index) => (
                <div key={index}>
                  #{index + 1} {v.size || "-"} - {v.color || "-"} ({v.sku || "-"})
                  - Đang mượn: {v.reservedStock ?? 0} - Còn lại: {v.stock ?? 0}
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="product-card product-section product-table-card"
            title="Lịch sử tồn kho"
          >
            <div className="product-history-toolbar">
              <Input
                placeholder="Tìm theo SKU..."
                value={historySku}
                onChange={(e) => {
                  setHistorySku(e.target.value);
                  setHistoryPage(1);
                }}
                style={{ width: 220 }}
              />
              <Select
                allowClear
                placeholder="Lọc hành động"
                value={historyAction}
                onChange={(value) => {
                  setHistoryAction(value);
                  setHistoryPage(1);
                }}
                style={{ width: 180 }}
                options={[
                  { value: "initial", label: "Khởi tạo" },
                  { value: "update", label: "Cập nhật" },
                  { value: "added", label: "Thêm biến thể" },
                  { value: "removed", label: "Xóa biến thể" },
                  { value: "rent", label: "Cho thuê" },
                  { value: "returned", label: "Đã trả" },
                  { value: "adjust", label: "Điều chỉnh" },
                ]}
              />
            </div>
            <Table
              size="small"
              rowKey="_id"
              columns={historyColumns as any}
              dataSource={history}
              loading={historyLoading}
              pagination={{
                current: historyPage,
                pageSize: historyLimit,
                total: historyTotal,
                onChange: (nextPage, nextPageSize) => {
                  setHistoryPage(nextPage);
                  setHistoryLimit(nextPageSize ?? historyLimit);
                },
              }}
              locale={{ emptyText: "Chưa có lịch sử tồn kho" }}
            />
          </Card>

          <Card className="product-card product-section" title="Tags">
            {(product.tags ?? []).length === 0 && <span>-</span>}
            {(product.tags ?? []).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Card>

          <Card className="product-card product-section" title="Mô tả">
            {product.description ? (
              <div
                className="product-rich-text"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              "-"
            )}
          </Card>

          <Card className="product-card product-section" title="Metadata">
            <div className="product-info-row">
              <span>Ngày tạo:</span>
              <span>{formatDateTime(product.createdAt)}</span>
            </div>
            <div className="product-info-row">
              <span>Cập nhật lần cuối:</span>
              <span>{formatDateTime(product.updatedAt)}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
