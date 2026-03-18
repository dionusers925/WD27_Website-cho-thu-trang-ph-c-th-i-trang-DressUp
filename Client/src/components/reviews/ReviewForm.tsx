import { useState } from "react";
import axios from "axios";
import "./review.css";

interface Props {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    try {
      await axios.post("http://localhost:3000/api/reviews", {
        productId,
        userId: "6980e50cae9a9de44bf1aa8f", // user test
        rating,
        comment,
      });

      alert("Đánh giá thành công");

      setComment("");

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể đánh giá");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      <h3 className="text-xl font-serif italic mb-6">Write a Review</h3>

      <div className="space-y-4">
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border px-4 py-2 text-sm"
        >
          <option value={5}>5 ⭐</option>
          <option value={4}>4 ⭐</option>
          <option value={3}>3 ⭐</option>
          <option value={2}>2 ⭐</option>
          <option value={1}>1 ⭐</option>
        </select>

        <textarea
          placeholder="Nhận xét của bạn..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border p-4 text-sm h-28"
        />

        <button
          onClick={submitReview}
          
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}