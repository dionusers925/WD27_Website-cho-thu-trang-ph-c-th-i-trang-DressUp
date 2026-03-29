import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";

/* ================= CONFIG ================= */
const API_URL = "http://localhost:3000";

const luxuryFont = { fontFamily: "Playfair Display, serif" };

/* ================= COMPONENT ================= */
function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const queryParam = searchParams.get("q");

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [priceRange, setPriceRange] = useState<string>("all");

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/categories`),
        ]);

        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error("Lỗi API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, []);

  // Update query params when filter changes (optional, but good for UX)
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", catId);
    }
    setSearchParams(searchParams);
  };

  const getProductPrice = (item: any) => {
    const dailyTier = item.rentalTiers?.find((t: any) => t.days === 1) || item.rentalPrices?.find((t: any) => t.days === 1);
    return dailyTier ? dailyTier.price : item.depositDefault || item.depositPrice || 0;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Filter by search query
      const matchQuery = !queryParam || item.name.toLowerCase().includes(queryParam.toLowerCase());

      // Filter by category
      // item.categoryId could be an object if populated, or string if not.
      const itemCatId = typeof item.categoryId === "object" ? item.categoryId?._id : item.categoryId;
      const matchCategory = selectedCategory === "all" || itemCatId === selectedCategory;

      // Filter by price
      const price = getProductPrice(item);
      let matchPrice = true;
      if (priceRange === "under500k") {
        matchPrice = price < 500000;
      } else if (priceRange === "500k-1m") {
        matchPrice = price >= 500000 && price <= 1000000;
      } else if (priceRange === "over1m") {
        matchPrice = price > 1000000;
      }

      return matchQuery && matchCategory && matchPrice;
    });
  }, [products, selectedCategory, priceRange, queryParam]);

  return (
    <div className="bg-[#FDFBF9] text-[#2C2C2C] font-sans min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16 border-b border-gray-200 pb-10">
          <span className="text-[10px] tracking-[0.4em] text-gray-400 uppercase font-bold block mb-4">
            Bộ Sưu Tập
          </span>
          <h1 className="text-5xl italic text-gray-900" style={luxuryFont}>
            {queryParam ? `— Kết quả: "${queryParam}"` : "— Tất Cả Sản Phẩm."}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* ================= SIDEBAR (FILTERS) ================= */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-10">
              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">
                  Danh Mục
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === "all"}
                      onChange={() => handleCategoryChange("all")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-sm group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">Tất cả</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                         type="radio"
                         name="category"
                         checked={selectedCategory === cat._id}
                         onChange={() => handleCategoryChange(cat._id)}
                         className="accent-black w-4 h-4"
                      />
                      <span className="text-sm group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">
                  Khoảng Giá / Ngày
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "all"}
                      onChange={() => setPriceRange("all")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-sm group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">Tất cả</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "under500k"}
                      onChange={() => setPriceRange("under500k")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-sm group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">Dưới 500,000 VNĐ</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "500k-1m"}
                      onChange={() => setPriceRange("500k-1m")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-sm group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">500,000 - 1,000,000 VNĐ</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "over1m"}
                      onChange={() => setPriceRange("over1m")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-sm group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">Trên 1,000,000 VNĐ</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* ================= PRODUCT GRID ================= */}
          <main className="flex-1">
            <div className="mb-6 text-sm text-gray-500 italic">
              Hiển thị {filteredProducts.length} sản phẩm
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <p className="text-[10px] tracking-widest uppercase text-gray-400 animate-pulse">
                  Loading Products...
                </p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((item) => {
                  const itemImg = item.images && item.images.length > 0
                      ? item.images[0]
                      : "https://placehold.co/600x800?text=DressUp";

                  const displayPrice = getProductPrice(item);

                  return (
                    <Link
                      key={item._id}
                      to={`/detail/${item._id}`}
                      className="group text-center block"
                    >
                      <div className="aspect-[3/4] overflow-hidden mb-6 bg-[#F9F7F5] relative">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                          onError={(e: any) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600";
                          }}
                        />
                        {item.status !== "active" && (
                          <div className="absolute top-4 right-4 bg-black text-white text-[8px] px-3 py-1 uppercase tracking-widest">
                            Rented
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl italic text-gray-800 mb-1" style={luxuryFont}>
                        {item.name}
                      </h3>

                      <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">
                        {item.brand?.name || item.brand || "Designer"}
                      </p>

                      <p className="text-[10px] text-gray-900 mt-3 uppercase tracking-[0.2em] font-medium">
                        {displayPrice.toLocaleString()} VNĐ
                        <span className="italic font-light text-gray-400"> / DAY</span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white shadow-sm border border-gray-100">
                <p className="text-lg text-gray-500 italic" style={luxuryFont}>Không tìm thấy sản phẩm nào phù hợp.</p>
                <button 
                  onClick={() => { setSelectedCategory("all"); setPriceRange("all"); setSearchParams(new URLSearchParams()); }}
                  className="mt-6 text-[10px] uppercase tracking-widest border-b border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition-all font-bold"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
