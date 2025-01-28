import mongoose, { Schema, Document } from "mongoose";

interface CartItem {
    cake: mongoose.Types.ObjectId;
    quantity: number;
}

interface CartDocument extends Document {
    user: mongoose.Types.ObjectId;
    items: CartItem[];
}

const cartItemSchema = new Schema<CartItem>({
    cake: { type: mongoose.Schema.Types.ObjectId, ref: "Cake", required: true },
    quantity: { type: Number, required: true, default: 1 },
});

const cartSchema = new Schema<CartDocument>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
});

const Cart = mongoose.model<CartDocument>("Cart", cartSchema);

export default Cart;
