import mongoose from 'mongoose';

const cakeSchema = new mongoose.Schema({
  name: { type: String, required: true },  // שם העוגה
  description: { type: String, required: true },  // תיאור העוגה
  price: { type: Number, required: true },  // מחיר העוגה
  image: { type: String },  // תמונה של העוגה (לינק)
  ingredients: { type: [String], required: true },  // רשימת מרכיבים
  createdAt: { type: Date, default: Date.now },  // תאריך יצירה
  updatedAt: { type: Date, default: Date.now },  // תאריך עדכון
});

export default mongoose.model('Cake', cakeSchema);
