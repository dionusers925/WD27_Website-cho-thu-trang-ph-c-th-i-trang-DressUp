import { useState } from "react";
import { Button, Input, InputNumber, Select, Space, Tag } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

type Variant = {
  size: string;
  color: string;
  sku: string;
  stock?: number;
};

type Props = {
  value?: Variant[];
  onChange?: (next: Variant[]) => void;
};

const defaultSizes = ["S", "M", "L", "XL"];
const defaultColors = ["Trắng", "Đen", "Đỏ", "Xanh"];

export default function ProductVariants({ value = [], onChange }: Props) {
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const add = () => {
    onChange?.([...value, { size: "", color: "", sku: "", stock: 1 }]);
  };

  const remove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange?.(next);
  };

  const update = (index: number, field: keyof Variant, val: any) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: val };
    onChange?.(next);
  };

  const generate = () => {
    if (sizes.length === 0 || colors.length === 0) return;
    const next: Variant[] = [];
    sizes.forEach((size) => {
      colors.forEach((color) => {
        next.push({
          size,
          color,
          sku: `${size}-${color}`.toUpperCase(),
          stock: 1,
        });
      });
    });
    onChange?.(next);
  };

  return (
    <div className="product-variants">
      <div className="product-variants-generator">
        <Space wrap>
          <Select
            mode="tags"
            placeholder="Size"
            value={sizes}
            onChange={setSizes}
            options={defaultSizes.map((s) => ({ value: s }))}
            tokenSeparators={[","]}
            style={{ minWidth: 220 }}
          />
          <Select
            mode="tags"
            placeholder="Màu"
            value={colors}
            onChange={setColors}
            options={defaultColors.map((c) => ({ value: c }))}
            tokenSeparators={[","]}
            style={{ minWidth: 220 }}
          />
          <Button onClick={generate}>Tạo biến thể</Button>
        </Space>
        <div className="product-variants-hint">
          Tạo sẽ thay thế danh sách hiện tại
        </div>
      </div>

      <div className="product-variants-list">
        {value.length === 0 && (
          <div className="product-variants-empty">Chưa có biến thể</div>
        )}
        {value.map((v, index) => (
          <div className="product-variants-row" key={index}>
            <Space>
              <Input
                placeholder="Size"
                value={v.size}
                onChange={(e) => update(index, "size", e.target.value)}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Màu"
                value={v.color}
                onChange={(e) => update(index, "color", e.target.value)}
                style={{ width: 140 }}
              />
              <Input
                placeholder="SKU"
                value={v.sku}
                onChange={(e) => update(index, "sku", e.target.value)}
                style={{ width: 160 }}
              />
              <InputNumber
                placeholder="Tồn kho"
                min={0}
                precision={0}
                value={v.stock}
                onChange={(val) => update(index, "stock", val ?? 0)}
                style={{ width: 100 }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(index)}
              />
            </Space>
            <div className="product-variants-preview">
              <Tag>{v.size || "Size"}</Tag>
              <Tag>{v.color || "Màu"}</Tag>
              <Tag color="geekblue">{v.sku || "SKU"}</Tag>
            </div>
          </div>
        ))}
      </div>

      <Button icon={<PlusOutlined />} onClick={add}>
        Thêm biến thể
      </Button>
    </div>
  );
}
