import { useEffect, useState } from "react";
import { Button, Form, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../../layouts/admin/components/product/ProductForm";
import { createProduct } from "../../../services/product.service";
import { getCategories } from "../../../services/category.service";
import { getAttributes } from "../../../services/attribute.service";
import type { ICategory } from "../../../types/category";
import type { Attribute } from "../../../types/attribute";
import "./product.css";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function ProductCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [slugLocked, setSlugLocked] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await getCategories();
      setCategories(res.data);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      const res = await getAttributes();
      setAttributes(res.data);
    } catch (error) {
      // ignore attributes load failure
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  const handleValuesChange = (changed: any) => {
    if (changed?.name && !slugLocked) {
      form.setFieldsValue({ slug: slugify(changed.name) });
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      tags: values.tags ?? [],
      images: values.images ?? [],
      rentalPrices: values.rentalPrices ?? [],
      variants: values.variants ?? [],
    };

    try {
      await createProduct(payload);
      message.success("Đã tạo sản phẩm");
      navigate("/admin/products");
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || error?.response?.data?.error || "";
      message.error(apiMessage || "Tạo sản phẩm thất bại");
    }
  };

  return (
    <div className="product-page product-create">
      <div className="product-page-header">
        <div>
          <div className="product-title">Thêm sản phẩm mới</div>
          <div className="product-subtitle">
            Quản lý thông tin sản phẩm và giá thuê
          </div>
        </div>
        <div className="product-toolbar">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Tạo sản phẩm
          </Button>
        </div>
      </div>

      <Form
        layout="vertical"
        form={form}
        initialValues={{
          status: "active",
          condition: "new",
          rentalPrices: [{ days: 3, price: 0 }],
          variants: [{ size: "", color: "", sku: "", stock: 1 }],
        }}
        onValuesChange={handleValuesChange}
      >
        <ProductForm
          categories={categories}
          loadingCategories={loadingCategories}
          attributes={attributes}
          onSlugManualChange={() => setSlugLocked(true)}
        />
      </Form>
    </div>
  );
}
