import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    name: string;
    description: string;
    cost: number;
    price: number;
    ingredients: string[];
    stock: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    description: string;
    cost: number;
    price: number;
    ingredients: string[];
    stock: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
}> & {
    name: string;
    description: string;
    cost: number;
    price: number;
    ingredients: string[];
    stock: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    description: string;
    cost: number;
    price: number;
    ingredients: string[];
    stock: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    description: string;
    cost: number;
    price: number;
    ingredients: string[];
    stock: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
}>> & mongoose.FlatRecord<{
    name: string;
    description: string;
    cost: number;
    price: number;
    ingredients: string[];
    stock: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    image?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
