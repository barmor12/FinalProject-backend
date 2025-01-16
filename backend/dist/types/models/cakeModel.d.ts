import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description: string;
    ingredients: string[];
    price: number;
    image?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description: string;
    ingredients: string[];
    price: number;
    image?: string | null | undefined;
}> & {
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description: string;
    ingredients: string[];
    price: number;
    image?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description: string;
    ingredients: string[];
    price: number;
    image?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description: string;
    ingredients: string[];
    price: number;
    image?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description: string;
    ingredients: string[];
    price: number;
    image?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
