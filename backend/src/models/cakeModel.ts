import mongoose from 'mongoose';

const cakeSchema = new mongoose.Schema({
  name: { type: String, required: true },  // שם העוגה
  description: { type: String, required: true },  // תיאור העוגה
  price: { type: Number, required: true },  // מחיר העוגה
  image: {
    url: String,
    public_id: String
  },
  ingredients: { type: [String], required: true },  // רשימת מרכיבים
  stock: { type: Number, default: 0 }, // שדה למלאי
  createdAt: { type: Date, default: Date.now },  // תאריך יצירה
  updatedAt: { type: Date, default: Date.now },  // תאריך עדכון
});

export default mongoose.model('Cake', cakeSchema);