import mongoose from "mongoose";
declare const Order: mongoose.Model<{
    user: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    user: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}> & {
    user: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    user: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    user: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}>> & mongoose.FlatRecord<{
    user: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default Order;
