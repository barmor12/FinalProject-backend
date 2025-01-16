import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    nickname: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    profilePic?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    nickname: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    profilePic?: string | null | undefined;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    nickname: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    profilePic?: string | null | undefined;
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
    nickname: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    profilePic?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    nickname: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    profilePic?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    nickname: string;
    role: string;
    favorites: mongoose.Types.ObjectId[];
    refresh_tokens: string[];
    profilePic?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
