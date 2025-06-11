import axios from "axios";

export const sendOrderStatusChangeNotification = async (
  token: string,
  orderId: string,
  status: string
) => {
  try {
    const messages: Record<string, string> = {
      pending: "ההזמנה שלך ממתינה לאישור",
      confirmed: "ההזמנה שלך אושרה!",
      delivered: "ההזמנה שלך סופקה",
      cancelled: "ההזמנה שלך בוטלה",
    };

    const body = {
      to: token,
      sound: "default",
      title: "עדכון הזמנה",
      body: messages[status] || `הסטטוס עודכן ל: ${status}`,
      data: { orderId, status },
    };

    await axios.post("https://exp.host/--/api/v2/push/send", body, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ נשלחה התראה למשתמש עם טוקן:", token);
  } catch (error) {
    console.error("❌ שגיאה בשליחת פוש:", error);
  }
};
