import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";

/* ================= CONFIG ================= */
const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const luxuryFont = { fontFamily: "Playfair Display, serif" };
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Number.isFinite(value) ? value : 0);

const normalizeProducts = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeCategories = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload?.categories)) return payload.categories;
  return [];
};

/* ================= COMPONENT ================= */
function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const queryParam = searchParams.get("q");

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam || "all",
  );
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios
            .get(`${API_URL}/api/products`)
            .catch(() => axios.get(`${API_URL}/products`)),
          axios.get(`${API_URL}/categories`).catch(() => ({ data: [] })),
        ]);

        setProducts(normalizeProducts(productsRes.data));
        setCategories(normalizeCategories(categoriesRes.data));
      } catch (err) {
        console.error("Lỗi API:", err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat: any) => {
      if (cat?._id) map[cat._id] = cat.name;
    });
    return map;
  }, [categories]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const nextParams = new URLSearchParams(searchParams);
    if (catId === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", catId);
    }
    setSearchParams(nextParams);
  };

  const getProductPrice = (item: any) => {
    const rentalPrices = Array.isArray(item.rentalTiers)
      ? item.rentalTiers
      : Array.isArray(item.rentalPrices)
        ? item.rentalPrices
        : [];
    const dailyTier = rentalPrices.find((t: any) => t.days === 1);
    const price = dailyTier?.price ?? rentalPrices[0]?.price;
    return Number(price ?? item.depositDefault ?? item.depositPrice ?? 0);
  };

  const getProductDeposit = (item: any) =>
    Number(item.depositPrice ?? item.depositDefault ?? 0);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (item?.status === "archived") return false;
      const name = String(item?.name || "");
      const matchQuery =
        !queryParam || name.toLowerCase().includes(queryParam.toLowerCase());

      const itemCatId =
        typeof item.categoryId === "object"
          ? item.categoryId?._id
          : item.categoryId;
      const matchCategory =
        selectedCategory === "all" || itemCatId === selectedCategory;

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

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    if (sortBy === "price-asc") {
      items.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    } else if (sortBy === "price-desc") {
      items.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    } else if (sortBy === "newest") {
      items.sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
    }
    return items;
  }, [filteredProducts, sortBy]);

  const activeFilters =
    selectedCategory !== "all" || priceRange !== "all" || !!queryParam;

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setPriceRange("all");
    setSearchParams(new URLSearchParams());
  };

  const priceLabels: Record<string, string> = {
    under500k: "Dưới 500,000 VNĐ",
    "500k-1m": "500,000 - 1,000,000 VNĐ",
    over1m: "Trên 1,000,000 VNĐ",
  };

  return (
    <div className="bg-[#FDFBF9] text-[#2C2C2C] font-sans min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl border border-[#EEE7E1] bg-white px-8 py-12 md:px-12 md:py-14 shadow-[0_25px_80px_rgba(20,20,20,0.08)] mb-12">
          <div className="absolute -right-24 -top-28 h-56 w-56 rounded-full bg-[#F2EDE8] blur-3xl" />
          <div className="absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-[#EFE7E1] blur-3xl" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 font-bold block mb-4">
            Bộ sưu tập
          </span>
          <h1
            className="text-4xl md:text-5xl italic text-gray-900"
            style={luxuryFont}
          >
            {queryParam
              ? `Kết quả tìm kiếm "${queryParam}"`
              : "Tất cả sản phẩm"}
          </h1>
          <p className="mt-4 text-sm text-gray-500 max-w-2xl">
            Từ thiết kế dạ tiệc đến tối giản thanh lịch, DressUp giúp bạn chọn
            đúng bộ trang phục cho mọi dịp.
          </p>
          {activeFilters && (
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
              {queryParam && (
                <span className="px-3 py-1 border border-gray-200 rounded-full text-gray-500 bg-white/80">
                  Từ khóa: {queryParam}
                </span>
              )}
              {selectedCategory !== "all" && (
                <span className="px-3 py-1 border border-gray-200 rounded-full text-gray-500 bg-white/80">
                  Danh mục: {categoryMap[selectedCategory] ?? "Danh mục"}
                </span>
              )}
              {priceRange !== "all" && (
                <span className="px-3 py-1 border border-gray-200 rounded-full text-gray-500 bg-white/80">
                  Giá: {priceLabels[priceRange]}
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 border border-black rounded-full text-black hover:bg-black hover:text-white transition-all"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="space-y-10 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-[#EEE7E1] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,20,0.06)]">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 text-gray-500">
                  Danh mục
                </h3>

                <div className="hidden lg:block space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === "all"}
                      onChange={() => handleCategoryChange("all")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-[11px] group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">
                      Tất cả
                    </span>
                  </label>
                  {categories.map((cat) => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat._id}
                        onChange={() => handleCategoryChange(cat._id)}
                        className="accent-black w-4 h-4"
                      />
                      <span className="text-[11px] group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="lg:hidden space-y-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full border border-gray-200 px-4 py-3 text-[11px] uppercase tracking-widest bg-white"
                  >
                    <option value="all">Tất cả</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-[#EEE7E1] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,20,0.06)]">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 text-gray-500">
                  Khoảng giá / ngày
                </h3>
                <div className="hidden lg:block space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "all"}
                      onChange={() => setPriceRange("all")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-[11px] group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">
                      Tất cả
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "under500k"}
                      onChange={() => setPriceRange("under500k")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-[11px] group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">
                      Dưới 500,000 VNĐ
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "500k-1m"}
                      onChange={() => setPriceRange("500k-1m")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-[11px] group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">
                      500,000 - 1,000,000 VNĐ
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === "over1m"}
                      onChange={() => setPriceRange("over1m")}
                      className="accent-black w-4 h-4"
                    />
                    <span className="text-[11px] group-hover:text-gray-500 transition-colors uppercase tracking-wider text-gray-700">
                      Trên 1,000,000 VNĐ
                    </span>
                  </label>
                </div>

                <div className="lg:hidden space-y-3">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full border border-gray-200 px-4 py-3 text-[11px] uppercase tracking-widest bg-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="under500k">Dưới 500,000 VNĐ</option>
                    <option value="500k-1m">500,000 - 1,000,000 VNĐ</option>
                    <option value="over1m">Trên 1,000,000 VNĐ</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                Hiển thị {sortedProducts.length} sản phẩm
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">
                  Sắp xếp
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 px-4 py-2 text-[10px] uppercase tracking-widest bg-white"
                >
                  <option value="featured">Nổi bật</option>
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <p className="text-[10px] tracking-widest uppercase text-gray-400 animate-pulse">
                  Loading Products...
                </p>
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {sortedProducts.map((item) => {
                  const itemImg =
                    item.images && item.images.length > 0
                      ? item.images[0]
                      : "https://placehold.co/600x800?text=DressUp";

                  const displayPrice = getProductPrice(item);
                  const deposit = getProductDeposit(item);

                  const itemCatId =
                    typeof item.categoryId === "object"
                      ? item.categoryId?._id
                      : item.categoryId;
                  const categoryName =
                    item.categoryId?.name ||
                    (itemCatId ? categoryMap[itemCatId] : null) ||
                    "Collection";

                  const brandName =
                    item.brand?.name || item.brand || "Designer";

                  const colorLabel =
                    item.colorGroup ??
                    item.colorFamily ??
                    item.variants?.[0]?.color;

                  const sizes = Array.from(
                    new Set(
                      (item.variants ?? [])
                        .map((v: any) => v.size)
                        .filter(Boolean),
                    ),
                  ) as string[];

                  const statusMeta =
                    item.status === "active"
                      ? {
                          label: "Hoạt động",
                          className: "bg-black text-white border-black",
                        }
                      : item.status === "draft"
                        ? {
                            label: "Tạm ngừng",
                            className:
                              "bg-amber-100 text-amber-700 border border-amber-200",
                          }
                        : {
                            label: "Lưu trữ",
                            className:
                              "bg-gray-100 text-gray-500 border border-gray-200",
                          };

                  return (
                    <Link
                      key={item._id}
                      to={`/detail/${item._id}`}
                      className="group block"
                    >
                      <div className="rounded-2xl overflow-hidden border border-[#EEE7E1] bg-white shadow-[0_25px_70px_rgba(20,20,20,0.08)] transition-transform duration-300 group-hover:-translate-y-1">
                        <div className="relative">
                          <div className="aspect-[3/4] overflow-hidden bg-[#F9F7F5]">
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.4s]"
                              onError={(e: any) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600";
                              }}
                            />
                          </div>
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {(item.tags ?? []).slice(0, 2).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[9px] uppercase tracking-widest px-3 py-1 rounded-full bg-white/90 text-gray-600 border border-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="absolute top-4 right-4">
                            <span
                              className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-all">
                            <p className="text-[10px] uppercase tracking-[0.4em]">
                              Xem chi tiết
                            </p>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-gray-400">
                            <span>{categoryName}</span>
                            {colorLabel && <span>{colorLabel}</span>}
                          </div>

                          <h3
                            className="text-xl italic text-gray-800 clamp-2 product-title-clamp"
                            style={luxuryFont}
                          >
                            {item.name}
                          </h3>

                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                            {brandName}
                          </p>

                          <div className="flex items-end justify-between pt-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(displayPrice)} VNĐ
                              </p>
                              <p className="text-[9px] uppercase tracking-widest text-gray-400">
                                / ngày
                              </p>
                            </div>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 text-right">
                              Cọc {formatCurrency(deposit)} VNĐ
                            </p>
                          </div>

                          {sizes.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {sizes.slice(0, 4).map((size: string) => (
                                <span
                                  key={size}
                                  className="text-[9px] uppercase tracking-widest px-2 py-1 border border-gray-200 rounded-full text-gray-500"
                                >
                                  {size}
                                </span>
                              ))}
                              {sizes.length > 4 && (
                                <span className="text-[9px] uppercase tracking-widest px-2 py-1 border border-gray-200 rounded-full text-gray-500">
                                  +{sizes.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white shadow-sm border border-[#EEE7E1] rounded-2xl">
                <p className="text-lg text-gray-500 italic" style={luxuryFont}>
                  Không tìm thấy sản phẩm nào phù hợp.
                </p>
                <button
                  onClick={handleClearFilters}
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
