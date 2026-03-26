import {
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";
import { ICategory } from "../../../../types/category";
import RentalPriceInput from "./RentalPriceInput";
import ProductVariants from "./ProductVariants";
import ProductImages from "./ProductImages";
import RichTextEditor from "./RichTextEditor";
import { Attribute } from "../../../../types/attribute";

type Props = {
  categories: ICategory[];
  loadingCategories?: boolean;
  onSlugManualChange?: () => void;
  attributes?: Attribute[];
};

export default function ProductForm({
  categories,
  loadingCategories,
  onSlugManualChange,
  attributes = [],
}: Props) {
  return (
    <div className="product-form">
      <Row gutter={16}>
        <Col span={16}>
          <Card
            className="product-card product-section"
            title="Thông tin cơ bản"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên sản phẩm"
                  rules={[
                    { required: true, message: "Tên sản phẩm bắt buộc" },
                    { min: 2, message: "Tối thiểu 2 ký tự" },
                  ]}
                >
                  <Input placeholder="Áo dài cưới trắng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="slug"
                  label="Slug (URL)"
                  getValueFromEvent={(e) => {
                    onSlugManualChange?.();
                    return (e?.target?.value ?? "").toLowerCase();
                  }}
                  rules={[
                    { required: true, message: "Slug bắt buộc" },
                    {
                      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message: "Slug chỉ bao gồm a-z, 0-9 và dấu -",
                    },
                  ]}
                >
                  <Input placeholder="ao-dai-cuoi-trang" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[{ required: true, message: "Chọn danh mục" }]}
            >
              <Select
                placeholder="Chọn danh mục"
                showSearch
                optionFilterProp="label"
                loading={loadingCategories}
                options={categories.map((c) => ({
                  value: c._id,
                  label: c.name,
                }))}
              />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <RichTextEditor placeholder="Mô tả sản phẩm" />
            </Form.Item>
          </Card>

          <Card
            className="product-card product-section"
            title="Đặc tính sản phẩm"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="brand" label="Thương hiệu">
                  <Input placeholder="Gucci, Chanel..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="condition" label="Tình trạng">
                  <Select
                    placeholder="Chọn tình trạng"
                    options={[
                      { value: "new", label: "Mới" },
                      { value: "good", label: "Tốt" },
                      { value: "used", label: "Đã sử dụng" },
                      { value: "damaged", label: "Cần sửa" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="material" label="Chất liệu">
                  <Input placeholder="Lụa, Voan, Cotton..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="colorGroup" label="Nhóm màu">
                  <Input placeholder="Trắng, Đỏ, Đen..." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Nhập tag và Enter"
                tokenSeparators={[","]}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="careInstruction" label="Hướng dẫn bảo quản">
                  <RichTextEditor placeholder="Giặt tay nhẹ..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="internalNote" label="Ghi chú nội bộ">
                  <RichTextEditor placeholder="Ghi chú cho nhân viên..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            className="product-card product-section"
            title="Hình ảnh sản phẩm"
          >
            <Form.Item name="images">
              <ProductImages />
            </Form.Item>
            <div className="product-hint">Ảnh đầu tiên sẽ làm ảnh bìa</div>
          </Card>

          <Card
            className="product-card product-section"
            title="Biến thể (Size / Màu)"
          >
            <Form.Item
              name="variants"
              rules={[
                {
                  validator: async (_, value) =>
                    value && value.length > 0
                      ? value.some((v: any) => !v?.size || !v?.color || !v?.sku)
                        ? Promise.reject(
                            new Error("Size, màu và SKU bắt buộc")
                          )
                        : new Set(value.map((v: any) => v?.sku)).size !==
                          value.length
                          ? Promise.reject(new Error("SKU bị trùng lặp"))
                          : Promise.resolve()
                      : Promise.reject(new Error("Cần ít nhất 1 biến thể")),
                },
              ]}
            >
              <ProductVariants attributes={attributes} />
            </Form.Item>
          </Card>
        </Col>

        <Col span={8}>
          <Card className="product-card product-section" title="Trạng thái">
            <Form.Item name="status">
              <Select
                options={[
                  { label: "Hoạt động", value: "active" },
                  { label: "Lưu trữ", value: "draft" },
                  { label: "Ngưng", value: "archived" },
                ]}
              />
            </Form.Item>
          </Card>

          <Card
            className="product-card product-section"
            title="Giá thuê & Đặt cọc"
          >
            <Form.Item
              name="depositPrice"
              label="Tiền đặt cọc (VND)"
              rules={[{ required: true, message: "Nhập tiền đặt cọc" }]}
            >
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="rentalPrices"
              label="Mức giá thuê"
              rules={[
                {
                  validator: async (_, value) =>
                    value && value.length > 0
                      ? value.some(
                          (p: any) =>
                            (p?.days ?? 0) <= 0 || (p?.price ?? -1) < 0
                        )
                        ? Promise.reject(new Error("Ngày và giá phải hợp lệ"))
                        : Promise.resolve()
                      : Promise.reject(new Error("Cần ít nhất 1 mức giá")),
                },
              ]}
            >
              <RentalPriceInput />
            </Form.Item>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
