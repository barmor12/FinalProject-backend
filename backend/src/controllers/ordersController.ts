import { Request, Response } from 'express';
import Order from '../models/orderModel';
import Cake from '../models/cakeModel';
import User from '../models/userModel';
import DiscountCode from '../models/discountCodeModel';
import mongoose from 'mongoose';
import Cart from '../models/cartModel';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import Address from '../models/addressModel';
import jwt, { JwtPayload } from 'jsonwebtoken';
import NotificationToken from '../models/notificationToken';
import { sendOrderStatusChangeNotification } from './notificationController';
import { notifyAdminOfNewOrder } from '../controllers/notificationController';
// --- Utility: Send email with attachments ---
export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email credentials are missing in .env file');
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions: any = {
    from: `"Bakey" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }
  await transporter.sendMail(mailOptions);
}

// --- Utility: Generate PDF receipt for order ---
export function generateReceiptPDF(order: any) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  let buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => { });

  // Header
  doc.fontSize(24).fillColor('#5A3827').text('Bakey - Payment Receipt', {
    align: 'center',
    underline: true,
  });
  doc.moveDown();

  doc.fontSize(14).fillColor('#333333');
  doc.text(`Order ID: ${order._id}`);
  doc.text(`Status: ${order.status}`);
  doc.text(`Payment Method: ${order.paymentMethod}`);
  doc.text(`Total: $${order.totalPrice.toFixed(2)}`);
  doc.moveDown(1.5);

  // Items Header
  doc.fontSize(16).fillColor('#5A3827').text('Order Summary:', { underline: true });
  doc.moveDown(0.5);

  // Items List
  if (Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      const cakeName =
        (item.cake && typeof item.cake === 'object' && 'name' in item.cake)
          ? item.cake.name
          : item.cakeName || 'Cake';
      const line = `${cakeName} x${item.quantity}`;
      const price = `$${(item.price * item.quantity).toFixed(2)}`;

      doc
        .fontSize(12)
        .fillColor('#000000')
        .text(line, { continued: true })
        .text(` - ${price}`, { align: 'right' });
    });
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(11).fillColor('#555555').text(
    'Thank you for choosing Bakey! We appreciate your order and hope you enjoy your cake.',
    { align: 'center' }
  );

  doc.end();

  const pdfPromise: Promise<Buffer> = new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });

  return {
    filename: `receipt_order_${order._id}.pdf`,
    content: pdfPromise,
    contentType: 'application/pdf',
  };
}

// Helper function to get push token for user
async function getPushTokenForUser(userId: string) {
  const tokenDoc = await NotificationToken.findOne({ userId });
  return tokenDoc ? tokenDoc.token : null;
}
export const placeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { items, paymentMethod, address, deliveryDate } = req.body;

    // Get userId from the authenticated user
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Authorization token is required' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;
    const userId = decoded.userId;


    if (
      !userId ||
      !items ||
      items.length === 0 ||
      (req.body.shippingMethod === 'Standard Delivery (2-3 days)' && !address)
    ) {
      console.error('❌ Error: Missing required fields.');
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }


    const deliveryDateTime = deliveryDate ? new Date(deliveryDate) : null;

    if (req.body.shippingMethod === 'Standard Delivery (2-3 days)') {
      if (!deliveryDateTime || deliveryDateTime <= new Date()) {
        console.error('❌ Error: Delivery date must be in the future');
        res.status(400).json({ error: 'Delivery date must be in the future' });
        return;
      }
    }

    // ✅ בדיקה: האם המשתמש קיים?
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Error: User not found:', userId);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // ✅ בדיקה: האם הכתובת קיימת ומשויכת לאותו משתמש? (רק אם address קיים)
    let userAddress = null;
    if (address) {
      userAddress = await Address.findById(address);
      if (!userAddress || userAddress.userId.toString() !== userId) {
        console.error(
          '❌ Error: Address not found or doesn\'t belong to user:',
          address
        );
        res
          .status(404)
          .json({ error: 'Address not found or does not belong to user' });
        return;
      }
    }

    // ✅ בדיקה: האם כל העוגות קיימות?
    const cakeIds = items.map((i: any) => i.cakeId);
    const cakes = await Cake.find({ _id: { $in: cakeIds } });

    if (cakes.length !== items.length) {
      console.error('❌ Error: One or more cakes not found.', {
        expected: items.length,
        found: cakes.length,
      });
      res.status(404).json({ error: 'One or more cakes not found' });
      return;
    }

    // ✅ בדיקה: אין הזמנה מעבר למלאי הקיים
    for (const item of items) {
      const cake = cakes.find((c) => c._id.toString() === item.cakeId);
      if (!cake) continue;
      if (cake.stock < item.quantity) {
        res.status(400).json({
          error: `Only ${cake.stock} units available for ${cake.name}`,
        });
        return;
      }
    }

    // ✅ חישוב מחיר כולל ורווח
    let totalPrice = 0;
    let totalRevenue = 0;
    const mappedItems = items
      .map((i: any) => {
        const foundCake = cakes.find((c) => c._id.toString() === i.cakeId);
        if (!foundCake) return null;

        const itemPrice = foundCake.price * i.quantity;
        const itemCost = foundCake.cost * i.quantity;
        const itemRevenue = itemPrice - itemCost;

        totalPrice += itemPrice;
        totalRevenue += itemRevenue;

        totalPrice = parseFloat(totalPrice.toFixed(2));
        totalRevenue = parseFloat(totalRevenue.toFixed(2));

        // ✅ הפחתת מלאי בפועל
        if (foundCake.stock !== undefined) {
          foundCake.stock -= i.quantity;
          if (foundCake.stock < 0) foundCake.stock = 0;
          foundCake.save(); // שמירה של המלאי החדש
        }

        return {
          cake: foundCake._id,
          quantity: i.quantity,
          price: foundCake.price,
          cakeName: foundCake.name || 'Cake',
        };
      })
      .filter(Boolean);

    // ✅ יצירת אובייקט הזמנה
    const order = new Order({
      user: userId,
      address: userAddress,
      items: mappedItems,
      totalPrice,
      totalRevenue,
      paymentMethod,
      status: 'pending',
      deliveryDate: deliveryDateTime,
    });

    // ✅ שמירת ההזמנה במסד הנתונים
    const savedOrder = await order.save();
    console.log('✅ Order Saved Successfully:', savedOrder);
    const orderIdStr = savedOrder._id.toString();
    // 🔔 שליחת התראה לאדמין על הזמנה חדשה
    await notifyAdminOfNewOrder(orderIdStr);

    // ✅ שליחת מייל אישור הזמנה (חדש עם תמיכה ב-attachments)
    let attachments: any[] = [];
    if (savedOrder.paymentMethod === 'credit') {
      // generateReceiptPDF returns {filename, content: Promise<Buffer>, contentType}
      const pdfObj = generateReceiptPDF(savedOrder);
      // Wait for the PDF buffer to be ready
      const pdfBuffer = await pdfObj.content;
      attachments = [
        {
          filename: pdfObj.filename,
          content: pdfBuffer,
          contentType: pdfObj.contentType,
        },
      ];
    }
    const orderItemsHtml = items
      .map((item: any) => {
        const cake = cakes.find((c) => c._id.toString() === item.cakeId);
        const cakeName = cake?.name || 'Cake';
        const price = cake?.price || 0;
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${cakeName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${price}</td>
          </tr>
        `;
      })
      .join('');

    const receiptNote =
      savedOrder.paymentMethod === 'cash'
        ? '<p style="color:#5a3827;"><em>You chose to pay with cash. A receipt will be sent after payment is completed.</em></p>'
        : '<p style="color:#5a3827;"><strong>Your payment receipt is attached.</strong></p>';

    await sendEmail({
      to: user.email,
      subject: `Order Confirmation - Order #${savedOrder._id.toString().slice(-6)}`,
      html: `
  <body style="margin:0;padding:0;background-color:#f4f4f9;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 0 8px rgba(0,0,0,0.1);">
    <div style="background-color:#5A3827; padding: 10px; border-radius: 8px; text-align: center;">
      <h2 style="margin: 0; color: white;">Order Confirmation</h2>
    </div>
    <p>Hi <strong>${user.firstName || 'Customer'}</strong>,</p>
    <p>Thank you for your order! We're excited to let you know that your order <strong>#${savedOrder._id.toString().slice(-6)}</strong> has been successfully placed.</p>
    <p><strong>Order Status:</strong> ${savedOrder.status}</p>
    <p><strong>Delivery Address:</strong> ${userAddress ? `${userAddress.fullName}, ${userAddress.street}, ${userAddress.city}` : 'Pickup from store'}</p>

    <h3 style="margin-top:20px;">Order Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f4f4f4;">
          <th style="padding: 8px; border-bottom: 1px solid #ddd;">Item</th>
          <th style="padding: 8px; border-bottom: 1px solid #ddd;">Quantity</th>
          <th style="padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${orderItemsHtml}
      </tbody>
    </table>

    <p style="margin-top: 20px; font-size: 16px;"><strong>Total Price:</strong> $${savedOrder.totalPrice.toFixed(2)}</p>
    ${receiptNote}
    <p style="margin-top: 20px;">We will notify you when your order is confirmed and on its way.</p>
    <div style="margin-top: 20px; text-align: center;">
      <a href="https://wa.me/972509667461" style="background-color: #25D366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
        Contact Us on WhatsApp
      </a>
    </div>
    <p style="margin-top: 20px;">Thank you for shopping with us!</p>
  </div>
  </body>
`,
      attachments,
    });

    // ✅ ניקוי עגלת הקניות של המשתמש
    await Cart.deleteOne({ user: userId });

    res.status(201).json(savedOrder);
  } catch (error: unknown) {
    console.error('❌ Error placing order:', error);

    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: 'Failed to place order due to an unknown error' });
    }
  }
};
export const getOrdersByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query; // date בפורמט YYYY-MM-DD
    if (!date) {
      res
        .status(400)
        .json({ message: 'Date is required in format YYYY-MM-DD' });
      return;
    }

    const orders = await Order.find({
      deliveryDate: date,
    }).populate('user', 'firstName lastName email phone');

    res.json(orders);
    console.log('✅ Orders retrieved:', JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error fetching orders by date:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

interface TokenPayload extends JwtPayload {
  userId: string;
  role: string;
}
export const sendOrderConfirmationEmail = async (
  customerEmail: string,
  orderId: string,
  totalPrice: number,
  orderItems: Array<any>, // פרטי העוגות שהוזמנו
  deliveryAddress: string,
  customerName: string,
  shopUrl: string
): Promise<void> => {
  try {
    // יצירת טרנספורטור לשליחת המייל
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    // יצירת תוכן המייל עם התייחסות לנתונים דינמיים
    const mailOptions = {
      from: `"Bakey" <${process.env.EMAIL_USER}>`,
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
          .map(
            (item: any) => `
                <tr>
                  <td>${item.cakeName || (item.cake && item.cake.name) || 'Cake'}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price}</td>
                </tr>`
          )
          .join('')}
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
      <div style="margin-top: 20px; text-align: center;">
        <a href="https://wa.me/972509667461" style="background-color: #25D366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
          Contact Us on WhatsApp
        </a>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    };

    // שליחת המייל
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const orders = await Order.find()
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'items.cake',
        select: 'name price image',
        strictPopulate: false, // מבטיח שהנתונים יחזרו גם אם cake לא קיים
      });

    console.log('✅ Orders retrieved:', JSON.stringify(orders, null, 2));
    res.status(200).json(orders);
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({
      error: 'Failed to fetch orders',
      details: (err as Error).message,
    });
  }
};
export const saveDraftOrder = async (req: Request, res: Response) => {
  const { userId, cakeId, quantity } = req.body;

  if (!userId || !cakeId || !quantity) {
    res
      .status(400)
      .json({ error: 'User ID, Cake ID, and quantity are required' });
    return;
  }

  try {
    const order = new Order({
      user: userId,
      cake: cakeId,
      quantity,
      status: 'draft',
      imagePath: req.file?.path || null,
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Error saving draft order:', err);
    res.status(500).json({ error: 'Failed to save draft order' });
  }
};

export const duplicateOrder = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const decoded = jwt.verify(
      token as string,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
    const userId = (decoded as any).userId;

    // נדרש שהבקשה תשלח את המערך items עם מבנה: { cakeId: string, quantity: number }
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Invalid items format' });
      return;
    }

    // חיפוש עגלה קיימת למשתמש או יצירת עגלה חדשה
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // הוספת הפריטים לעגלה הקיימת:
    items.forEach((item: { cakeId: string; quantity: number }) => {
      const cakeObjectId = new mongoose.Types.ObjectId(item.cakeId);
      // בדיקה אם הפריט כבר קיים בעגלה
      const existingIndex = cart.items.findIndex(
        (cartItem) => cartItem.cake.toString() === item.cakeId
      );
      if (existingIndex !== -1) {
        // אם קיים – עדכון הכמות (הוספה למה שכבר קיים)
        cart.items[existingIndex].quantity += item.quantity;
      } else {
        // אם לא – הוספת הפריט לעגלה
        cart.items.push({
          cake: cakeObjectId,
          quantity: item.quantity,
        });
      }
    });

    await cart.save();
    res.status(200).json({ message: 'Cart updated', cart });
  } catch (error) {
    console.error('Error in reorderCart:', error);
    res.status(500).json({ error: 'Failed to reorder cart' });
  }
};

export const applyDiscountCode = async (req: Request, res: Response) => {
  const { orderId, discountCode } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400).json({ error: 'Invalid order ID format' });
    return;
  }

  try {
    const validCode = await DiscountCode.findOne({
      code: discountCode,
      isActive: true,
    });

    if (!validCode) {
      res.status(400).json({ error: 'Invalid or expired discount code' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.totalPrice *= 1 - validCode.discountPercentage / 100;
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    console.error('Failed to apply discount code:', err);
    res.status(500).json({ error: 'Failed to apply discount code' });
  }
};

export const checkDeliveryDate = async (req: Request, res: Response) => {
  const { date } = req.body;

  if (!date) {
    res.status(400).json({ error: 'Date is required' });
    return;
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const ordersOnDate = await Order.countDocuments({
      deliveryDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const maxOrdersPerDay = 10;

    res.status(200).json({ available: ordersOnDate < maxOrdersPerDay });
  } catch (err) {
    console.error('Failed to check delivery date:', err);
    res.status(500).json({ error: 'Failed to check delivery date' });
  }
};

export const validateOrderInput = async (req: Request, res: Response) => {
  const { userId, cakeId, quantity } = req.body;

  if (!userId || !cakeId || !quantity) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (quantity <= 0) {
    res.status(400).json({ error: 'Quantity must be greater than zero' });
    return;
  }

  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(cakeId)
    ) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    const userExists = await User.exists({ _id: userId });
    const cakeExists = await Cake.exists({ _id: cakeId });

    if (!userExists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!cakeExists) {
      res.status(404).json({ error: 'Cake not found' });
      return;
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Failed to validate order' });
  }
};
export const getDecorations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const decorations = [
      'Sprinkles',
      'Chocolates',
      'Fondant',
      'Fruit Slices',
      'Icing Roses',
    ]; // רשימה קשיחה לדוגמה
    res.status(200).json(decorations);
  } catch (error) {
    console.error('Error fetching decorations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
// עדכון סטטוס הזמנה
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, shippingMethod, deliveryDate, address } = req.body;

    const updateFields: any = {};
    if (status) {
      if (
        !['draft', 'pending', 'confirmed', 'delivered', 'cancelled'].includes(
          status
        )
      ) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }
      updateFields.status = status;
    }

    if (shippingMethod) updateFields.shippingMethod = shippingMethod;
    if (deliveryDate) updateFields.deliveryDate = new Date(deliveryDate);
    if (address) updateFields.address = address;

    const order = await Order.findByIdAndUpdate(orderId, updateFields, {
      new: true,
    }).populate('user', '_id email firstName lastName phone'); // populate user for token lookup

    // הוספת שליחת התראה אחרי עדכון סטטוס
    if (order && updateFields.status) {
      await sendOrderStatusChangeNotification({
        userId: order.user._id.toString(),
        orderId: order._id.toString(),
        newStatus: order.status,
      });
    }

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// מחיקת הזמנה
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    // מצא את ההזמנה עם פרטי העוגות
    const order = await Order.findById(orderId).populate('items.cake');

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // החזר מלאי לכל עוגה
    for (const item of order.items) {
      const cake = item.cake as any;
      if (cake && cake._id && typeof item.quantity === 'number') {
        await Cake.findByIdAndUpdate(cake._id, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // מחק את ההזמנה
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      message: 'Order deleted successfully and stock updated',
      deletedOrderId: order._id,
    });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
export const sendOrderUpdateEmailHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId } = req.params;
    const { customerEmail, orderStatus, managerMessage, hasMsg } = req.body;

    console.log('Received request body:', req.body);

    if (!customerEmail || !orderStatus) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials are missing in .env file');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const statusMessages: Record<string, string> = {
      pending: 'Your order has been received and is awaiting confirmation.',
      confirmed: 'Your order has been confirmed and is being prepared.',
      delivered: 'Your order has been successfully delivered!',
      cancelled: 'Unfortunately, your order has been cancelled.',
    };

    let emailContent = `
      <h2>Order Update</h2>
      <p>Hello,</p>
      <p>Your order <strong>#${orderId.slice(
      -6
    )}</strong> has been updated to: <strong>${orderStatus}</strong>.</p>
      <p>${statusMessages[orderStatus]}</p>
    `;

    // אם יש הודעת מנהל, נוסיף אותה
    if (hasMsg && managerMessage) {
      emailContent += `
        <p><strong>Message from the manager:</strong></p>
        <blockquote>${managerMessage}</blockquote>
      `;
    }

    emailContent += '<p>Thank you for ordering with us!</p>';

    const mailOptions = {
      from: `"Bakey" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order #${orderId.slice(-6)} Status Update`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[INFO] Order update email sent to: ${customerEmail}`);

    res
      .status(200)
      .json({ success: true, message: 'Email sent successfully!' });
    return;
  } catch (error: any) {
    console.error(`[ERROR] Failed to send email: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
    return;
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // בדיקה אם ה-ID תקין
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    // חיפוש ההזמנה במסד הנתונים
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'items.cake',
        select: 'name image',
      })
      .populate('address');

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error fetching order:', error);
      res
        .status(500)
        .json({ error: 'Failed to fetch order', details: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};
export const getUserOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // ✅ בדיקה אם יש userId
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // ✅ בדיקה אם ה-userId תקין כ-ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid User ID format' });
      return;
    }

    // ✅ שליפת כל ההזמנות של המשתמש
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) // מההזמנה האחרונה לישנה ביותר
      .populate('user', 'firstName lastName email phone') // טוען מידע בסיסי על המשתמש
      .populate({
        path: 'items.cake',
        select: 'name image price', // שליפת שם, תמונה ומחיר של העוגה
      })
      .populate({
        path: 'address',
        select: 'fullName phone street city zipCode country', // ✅ שליפת הכתובת מהמודל
      });

    // ✅ מחזיר מערך ריק במקום שגיאת 404 אם אין הזמנות
    if (!orders || orders.length === 0) {
      res.status(200).json([]); // שינוי מ-404 ל-200 עם מערך ריק
      return;
    }

    res.status(200).json(orders);
  } catch (error: any) {
    console.error('❌ Error fetching user orders:', error);

    // ✅ בדיקת השגיאה ושמירה על רמות אבטחה
    const errorMessage =
      error instanceof mongoose.Error.ValidationError
        ? 'Validation error while fetching orders.'
        : 'Failed to fetch user orders.';

    res.status(500).json({ error: errorMessage });
  }
};

export const getOrdersByMonth = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query; // month should be 1-12, year should be YYYY
    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' });
      return;
    }

    // Convert month and year to numbers
    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);

    // Validate month and year
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res
        .status(400)
        .json({ message: 'Invalid month. Must be between 1 and 12' });
      return;
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      res.status(400).json({ message: 'Invalid year' });
      return;
    }

    // Create start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
    const endDate = new Date(yearNum, monthNum, 0); // Last day of month

    // Find all orders in the specified month
    const orders = await Order.find({
      deliveryDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'items.cake',
        select: 'name price image',
      })
      .populate('address');

    console.log(
      '✅ Orders retrieved for month:',
      JSON.stringify(orders, null, 2)
    );
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by month:', error);
    res.status(500).json({ message: 'Server error' });
  }
};