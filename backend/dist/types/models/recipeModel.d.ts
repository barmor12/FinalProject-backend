import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    title: string;
    ingredients: string[];
    instructions: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    image?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    title: string;
    ingredients: string[];
    instructions: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    image?: string | null | undefined;
}> & {
    title: string;
    ingredients: string[];
    instructions: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    image?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    title: string;
    ingredients: string[];
    instructions: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    image?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    title: string;
    ingredients: string[];
    instructions: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    image?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    title: string;
    ingredients: string[];
    instructions: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    image?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
