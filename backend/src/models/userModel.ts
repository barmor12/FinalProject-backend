import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePic: { type: String },
    role: { type: String, default: "user" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cake" }],
    refresh_tokens: [String],
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String },
    resetExpires: { type: Date },

    // 🔥 מחליפים כתובת ומספר טלפון בהפנייה לסכמת Address
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
