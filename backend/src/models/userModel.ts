import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profilePic: { type: String },
  role: { type: String, default: "user" }, // ניתן להוסיף פרופרטי של "role"
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cake" }], // עוגות מועדפות
  refresh_tokens: [String],
}, { timestamps: true });

export default mongoose.model("User", userSchema);