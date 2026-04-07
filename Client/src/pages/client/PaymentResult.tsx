import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const hasCalled = useRef(false);

  // Hàm xóa giỏ hàng trên client
  const clearCartOnClient = () => {
    // Xóa trong localStorage
    localStorage.removeItem("cart");
    localStorage.removeItem("cartItems");
    
    // Dispatch event để các component khác cập nhật
    window.dispatchEvent(new Event("cartUpdated"));
    
    console.log("✅ Đã xóa giỏ hàng trên client");
  };

  useEffect(() => {
    const responseCode = searchParams.get("vnp_ResponseCode");
    const transactionNo = searchParams.get("vnp_TransactionNo");
    const amount = searchParams.get("vnp_Amount");
    const txnRef = searchParams.get("vnp_TxnRef");

    const processPayment = async () => {
      if (hasCalled.current) {
        console.log("Đã gọi API rồi, bỏ qua lần 2");
        return;
      }
      hasCalled.current = true;

      if (responseCode === "00") {
        try {
          const confirmResponse = await axios.post(
            "http://localhost:3000/api/payment/payment-success",
            {
              vnp_TxnRef: txnRef,
              vnp_ResponseCode: responseCode,
              vnp_Amount: amount,
              vnp_TransactionNo: transactionNo,
            }
          );

          if (confirmResponse.data.success) {
            console.log("Đã xác nhận thanh toán thành công");
            
            // 👉 XÓA GIỎ HÀNG NGAY SAU KHI THANH TOÁN THÀNH CÔNG
            clearCartOnClient();
            
            setResult({
              success: true,
              transactionNo: transactionNo,
              amount: Number(amount) / 100,
              orderId: txnRef,
            });
          } else {
            setResult({ success: false });
          }
        } catch (error) {
          console.error("Lỗi xác nhận thanh toán:", error);
          setResult({ success: false });
        }
      } else {
        setResult({ success: false });
      }
    };

    processPayment();
  }, [searchParams]);

  useEffect(() => {
    if (result?.success) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [result, navigate]);

  if (!result) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Đang xử lý giao dịch...</p>
      </div>
    );
  }

  if (result.success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Thanh toán thành công!</h1>
          <p style={styles.successMessage}>Cảm ơn bạn đã mua hàng tại DressUp</p>
          
          <div style={styles.detailBox}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Mã đơn hàng:</span>
              <span style={styles.detailValue}>{result.orderId}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Mã giao dịch:</span>
              <span style={styles.detailValue}>{result.transactionNo}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Số tiền:</span>
              <span style={styles.detailAmount}>{result.amount?.toLocaleString()} VND</span>
            </div>
          </div>
          
          <div style={styles.autoRedirect}>
            <p>Tự động chuyển về trang chủ sau <strong>{countdown}</strong> giây</p>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${(countdown / 5) * 100}%` }}></div>
            </div>
          </div>
          
          <button onClick={() => {
            clearCartOnClient();
            navigate("/");
          }} style={styles.button}>
            🏠 Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorIcon}>✗</div>
        <h1 style={styles.errorTitle}>Thanh toán thất bại</h1>
        <p style={styles.errorMessage}>Có lỗi xảy ra trong quá trình thanh toán</p>
        <button onClick={() => navigate("/cart")} style={styles.button}>
          🔄 Thử lại
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: "16px",
  },
  card: {
    maxWidth: "500px",
    width: "100%",
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    padding: "32px",
    textAlign: "center" as const,
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "16px",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    backgroundColor: "#22c55e",
    color: "white",
    fontSize: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  errorIcon: {
    width: "80px",
    height: "80px",
    backgroundColor: "#ef4444",
    color: "white",
    fontSize: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  successTitle: {
    fontSize: "28px",
    fontWeight: "bold" as const,
    color: "#16a34a",
    marginBottom: "12px",
  },
  errorTitle: {
    fontSize: "28px",
    fontWeight: "bold" as const,
    color: "#dc2626",
    marginBottom: "12px",
  },
  successMessage: {
    color: "#64748b",
    marginBottom: "24px",
  },
  errorMessage: {
    color: "#64748b",
    marginBottom: "24px",
  },
  detailBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
    textAlign: "left" as const,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: "14px",
  },
  detailValue: {
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "monospace",
  },
  detailAmount: {
    color: "#3b82f6",
    fontSize: "18px",
    fontWeight: "bold" as const,
  },
  autoRedirect: {
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "20px",
  },
  progressBar: {
    height: "6px",
    backgroundColor: "#bfdbfe",
    borderRadius: "3px",
    marginTop: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: "3px",
    transition: "width 1s linear",
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);