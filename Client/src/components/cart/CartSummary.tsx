import { formatPrice } from "../../utils/formatPrice";

type Props = {
  subtotal: number;
  count: number;
  onClear: () => void;
  onCheckout: () => void;
};

export default function CartSummary({ subtotal, count, onClear, onCheckout }: Props) {
  return (
    <div className="bg-white border border-gray-300 p-6">
      <h3 className="uppercase font-semibold mb-4">Tổng giỏ hàng</h3>

      <p className="text-sm mb-6">Đã chọn {count} sản phẩm</p>

      <div className="flex justify-between mb-3">
        <span>Tạm tính</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      <div className="flex justify-between mb-4">
        <span>Vận chuyển</span>
        <span>0 đ</span>
      </div>

      <hr className="mb-4" />

      <div className="flex justify-between font-semibold text-lg mb-6">
        <span>Tổng cộng</span>
        <span className="text-[#c8a693]">{formatPrice(subtotal)}</span>
      </div>

      <button
  onClick={onCheckout}
  className="w-full bg-black text-white py-3 mt-4"
>
  Thanh toán VNPAY
</button>

      <button
        onClick={onClear}
        className="w-full border border-gray-300 py-3 hover:bg-gray-100 transition"
      >
        XÓA GIỎ HÀNG
      </button>
    </div>
  );
}
