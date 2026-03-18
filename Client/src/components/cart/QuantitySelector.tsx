type Props = {
  quantity: number;
  onChange: (value: number) => void;
};

export default function QuantitySelector({ quantity, onChange }: Props) {
  return (
    <div className="flex border">
      <button onClick={() => onChange(quantity - 1)} className="px-4 py-2">
        -
      </button>

      <span className="px-6 py-2">{quantity}</span>

      <button onClick={() => onChange(quantity + 1)} className="px-4 py-2">
        +
      </button>
    </div>
  );
}
