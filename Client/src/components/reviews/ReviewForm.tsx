import { useState, useEffect } from "react";
import axios from "axios";
import "./review.css";

interface Props {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) {
      setUserId(user._id);
    }
  }, []);

  const submitReview = async () => {
    if (!userId) {
      alert("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (!comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:3000/api/reviews", {
        productId,
        userId: userId,
        rating,
        comment,
      });

      alert("Đánh giá thành công!");
      setComment("");
      setRating(5);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      <h3 className="text-xl font-medium italic mb-6">Viết đánh giá</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Đánh giá của bạn:</span>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="border px-4 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value={5}>5 ⭐ - Tuyệt vời</option>
            <option value={4}>4 ⭐ - Tốt</option>
            <option value={3}>3 ⭐ - Trung bình</option>
            <option value={2}>2 ⭐ - Tệ</option>
            <option value={1}>1 ⭐ - Rất tệ</option>
          </select>
        </div>

        <textarea
          placeholder="Nhận xét của bạn về sản phẩm..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-4 text-sm h-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />

        <button
          onClick={submitReview}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </div>
    </div>
  );
}