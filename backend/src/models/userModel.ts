import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePic: { type: String },
    phone: { type: String },
    address: { type: String },
    role: { type: String, default: "user" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cake" }],
    refresh_tokens: [String],
    isVerified: { type: Boolean, default: false }, // שדה לאימות דוא"ל
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
