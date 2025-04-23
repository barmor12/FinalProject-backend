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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserWithEmail = exports.sendEmailToUser = exports.sendReviewEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const userModel_1 = __importDefault(require("../models/userModel"));
const sendReviewEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Sending review Email....");
        const { customerEmail, orderId } = req.body;
        if (!customerEmail || !orderId) {
            res.status(400).json({ error: "Missing required fields: customerEmail and orderId" });
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            secure: true,
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: `We'd love your review for Order #${orderId.slice(-6)}`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Leave a Review</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f9;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                color: #6b4226;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                background-color: #6b4226;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="header">Thank you for your order!</h2>
              <p>Your order <strong>#${orderId.slice(-6)}</strong> has been delivered.</p>
              <p>We would love to hear your feedback. Please click the button below to leave a review:</p>
              <a class="button" href="${process.env.REVIEW_URL || 'https://example.com/review'}">Leave a Review</a>
              <p>Thank you for shopping with us!</p>
            </div>
          </body>
        </html>
      `,
        };
        yield transporter.sendMail(mailOptions);
        console.log(`✅ Review email sent to ${customerEmail}`);
        res.status(200).json({ success: true, message: "Review email sent successfully!" });
    }
    catch (error) {
        console.error("❌ Error sending review email:", error);
        res.status(500).json({ error: "Failed to send review email." });
    }
});
exports.sendReviewEmail = sendReviewEmail;
const sendEmailToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerEmail, managerMessage } = req.body;
    if (!customerEmail || !(managerMessage === null || managerMessage === void 0 ? void 0 : managerMessage.trim())) {
        res.status(400).json({ error: "Missing email or message content" });
        return;
    }
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
            subject: "📬 Message from Admin",
            text: managerMessage,
            html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #6b4226; margin-bottom: 20px;">Message from Admin</h2>
              <p style="font-size: 16px; color: #333;">${managerMessage.replace(/\n/g, "<br>")}</p>
              <hr style="margin: 30px 0;" />
              <p style="font-size: 14px; color: #888;">This message was sent to you by the admin team.</p>
            </div>
          </div>
        `,
        };
        yield transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
    }
    catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ error: "Failed to send email" });
    }
});
exports.sendEmailToUser = sendEmailToUser;
const deleteUserWithEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log("first");
    try {
        const user = yield userModel_1.default.findById(id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const userEmail = user.email;
        const userFullName = `${user.firstName} ${user.lastName}`;
        yield userModel_1.default.findByIdAndDelete(id);
        console.log("user deleted");
        console.log("Email credentials:", process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
        const transporter = nodemailer_1.default.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "🗑️ Your Account Has Been Deleted",
            text: `Hi ${userFullName}, your account was deleted.`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <h2 style="color: #d9534f;">Account Deletion Notice</h2>
                  <p>Hi <strong>${userFullName}</strong>,</p>
                  <p>We want to inform you that your account has been <strong>deleted</strong> from our system.</p>
                  <p>If you believe this was done in error or have any questions, feel free to contact our support team.</p>
                  <br/>
                  <p style="color: #6b4226;">Best regards,<br/>Admin Team</p>
                </div>
              </div>
            `,
        };
        yield transporter.sendMail(mailOptions);
        console.log("User deleted and email sent");
        res.status(200).json({ message: "User deleted and email sent" });
        return;
    }
    catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "Failed to delete user" });
        return;
    }
});
exports.deleteUserWithEmail = deleteUserWithEmail;
//# sourceMappingURL=emailController.js.map