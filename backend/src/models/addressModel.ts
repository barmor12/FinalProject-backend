import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true }, // שם מלא עבור המשלוח
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    isDefault: { type: Boolean, default: false }, // כתובת ברירת מחדל
}, { timestamps: true });

const Address = mongoose.model("Address", addressSchema);
export default Address;
