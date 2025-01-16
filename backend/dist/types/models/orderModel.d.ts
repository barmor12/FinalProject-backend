import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    orderDate: NativeDate;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    orderDate: NativeDate;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    orderDate: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    orderDate: NativeDate;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    orderDate: NativeDate;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    user: mongoose.Types.ObjectId;
    cake: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice: number;
    orderDate: NativeDate;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
