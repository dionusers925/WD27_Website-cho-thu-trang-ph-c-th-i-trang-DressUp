import { useEffect, useState } from "react";
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import axios from "axios";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../api/cartService";

export default function CartPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // load cart
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await getCart();

      console.log("Cart data:", data);
      console.log("Cart items:", data?.items);

      const cartItems = data?.items || [];

      setItems(cartItems);

      setSelectedIds(new Set(cartItems.map((i: any) => i._id)));
    } catch (error) {
      console.log("Lỗi lấy cart:", error);
      setItems([]);
    }
  };

  // chọn sản phẩm
  const toggleItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (checked) next.add(id);
      else next.delete(id);

      return next;
    });
  };

  // tăng giảm số lượng
  const changeQuantity = async (itemId: string, quantity: number) => {
    await updateCartItem(itemId, quantity);

    fetchCart();
  };

  // xóa sản phẩm
  const removeItem = async (itemId: string) => {
    await removeCartItem(itemId);

    fetchCart();
  };

  // xóa giỏ hàng
  const handleClearCart = async () => {
    await clearCart();

    fetchCart();
  };

  const selectedItems = items.filter((i) => selectedIds.has(i._id));

  const totalDeposit = selectedItems.reduce((sum, item) => {
    return sum + (item.deposit || 0) * (item.quantity || 1);
  }, 0);

  const totalRental = selectedItems.reduce((sum, item) => {
    return sum + (item.rentalPrice || 0) * (item.quantity || 1);
  }, 0);

  const total = totalDeposit + totalRental;

  const handleCheckout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null") as any;

      console.log("USER:", user);
      console.log("USER ID SEND:", user._id);

      if (!user) {
        alert("Bạn chưa đăng nhập");
        return;
      }

      const formattedItems = selectedItems.map((item) => ({
        productId: item.productId || item._id,
        quantity: item.quantity || 1,
        price: item.price,
      }));

      const res = await axios.post(
        "http://localhost:3000/api/payment/checkout",
        {
          userId: user._id,
          total: total,
          items: formattedItems,
        },
      );

      window.location.href = res.data.paymentUrl;
    } catch (error) {
      console.error("Lỗi thanh toán", error);
    }
  };
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 pt-28">
      <div className="col-span-8 bg-white border border-gray-300">
        {items.map((item, index) => (
          <CartItem
            key={`${item._id}-${index}`}
            item={item}
            checked={selectedIds.has(item._id)}
            onCheckedChange={toggleItem}
            onQuantityChange={changeQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div className="col-span-4">
        <CartSummary
          subtotal={totalRental}
          deposit={totalDeposit}
          total={total}
          count={selectedItems.length}
          onClear={handleClearCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
