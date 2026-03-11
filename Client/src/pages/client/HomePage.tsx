import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Header from '../../layouts/client/components/Header';
import Footer from '../../layouts/client/components/Footer';
import { type ICostume } from '../../types/product';

function HomePage() {
  const [costumes, setCostumes] = useState<ICostume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API từ Server để lấy dữ liệu từ MongoDB
    axios.get('http://localhost:5000/api/costumes')
      .then(res => {
        setCostumes(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi kết nối:", err);
        setLoading(false);
      });
    window.scrollTo(0, 0);
  }, []);

  const scrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('catalog');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FDFBF9] text-[#2C2C2C] font-sans selection:bg-black selection:text-white">
      <Header />

      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-center px-6 md:px-20 overflow-hidden">
        <div className="z-10 bg-white/95 p-10 md:p-16 max-w-xl shadow-2xl animate-fadeIn">
          <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-6 block font-bold">Premium Rental</span>
          <h1 className="text-5xl md:text-7xl mb-8 leading-[1.1] font-serif italic text-gray-900">
            — Your New <br/> Everyday Style.
          </h1>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed font-light max-w-sm">
            DressUp mang đến những bộ trang phục thiết kế cao cấp, giúp bạn tỏa sáng trong mọi sự kiện quan trọng.
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

      {/* 2. CATALOG SECTION - ĐÃ FIX HIỂN THỊ DỰA TRÊN DỮ LIỆU JSON */}
      <section id="catalog" className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] tracking-[0.5em] text-gray-300 uppercase">COLLECTION</span>
            <h2 className="text-4xl font-serif italic mt-4 text-gray-900">— Designer Clothes for Every Taste.</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <p className="text-[10px] tracking-widest uppercase text-gray-400 animate-pulse">Loading Catalog...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {costumes.slice(0, 3).map((item: any) => {
                // LẤY ẢNH: Sử dụng link đầu tiên trong mảng images hoàn chỉnh
                const itemImg = (item.images && item.images.length > 0) 
                  ? item.images[0] 
                  : 'https://placehold.co/600x800?text=DressUp';

                // LẤY GIÁ: Tìm gói "1 ngày" (days: 1) để hiển thị giá 300,000
                const dailyTier = item.rentalTiers?.find((t: any) => t.days === 1);
                const displayPrice = dailyTier ? dailyTier.price : (item.depositDefault || 0);

                return (
                  <Link key={item._id} to={`/costume/${item._id}`} className="group text-center">
                    <div className="aspect-[3/4] overflow-hidden mb-8 bg-[#F9F7F5] relative">
                      <img 
                        src={itemImg} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
                        // Dự phòng nếu link hstatic gặp sự cố mạng hoặc lỗi DNS
                        onError={(e: any) => { 
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600'; 
                        }}
                      />
                      {item.status !== 'active' && (
                         <div className="absolute top-4 right-4 bg-black text-white text-[8px] px-3 py-1 uppercase tracking-widest">Rented</div>
                      )}
                    </div>
                    
                    {/* Hiển thị Tên và Thương hiệu */}
                    <h3 className="text-xl font-serif italic text-gray-800">{item.name}</h3>
                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">{item.brand || 'Designer'}</p>
                    
                    <p className="text-[10px] text-gray-900 mt-3 uppercase tracking-[0.2em] font-medium">
                      {displayPrice.toLocaleString()} VNĐ 
                      <span className="italic font-light text-gray-400"> / DAY</span>
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
              
          <div className="mt-24 text-center">
            <Link to="/catalog" className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black pb-2 hover:text-gray-400 hover:border-gray-200 transition-all">
              View Full Collection
            </Link>
          </div>
        </div>
      </section>
        {/* --- SECTION 3: ABOUT US (PHẦN MỚI THÊM) --- */}
      <div className="max-w-7xl mx-auto px-6 mt-40 py-40 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Cột ảnh trái & Trích dẫn */}
          <div className="space-y-12">
            <div className="aspect-[4/5] overflow-hidden bg-gray-50">
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                alt="About DressUp" 
              />
            </div>
            <div className="max-w-md">
              <span className="text-4xl font-serif text-gray-200">“</span>
              <p className="text-lg font-serif italic text-gray-600 leading-relaxed -mt-4">
                I have always had difficulties with buying clothes for every-day wear. Therefore, together with Linda, we decided to create our own brand.
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-widest text-gray-400">— Johanna Innsbruck</p>
            </div>
          </div>

          {/* Cột nội dung phải */}
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">About Us</span>
              <h2 className="text-5xl font-serif text-gray-900 leading-tight">Comfort and <br />Quality Come First.</h2>
            </div>
            
            <div className="space-y-6 text-sm text-gray-500 font-light leading-relaxed max-w-lg">
              <p>
                Johanna Innsbruck and Linda Copperfield have always dreamed of comfortable women's clothing that would look appropriate in any circumstances.
              </p>
              <p>
                This is how the DressUp brand appeared — it is a brand for women who want to feel confident, seductive, and stylish in any situation.
              </p>
            </div>

            <div className="pt-6">
              <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop" 
                className="w-full aspect-video object-cover" 
                alt="DressUp Collection"
              />
            </div>
          </div>
        </div>
      </div>
      {/* --- KẾT THÚC PHẦN ABOUT US --- */}

      {/* --- SECTION: HISTORY (MOMENTS THAT MATTER) --- */}
<div className="max-w-7xl mx-auto px-6 py-40">
  <div className="text-center space-y-4 mb-24">
    <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">History</span>
    <h2 className="text-5xl font-serif text-gray-900">— Moments That Matter for Us.</h2>
    <p className="text-sm text-gray-400 font-light">A few words about how our brand of designer clothes was created and developed.</p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {/* Milestone 1997 */}
    <div className="border border-gray-100 p-16 text-center space-y-8 hover:shadow-2xl transition-shadow duration-500">
      <div className="w-24 h-24 bg-[#F9F7F5] rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl font-serif italic text-gray-800">1997</span>
      </div>
      <div className="space-y-4">
        <h4 className="text-xl font-serif italic">Beginning</h4>
        <div className="w-8 h-[1px] bg-gray-200 mx-auto"></div>
        <p className="text-xs text-gray-400 leading-relaxed font-light px-4">
          Johanna met Linda, and together they decided to create a fashion brand.
        </p>
      </div>
    </div>

    {/* Milestone 2001 */}
    <div className="border border-gray-100 p-16 text-center space-y-8 hover:shadow-2xl transition-shadow duration-500">
      <div className="w-24 h-24 bg-[#F9F7F5] rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl font-serif italic text-gray-800">2001</span>
      </div>
      <div className="space-y-4">
        <h4 className="text-xl font-serif italic">Featured in Vogue</h4>
        <div className="w-8 h-[1px] bg-gray-200 mx-auto"></div>
        <p className="text-xs text-gray-400 leading-relaxed font-light px-4">
          We were featured as the "Editor's Pick for Spring-Summer 2001".
        </p>
      </div>
    </div>

    {/* Milestone 2019 */}
    <div className="border border-gray-100 p-16 text-center space-y-8 hover:shadow-2xl transition-shadow duration-500">
      <div className="w-24 h-24 bg-[#F9F7F5] rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl font-serif italic text-gray-800">2019</span>
      </div>
      <div className="space-y-4">
        <h4 className="text-xl font-serif italic">First Offline Store</h4>
        <div className="w-8 h-[1px] bg-gray-200 mx-auto"></div>
        <p className="text-xs text-gray-400 leading-relaxed font-light px-4">
          In 2019, we opened our first boutique on the Quận 1, TP. Hồ Chí Minh.
        </p>
      </div>
    </div>
  </div>
</div>

{/* --- SECTION: GALLERY (TRENDY LOOKS) --- */}
<div className="max-w-7xl mx-auto px-6 py-40 border-t border-gray-50">
  <div className="text-center space-y-4 mb-20">
    <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Gallery</span>
    <h2 className="text-5xl font-serif text-gray-900">— Trendy Looks of Your Spring.</h2>
    <p className="text-sm text-gray-400 font-light">Stay playful and romantic this spring with the new collection by DressUp.</p>
  </div>

  <div className="grid grid-cols-12 gap-6">
    {/* Ảnh lớn bên trái */}
    <div className="col-span-12 md:col-span-4 space-y-6">
      <div className="aspect-[4/5] overflow-hidden bg-gray-100">
        <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000" className="w-full h-full object-cover hover:scale-105 transition-all duration-1000" alt="Spring Look 1" />
      </div>
      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
        <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000" className="w-full h-full object-cover hover:scale-105 transition-all duration-1000" alt="Spring Look 2" />
      </div>
    </div>

    {/* Ảnh trung tâm */}
    <div className="col-span-12 md:col-span-4 space-y-6 md:pt-20">
      <div className="aspect-[3/5] overflow-hidden bg-gray-100">
        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000" className="w-full h-full object-cover hover:scale-105 transition-all duration-1000" alt="Spring Look 3" />
      </div>
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000" className="w-full h-full object-cover hover:scale-105 transition-all duration-1000" alt="Spring Look 4" />
      </div>
    </div>

    {/* Cột bên phải */}
    <div className="col-span-12 md:col-span-4 space-y-6">
      <div className="aspect-[4/5] overflow-hidden bg-gray-100">
        <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000" className="w-full h-full object-cover hover:scale-105 transition-all duration-1000" alt="Spring Look 5" />
      </div>
      <div className="aspect-video overflow-hidden bg-gray-100">
        <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000" className="w-full h-full object-cover hover:scale-105 transition-all duration-1000" alt="Spring Look 6" />
      </div>
    </div>
  </div>
</div>
{/* --- SECTION: GALLERY (TRENDY LOOKS) --- */}

{/* --- SECTION: INSTAGRAM FEED --- */}
<div className="max-w-7xl mx-auto px-6 py-32 border-t border-gray-50">
  <div className="text-center mb-16">
    <h2 className="text-2xl font-serif text-gray-900 tracking-tight">
      Follow Us @DressUp.store
    </h2>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {/* Các ảnh trong feed Instagram */}
    <div className="aspect-square overflow-hidden bg-gray-50">
      <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500" className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="Instagram 1" />
    </div>
    <div className="aspect-square overflow-hidden bg-gray-50">
      <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=500" className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="Instagram 2" />
    </div>
    <div className="aspect-square overflow-hidden bg-gray-50">
      <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=500" className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="Instagram 3" />
    </div>
    <div className="aspect-square overflow-hidden bg-gray-50">
      <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=500" className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="Instagram 4" />
    </div>
    <div className="aspect-square overflow-hidden bg-gray-50">
      <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500" className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="Instagram 5" />
    </div>
  </div>
</div>


{/* --- SECTION: INSTAGRAM FEED --- */}
      <Footer />
    </div>
  );
}

export default HomePage;