import mongoose, { Document } from "mongoose";
export interface IProduct extends Document {
    name: string;
    image: string;
    description: string;
    quantity: number;
    price: number;
}
declare const _default: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct> & IProduct & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
