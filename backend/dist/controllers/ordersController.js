"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserOrders = exports.getOrderById = exports.sendOrderUpdateEmailHandler = exports.deleteOrder = exports.updateOrderStatus = exports.getDecorations = exports.validateOrderInput = exports.checkDeliveryDate = exports.applyDiscountCode = exports.duplicateOrder = exports.saveDraftOrder = exports.getAllOrders = exports.sendOrderConfirmationEmail = exports.placeOrder = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const discountCodeModel_1 = __importDefault(require("../models/discountCodeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const cartModel_1 = __importDefault(require("../models/cartModel"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const addressModel_1 = __importDefault(require("../models/addressModel"));
const placeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, address, items, paymentMethod, decoration } = req.body;
        console.log("📨 Full Request Body:", JSON.stringify(req.body, null, 2));
        if (!userId || !address || !items || items.length === 0) {
            console.error("❌ Error: Missing required fields.");
            res.status(400).json({ error: "User ID, address, and items are required" });
            return;
        }
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            console.error("❌ Error: User not found:", userId);
            res.status(404).json({ error: "User not found" });
            return;
        }
        const userAddress = yield addressModel_1.default.findById(address);
        if (!userAddress || userAddress.userId.toString() !== userId) {
            console.error("❌ Error: Address not found or doesn't belong to user:", address);
            res.status(404).json({ error: "Address not found or does not belong to user" });
            return;
        }
        const cakeIds = items.map((i) => i.cakeId);
        const cakes = yield cakeModel_1.default.find({ _id: { $in: cakeIds } });
        if (cakes.length !== items.length) {
            console.error("❌ Error: One or more cakes not found.", { expected: items.length, found: cakes.length });
            res.status(404).json({ error: "One or more cakes not found" });
            return;
        }
        let totalPrice = 0;
        const mappedItems = items.map((i) => {
            const foundCake = cakes.find((c) => c._id.toString() === i.cakeId);
            if (!foundCake)
                return null;
            totalPrice += foundCake.price * i.quantity;
            totalPrice = parseFloat(totalPrice.toFixed(2));
            return {
                cake: foundCake._id,
                quantity: i.quantity,
                price: foundCake.price,
                cakeName: foundCake.name,
            };
        }).filter(Boolean);
        const order = new orderModel_1.default({
            user: userId,
            address: userAddress,
            items: mappedItems,
            totalPrice,
            decoration: decoration || "",
            paymentMethod,
            status: "pending",
        });
        const savedOrder = yield order.save();
        console.log("✅ Order Saved Successfully:", savedOrder);
        const orderIdStr = savedOrder._id.toString();
        yield (0, exports.sendOrderConfirmationEmail)(user.email, orderIdStr, totalPrice, mappedItems, userAddress.fullName, user.firstName, "https://example.com");
        yield cartModel_1.default.deleteOne({ user: userId });
        res.status(201).json(savedOrder);
    }
    catch (error) {
        console.error("❌ Error placing order:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Failed to place order due to an unknown error" });
        }
    }
});
exports.placeOrder = placeOrder;
const sendOrderConfirmationEmail = (customerEmail, orderId, totalPrice, orderItems, deliveryAddress, customerName, shopUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: `Order Confirmation - Order #${orderId}`,
            html: `
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f9;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      background-color: #5a3827;
      padding: 10px;
      border-radius: 8px;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .order-details {
      margin-top: 20px;
      font-size: 16px;
      color: #333333;
    }
    .order-details p {
      margin: 5px 0;
    }
    .order-items {
      margin-top: 20px;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .order-items table {
      width: 100%;
      border-collapse: collapse;
    }
    .order-items th, .order-items td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .order-items th {
      background-color: #f4f4f9;
    }
    .total-price {
      margin-top: 20px;
      font-size: 18px;
      font-weight: bold;
      color: #5a3827;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 14px;
      color: #777777;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
  <title>Order Confirmation</title>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
    </div>

    <div class="order-details">
      <p>Hi <strong>${customerName}</strong>,</p>
      <p>Thank you for your order! We're excited to let you know that your order <strong>#${orderId}</strong> has been successfully placed.</p>
      <p><strong>Order Status:</strong> Pending</p>
      <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
    </div>

    <div class="order-items">
      <h3>Order Details</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderItems
                .map((item) => `
              <tr>
                <td>${item.cakeName}</td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
              </tr>`)
                .join("")}
        </tbody>
      </table>
    </div>

    <div class="total-price">
      <p>Total Price: $${totalPrice.toFixed(2)}</p>
    </div>

    <div class="footer">
      <p>We will notify you when your order is confirmed and on its way.</p>
      <p>If you have any questions, feel free to contact us.</p>
      <p>Thank you for shopping with us!</p>
      <p><a href="${shopUrl}" style="color: #5a3827; text-decoration: none;">Visit our shop</a></p>
    </div>
  </div>
</body>
</html>
      `,
        };
        yield transporter.sendMail(mailOptions);
        console.log(`Order confirmation email sent to ${customerEmail}`);
    }
    catch (error) {
        console.error("Error sending order confirmation email:", error);
    }
});
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔍 Fetching all orders...");
        const orders = yield orderModel_1.default.find()
            .populate("user", "firstName lastName email")
            .populate({
            path: "items.cake",
            select: "name price image",
            strictPopulate: false,
        });
        console.log("✅ Orders retrieved:", JSON.stringify(orders, null, 2));
        res.status(200).json(orders);
    }
    catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).json({
            error: "Failed to fetch orders",
            details: err.message,
        });
    }
});
exports.getAllOrders = getAllOrders;
const saveDraftOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId, cakeId, quantity } = req.body;
    if (!userId || !cakeId || !quantity) {
        res
            .status(400)
            .json({ error: "User ID, Cake ID, and quantity are required" });
        return;
    }
    try {
        const order = new orderModel_1.default({
            user: userId,
            cake: cakeId,
            quantity,
            status: "draft",
            imagePath: ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || null,
        });
        const savedOrder = yield order.save();
        res.status(201).json(savedOrder);
    }
    catch (err) {
        console.error("Error saving draft order:", err);
        res.status(500).json({ error: "Failed to save draft order" });
    }
});
exports.saveDraftOrder = saveDraftOrder;
const duplicateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.body;
    try {
        const originalOrder = yield orderModel_1.default.findById(orderId);
        if (!originalOrder) {
            res.status(404).json({ error: "Original order not found" });
            return;
        }
        const _a = originalOrder.toObject(), { _id, createdAt, updatedAt } = _a, orderData = __rest(_a, ["_id", "createdAt", "updatedAt"]);
        const duplicatedOrder = new orderModel_1.default(Object.assign(Object.assign({}, orderData), { createdAt: new Date(), updatedAt: new Date() }));
        const savedOrder = yield duplicatedOrder.save();
        res.status(201).json(savedOrder);
    }
    catch (err) {
        console.error("Error duplicating order:", err);
        res.status(500).json({ error: "Failed to duplicate order" });
    }
});
exports.duplicateOrder = duplicateOrder;
const applyDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, discountCode } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
        res.status(400).json({ error: "Invalid order ID format" });
        return;
    }
    try {
        const validCode = yield discountCodeModel_1.default.findOne({
            code: discountCode,
            isActive: true,
        });
        if (!validCode) {
            res.status(400).json({ error: "Invalid or expired discount code" });
            return;
        }
        const order = yield orderModel_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        order.totalPrice *= 1 - validCode.discountPercentage / 100;
        yield order.save();
        res.status(200).json(order);
    }
    catch (err) {
        console.error("Failed to apply discount code:", err);
        res.status(500).json({ error: "Failed to apply discount code" });
    }
});
exports.applyDiscountCode = applyDiscountCode;
const checkDeliveryDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.body;
    if (!date) {
        res.status(400).json({ error: "Date is required" });
        return;
    }
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const ordersOnDate = yield orderModel_1.default.countDocuments({
            deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        });
        const maxOrdersPerDay = 10;
        res.status(200).json({ available: ordersOnDate < maxOrdersPerDay });
    }
    catch (err) {
        console.error("Failed to check delivery date:", err);
        res.status(500).json({ error: "Failed to check delivery date" });
    }
});
exports.checkDeliveryDate = checkDeliveryDate;
const validateOrderInput = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, cakeId, quantity } = req.body;
    if (!userId || !cakeId || !quantity) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    if (quantity <= 0) {
        res.status(400).json({ error: "Quantity must be greater than zero" });
        return;
    }
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId) ||
            !mongoose_1.default.Types.ObjectId.isValid(cakeId)) {
            res.status(400).json({ error: "Invalid ID format" });
            return;
        }
        const userExists = yield userModel_1.default.exists({ _id: userId });
        const cakeExists = yield cakeModel_1.default.exists({ _id: cakeId });
        if (!userExists) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (!cakeExists) {
            res.status(404).json({ error: "Cake not found" });
            return;
        }
        res.status(200).json({ valid: true });
    }
    catch (err) {
        console.error("Validation error:", err);
        res.status(500).json({ error: "Failed to validate order" });
    }
});
exports.validateOrderInput = validateOrderInput;
const getDecorations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decorations = [
            "Sprinkles",
            "Chocolates",
            "Fondant",
            "Fruit Slices",
            "Icing Roses",
        ];
        res.status(200).json(decorations);
    }
    catch (error) {
        console.error("Error fetching decorations:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getDecorations = getDecorations;
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        if (!["draft", "pending", "confirmed", "delivered"].includes(status)) {
            res.status(400).json({ error: "Invalid status value" });
            return;
        }
        const order = yield orderModel_1.default.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.json({ message: "Order status updated successfully", order });
    }
    catch (error) {
        console.error("❌ Error updating order:", error);
        res.status(500).json({ error: "Failed to update order status" });
    }
});
exports.updateOrderStatus = updateOrderStatus;
const deleteOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ error: "Invalid order ID" });
            return;
        }
        const order = yield orderModel_1.default.findByIdAndDelete(orderId);
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.status(200).json({
            message: "Order deleted successfully",
            deletedOrderId: order._id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting order:", error);
        res.status(500).json({ error: "Failed to delete order" });
    }
});
exports.deleteOrder = deleteOrder;
const sendOrderUpdateEmailHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const { customerEmail, orderStatus, managerMessage, hasMsg } = req.body;
        console.log("Received request body:", req.body);
        if (!customerEmail || !orderStatus) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("Email credentials are missing in .env file");
        }
        const transporter = nodemailer_1.default.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            secure: true,
        });
        const statusMessages = {
            pending: "Your order has been received and is awaiting confirmation.",
            confirmed: "Your order has been confirmed and is being prepared.",
            delivered: "Your order has been successfully delivered!",
            cancelled: "Unfortunately, your order has been cancelled.",
        };
        let emailContent = `
      <h2>Order Update</h2>
      <p>Hello,</p>
      <p>Your order <strong>#${orderId.slice(-6)}</strong> has been updated to: <strong>${orderStatus}</strong>.</p>
      <p>${statusMessages[orderStatus]}</p>
    `;
        if (hasMsg && managerMessage) {
            emailContent += `
        <p><strong>Message from the manager:</strong></p>
        <blockquote>${managerMessage}</blockquote>
      `;
        }
        emailContent += `<p>Thank you for ordering with us!</p>`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: `Order #${orderId.slice(-6)} Status Update`,
            html: emailContent,
        };
        yield transporter.sendMail(mailOptions);
        console.log(`[INFO] Order update email sent to: ${customerEmail}`);
        res.status(200).json({ success: true, message: "Email sent successfully!" });
        return;
    }
    catch (error) {
        console.error(`[ERROR] Failed to send email: ${error.message}`);
        res.status(500).json({ success: false, message: "Failed to send email." });
        return;
    }
});
exports.sendOrderUpdateEmailHandler = sendOrderUpdateEmailHandler;
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }
        const order = yield orderModel_1.default.findById(orderId)
            .populate("user", "firstName lastName email")
            .populate({
            path: "items.cake",
            select: "name image"
        })
            .populate("address");
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.json(order);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("❌ Error fetching order:", error);
            res.status(500).json({ error: "Failed to fetch order", details: error.message });
        }
        else {
            res.status(500).json({ error: "Unknown error occurred" });
        }
    }
});
exports.getOrderById = getOrderById;
const getUserOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ error: "Invalid User ID format" });
            return;
        }
        const orders = yield orderModel_1.default.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate("user", "firstName lastName email")
            .populate({
            path: "items.cake",
            select: "name image price",
        })
            .populate({
            path: "address",
            select: "fullName phone street city zipCode country",
        });
        if (!orders || orders.length === 0) {
            res.status(200).json([]);
            return;
        }
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("❌ Error fetching user orders:", error);
        const errorMessage = error instanceof mongoose_1.default.Error.ValidationError
            ? "Validation error while fetching orders."
            : "Failed to fetch user orders.";
        res.status(500).json({ error: errorMessage });
    }
});
exports.getUserOrders = getUserOrders;
//# sourceMappingURL=ordersController.js.map