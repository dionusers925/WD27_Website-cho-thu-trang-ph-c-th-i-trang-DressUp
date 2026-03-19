import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ProductForm from "../../../layouts/admin/components/product/ProductForm";
import { getProduct, updateProduct } from "../../../services/product.service";
import { getCategories } from "../../../services/category.service";
import { ICategory } from "../../../types/category";
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

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
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

  const fetchProduct = async () => {
    if (!id) return;
    try {
      const res = await getProduct(id);
      const data = res.data;
      const payload = data?.data ?? data;
      const productData = payload?.product ?? payload;
      const variants = payload?.variants ?? productData?.variants ?? [];

      if (!productData) return;

      form.setFieldsValue({
        ...productData,
        categoryId: productData?.categoryId?._id ?? productData.categoryId,
        variants,
      });
    } catch (error) {
      message.error("Tải sản phẩm thất bại");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleValuesChange = (changed: any) => {
    if (changed?.name && !slugLocked) {
      form.setFieldsValue({ slug: slugify(changed.name) });
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    const values = await form.validateFields();
    const payload = {
      ...values,
      tags: values.tags ?? [],
      images: values.images ?? [],
      rentalPrices: values.rentalPrices ?? [],
      variants: values.variants ?? [],
    };

    try {
      await updateProduct(id, payload);
      message.success("Đã cập nhật");
      navigate("/admin/products");
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || error?.response?.data?.error || "";
      message.error(apiMessage || "Cập nhật thất bại");
    }
  };

  return (
    <div className="product-page product-edit">
      <div className="product-page-header">
        <div>
          <div className="product-title">Chỉnh sửa sản phẩm</div>
          <div className="product-subtitle">Cập nhật thông tin sản phẩm</div>
        </div>
        <div className="product-toolbar">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <Form layout="vertical" form={form} onValuesChange={handleValuesChange}>
        <ProductForm
          categories={categories}
          loadingCategories={loadingCategories}
          onSlugManualChange={() => setSlugLocked(true)}
        />
      </Form>
    </div>
  );
}
