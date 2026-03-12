import { Button, InputNumber, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

type RentalPrice = {
  days: number;
  price: number;
};

type Props = {
  value?: RentalPrice[];
  onChange?: (next: RentalPrice[]) => void;
};

export default function RentalPriceInput({ value = [], onChange }: Props) {
  const add = () => {
    onChange?.([...value, { days: 1, price: 0 }]);
  };

  const remove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange?.(next);
  };

  const update = (index: number, field: keyof RentalPrice, val: any) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: val ?? 0 };
    onChange?.(next);
  };

  return (
    <div className="product-rental-prices">
      {value.length === 0 && (
        <div className="product-rental-empty">Chưa có giá</div>
      )}
      {value.map((item, index) => (
        <Space key={index} style={{ marginBottom: 8 }}>
          <InputNumber
            placeholder="Số ngày"
            min={1}
            precision={0}
            value={item.days}
            onChange={(v) => update(index, "days", v)}
          />
          <InputNumber
            placeholder="Giá (VND)"
            min={0}
            precision={0}
            value={item.price}
            onChange={(v) => update(index, "price", v)}
          />
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
        </Space>
      ))}

      <Button icon={<PlusOutlined />} onClick={add}>
        Thêm giá
      </Button>
    </div>
  );
}
