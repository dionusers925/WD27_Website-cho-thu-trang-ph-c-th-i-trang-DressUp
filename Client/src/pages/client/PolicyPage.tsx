import Footer from "../../layouts/client/Footer";
import Header from "../../layouts/client/Header";

function PolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-5xl font-serif italic text-gray-900 mb-16 text-center">
          Hướng dẫn thuê trang phục tại DressUp
        </h1>
        

        <div className="space-y-16">
          {/* MỤC 1: QUY TRÌNH ĐẶT THUÊ */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-black border-b border-gray-100 pb-2">
              01. Quy trình đặt thuê
            </h2>
            <div className="text-[13px] text-gray-600 leading-relaxed font-light space-y-3">
              <p>
                • Khách hàng lựa chọn trang phục, kích cỡ (Size) và thời gian
                thuê phù hợp trên website.
              </p>
              <p>
                • Đơn hàng chỉ được xác nhận sau khi khách hàng hoàn tất thanh
                toán Phí thuê và Tiền cọc (Security Deposit).
              </p>
            </div>
          </section>

          {/* MỤC 2: CHÍNH SÁCH TIỀN CỌC */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-black border-b border-gray-100 pb-2">
              02. Tiền đặt cọc (Security Deposit)
            </h2>
            <div className="text-[13px] text-gray-600 leading-relaxed font-light space-y-3">
              <p>• Khoản tiền cọc mặc định bằng 100% giá tiền mỗi sản phẩm.</p>
              <p>
                • Tiền cọc sẽ được hoàn trả 100% trong vòng 24h-48h sau khi
                DressUp nhận lại đồ và kiểm tra không có hư hại nghiêm trọng.
              </p>
              <p>
                • Trong trường hợp trang phục bị hư hại (rách, cháy, vết bẩn
                không thể tẩy sạch), DressUp có quyền khấu trừ từ tiền cọc tùy
                theo mức độ thiệt hại.
              </p>
            </div>
          </section>

          {/* MỤC 3: THỜI GIAN & TRẢ ĐỒ */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-black border-b border-gray-100 pb-2">
              03. Thời gian & Trả đồ
            </h2>
            <div className="text-[13px] text-gray-600 leading-relaxed font-light space-y-3">
              <p>• Thời gian thuê được tính theo ngày.</p>
              <p>
                • Khách hàng vui lòng trả đồ đúng hạn. Phí trễ hạn sẽ được tính
                dựa trên đơn giá thuê hàng ngày.
              </p>
              <p>
                • **Lưu ý:** DressUp sẽ chịu trách nhiệm làm sạch chuyên dụng
                sau mỗi lần thuê. Quý khách vui lòng không tự ý giặt ủi trang
                phục.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-24 pt-12 border-t border-gray-100 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Hỗ trợ:{" "}
            <span className="text-black font-medium">+84 901 234 567</span>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default PolicyPage;
