import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    address: mongoose.Types.ObjectId;
    items: mongoose.Types.DocumentArray<{
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }> & {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    totalPrice: number;
    totalRevenue: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    isPriority: boolean;
    deliveryDate?: NativeDate | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    address: mongoose.Types.ObjectId;
    items: mongoose.Types.DocumentArray<{
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }> & {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    totalPrice: number;
    totalRevenue: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    isPriority: boolean;
    deliveryDate?: NativeDate | null | undefined;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    address: mongoose.Types.ObjectId;
    items: mongoose.Types.DocumentArray<{
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }> & {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    totalPrice: number;
    totalRevenue: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    isPriority: boolean;
    deliveryDate?: NativeDate | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    address: mongoose.Types.ObjectId;
    items: mongoose.Types.DocumentArray<{
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }> & {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    totalPrice: number;
    totalRevenue: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    isPriority: boolean;
    deliveryDate?: NativeDate | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    address: mongoose.Types.ObjectId;
    items: mongoose.Types.DocumentArray<{
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }> & {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    totalPrice: number;
    totalRevenue: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    isPriority: boolean;
    deliveryDate?: NativeDate | null | undefined;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    user: mongoose.Types.ObjectId;
    address: mongoose.Types.ObjectId;
    items: mongoose.Types.DocumentArray<{
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }> & {
        price: number;
        cake: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    totalPrice: number;
    totalRevenue: number;
    status: "pending" | "draft" | "confirmed" | "delivered";
    isPriority: boolean;
    deliveryDate?: NativeDate | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
