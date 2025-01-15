import mongoose from "mongoose";

// הגדרת המודל של המתכון
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },  // שם המתכון
  description: { type: String, required: true },  // תיאור קצר על המתכון
  ingredients: { type: [String], required: true },  // רשימת מרכיבים
  instructions: { type: [String], required: true },  // הוראות הכנה
  image: { type: String },  // תמונה (קישור לתמונה)
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",  // הפניה למודל משתמש
    required: true 
  },
}, { timestamps: true });  // הוספתי את timestamps כדי שיהיה לך תיעוד של תאריכי יצירה ועדכון

export default mongoose.model("Recipe", recipeSchema);
