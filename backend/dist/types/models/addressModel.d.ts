import mongoose from "mongoose";
declare const Address: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    isDefault: boolean;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    isDefault: boolean;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    isDefault: boolean;
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
    userId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    isDefault: boolean;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    isDefault: boolean;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    isDefault: boolean;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default Address;
