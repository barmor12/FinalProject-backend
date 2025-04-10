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
exports.deleteUserWithEmail = exports.sendEmailToUser = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const userModel_1 = __importDefault(require("../models/userModel"));
const sendEmailToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerEmail, managerMessage, isManagerMessage } = req.body;
    if (!customerEmail) {
        res.status(400).json({ error: "Missing customer email" });
        return;
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
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
        yield transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
        return;
    }
    catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ error: "Failed to send email" });
        return;
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
        const transporter = nodemailer_1.default.createTransport({
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
        yield transporter.sendMail(mailOptions);
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