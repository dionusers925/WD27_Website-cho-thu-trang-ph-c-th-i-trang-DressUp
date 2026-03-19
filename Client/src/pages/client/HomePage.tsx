import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { type ICostume } from "../../types/product";
import { useRef } from "react";

function HomePage() {
  const [costumes, setCostumes] = useState<ICostume[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  //call sản phẩm
  useEffect(() => {
    axios
      .get("http://localhost:3000/products")
      .then((res) => {
        setCostumes(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi kết nối:", err);
        setLoading(false);
      });
    window.scrollTo(0, 0);
  }, []);

  const scrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("catalog");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  //call danh mục
  useEffect(() => {
  axios
    .get("http://localhost:3000/categories")
    .then((res) => setCategories(res.data))
    .catch((err) => console.error("Lỗi categories:", err));
}, []);

const scrollLeft = () => {
  scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
};

const scrollRight = () => {
  scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
};

  return (
    <div className="bg-[#FDFBF9] text-[#2C2C2C] font-sans selection:bg-black selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="z-10 bg-white/95 p-10 md:p-16 max-w-xl shadow-2xl animate-fadeIn ml-6 md:ml-20">
          <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-6 block font-bold">
            Premium Rental
          </span>
          <h1 className="text-5xl md:text-7xl mb-8 leading-[1.1] font-serif italic text-gray-900">
            — Your New <br /> Everyday Style.
          </h1>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed font-light max-w-sm">
            DressUp mang đến những bộ trang phục thiết kế cao cấp, giúp bạn tỏa
            sáng trong mọi sự kiện quan trọng.
          </p>
          <div className="flex gap-4">
            <a href="#catalog" onClick={scrollToCatalog}>
              <button className="bg-[#222] text-white px-10 py-4 text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                Shop Now +
              </button>
            </a>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
          className="absolute right-0 top-0 w-full md:w-2/3 h-full object-cover"
          alt="Hero Fashion"
        />
      </section>

      {/* 2. CATALOG SECTION */}
      <section id="catalog" className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] tracking-[0.5em] text-gray-300 uppercase">
              Bộ sưu tập
            </span>
            <h2 className="text-4xl font-serif italic text-gray-900 mt-2">
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
              {costumes.slice(0, 3).map((item: any) => {
                // LẤY ẢNH: Sử dụng link đầu tiên trong mảng images hoàn chỉnh
                const itemImg =
                  item.images && item.images.length > 0
                    ? item.images[0]
                    : "https://placehold.co/600x800?text=DressUp";

                // LẤY GIÁ: Tìm gói "1 ngày" (days: 1) để hiển thị giá 300,000
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
                        // Dự phòng nếu link hstatic gặp sự cố mạng hoặc lỗi DNS
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

                    {/* Hiển thị Tên và Thương hiệu */}
                    <h3 className="text-xl font-serif italic text-gray-800">
                      {item.name}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">
                      {item.brand || "Designer"}
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
      {/* --- SECTION: CATEGORY (DANH MỤC) --- */}
<div className="max-w-7xl mx-auto px-6 mt-40 py-20 border-t border-gray-100">
  <div className="flex justify-between items-center mb-10">
    <div>
      <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
        Danh mục
      </span>
      <h2 className="text-4xl font-serif italic text-gray-900 mt-2">
        — Khám phá theo phong cách
      </h2>
    </div>

    {/* Nút scroll */}
    <div className="flex gap-3">
      <button
        onClick={scrollLeft}
        className="w-10 h-10 border border-gray-300 hover:bg-black hover:text-white transition"
      >
        ←
      </button>
      <button
        onClick={scrollRight}
        className="w-10 h-10 border border-gray-300 hover:bg-black hover:text-white transition"
      >
        →
      </button>
    </div>
  </div>

  {/* LIST CATEGORY */}
  <div
    ref={scrollRef}
    className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar"
  >
    {categories.map((cat: any, index: number) => {
      // fallback ảnh random theo index cho đỡ trùng
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
          className="min-w-[250px] group"
        >
          <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
            <img
              src={`${img}?w=600`}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              alt={cat.name}
            />
          </div>

          <h3 className="text-lg font-serif italic text-gray-800 text-center">
            {cat.name}
          </h3>
        </Link>
      );
    })}
  </div>
</div>


      {/* --- KẾT THÚC PHẦN CATEGORY --- */}

      <div className="max-w-7xl mx-auto px-6 py-40 border-t border-gray-50">
        <div className="text-center space-y-4 mb-20">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
            Trưng bày xu hướng
          </span>
          <h2 className="text-4xl font-serif italic text-gray-900 mt-2">
            — Làm mới phong cách của bạn.
          </h2>
          <p className="text-sm text-gray-400 font-light">
            Hãy giữ tinh thần vui tươi và lãng mạn với bộ sưu tập mới của DressUp.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Ảnh lớn bên trái */}
          <div className="col-span-12 md:col-span-4 space-y-6">
            <div className="aspect-[4/5] overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000"
                className="w-full h-full object-cover hover:scale-105 transition-all duration-1000"
                alt="Spring Look 1"
              />
            </div>
            <div className="aspect-[3/4] overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000"
                className="w-full h-full object-cover hover:scale-105 transition-all duration-1000"
                alt="Spring Look 2"
              />
            </div>
          </div>

          {/* Ảnh trung tâm */}
          <div className="col-span-12 md:col-span-4 space-y-6 md:pt-20">
            <div className="aspect-[3/5] overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000"
                className="w-full h-full object-cover hover:scale-105 transition-all duration-1000"
                alt="Spring Look 3"
              />
            </div>
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000"
                className="w-full h-full object-cover hover:scale-105 transition-all duration-1000"
                alt="Spring Look 4"
              />
            </div>
          </div>

          {/* Cột bên phải */}
          <div className="col-span-12 md:col-span-4 space-y-6">
            <div className="aspect-[4/5] overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000"
                className="w-full h-full object-cover hover:scale-105 transition-all duration-1000"
                alt="Spring Look 5"
              />
            </div>
            <div className="aspect-video overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000"
                className="w-full h-full object-cover hover:scale-105 transition-all duration-1000"
                alt="Spring Look 6"
              />
            </div>
          </div>
        </div>
      </div>
      {/* --- SECTION: GALLERY (TRENDY LOOKS) --- */}
      
    </div>
  );
}

export default HomePage;
