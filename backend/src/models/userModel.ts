import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePic: {
      url: { type: String }, // הקישור הישיר לתמונה ב-Cloudinary
      public_id: { type: String }, // מזהה התמונה לניהול עתידי
    },
    role: { type: String, default: "user" },
    googleId: { type: String },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cake" }],
    refresh_tokens: [String],
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String },
    resetExpires: { type: Date },


    // 🔥 מחליפים כתובת ומספר טלפון בהפנייה לסכמת Address
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],

    // 2FA related fields
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorCode: { type: String },
    twoFactorExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
