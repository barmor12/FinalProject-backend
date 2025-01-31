import mongoose from "mongoose";
declare const Order: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    decoration: string;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    decoration: string;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    decoration: string;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    decoration: string;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    decoration: string;
    status: "pending" | "draft" | "confirmed" | "delivered";
    expiresAt: NativeDate;
    discountCode?: string | null | undefined;
    deliveryDate?: NativeDate | null | undefined;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    decoration: string;
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
