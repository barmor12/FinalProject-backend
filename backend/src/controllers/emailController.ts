// controllers/userController.ts
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import User from "../models/userModel"; // נניח שיש לך מודל של יוזר

export const sendEmailToUser = async (req: Request, res: Response) => {
    const { customerEmail, managerMessage } = req.body;

    if (!customerEmail || !managerMessage?.trim()) {
        res.status(400).json({ error: "Missing email or message content" });
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
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
            text: managerMessage, // גרסה פשוטה לגיבוי
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

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (err: any) {
        console.error("Error sending email:", err);
        res.status(500).json({ error: "Failed to send email" });
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
        console.log("user deleted");
        console.log("Email credentials:", process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);

        // שליחת מייל לאחר המחיקה
        const transporter = nodemailer.createTransport({
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
            text: `Hi ${userFullName}, your account was deleted.`, // רק לגיבוי
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


        await transporter.sendMail(mailOptions);
        console.log("User deleted and email sent");
        res.status(200).json({ message: "User deleted and email sent" });
        return;
    } catch (err: any) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "Failed to delete user" });
        return;
    }
};
