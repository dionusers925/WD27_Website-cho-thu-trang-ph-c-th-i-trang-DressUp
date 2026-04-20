import { Button, Form, Input, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { ICategory } from "../../../types/category";

const AddCategory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (categoryData: Partial<ICategory>) => {
      const res = await axios.post(
        "http://localhost:3000/categories",
        categoryData,
      );
      return res.data;
    },

    onSuccess: (newCategory: ICategory) => {
      message.success("Thêm mới thành công!");

      queryClient.setQueryData(["AllCategory"], (oldData?: ICategory[]) => {
        return oldData ? [...oldData, newCategory] : [newCategory];
      });

      navigate("/admin/categories");
    },

    onError: () => {
      message.error("Thêm mới thất bại!");
    },
  });

  const onFinish = (data: Partial<ICategory>) => {
    mutation.mutate(data);
  };

  return (
    <>
      <h1 className="text-2xl text-center mb-5">Thêm danh mục</h1>

      <Form labelCol={{ flex: "110px" }} onFinish={onFinish}>
        <Form.Item
          label="Tên danh mục"
          name="name"
          rules={[
            { required: true, message: "Tên danh mục không được để trống!" },
            { max: 255, message: "Tên danh mục không được vượt quá 255 ký tự" },
            { min: 5, message: "Tên danh mục phải có ít nhất 5 ký tự" },
          ]}
        >
          <Input placeholder="Tên danh mục" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input placeholder="Description" />
        </Form.Item>
        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug không được để trống!" }]}
        >
          <Input placeholder="Slug" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Thêm mới
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default AddCategory;
