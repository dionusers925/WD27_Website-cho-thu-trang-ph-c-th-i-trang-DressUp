import { formatPrice } from "../../utils/formatPrice";
import { rentalPriceSchema } from "./../../../../Server/src/validations/product.validation";

type Props = {
  subtotal: number;
  deposit: number;
  total: number;
  count: number;
  onClear: () => void;
  onCheckout: () => void;
};

export default function CartSummary({
  subtotal,
  count,
  deposit,
  total,
  onClear,
  onCheckout,
}: Props) {
  return (
    <div className="bg-white border border-gray-300 p-6">
      <h3 className="uppercase font-semibold mb-4">Tổng giỏ hàng</h3>

      <p className="text-sm mb-6">Đã chọn {count} sản phẩm</p>

      <div className="flex justify-between mb-3">
        <span>Tiền cọc</span>
        <span className="font-bold">{formatPrice(deposit)}</span>
      </div>

      <div className="flex justify-between mb-3">
        <span>Tiền thuê</span>
        <span className="font-bold">{formatPrice(subtotal)}</span>
      </div>

      {/* <p className="text-gray-600 mt-1">
        {item.rentalPrice?.toLocaleString()}đ/{item.days} ngày thuê
      </p> */}

      <div className="flex justify-between mb-3">
        <span>Tạm tính</span>
        <span>{formatPrice(total)}</span>
      </div>
      
      <hr className="mb-4" />

      <div className="flex justify-between font-semibold text-lg mb-6">
        <span>Tổng cộng</span>
        <span className="text-[#c8a693]">{formatPrice(total)}</span>
      </div>

      <div className="space-y-3">
        <button
          onClick={onCheckout}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
        >
          CHECK OUT
        </button>

        <button
          onClick={onClear}
          className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-100 transition"
        >
          XÓA GIỎ HÀNG
        </button>
      </div>
    </div>
  );
}
