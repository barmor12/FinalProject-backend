// controllers/userController.ts
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import User from "../models/userModel"; // נניח שיש לך מודל של יוזר

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
