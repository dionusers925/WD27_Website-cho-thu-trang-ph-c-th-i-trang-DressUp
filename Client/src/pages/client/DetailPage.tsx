import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { addToCart } from "../../api/cartService";
import Header from "../../layouts/client/Header";
import Footer from "../../layouts/client/Footer";
import ReviewForm from "../../components/reviews/ReviewForm";
import ReviewList from "../../components/reviews/ReviewList";

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [activeImg, setActiveImg] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // State quản lý ngày thuê và xác nhận chính sách
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/products/${id}`)
      .then((res) => {
        const data = res.data;
        setProduct(data);
        if (data.images?.length > 0) setActiveImg(data.images[0]);
        if (data.variants?.length > 0) setSelectedVariant(data.variants[0]);
      })
      .catch((err) => console.error("Lỗi tải chi tiết:", err));
    window.scrollTo(0, 0);
  }, [id]);

  const calculateDiffDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const diffDays = calculateDiffDays();

  const calculateRentalPrice = () => {
    if (diffDays <= 0) return 0;
    const tier = product?.rentalTiers?.find((t: any) => t.days === diffDays);
    if (tier) return tier.price;
    const basePrice =
      product?.rentalTiers?.find((t: any) => t.days === 1)?.price || 0;
    return basePrice * diffDays;
  };

  const rentalPrice = calculateRentalPrice();
  const totalPayment = (product?.depositDefault || 0) + rentalPrice;

  const quickSelectDays = (days: number) => {
    if (!startDate) return;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    setEndDate(end.toISOString().split("T")[0]);
  };

  if (!product)
    return (
      <div className="h-screen flex items-center justify-center font-serif italic text-gray-400">
        Loading...
      </div>
    );

  const handleConfirmRental = async () => {
    try {
      await addToCart(
        product._id,
        1,
        diffDays,
        selectedVariant.size,
        selectedVariant.color || product.colorFamily,
      );

      navigate("/cart");
    } catch (error) {
      console.log("Lỗi thêm vào giỏ hàng:", error);
    }
  };
  return (
    <div className="bg-white min-h-screen selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row gap-20">
          <div className="w-full md:w-1/2">
            <div className="aspect-[3/4] overflow-hidden bg-[#F9F7F5] mb-6">
              <img
                src={activeImg}
                className="w-full h-full object-cover"
                alt={product.name}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images?.map((img: string, index: number) => (
                <img
                  key={index}
                  src={img}
                  onClick={() => setActiveImg(img)}
                  className={`aspect-[3/4] object-cover cursor-pointer border-b-2 transition-all ${activeImg === img ? "border-black" : "border-transparent opacity-50"}`}
                />
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-10">
            <div>
              <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 font-bold">
                {product.brand}
              </span>
              <h1 className="text-5xl font-serif italic mt-4 text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Color
                </h4>
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{
                      backgroundColor:
                        product.colorFamily === "Đỏ" ? "#B91C1C" : "#222",
                    }}
                  />
                  <span className="text-[10px] uppercase tracking-widest text-black font-medium">
                    {product.colorFamily}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Select Size
                </h4>
                {selectedVariant && (
                  <span className="text-[9px] text-gray-400 italic">
                    Color:{" "}
                    <span className="text-black font-medium">
                      {selectedVariant.color || product.colorFamily}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants?.map((variant: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`min-w-[60px] px-4 py-3 text-[10px] tracking-widest uppercase border transition-all duration-300 ${
                      selectedVariant === variant
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-100 text-gray-400 hover:border-black hover:text-black"
                    }`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Rental Period
                </h4>
                <div className="flex gap-2">
                  {[1, 3, 7].map((d) => (
                    <button
                      key={d}
                      onClick={() => quickSelectDays(d)}
                      className={`text-[9px] px-4 py-1.5 border uppercase tracking-widest transition-all duration-300 ${
                        diffDays === d
                          ? "border-black bg-black text-white"
                          : "border-gray-100 text-gray-400 hover:border-black hover:text-black"
                      }`}
                    >
                      {d} Day{d > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 relative">
                <div className="relative group">
                  <label className="text-[8px] uppercase tracking-[0.2em] text-gray-400 absolute -top-5 left-0 font-bold">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-b border-gray-100 py-3 outline-none focus:border-black transition-all text-xs font-light bg-transparent cursor-pointer"
                  />
                </div>
                <div className="relative group">
                  <label className="text-[8px] uppercase tracking-[0.2em] text-gray-400 absolute -top-5 left-0 font-bold">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-b border-gray-100 py-3 outline-none focus:border-black transition-all text-xs font-light bg-transparent cursor-pointer"
                  />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 font-extralight text-xl">
                  /
                </div>
              </div>
            </div>

            <div className="bg-[#F9F7F5] p-8 space-y-5">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-400">
                <span>Security Deposit (Tiền cọc)</span>
                <span className="text-black font-bold">
                  {product.depositDefault?.toLocaleString()} VNĐ
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-400">
                <span>Rental Fee ({diffDays} days)</span>
                <span className="text-black font-bold">
                  {rentalPrice.toLocaleString()} VNĐ
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200/50 flex justify-between items-baseline">
                <span className="font-serif italic text-2xl">
                  Total Amount:
                </span>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {totalPayment.toLocaleString()} VNĐ
                  </p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">
                    Gồm tiền cọc & phí thuê
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => setIsAgreed(!isAgreed)}
              >
                <div
                  className={`mt-0.5 w-4 h-4 border flex items-center justify-center transition-all ${isAgreed ? "bg-black border-black" : "border-gray-300 group-hover:border-black"}`}
                >
                  {isAgreed && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={4}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] leading-relaxed select-none">
                  Tôi đồng ý với{" "}
                  <a
                    href="/policy"
                    target="_blank"
                    className="text-black font-bold underline underline-offset-4 hover:opacity-70"
                    onClick={(e) => e.stopPropagation()}
                  >
                    chính sách thuê trang phục
                  </a>{" "}
                  của DressUp.
                </p>
              </div>

              <button
                onClick={handleConfirmRental}
                disabled={diffDays <= 0 || !isAgreed}
                className={`w-full py-6 text-[10px] uppercase tracking-[0.5em] transition-all shadow-xl ${
                  diffDays <= 0 || !isAgreed
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900"
                }`}
              >
                Confirm Rental
              </button>
            </div>
          </div>
        </div>
      </div>
      <ReviewList productId={id!} />

      <ReviewForm productId={id!} onSuccess={() => window.location.reload()} />
    </div>
  );
}

export default DetailPage;
