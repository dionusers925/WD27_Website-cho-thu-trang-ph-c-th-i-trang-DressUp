import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Col, Image, Row, Tag, message } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { getProduct } from "../../../services/product.service";
import { Product } from "../../../types/product";
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
  if (value === "draft") return "Lưu trữ";
  if (value === "archived") return "Ngưng";
  return value ?? "-";
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);

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

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const minRentalPrice = useMemo(() => {
    const prices = product?.rentalPrices ?? [];
    if (prices.length === 0) return 0;
    return Math.min(...prices.map((p) => p.price));
  }, [product]);

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
              <span>Tình trạng:</span>
              <span>
                <Tag>{conditionLabel(product.condition)}</Tag>
              </span>
            </div>
            <div className="product-info-row">
              <span>Trạng thái:</span>
              <span>
                <Tag color="geekblue">{statusLabel(product.status)}</Tag>
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
            <div className="product-info-list">
              {(product.variants ?? []).map((v, index) => (
                <div key={index}>
                  #{index + 1} {v.size} - {v.color} ({v.sku})
                </div>
              ))}
            </div>
          </Card>

          <Card className="product-card product-section" title="Tags">
            {(product.tags ?? []).length === 0 && <span>-</span>}
            {(product.tags ?? []).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Card>

          <Card className="product-card product-section" title="Mô tả">
            {product.description ?? "-"}
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
