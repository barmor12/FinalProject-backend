import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: string | null | undefined;
}> & {
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
