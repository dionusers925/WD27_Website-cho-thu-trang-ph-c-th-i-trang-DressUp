import { useState } from "react";
import { Button, Select, Space } from "antd";

export default function VariantGenerator({ onGenerate }: any) {

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const generateVariants = () => {

    const variants: any[] = [];

    sizes.forEach((size) => {
      colors.forEach((color) => {

        variants.push({
          size,
          color,
          sku: `${size}-${color}`.toUpperCase(),
          stock: 1
        });

      });
    });

    onGenerate(variants);
  };

  return (
    <>
      <Space direction="vertical">

        <Select
          mode="multiple"
          placeholder="Select Sizes"
          onChange={setSizes}
          options={[
            { value: "S" },
            { value: "M" },
            { value: "L" },
            { value: "XL" },
          ]}
        />

        <Select
          mode="multiple"
          placeholder="Select Colors"
          onChange={setColors}
          options={[
            { value: "Red" },
            { value: "White" },
            { value: "Black" },
            { value: "Blue" },
          ]}
        />

        <Button type="primary" onClick={generateVariants}>
          Generate Variants
        </Button>

      </Space>
    </>
  );
}