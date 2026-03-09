import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, message, Popconfirm, Table } from "antd";
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import type { ICategory } from "../../../types/category";

const ListCategory = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<ICategory[]>({
    queryKey: ["AllCategory"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:3000/categories");
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`http://localhost:3000/categories/${id}`);
      return id;
    },
    onSuccess: (id) => {
      message.success("Xóa thành công!");

      queryClient.setQueryData(["AllCategory"], (categories: any) => {
        return categories.filter((category: ICategory) => category._id !== id);
      });
    },
  });

  const handleDelete = (id: string) => {
    mutation.mutate(id);
  };

  if (isLoading) return <>Loading...</>;
  if (isError) return <>Error loading data</>;

  const columns = [
    {
      title: "STT",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Slug",
      dataIndex: "slug",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id: string) => (
        <div className="flex gap-2">
          <Button
            color="purple"
            variant="outlined"
            onClick={() => navigate(`/admin/categories/${id}`)}
          >
            Edit
          </Button>

          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Danh sách danh mục</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/categories/add")}
        >
          Thêm danh mục
        </Button>
      </div>

      <Table rowKey="_id" dataSource={data ?? []} columns={columns} />
    </div>
  );
};

export default ListCategory;
