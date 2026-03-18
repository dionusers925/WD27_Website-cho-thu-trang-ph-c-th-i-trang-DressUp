import { useEffect, useState } from "react";
import axios from "axios";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  productId: {
    name: string;
  };
  userId: {
    name: string;
  };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    const res = await axios.get("http://localhost:3000/api/reviews");
    setReviews(res.data);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Xóa đánh giá này?")) return;

    await axios.delete(`http://localhost:3000/api/reviews/${id}`);
    fetchReviews();
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div>
      <h2>Quản lý đánh giá</h2>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Product</th>
            <th>User</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {reviews.map((r) => (
            <tr key={r._id}>
              <td>{r.productId?.name}</td>
              <td>{r.userId?.name}</td>
              <td>{"⭐".repeat(r.rating)}</td>
              <td>{r.comment}</td>
              <td>
                <button onClick={() => deleteReview(r._id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}