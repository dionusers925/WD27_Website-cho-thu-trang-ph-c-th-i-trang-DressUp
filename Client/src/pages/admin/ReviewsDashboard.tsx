import { Table, Button } from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
interface Review {
  _id: string;
  productId: any;
  userId: any;
  rating: number;
  comment: string;
  status?: boolean;
}

const ReviewsDashboard = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/reviews");
      setReviews(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xoá đánh giá này?")) {
      await axios.delete(`http://localhost:3000/api/reviews/${id}`);
      fetchReviews();
    }
  };


  const toggleStatus = async (id: string, status?: boolean) => {
  try {
    await axios.patch(`http://localhost:3000/api/reviews/${id}/status`, {
      status: !status,
    });
    fetchReviews();
  } catch (error) {
    console.log(error);
  }
};

  const renderStars = (rating: number) => {
    return "⭐".repeat(rating);
  };

  const columns = [
  {
    title: "STT",
    render: (_: any, __: any, index: number) => index + 1,
  },
  {
    title: "Sản phẩm",
    render: (record: Review) => record.productId?.name || "N/A",
  },
  {
    title: "Người dùng",
    render: (record: Review) => record.userId?.name || "User",
  },
  {
    title: "Rating",
    render: (record: Review) => (
      <span className="review-rating">{renderStars(record.rating)}</span>
    ),
  },
  {
    title: "Comment",
    dataIndex: "comment",
  },
  {
    title: "Trạng thái",
    render: (record: Review) =>
      record.status ? (
        <span style={{ color: "green", fontWeight: 600 }}>Đang hiển thị</span>
      ) : (
        <span style={{ color: "red", fontWeight: 600 }}>Đã ẩn</span>
      ),
  },
  {
    title: "Action",
    render: (record: Review) => (
      <div style={{ display: "flex", gap: "8px" }}>
        <Button onClick={() => toggleStatus(record._id, record.status)}>
          {record.status ? "Ẩn" : "Hiện"}
        </Button>

        <Button
          danger
          onClick={() => handleDelete(record._id)}
        >
          Delete
        </Button>
      </div>
    ),
  },
];
  

  return (
    <div className="review-admin-container">
      <div className="review-admin-header">
        <h2>Quản lý đánh giá</h2>
      </div>

      <Table
        className="review-table"
        columns={columns}
        dataSource={reviews}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ReviewsDashboard;