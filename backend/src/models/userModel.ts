import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  profilePic: { type: String },
  refresh_tokens: [String],
}, { timestamps: true });  // הוספתי את timestamps כדי שיהיה לך תיעוד של תאריכי יצירה ועדכון

export default mongoose.model("User", userSchema);
