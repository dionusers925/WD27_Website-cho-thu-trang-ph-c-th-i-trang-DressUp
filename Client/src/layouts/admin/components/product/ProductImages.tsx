import { useState } from "react";
import { Upload, Image, Button, Input, Space, message } from "antd";
import { UploadOutlined, LinkOutlined, DeleteOutlined } from "@ant-design/icons";
import { uploadImage } from "../../../../services/upload.service";

type Props = {
  value?: string[];
  onChange?: (next: string[]) => void;
};

export default function ProductImages({ value = [], onChange }: Props) {
  const [url, setUrl] = useState("");

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange?.([...value, trimmed]);
    setUrl("");
  };

  const remove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange?.(next);
  };

  const handleUpload = async (file: File) => {
    try {
      const uploaded = await uploadImage(file);
      if (!uploaded) {
        message.error("Upload thất bại");
        return false;
      }
      onChange?.([...value, uploaded]);
    } catch (error) {
      message.error("Upload thất bại");
    }
    return false;
  };

  return (
    <div className="product-images">
      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="URL hình ảnh"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={addUrl}
          prefix={<LinkOutlined />}
        />
        <Button onClick={addUrl}>Thêm URL</Button>
        <Upload beforeUpload={handleUpload} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Upload ảnh</Button>
        </Upload>
      </Space.Compact>

      <div className="product-images-grid">
        {value.length === 0 && (
          <div className="product-images-empty">Chưa có hình ảnh</div>
        )}
        {value.map((img, index) => (
          <div className="product-images-item" key={`${img}-${index}`}>
            <Image src={img} width={90} height={120} />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => remove(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
