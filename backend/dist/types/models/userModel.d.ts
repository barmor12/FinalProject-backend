import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    email: string;
    password: string;
    nickname: string;
    refresh_tokens: string[];
    User: mongoose.Types.ObjectId;
    profilePic?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    email: string;
    password: string;
    nickname: string;
    refresh_tokens: string[];
    User: mongoose.Types.ObjectId;
    profilePic?: string | null | undefined;
}> & {
    email: string;
    password: string;
    nickname: string;
    refresh_tokens: string[];
    User: mongoose.Types.ObjectId;
    profilePic?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    email: string;
    password: string;
    nickname: string;
    refresh_tokens: string[];
    User: mongoose.Types.ObjectId;
    profilePic?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    email: string;
    password: string;
    nickname: string;
    refresh_tokens: string[];
    User: mongoose.Types.ObjectId;
    profilePic?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    email: string;
    password: string;
    nickname: string;
    refresh_tokens: string[];
    User: mongoose.Types.ObjectId;
    profilePic?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
