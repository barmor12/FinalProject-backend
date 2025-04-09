// controllers/userController.ts
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import User from "../models/userModel"; // נניח שיש לך מודל של יוזר

// ודא שיש לך את המשתנים המתאימים בסביבת ההרצה: EMAIL_USER, EMAIL_PASSWORD, REVIEW_URL (קישור לטופס ביקורת)
export const sendReviewEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        // קבלת נתונים מהבקשה
        console.log("Sending review Email....");
        const { customerEmail, orderId } = req.body;
        if (!customerEmail || !orderId) {
            res.status(400).json({ error: "Missing required fields: customerEmail and orderId" });
            return;
        }

        // יצירת טרנספורטור לשליחת המייל
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,        // כתובת המייל המגדירה את השליחה
                pass: process.env.EMAIL_PASSWORD,      // הסיסמה של חשבון המייל
            },
            secure: true,
        });

        // יצירת תוכן המייל – ניתן לשנות את העיצוב והתוכן כרצונך
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

        // שליחת המייל
        await transporter.sendMail(mailOptions);
        console.log(`✅ Review email sent to ${customerEmail}`);
        res.status(200).json({ success: true, message: "Review email sent successfully!" });
    } catch (error) {
        console.error("❌ Error sending review email:", error);
        res.status(500).json({ error: "Failed to send review email." });
    }
};




export const sendEmailToUser = async (req: Request, res: Response) => {
    const { customerEmail, managerMessage, isManagerMessage } = req.body;

    if (!customerEmail) {
        res.status(400).json({ error: "Missing customer email" });
        return;
    }

    try {
        // הגדרת טרנספורטר עם מייל אמיתי או סנדבוקס
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: "Message from Admin",
            text: isManagerMessage ? managerMessage : "Your order was updated",
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
        return;
    } catch (err: any) {
        console.error("Error sending email:", err);
        res.status(500).json({ error: "Failed to send email" });
        return;
    }
};

export const deleteUserWithEmail = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log("first");
    try {
        const user = await User.findById(id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // שמירת האימייל לפני המחיקה
        const userEmail = user.email;
        const userFullName = `${user.firstName} ${user.lastName}`;

        // מחיקת המשתמש בפועל
        await User.findByIdAndDelete(id);

        // שליחת מייל לאחר המחיקה
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Account Deletion Notice",
            text: `Hi ${userFullName},\n\nYour account has been deleted from our system.\nIf you think this was a mistake, please contact support.\n\nBest regards,\nAdmin Team`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "User deleted and email sent" });
        return;
    } catch (err: any) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "Failed to delete user" });
        return;
    }
};
