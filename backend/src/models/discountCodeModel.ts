import mongoose, { Document } from 'mongoose';

// ✅ ממשק עם הפונקציה isValid
export interface IDiscountCode extends Document {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  expiryDate?: Date;
  isValid(): boolean; // ✅ כאן הסוד
}

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ✅ מתודה מותאמת אישית
discountCodeSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return true;
};

export default mongoose.model<IDiscountCode>('DiscountCode', discountCodeSchema);
