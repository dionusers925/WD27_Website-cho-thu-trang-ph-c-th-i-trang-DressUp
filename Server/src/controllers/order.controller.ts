import { Request, Response } from "express";
import Order from "../models/Order";

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("userId", "name fullName email phone");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      lateFee, damageFee, status, paymentStatus, updatedBy, 
      returnMedia, adminReturnMedia, penaltyNote, damageErrors, 
      lostItems, overdueDays 
    } = req.body;

    const updateData: any = {};
    if (lateFee !== undefined) updateData.lateFee = lateFee;
    if (damageFee !== undefined) updateData.damageFee = damageFee;
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (returnMedia !== undefined) updateData.returnMedia = returnMedia;
    if (adminReturnMedia !== undefined) updateData.adminReturnMedia = adminReturnMedia;
    if (penaltyNote !== undefined) updateData.penaltyNote = penaltyNote;
    if (damageErrors !== undefined) updateData.damageErrors = damageErrors;
    if (lostItems !== undefined) updateData.lostItems = lostItems;
    if (overdueDays !== undefined) updateData.overdueDays = overdueDays;

    // Thêm vào lịch sử trạng thái nếu status thay đổi
    if (status !== undefined && status !== (await Order.findById(id))?.status) {
      updateData.$push = {
        statusHistory: {
          status,
          timestamp: new Date(),
          changedBy: updatedBy || "Hệ thống",
          notes: req.body.note || ""
        }
      };
    }

    // Thêm vào lịch sử thanh toán nếu paymentStatus thay đổi
    if (paymentStatus !== undefined && paymentStatus !== (await Order.findById(id))?.paymentStatus) {
      if (!updateData.$push) updateData.$push = {};
      updateData.$push.paymentStatusHistory = {
        status: paymentStatus,
        date: new Date(),
        updatedBy: updatedBy || "Hệ thống"
      };
    }

    const orderToUpdate = await Order.findById(id);
    if (!orderToUpdate) {
      return res.status(404).json({ message: "Cập nhật thất bại, không tìm thấy đơn hàng" });
    }

    // Logic: hoàn tất thủ tục nhận đồ sau 16:00 -> tự động dời ngày thuê sang hôm sau
    if (status && (status === "renting" || status === "picked_up") && orderToUpdate.status !== "renting" && orderToUpdate.status !== "picked_up") {
      const now = new Date();
      if (now.getHours() >= 16) {
        let itemsModified = false;
        const updatedItems = orderToUpdate.items.map((item: any) => {
          if (item.rental && item.rental.startDate) {
            const start = new Date(item.rental.startDate);
            // Nếu ngày bắt đầu là hôm nay hoặc trong quá khứ
            if (
              start.getFullYear() === now.getFullYear() &&
              start.getMonth() === now.getMonth() &&
              start.getDate() <= now.getDate()
            ) {
              const newStart = new Date(now);
              newStart.setDate(newStart.getDate() + 1);
              newStart.setHours(0, 0, 0, 0);

              const daysShifted = Math.ceil((newStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

              item.rental.startDate = newStart;
              if (item.rental.endDate) {
                const newEnd = new Date(item.rental.endDate);
                newEnd.setDate(newEnd.getDate() + daysShifted);
                item.rental.endDate = newEnd;
              }
              itemsModified = true;
            }
          }
          return item;
        });

        if (itemsModified) {
          updateData.items = updatedItems;
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("userId", "name fullName email phone");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Cập nhật thất bại, không tìm thấy đơn hàng" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi cập nhật đơn hàng" });
  }
};

// ========== API GIA HẠN ĐƠN HÀNG (cho Model mới) ==========
export const extendOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { userId, newEndDate } = req.body;

    if (!orderId || !userId || !newEndDate) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Kiểm tra quyền
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền gia hạn đơn hàng này" });
    }

    // Kiểm tra trạng thái
    if (order.status !== "renting") {
      return res.status(400).json({ success: false, message: "Chỉ có thể gia hạn khi đơn hàng đang ở trạng thái 'Đang thuê'" });
    }

    // Lấy ngày hiện tại từ item đầu tiên (cấu trúc mới: items[0].rental)
    const firstItem = order.items[0];
    if (!firstItem || !firstItem.rental) {
      return res.status(400).json({ success: false, message: "Không tìm thấy thông tin ngày thuê" });
    }

    const currentStartDate = firstItem.rental.startDate;
    const currentEndDate = firstItem.rental.endDate;
    const newEnd = new Date(newEndDate);

    if (newEnd <= currentEndDate) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc mới phải lớn hơn ngày kết thúc hiện tại" });
    }

    if (newEnd <= currentStartDate) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    // Tính số ngày cũ và mới
    const oldRentalDays = firstItem.rental.days;
    const diffTime = newEnd.getTime() - currentStartDate.getTime();
    const newRentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const extensionDays = newRentalDays - oldRentalDays;

    if (extensionDays <= 0) {
      return res.status(400).json({ success: false, message: "Số ngày gia hạn không hợp lệ" });
    }

    // Tính thêm tiền
    let additionalTotal = 0;
    order.items.forEach((item: any) => {
      const pricePerDay = item.rental.pricePerDay;
      const additional = pricePerDay * extensionDays * item.quantity;
      additionalTotal += additional;
      item.lineTotal = (item.lineTotal || 0) + additional;
      // Cập nhật rental cho từng item
      item.rental.endDate = newEnd;
      item.rental.days = newRentalDays;
    });

    // Cập nhật order
    order.total = (order.total || 0) + additionalTotal;
    order.subtotal = (order.subtotal || 0) + additionalTotal;

    // Thêm vào lịch sử
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "extended",
      timestamp: new Date(),
      changedBy: userId,
      notes: `Gia hạn từ ${currentEndDate.toLocaleDateString("vi-VN")} đến ${newEnd.toLocaleDateString("vi-VN")} (thêm ${extensionDays} ngày, +${additionalTotal.toLocaleString()}đ)`
    });

    await order.save();

    res.json({ 
      success: true, 
      message: `Đã gia hạn thành công! Thêm ${extensionDays} ngày. Vui lòng thanh toán thêm ${additionalTotal.toLocaleString()}đ`,
      order,
      additionalPayment: additionalTotal
    });
  } catch (error) {
    console.error("Lỗi gia hạn đơn hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi gia hạn" });
  }
};

// API lấy danh sách đơn hàng của user
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
  }
};