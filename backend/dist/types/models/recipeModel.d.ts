import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    description: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    user: mongoose.Types.ObjectId;
    image?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    description: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    user: mongoose.Types.ObjectId;
    image?: string | null | undefined;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    description: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    user: mongoose.Types.ObjectId;
    image?: string | null | undefined;
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
    description: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    user: mongoose.Types.ObjectId;
    image?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    description: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    user: mongoose.Types.ObjectId;
    image?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    description: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    user: mongoose.Types.ObjectId;
    image?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
