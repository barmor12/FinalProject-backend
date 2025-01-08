import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  profilePic: { type: String },
  refresh_tokens: [String],
  User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("User", userSchema);
