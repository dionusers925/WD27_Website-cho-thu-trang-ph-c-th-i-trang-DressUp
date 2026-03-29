import crypto from "crypto";
import qs from "qs";

function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export const createVnpayUrl = (
  amount: number,
  order: any,
  ipAddr: string
) => {
  const tmnCode = process.env.VNP_TMN_CODE!;
  const secretKey = process.env.VNP_HASH_SECRET!;
  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  // ✅ SỬA LỖI 1: thêm http://
  const returnUrl = "http://localhost:5173/payment-result";

  const createDate = formatDate(new Date());

  let vnp_Params: any = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: Number(amount) * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: `${order._id}`,
    vnp_OrderInfo: `Thanh_toan_don_${order._id}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    // ✅ SỬA LỖI 3: comment hoặc bỏ dòng này
    // vnp_BankCode: "NCB",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
  };

  // Sort params theo key
  const sortedKeys = Object.keys(vnp_Params).sort();
  
  // ✅ SỬA LỖI 2: encode giá trị khi tạo signData
  let signData = "";
  sortedKeys.forEach((key, index) => {
    const value = vnp_Params[key];
    if (index === 0) {
      signData += `${key}=${encodeURIComponent(value)}`;
    } else {
      signData += `&${key}=${encodeURIComponent(value)}`;
    }
  });

  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(signData)
    .digest("hex");

  // Thêm secureHash vào params để tạo URL
  vnp_Params.vnp_SecureHash = secureHash;

  const paymentUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: true });

  return paymentUrl;
};