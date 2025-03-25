import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    isVerified: boolean;
    addresses: mongoose.Types.ObjectId[];
    profilePic?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
    resetToken?: string | null | undefined;
    resetExpires?: NativeDate | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    isVerified: boolean;
    addresses: mongoose.Types.ObjectId[];
    profilePic?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
    resetToken?: string | null | undefined;
    resetExpires?: NativeDate | null | undefined;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    isVerified: boolean;
    addresses: mongoose.Types.ObjectId[];
    profilePic?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
    resetToken?: string | null | undefined;
    resetExpires?: NativeDate | null | undefined;
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
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    isVerified: boolean;
    addresses: mongoose.Types.ObjectId[];
    profilePic?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
    resetToken?: string | null | undefined;
    resetExpires?: NativeDate | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    isVerified: boolean;
    addresses: mongoose.Types.ObjectId[];
    profilePic?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
    resetToken?: string | null | undefined;
    resetExpires?: NativeDate | null | undefined;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    isVerified: boolean;
    addresses: mongoose.Types.ObjectId[];
    profilePic?: {
        url?: string | null | undefined;
        public_id?: string | null | undefined;
    } | null | undefined;
    resetToken?: string | null | undefined;
    resetExpires?: NativeDate | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
