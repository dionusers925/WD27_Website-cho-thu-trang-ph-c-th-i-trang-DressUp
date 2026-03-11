import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          
          {/* CỘT 1: BRAND - Tăng kích thước và độ trắng */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-3xl font-serif italic tracking-tighter text-white hover:opacity-80 transition-opacity">
              DressUp.
            </Link>
            <p className="mt-8 text-[11px] leading-relaxed text-gray-300 uppercase tracking-[0.2em] font-light">
              Nền tảng thuê trang phục thiết kế cao cấp dành cho những dịp đặc biệt. 
              Nơi phong cách và sự bền vững giao thoa.
            </p>
          </div>

          {/* CỘT 2: KHÁM PHÁ - Sử dụng Gray-300 thay vì Gray-500 */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">Khám phá</h4>
            <ul className="space-y-4 text-[11px] text-gray-300 uppercase tracking-[0.2em] font-light">
              <li><Link to="/catalog" className="hover:text-white transition-all underline-offset-8 hover:underline">Tất cả sản phẩm</Link></li>
              <li><Link to="/about" className="hover:text-white transition-all underline-offset-8 hover:underline">Về chúng tôi</Link></li>
              <li><Link to="/policy" className="hover:text-white transition-all underline-offset-8 hover:underline">Chính sách thuê đồ</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-all underline-offset-8 hover:underline">Vận chuyển & Trả đồ</Link></li>
            </ul>
          </div>

          {/* CỘT 3: LIÊN HỆ - Tăng độ sáng cho tiêu đề con */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">Liên hệ</h4>
            <ul className="space-y-4 text-[11px] text-gray-300 uppercase tracking-[0.2em] font-light">
              <li>
                <span className="block text-gray-500 mb-1 italic font-serif text-[13px]">Email.</span> 
                <a href="mailto:hello@dressup.vn" className="text-white hover:text-gray-300">hello@dressup.vn</a>
              </li>
              <li>
                <span className="block text-gray-500 mb-1 italic font-serif text-[13px]">Office.</span> 
                Quận 1, TP. Hồ Chí Minh
              </li>
              <li>
                <span className="block text-gray-500 mb-1 italic font-serif text-[13px]">Hotline.</span> 
                +84 901 234 567
              </li>
            </ul>
          </div>

          {/* CỘT 4: BẢN TIN - Làm nổi bật Input */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">Bản tin</h4>
            <p className="text-[11px] text-gray-300 font-light leading-relaxed">Đăng ký để nhận thông tin về các bộ sưu tập giới hạn.</p>
            <div className="flex border-b border-gray-600 py-2 focus-within:border-white transition-all duration-500">
              <input 
                type="email" 
                placeholder="EMAIL CỦA BẠN" 
                className="bg-transparent text-[10px] outline-none w-full uppercase tracking-widest text-white placeholder:text-gray-600"
              />
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:opacity-60">
                GỬI
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER - Điều chỉnh Gray-700 lên Gray-500 */}
        <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em]">
            © {currentYear} DRESSUP RENTAL. CONCEPT BY A RANDOM GUY.
          </p>
          <div className="flex gap-10 text-[9px] text-gray-400 uppercase tracking-[0.3em]">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Pinterest</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;