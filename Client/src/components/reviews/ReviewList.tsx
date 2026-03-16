import { useEffect, useState } from "react";
import axios from "axios";
import "./review.css";

interface Props {
  productId: string;
}

export default function ReviewList({ productId }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/reviews/product/${productId}`)
      .then((res) => {
        setReviews(res.data);
      })
      .catch((err) => console.log("Lỗi load review", err));
  }, [productId]);

  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-gray-400">
        Chưa có đánh giá nào
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-serif italic mb-10">Customer Reviews</h2>

      {reviews.map((r) => (
        <div key={r._id} className="border-b py-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">{r.userId?.fullName}</p>
            <p>{"⭐".repeat(r.rating)}</p>
          </div>

          <p className="text-gray-600 text-sm">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}