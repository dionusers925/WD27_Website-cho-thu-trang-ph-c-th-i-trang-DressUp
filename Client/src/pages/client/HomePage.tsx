import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { type Product } from "../../types/product";

/* ================= TYPES ================= */
interface ICategory {
  _id: string;
  name: string;
}

/* ================= CONFIG ================= */
const API_URL = "http://localhost:3000";

/* ================= COMPONENT ================= */
function HomePage() {


  const [categories, setCategories] = useState<ICategory[]>([]);

  const [costumes, setCostumes] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/categories`),
        ]);

        setCostumes(productsRes.data);
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

  /* ================= SCROLL CATEGORY ================= */
  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  const luxuryFont = { fontFamily: "Playfair Display, serif" };

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeftPos.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => (isDown.current = false);
  const handleMouseUp = () => (isDown.current = false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
    }
  };

  return (
    <div className="bg-[#FDFBF9] text-[#2C2C2C] font-sans selection:bg-black selection:text-white">
      {/* ================= HERO ================= */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="z-10 bg-white/95 p-10 md:p-16 max-w-xl shadow-2xl animate-fadeIn ml-6 md:ml-20">
          <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-6 block font-bold">
            Premium Rental
          </span>

          <h1
            className="text-5xl md:text-7xl mb-8 leading-[1.1] italic text-gray-900"
            style={luxuryFont}
          >
            — Your New <br /> Everyday Style.
          </h1>

          <p className="text-sm text-gray-500 mb-10 leading-relaxed font-light max-w-sm">
            DressUp mang đến những bộ trang phục thiết kế cao cấp, giúp bạn tỏa
            sáng trong mọi sự kiện quan trọng.
          </p>
        </div>

        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
          className="absolute right-0 top-0 w-full md:w-2/3 h-full object-cover"
          alt="Hero Fashion"
        />
      </section>

      {/* ================= CATALOG ================= */}
      <section id="catalog" className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] tracking-[0.5em] text-gray-300 uppercase">
              Bộ sưu tập
            </span>

            <h2
              className="text-4xl italic text-gray-900 mt-2"
              style={luxuryFont}
            >
              — Thiết kế dành cho mọi sở thích.
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <p className="text-[10px] tracking-widest uppercase text-gray-400 animate-pulse">
                Loading Catalog...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {costumes.slice(0, 3).map((item) => {
                const itemImg =
                  item.images && item.images.length > 0
                    ? item.images[0]
                    : "https://placehold.co/600x800?text=DressUp";

                const dailyTier = item.rentalTiers?.find(
                  (t: any) => t.days === 1,
                );

                const displayPrice = dailyTier
                  ? dailyTier.price
                  : item.depositDefault || 0;

                return (
                  <Link
                    key={item._id}
                    to={`/detail/${item._id}`}
                    className="group text-center"
                  >
                    <div className="aspect-[3/4] overflow-hidden mb-8 bg-[#F9F7F5] relative">
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

                    <h3
                      className="text-xl italic text-gray-800"
                      style={luxuryFont}
                    >
                      {item.name}
                    </h3>

                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">
                      {item.brand?.name || "Designer"}
                    </p>

                    <p className="text-[10px] text-gray-900 mt-3 uppercase tracking-[0.2em] font-medium">
                      {displayPrice.toLocaleString()} VNĐ
                      <span className="italic font-light text-gray-400">
                        {" "}
                        / DAY
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-24 text-center">
            <Link
              to="/catalog"
              className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black pb-2 hover:text-gray-400 hover:border-gray-200 transition-all"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY ================= */}
      <div className="max-w-7xl mx-auto px-6 mt-40 py-20 border-t border-gray-100">
        <div className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
            Danh mục
          </span>

          <h2 className="text-4xl italic text-gray-900 mt-2" style={luxuryFont}>
            — Khám phá theo phong cách
          </h2>
        </div>

        <div className="relative">
          {/* fade trái */}
          <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

          {/* fade phải */}
          <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-6 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing snap-x snap-mandatory"
          >
            {categories.map((cat, index) => {
              const fallbackImages = [
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
                "https://images.unsplash.com/photo-1539109136881-3be0616acf4b",
                "https://images.unsplash.com/photo-1509631179647-0177331693ae",
              ];

              const img = fallbackImages[index % fallbackImages.length];

              return (
                <Link
                  key={cat._id}
                  to={`/catalog?category=${cat._id}`}
                  className="min-w-[250px] group snap-start"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    <img
                      src={`${img}?w=600`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      alt={cat.name}
                    />
                  </div>

                  <h3
                    className="text-lg italic text-gray-800 text-center"
                    style={luxuryFont}
                  >
                    {cat.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= GALLERY ================= */}
      <div className="max-w-7xl mx-auto px-6 py-40 border-t border-gray-50">
        <div className="text-center space-y-4 mb-20">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
            Trưng bày xu hướng
          </span>

          <h2 className="text-4xl italic text-gray-900 mt-2" style={luxuryFont}>
            — Làm mới phong cách của bạn.
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4 space-y-6">
            <img
              className="w-full h-[500px] object-cover rounded-xl"
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000"
            />
            <img
              className="w-full h-[500px] object-cover rounded-xl"
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000"
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-6 md:pt-20">
            <img
              className="w-full h-[400px] object-cover rounded-xl"
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000"
            />
            <img
              className="w-full h-[400px] object-cover rounded-xl"
              src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000"
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-6">
            <img
              className="w-full h-[500px] object-cover rounded-xl"
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000"
            />
            <img
              className="w-full h-[500px] object-cover rounded-xl"
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
