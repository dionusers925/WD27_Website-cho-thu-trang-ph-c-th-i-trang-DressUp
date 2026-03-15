import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import { PlusOutlined, AppstoreOutlined } from "@ant-design/icons";
import FooterMenu from "../../../layouts/admin/components/FooterMenu";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../../../services/attribute.service";
import { Attribute } from "../../../types/attribute";
import "../products/product.css";

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

const normalizeName = (value?: string) =>
  (value ?? "").trim().toLowerCase();

const AttributeDashboard = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [slugLocked, setSlugLocked] = useState(false);

  const [form] = Form.useForm();

  const fetchAttributes = async () => {
    const res = await getAttributes();
    setAttributes(res.data);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const isDuplicateName = (value?: string) => {
    const normalized = normalizeName(value);
    if (!normalized) return false;
    return attributes.some(
      (attr) =>
        attr._id !== editing?._id &&
        normalizeName(attr.name) === normalized
    );
  };

  const handleValuesChange = (changed: any) => {
    if (changed?.name && !slugLocked) {
      form.setFieldsValue({ slug: slugify(changed.name) });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        values: values.values.split(",").map((v: string) => v.trim()),
      };

      if (editing) {
        await updateAttribute(editing._id, payload);
        message.success("Đã cập nhật");
      } else {
        await createAttribute(payload);
        message.success("Đã tạo");
      }

      setOpen(false);
      setEditing(null);
      setSlugLocked(false);
      form.resetFields();
      fetchAttributes();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || error?.response?.data?.error || "";
      if (apiMessage) {
        message.error(apiMessage);
      }
    }
  };

  const handleEdit = (record: Attribute) => {
    setEditing(record);
    setSlugLocked(false);
    setOpen(true);

    form.setFieldsValue({
      ...record,
      values: record.values.join(", "),
    });
  };

  const handleCreate = () => {
    setEditing(null);
    setSlugLocked(false);
    form.resetFields();
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAttribute(id);
      message.success("Đã xóa");
      fetchAttributes();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message || error?.response?.data?.error || "";
      message.error(apiMessage || "Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Tên",
      dataIndex: "name",
    },
    {
      title: "Slug",
      dataIndex: "slug",
    },
    {
      title: "Giá trị",
      dataIndex: "values",
      render: (values: string[]) => (
        <>
          {values.map((v) => (
            <Tag color="blue" key={v}>
              {v}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Thao tác",
      render: (record: Attribute) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>

          <Button danger onClick={() => handleDelete(record._id)}>
            Xóa
          </Button>
        </>
      ),
    },
  ];

  const summary = [
    {
      title: "Tổng thuộc tính",
      value: attributes.length,
      icon: <AppstoreOutlined />,
    },
    {
      title: "Tổng giá trị",
      value: attributes.reduce((acc, cur) => acc + cur.values.length, 0),
      icon: <AppstoreOutlined />,
    },
  ];

  return (
    <>
      <div className="product-page attribute-page">
        <div className="product-page-header">
          <div>
            <div className="product-title">Quản lý thuộc tính</div>
            <div className="product-subtitle">
              {attributes.length} thuộc tính
            </div>
          </div>
        </div>

        <Row gutter={16}>
          {summary.map((item) => (
            <Col span={6} key={item.title}>
              <Card className="product-card">
                <Row justify="space-between" align="middle">
                  <div>
                    <h4>{item.title}</h4>
                    <h2>{item.value}</h2>
                  </div>

                  <div style={{ fontSize: 28, color: "#1677ff" }}>
                    {item.icon}
                  </div>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          title="Thuộc tính"
          className="product-card product-table-card"
          style={{ marginTop: 24 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm thuộc tính
            </Button>
          }
        >
          <Table rowKey="_id" columns={columns} dataSource={attributes} />
        </Card>
      </div>

      <Modal
        title={editing ? "Sửa thuộc tính" : "Thêm thuộc tính"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          setSlugLocked(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
      >
        <Form layout="vertical" form={form} onValuesChange={handleValuesChange}>
          <Form.Item
            name="name"
            label="Tên"
            rules={[
              { required: true, message: "Tên bắt buộc" },
              {
                validator: (_, value) =>
                  isDuplicateName(value)
                    ? Promise.reject(new Error("Tên đã tồn tại"))
                    : Promise.resolve(),
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            getValueFromEvent={(e) => {
              setSlugLocked(true);
              return (e?.target?.value ?? "").toLowerCase();
            }}
            rules={[{ required: true, message: "Slug bắt buộc" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="values"
            label="Giá trị (phân tách bằng dấu phẩy)"
            rules={[{ required: true, message: "Giá trị bắt buộc" }]}
          >
            <Input placeholder="S, M, L, XL" />
          </Form.Item>
        </Form>
      </Modal>

      <FooterMenu />
    </>
  );
};

export default AttributeDashboard;
