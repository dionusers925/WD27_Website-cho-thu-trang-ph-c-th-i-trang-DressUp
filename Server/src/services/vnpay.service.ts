import crypto from "crypto";
import qs from "qs";

export const createVnpayUrl = (
  amount: number,
  orderId: string,
  ipAddr: string
) => {
  const tmnCode = process.env.VNP_TMN_CODE!;
  const secretKey = process.env.VNP_HASH_SECRET!;
  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = "http://localhost:5173/payment-result";

  const date = new Date();
  const createDate = date
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  let vnp_Params: any = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: amount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: "Thanh toan don hang",
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  // 🔥 SORT PARAMS
  vnp_Params = Object.keys(vnp_Params)
    .sort()
    .reduce((result: any, key) => {
      result[key] = vnp_Params[key];
      return result;
    }, {});

  // 🔥 STRINGIFY
  const signData = qs.stringify(vnp_Params, { encode: false });

  // 🔥 HASH
  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(signData)
    .digest("hex");

  vnp_Params["vnp_SecureHash"] = secureHash;

  // 🔥 URL
  const paymentUrl = `${vnpUrl}?${qs.stringify(vnp_Params, {
    encode: true,
  })}`;

  return paymentUrl;
};