import { useEffect, useState } from "react";
import axios from "axios";
import "./review.css";

interface Props {
  productId: string;
}

interface Review {
  _id: string;
  userId?: {
    fullName?: string;
    name?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewList({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/reviews/product/${productId}`
      );
      setReviews(res.data);
    } catch (err) {
      console.log("Lỗi load review", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-gray-400">
        Đang tải đánh giá...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-gray-400">
        Chưa có đánh giá nào cho sản phẩm này
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-medium italic mb-10">
        Đánh giá của khách hàng ({reviews.length})
      </h2>

      {reviews.map((r) => (
        <div key={r._id} className="border-b pb-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">
              {r.userId?.fullName || r.userId?.name || "Khách hàng"}
            </p>
            <p className="text-yellow-500">
              {"★".repeat(r.rating)}
              <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
            </p>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
          <p className="text-gray-400 text-xs mt-2">
            {new Date(r.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      ))}
    </div>
  );
}