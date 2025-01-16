import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",  // הפניה למודל משתמש
        required: true 
      },
      cake: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Cake",  // הפניה למודל עוגה
        required: true 
      },
      quantity: { type: Number, required: true },  // כמות העוגות שהוזמנו
      totalPrice: { type: Number, required: true },  // המחיר הכולל של ההזמנה
      orderDate: { type: Date, default: Date.now },  // תאריך ההזמנה
    },
    { timestamps: true }  // מאפשר תיעוד של תאריך יצירה ועדכון
  );
  

export default mongoose.model('Order', orderSchema);
