import mongoose, { Document } from "mongoose";
export interface IDiscountCode extends Document {
    code: string;
    discountPercentage: number;
    isActive: boolean;
    expiryDate?: Date;
    isValid(): boolean;
}
declare const _default: mongoose.Model<IDiscountCode, {}, {}, {}, mongoose.Document<unknown, {}, IDiscountCode> & IDiscountCode & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
