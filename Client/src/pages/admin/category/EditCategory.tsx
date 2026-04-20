import { useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import type { ICategory } from "../../../types/category";

const EditCategory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const [form] = Form.useForm();

  const { data: category, isLoading } = useQuery<ICategory>({
    queryKey: ["categoryDetail", params.id],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:3000/categories/${params.id}`,
      );
      return res.data;
    },
    enabled: !!params.id,
  });

  useEffect(() => {
    if (category) {
      form.setFieldsValue(category);
    }
  }, [category]);

  const mutation = useMutation({
    mutationFn: async (categoryData: Partial<ICategory>) => {
      const res = await axios.put(
        `http://localhost:3000/categories/${params.id}`,
        categoryData,
      );
      return res.data;
    },
    onSuccess: (updatedCategory) => {
      message.success("Cập nhật thành công!");

      queryClient.setQueryData(["AllCategory"], (categories?: ICategory[]) => {
        if (!categories) return [];
        return categories.map((c) =>
          c._id === updatedCategory._id ? updatedCategory : c,
        );
      });

      navigate("/admin/categories");
    },
    onError: () => {
      message.error("Cập nhật thất bại!");
    },
  });

  const onFinish = (data: Partial<ICategory>) => {
    mutation.mutate(data);
  };

  if (isLoading) return <>Loading...</>;

  return (
    <>
      <h1 className="text-2xl text-center mb-5">Sửa danh mục</h1>

      <Form form={form} labelCol={{ flex: "110px" }} onFinish={onFinish}>
        <Form.Item
          label="Tên danh mục"
          name="name"
          rules={[
            { required: true, message: "Tên danh mục không được để trống!" },
            { min: 5, message: "Tên danh mục phải có ít nhất 5 ký tự" },
          ]}
        >
          <Input placeholder="Tên danh mục" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Cập nhật
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default EditCategory;
