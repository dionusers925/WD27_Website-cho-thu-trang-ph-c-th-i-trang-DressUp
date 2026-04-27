import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../api/cartService";

export default function CartPage() {
  const navigate = useNavigate(); 
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await getCart();

      console.log("📦 Cart data từ BE:", data);
      console.log("📦 Cart items:", data?.items);

      let cartItems = data?.items || [];
      
      cartItems = cartItems.map((item: any) => {
        const saved = localStorage.getItem(`rental_${item.productId}`);
        if (saved && (!item.startDate || !item.endDate)) {
          const { startDate, endDate, days } = JSON.parse(saved);
          console.log(`🔧 Ghép ngày cho ${item.name}:`, { startDate, endDate, days });
          return { ...item, startDate, endDate, days };
        }
        return item;
      });
      
      cartItems.forEach((item: any, idx: number) => {
        console.log(`📋 Item ${idx}: ${item.name}`, {
          startDate: item.startDate,
          endDate: item.endDate,
          days: item.days
        });
      });

      setItems(cartItems);
      setSelectedIds(new Set(cartItems.map((i: any) => i._id)));
    } catch (error) {
      console.log("Lỗi lấy cart:", error);
      setItems([]);
    }
  };

  const toggleItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const changeQuantity = async (itemId: string, quantity: number) => {
    await updateCartItem(itemId, quantity);
    fetchCart();
  };

  const removeItem = async (itemId: string) => {
    await removeCartItem(itemId);
    const itemToRemove = items.find(i => i._id === itemId);
    if (itemToRemove) {
      localStorage.removeItem(`rental_${itemToRemove.productId}`);
    }
    fetchCart();
  };

  const handleClearCart = async () => {
    await clearCart();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rental_')) {
        localStorage.removeItem(key);
      }
    });
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

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn sản phẩm cần thanh toán");
      return;
    }

    const missingDateItems = selectedItems.filter(
      item => !item.startDate || !item.endDate
    );
    
    if (missingDateItems.length > 0) {
      console.error("❌ Sản phẩm thiếu ngày thuê:", missingDateItems);
      alert(`Một số sản phẩm thiếu ngày thuê. Vui lòng xóa và thêm lại từ trang chi tiết:
${missingDateItems.map(i => i.name).join(", ")}`);
      return;
    }

    console.log("✅ Chuyển sang checkout với các item:");
    selectedItems.forEach(item => {
      console.log(`  - ${item.name}: ${item.startDate} → ${item.endDate} (${item.days} ngày)`);
    });

    navigate("/checkout", {
      state: {
        total: total,
        selectedItems: selectedItems,
        totalRental: totalRental,
        totalDeposit: totalDeposit,
      },
    });
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