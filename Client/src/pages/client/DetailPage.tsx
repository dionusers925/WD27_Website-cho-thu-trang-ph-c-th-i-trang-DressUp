import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { addToCart } from "../../api/cartService";
import ReviewForm from "../../components/reviews/ReviewForm";
import ReviewList from "../../components/reviews/ReviewList";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const luxuryFont = { fontFamily: "Playfair Display, serif" };
const fallbackImage = "https://placehold.co/900x1200?text=DressUp";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Number.isFinite(value) ? value : 0);

const normalizeProduct = (payload: any) => {
  const productData = payload?.data?.product ?? payload?.product ?? payload;
  const variants = Array.isArray(payload?.data?.variants)
    ? payload.data.variants
    : Array.isArray(payload?.variants)
      ? payload.variants
      : Array.isArray(productData?.variants)
        ? productData.variants
        : [];
  return productData ? { ...productData, variants } : null;
};

const colorSwatchMap: Record<string, string> = {
  "đỏ": "#B91C1C",
  "do": "#B91C1C",
  "red": "#B91C1C",
  "đen": "#111827",
  "den": "#111827",
  "black": "#111827",
  "trắng": "#F8FAFC",
  "trang": "#F8FAFC",
  "white": "#F8FAFC",
  "be": "#E7D7C5",
  "kem": "#F5EDE2",
  "xanh": "#2563EB",
  "blue": "#2563EB",
  "xanh lá": "#16A34A",
  "xanh la": "#16A34A",
  "green": "#16A34A",
  "hồng": "#EC4899",
  "hong": "#EC4899",
  "pink": "#EC4899",
  "vàng": "#EAB308",
  "vang": "#EAB308",
  "yellow": "#EAB308",
  "tím": "#7C3AED",
  "tim": "#7C3AED",
  "purple": "#7C3AED",
  "nâu": "#92400E",
  "nau": "#92400E",
  "brown": "#92400E",
  "xám": "#9CA3AF",
  "xam": "#9CA3AF",
  "gray": "#9CA3AF",
  "grey": "#9CA3AF",
};

const resolveColorSwatch = (value?: string) => {
  if (!value) return "#111827";
  const key = value.toLowerCase().trim();
  return colorSwatchMap[key] ?? "#111827";
};

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [activeImg, setActiveImg] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const today = useMemo(
    () => new Date().toISOString().split("T")[0],
    [],
  );
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios
          .get(`${API_URL}/api/products/${id}`)
          .catch(() => axios.get(`${API_URL}/products/${id}`));
        const merged = normalizeProduct(res.data);
        if (!isMounted) return;
        if (merged?.status === "archived") {
          setError("Sản phẩm đã được lưu trữ và không còn hiển thị.");
          setProduct(null);
        } else {
          setProduct(merged);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Lỗi tải chi tiết:", err);
        setError("Không thể tải chi tiết sản phẩm.");
        setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const initialVariant =
      variants.find((variant: any) => variant?.isDefault) ||
      variants[0] ||
      null;
    setSelectedVariant(initialVariant);

    const initialColor =
      initialVariant?.color || product.colorGroup || product.colorFamily || null;
    setSelectedColor(initialColor);

    const images =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [fallbackImage];
    setActiveImg(images[0]);
  }, [product?._id]);

  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product],
  );

  const colors = useMemo(() => {
    const variantColors = variants
      .map((variant: any) => variant?.color)
      .filter(Boolean);
    const baseColor = product?.colorGroup ?? product?.colorFamily;
    const merged = variantColors.length
      ? variantColors
      : baseColor
        ? [baseColor]
        : [];
    return Array.from(new Set(merged));
  }, [variants, product]);

  const sizeOptions = useMemo(() => {
    const pool = selectedColor
      ? variants.filter((variant: any) => variant?.color === selectedColor)
      : variants;
    return Array.from(
      new Set(pool.map((variant: any) => variant?.size).filter(Boolean)),
    );
  }, [variants, selectedColor]);

  const images = useMemo(() => {
    const list =
      Array.isArray(product?.images) && product.images.length > 0
        ? product.images
        : [];
    return list.length ? list : [fallbackImage];
  }, [product]);

  const calculateDiffDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const diffDays = calculateDiffDays();

  const rentalPrices = Array.isArray(product?.rentalPrices)
    ? product.rentalPrices
    : Array.isArray(product?.rentalTiers)
      ? product.rentalTiers
      : [];

  const dailyTier = rentalPrices.find((t: any) => t.days === 1);
  const dailyPrice = Number(
    dailyTier?.price ?? rentalPrices[0]?.price ?? 0,
  );

  const calculateRentalPrice = () => {
    if (diffDays <= 0) return 0;
    const tier = rentalPrices.find((t: any) => t.days === diffDays);
    if (tier) return tier.price;
    return dailyPrice * diffDays;
  };

  const rentalPrice = calculateRentalPrice();
  const deposit =
    Number(product?.depositPrice ?? product?.depositDefault ?? 0) || 0;
  const totalPayment = deposit + rentalPrice;

  const quickSelectDays = (days: number) => {
    if (!startDate) return;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    const match =
      variants.find(
        (variant: any) =>
          variant?.color === color &&
          (!selectedVariant?.size || variant?.size === selectedVariant?.size),
      ) || variants.find((variant: any) => variant?.color === color);
    if (match) setSelectedVariant(match);
  };

  const handleSelectSize = (size: string) => {
    const match =
      variants.find(
        (variant: any) =>
          variant?.size === size &&
          (!selectedColor || variant?.color === selectedColor),
      ) || variants.find((variant: any) => variant?.size === size);
    if (match) {
      setSelectedVariant(match);
      if (match?.color) setSelectedColor(match.color);
    }
  };

  const handleConfirmRental = async () => {
    if (!product || diffDays <= 0 || !isAgreed) return;
    try {
      await addToCart(
        product._id,
        1,
        diffDays,
        selectedVariant?.size,
        selectedVariant?.color ||
          selectedColor ||
          product.colorGroup ||
          product.colorFamily,
      );
      navigate("/cart");
    } catch (error) {
      console.log("Lỗi thêm vào giỏ hàng:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-serif italic text-gray-400">
        Loading...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-gray-500">
        <p className="text-lg italic" style={luxuryFont}>
          {error || "Không tìm thấy sản phẩm."}
        </p>
        <button
          onClick={() => navigate("/catalog")}
          className="text-[10px] uppercase tracking-widest border-b border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition-all font-bold"
        >
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  const description =
    typeof product.description === "string" ? product.description.trim() : "";
  const descriptionPlain = description.replace(/<[^>]+>/g, "").trim();
  const descriptionPreview =
    descriptionPlain.length > 220
      ? `${descriptionPlain.slice(0, 220)}...`
      : descriptionPlain;
  const descriptionHasHtml = /<\/?[a-z][\s\S]*>/i.test(description);
  const canToggleDesc = descriptionPlain.length > 220;

  const categoryName = product.categoryId?.name ?? "Bộ sưu tập";
  const brandName = product.brand?.name || product.brand || "DressUp Atelier";

  const conditionLabels: Record<string, string> = {
    new: "Mới",
    like_new: "Như mới",
    used: "Đã sử dụng",
  };
  const conditionLabel =
    conditionLabels[product.condition] || product.condition || "-";

  const statusLabel =
    product.status === "active"
      ? "Hoạt động"
      : product.status === "draft"
        ? "Tạm ngừng"
        : "Lưu trữ";
  const statusClass =
    product.status === "active"
      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
      : product.status === "draft"
        ? "border-amber-200 text-amber-700 bg-amber-50"
        : "border-gray-200 text-gray-500 bg-gray-50";

  const canRent =
    product.status === "active" &&
    diffDays > 0 &&
    isAgreed &&
    (variants.length === 0 || selectedVariant);

  return (
    <div className="bg-[#FDFBF9] text-[#1f1f1f] min-h-screen selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-gray-400">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="hover:text-gray-700 transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-gray-700 transition-colors">
              Sản phẩm
            </Link>
            <span>/</span>
            <span className="text-gray-600">{product.name}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-[10px] uppercase tracking-widest border-b border-gray-400 pb-1 hover:text-gray-600 hover:border-gray-600 transition-all"
          >
            Quay lại
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-14">
          <div className="space-y-5">
            <div className="rounded-3xl overflow-hidden border border-[#EEE7E1] bg-white shadow-[0_30px_90px_rgba(20,20,20,0.1)]">
              <div className="aspect-[3/4] overflow-hidden bg-[#F9F7F5]">
                <img
                  src={activeImg || images[0]}
                  className="w-full h-full object-cover"
                  alt={product.name}
                  onError={(e: any) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=900";
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {images.map((img: string, index: number) => (
                <button
                  key={`${img}-${index}`}
                  onClick={() => setActiveImg(img)}
                  className={`aspect-[3/4] overflow-hidden border transition-all ${
                    activeImg === img
                      ? "border-black"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt={`${product.name}-${index}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 space-y-10">
            <div>
              <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.35em] text-gray-400">
                <span>{categoryName}</span>
                <span
                  className={`px-3 py-1 rounded-full border ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </div>

              <h1
                className="text-4xl md:text-5xl font-serif italic mt-4 text-gray-900 leading-tight"
                style={luxuryFont}
              >
                {product.name}
              </h1>

              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mt-3">
                {brandName}
              </p>

              <div className="mt-6 flex flex-wrap items-end gap-6">
                <div>
                  <div className="text-3xl md:text-4xl font-semibold text-gray-900">
                    {formatCurrency(dailyPrice)} VNĐ
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400">
                    Giá thuê / ngày
                  </p>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">
                  Tiền cọc{" "}
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(deposit)} VNĐ
                  </span>
                </div>
              </div>

              {descriptionPreview && (
                <p className="mt-6 text-sm text-gray-600 leading-relaxed">
                  {descriptionPreview}
                </p>
              )}
            </div>

            {(colors.length > 0 || selectedColor) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    Màu sắc
                  </h4>
                  {selectedColor && (
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                      {selectedColor}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSelectColor(color)}
                      className={`flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-widest transition-all ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/60"
                        style={{ backgroundColor: resolveColorSwatch(color) }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Chọn size
                </h4>
                {selectedVariant?.size && (
                  <span className="text-[9px] text-gray-400 italic">
                    Size:{" "}
                    <span className="text-black font-medium">
                      {selectedVariant.size}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {sizeOptions.length > 0 ? (
                  sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSelectSize(size)}
                      className={`min-w-[60px] px-4 py-3 text-[10px] tracking-widest uppercase border transition-all duration-300 ${
                        selectedVariant?.size === size
                          ? "border-black bg-black text-white shadow-lg"
                          : "border-gray-100 text-gray-400 hover:border-black hover:text-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    One size available
                  </span>
                )}
              </div>
              {selectedVariant?.stock !== undefined && (
                <p className="text-[10px] uppercase tracking-widest text-gray-400">
                  Còn {selectedVariant.stock} sản phẩm
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Thời gian thuê
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
                      {d} ngày
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 relative">
                <div className="relative group">
                  <label className="text-[8px] uppercase tracking-[0.2em] text-gray-400 absolute -top-5 left-0 font-bold">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-b border-gray-100 py-3 outline-none focus:border-black transition-all text-xs font-light bg-transparent cursor-pointer"
                  />
                </div>
                <div className="relative group">
                  <label className="text-[8px] uppercase tracking-[0.2em] text-gray-400 absolute -top-5 left-0 font-bold">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-b border-gray-100 py-3 outline-none focus:border-black transition-all text-xs font-light bg-transparent cursor-pointer"
                  />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 font-extralight text-xl">
                  /
                </div>
              </div>

              {rentalPrices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {rentalPrices.map((tier: any) => (
                    <div
                      key={`${tier.days}-${tier.price}`}
                      className="text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-white"
                    >
                      {tier.days} ngày · {formatCurrency(tier.price)} VNĐ
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#EEE7E1] rounded-2xl p-6 shadow-[0_25px_70px_rgba(20,20,20,0.08)] space-y-4">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-400">
                <span>Tiền cọc</span>
                <span className="text-gray-900 font-bold">
                  {formatCurrency(deposit)} VNĐ
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-400">
                <span>Phí thuê ({diffDays} ngày)</span>
                <span className="text-gray-900 font-bold">
                  {formatCurrency(rentalPrice)} VNĐ
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200/60 flex justify-between items-baseline">
                <span className="font-serif italic text-2xl">Tổng</span>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {formatCurrency(totalPayment)} VNĐ
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
                  className={`mt-0.5 w-4 h-4 border flex items-center justify-center transition-all ${
                    isAgreed
                      ? "bg-black border-black"
                      : "border-gray-300 group-hover:border-black"
                  }`}
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

              {product.status !== "active" && (
                <div className="text-[10px] uppercase tracking-widest text-gray-500">
                  {product.status === "draft"
                    ? "Sản phẩm đang tạm ngừng, chưa thể cho thuê."
                    : "Sản phẩm đã lưu trữ và không còn cho thuê."}
                </div>
              )}

              <button
                onClick={handleConfirmRental}
                disabled={!canRent}
                className={`w-full py-6 text-[10px] uppercase tracking-[0.5em] transition-all shadow-xl ${
                  !canRent
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900"
                }`}
              >
                Xác nhận thuê
              </button>
            </div>
          </aside>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Chăm sóc miễn phí",
              desc: "Giặt khô và làm mới trước khi giao.",
            },
            {
              title: "Đặt cọc hoàn lại",
              desc: "Hoàn trả cọc trong 24h sau khi trả đồ.",
            },
            {
              title: "Hỗ trợ đổi size",
              desc: "Đổi size nhanh trong ngày nếu cần.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#EEE7E1] bg-white p-6 shadow-[0_20px_50px_rgba(20,20,20,0.06)]"
            >
              <h3 className="text-sm uppercase tracking-[0.3em] text-gray-500">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-3xl border border-[#EEE7E1] bg-white p-8 shadow-[0_30px_90px_rgba(20,20,20,0.08)]">
            <h3
              className="text-2xl font-serif italic text-gray-900"
              style={luxuryFont}
            >
              Mô tả sản phẩm
            </h3>
            <div className="mt-6 text-sm leading-relaxed text-gray-600">
              {description ? (
                showFullDesc ? (
                  descriptionHasHtml ? (
                    <div
                      className="space-y-4"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  ) : (
                    <p className="whitespace-pre-line">{description}</p>
                  )
                ) : (
                  <p className="whitespace-pre-line">{descriptionPreview}</p>
                )
              ) : (
                <p>Chưa có mô tả chi tiết cho sản phẩm này.</p>
              )}
            </div>
            {description && canToggleDesc && (
              <button
                onClick={() => setShowFullDesc((prev) => !prev)}
                className="mt-5 text-[10px] uppercase tracking-widest border-b border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition-all font-bold"
              >
                {showFullDesc ? "Thu gọn" : "Xem thêm"}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#EEE7E1] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,20,0.06)]">
              <h4 className="text-[11px] uppercase tracking-[0.4em] text-gray-400">
                Thông tin
              </h4>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between gap-4">
                  <span>Thương hiệu</span>
                  <span className="text-gray-900 font-medium">{brandName}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Chất liệu</span>
                  <span className="text-gray-900 font-medium">
                    {product.material || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Màu sắc</span>
                  <span className="text-gray-900 font-medium">
                    {product.colorGroup || product.colorFamily || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Tình trạng</span>
                  <span className="text-gray-900 font-medium">
                    {conditionLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EEE7E1] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,20,0.06)]">
              <h4 className="text-[11px] uppercase tracking-[0.4em] text-gray-400">
                Lưu ý & chăm sóc
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li>
                  {product.careInstruction ||
                    "Giặt khô chuyên nghiệp, không tự giặt tại nhà."}
                </li>
                <li>Tránh tiếp xúc mỹ phẩm và hóa chất trực tiếp.</li>
                <li>Bảo quản trong túi vải và treo ngay khi nhận.</li>
              </ul>
              {(product.tags ?? []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(product.tags ?? []).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-20">
          <ReviewList productId={id!} />
          <ReviewForm
            productId={id!}
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
