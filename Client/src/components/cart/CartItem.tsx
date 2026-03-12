type Props = {
  item: any;
  checked: boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

export default function CartItem({
  item,
  checked,
  onCheckedChange,
  onQuantityChange,
  onRemove,
}: Props) {
  return (
    <div className="flex gap-6 p-6">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(item._id, e.target.checked)}
      />

      <img
        src={item.image}
        alt={item.name}
        className="w-28 h-26 object-cover"
      />

      <div className="flex-1">
        <h3 className="font-medium text-2xl">{item.name}</h3>

        <p>{item.days} Ngày thuê</p>

        <p className="text-gray-600 mt-1">{item.price?.toLocaleString()} đ</p>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => {
                if (item.quantity > 1) {
                  onQuantityChange(item._id, item.quantity - 1);
                }
              }}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition"
            >
              -
            </button>

            <span className="px-4 text-sm font-medium">{item.quantity}</span>

            <button
              onClick={() => onQuantityChange(item._id, item.quantity + 1)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition"
            >
              +
            </button>
          </div>

          <button
            onClick={() => onRemove(item._id)}
            className="px-4 py-1.5 text-sm text-red-500 border border-gray-200 rounded-md hover:bg-red-50 transition"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
