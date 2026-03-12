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

const AttributeDashboard = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);

  const [form] = Form.useForm();

  const fetchAttributes = async () => {
    const res = await getAttributes();
    setAttributes(res.data);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const payload = {
      ...values,
      values: values.values.split(",").map((v: string) => v.trim()),
    };

    if (editing) {
      await updateAttribute(editing._id, payload);
      message.success("Updated");
    } else {
      await createAttribute(payload);
      message.success("Created");
    }

    setOpen(false);
    setEditing(null);
    form.resetFields();
    fetchAttributes();
  };

  const handleEdit = (record: Attribute) => {
    setEditing(record);
    setOpen(true);

    form.setFieldsValue({
      ...record,
      values: record.values.join(", "),
    });
  };

  const handleDelete = async (id: string) => {
    await deleteAttribute(id);
    message.success("Deleted");
    fetchAttributes();
  };

  const columns = [
    {
      title: "ID",
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
      title: "Values",
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
      title: "Action",
      render: (record: Attribute) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>

          <Button danger onClick={() => handleDelete(record._id)}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  const summary = [
    {
      title: "Total Attributes",
      value: attributes.length,
      icon: <AppstoreOutlined />,
    },
    {
      title: "Total Values",
      value: attributes.reduce((acc, cur) => acc + cur.values.length, 0),
      icon: <AppstoreOutlined />,
    },
  ];

  return (
    <>
      <div style={{ padding: 24 }}>
        <Row gutter={16}>
          {summary.map((item) => (
            <Col span={6} key={item.title}>
              <Card>
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
          title="Attributes"
          style={{ marginTop: 24 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
            >
              Add Attribute
            </Button>
          }
        >
          <Table rowKey="_id" columns={columns} dataSource={attributes} />
        </Card>
      </div>

      <Modal
        title={editing ? "Edit Attribute" : "Add Attribute"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: "Slug required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="values"
            label="Values (comma separated)"
            rules={[{ required: true, message: "Values required" }]}
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