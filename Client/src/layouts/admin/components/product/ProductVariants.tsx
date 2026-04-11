import { useMemo, useState } from "react";
import { Button, Input, InputNumber, Select, Space, Tag, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Attribute } from "../../../../types/attribute";

type VariantAttribute = {
  attributeId?: string;
  attributeName: string;
  value: string;
};

type Variant = {
  size: string;
  color: string;
  sku: string;
  stock?: number;
  attributes?: VariantAttribute[];
};

type Props = {
  value?: Variant[];
  onChange?: (next: Variant[]) => void;
  attributes?: Attribute[];
};

const normalizeKey = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const isSizeAttribute = (name: string) => {
  const normalized = normalizeKey(name);
  return (
    normalized.includes("size") ||
    normalized.includes("kichthuoc") ||
    normalized.includes("kichco")
  );
};

const isColorAttribute = (name: string) => {
  const normalized = normalizeKey(name);
  return normalized.includes("mau") || normalized.includes("color");
};

export default function ProductVariants({
  value = [],
  onChange,
  attributes = [],
}: Props) {
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string[]>
  >({});

  const attributeOptions = useMemo(
    () =>
      attributes.map((attr) => ({
        label: attr.name,
        value: attr._id,
      })),
    [attributes]
  );

  const attributeMap = useMemo(() => {
    const map = new Map<string, Attribute>();
    attributes.forEach((attr) => map.set(attr._id, attr));
    return map;
  }, [attributes]);

  const handleSelectAttributes = (ids: string[]) => {
    setSelectedAttributes(ids);
    setAttributeValues((prev) => {
      const next: Record<string, string[]> = {};
      ids.forEach((id) => {
        next[id] = prev[id] ?? [];
      });
      return next;
    });
  };

  const handleSelectValues = (attrId: string, values: string[]) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attrId]: values,
    }));
  };

  const add = () => {
    onChange?.([
      ...value,
      { size: "", color: "", sku: "", stock: 1, attributes: [] },
    ]);
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
    if (selectedAttributes.length === 0) {
      message.warning("Chọn ít nhất 1 thuộc tính để tạo biến thể.");
      return;
    }

    const attributeEntries = selectedAttributes
      .map((id) => attributeMap.get(id))
      .filter(Boolean) as Attribute[];

    if (attributeEntries.length < 2) {
      message.error("Cần chọn ít nhất 2 thuộc tính để tạo biến thể.");
      return;
    }

    for (const attr of attributeEntries) {
      const values = attributeValues[attr._id] ?? [];
      if (values.length === 0) {
        message.error(`Chọn giá trị cho thuộc tính "${attr.name}".`);
        return;
      }
    }

    const sizeAttr =
      attributeEntries.find((attr) => isSizeAttribute(attr.name)) ??
      attributeEntries[0];
    const colorAttr =
      attributeEntries.find((attr) => isColorAttribute(attr.name)) ??
      attributeEntries.find((attr) => attr._id !== sizeAttr._id) ??
      attributeEntries[1];

    if (!sizeAttr || !colorAttr) {
      message.error("Cần có thuộc tính đại diện cho Size và Màu.");
      return;
    }

    const combos = attributeEntries.reduce(
      (acc, attr) => {
        const values = attributeValues[attr._id] ?? [];
        const next: VariantAttribute[][] = [];
        acc.forEach((combo) => {
          values.forEach((val) => {
            next.push([
              ...combo,
              {
                attributeId: attr._id,
                attributeName: attr.name,
                value: val,
              },
            ]);
          });
        });
        return next;
      },
      [[]] as VariantAttribute[][]
    );

    const nextVariants = combos.map((attrs) => {
      let size = "";
      let color = "";
      attrs.forEach((attr) => {
        if (attr.attributeId === sizeAttr._id) {
          size = attr.value.trim();
        }
        if (attr.attributeId === colorAttr._id) {
          color = attr.value.trim();
        }
      });
      const sku = attrs
        .map((attr) => attr.value.trim())
        .filter(Boolean)
        .join("-")
        .toUpperCase();
      return {
        size,
        color,
        sku,
        stock: 1,
        attributes: attrs,
      };
    });

    onChange?.(nextVariants);
  };

  const canGenerate =
    selectedAttributes.length >= 2 &&
    selectedAttributes.every(
      (id) => (attributeValues[id] ?? []).length > 0
    );

  return (
    <div className="product-variants">
      <div className="product-variants-builder">
        <div className="product-variants-builder-card">
          <div className="product-variants-builder-title">
            Tạo biến thể theo thuộc tính
          </div>

          <div className="product-variants-builder-row">
            <div className="product-variants-builder-label">
              Chọn thuộc tính
            </div>
            <Select
              mode="multiple"
              placeholder="Chọn thuộc tính đã có"
              value={selectedAttributes}
              onChange={handleSelectAttributes}
              options={attributeOptions}
              style={{ minWidth: 320, flex: 1 }}
            />
          </div>

          {selectedAttributes.map((id) => {
            const attr = attributeMap.get(id);
            if (!attr) return null;
            const options = attr.values.map((val) => ({
              label: val,
              value: val,
            }));
            return (
              <div className="product-variants-builder-row" key={id}>
                <div className="product-variants-builder-label">
                  {attr.name}
                </div>
                <Select
                  mode="multiple"
                  placeholder={`Chọn giá trị cho ${attr.name}`}
                  value={attributeValues[id] ?? []}
                  onChange={(values) =>
                    handleSelectValues(id, values as string[])
                  }
                  options={options}
                  style={{ minWidth: 320, flex: 1 }}
                />
              </div>
            );
          })}

          <div className="product-variants-builder-actions">
            <Button type="primary" onClick={generate} disabled={!canGenerate}>
              Tạo biến thể
            </Button>
            <div className="product-variants-hint">
              {selectedAttributes.length < 2
                ? "Chọn tối thiểu 2 thuộc tính để tạo biến thể."
                : "Chọn giá trị cho tất cả thuộc tính đã chọn. Hệ thống sẽ dùng thuộc tính Size/Màu nếu có, nếu không sẽ lấy 2 thuộc tính đầu tiên."}
            </div>
          </div>
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
              {(v.attributes ?? []).map((attr) => (
                <Tag key={`${attr.attributeName}-${attr.value}`}>
                  {attr.attributeName}: {attr.value}
                </Tag>
              ))}
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
