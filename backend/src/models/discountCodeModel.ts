import mongoose from "mongoose";

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // קוד הנחה חייב להיות ייחודי
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // ההנחה חייבת להיות בין 0% ל-100%
    },
    isActive: {
      type: Boolean,
      default: true, // ברירת המחדל: קוד הנחה פעיל
    },
    expiryDate: {
      type: Date,
      required: false, // תאריך תפוגה (אופציונלי)
    },
  },
  { timestamps: true } // יצירת חותמות זמן ליצירה ועדכון
);

discountCodeSchema.methods.isValid = function () {
  // בדיקה אם הקוד פעיל ולא פג תוקף
  if (!this.isActive) return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return true;
};

export default mongoose.model("DiscountCode", discountCodeSchema);
