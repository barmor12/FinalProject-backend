// controllers/userController.ts
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import User from '../models/userModel'; // נניח שיש לך מודל של יוזר

// ודא שיש לך את המשתנים המתאימים בסביבת ההרצה: EMAIL_USER, EMAIL_PASSWORD, REVIEW_URL (קישור לטופס ביקורת)
export const sendReviewEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // קבלת נתונים מהבקשה
    console.log('Sending review Email....');
    const { customerEmail, orderId } = req.body;
    if (!customerEmail || !orderId) {
      res
        .status(400)
        .json({ error: 'Missing required fields: customerEmail and orderId' });
      return;
    }

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

    // יצירת תוכן המייל – ניתן לשנות את העיצוב והתוכן כרצונך
    const mailOptions = {
      from: `"Bakey" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order #${orderId.slice(-6)} Delivered – We're Here for You`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>We're Here to Help</title>
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
                text-align: center;
              }
              .header {
                color: #6b4226;
                margin-bottom: 20px;
              }
              .order-info {
                font-size: 16px;
                color: #333;
                margin-bottom: 24px;
              }
              .whatsapp-button {
                display: inline-block;
                background-color: #25D366;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="header">Thank you for your order!</h2>
              <p class="order-info">Your order <strong>#${orderId.slice(-6)}</strong> has been delivered.</p>
              <p>If you have any questions or need assistance, feel free to contact us directly on WhatsApp:</p>
              <a class="whatsapp-button" href="https://wa.me/972509667461" target="_blank">Contact Us on WhatsApp</a>
              <p style="margin-top: 24px;">We're always here for you.<br>Bakey Team</p>
            </div>
          </body>
        </html>
      `,
    };

    // שליחת המייל
    await transporter.sendMail(mailOptions);
    console.log(`✅ Review email sent to ${customerEmail}`);
    res
      .status(200)
      .json({ success: true, message: 'Review email sent successfully!' });
  } catch (error) {
    console.error('❌ Error sending review email:', error);
    res.status(500).json({ error: 'Failed to send review email.' });
  }
};

export const sendEmailToUser = async (req: Request, res: Response) => {
  const { customerEmail, managerMessage } = req.body;

  if (!customerEmail || !managerMessage?.trim()) {
    res.status(400).json({ error: 'Missing email or message content' });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: `"Bakey" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: '📬 Message from Admin',
      text: managerMessage, // גרסה פשוטה לגיבוי
      html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #6b4226; margin-bottom: 20px;">Message from Admin</h2>
              <p style="font-size: 16px; color: #333;">${managerMessage.replace(
        /\n/g,
        '<br>'
      )}</p>
              <hr style="margin: 30px 0;" />
              <p style="font-size: 14px; color: #888;">This message was sent to you by the admin team.</p>
            </div>
          </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err: any) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

export const deleteUserWithEmail = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('first');
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // שמירת האימייל לפני המחיקה
    const userEmail = user.email;
    const userFullName = `${user.firstName} ${user.lastName}`;

    // מחיקת המשתמש בפועל
    await User.findByIdAndDelete(id);
    console.log('user deleted');
    console.log(
      'Email credentials:',
      process.env.EMAIL_USER,
      process.env.EMAIL_PASSWORD
    );

    // שליחת מייל לאחר המחיקה
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Bakey" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🗑️ Your Account Has Been Deleted',
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
    console.log('User deleted and email sent');
    res.status(200).json({ message: 'User deleted and email sent' });
    return;
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
    return;
  }
};
