import mongoose, { Document } from "mongoose";
interface CartItem {
    cake: mongoose.Types.ObjectId;
    quantity: number;
}
interface CartDocument extends Document {
    user: mongoose.Types.ObjectId;
    items: CartItem[];
}
declare const Cart: mongoose.Model<CartDocument, {}, {}, {}, mongoose.Document<unknown, {}, CartDocument> & CartDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Cart;
