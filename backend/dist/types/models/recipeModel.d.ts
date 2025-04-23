import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    name: string;
    description: string;
    ingredients: mongoose.Types.DocumentArray<{
        name: string;
        amount: string;
        unit: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        name: string;
        amount: string;
        unit: string;
    }> & {
        name: string;
        amount: string;
        unit: string;
    }>;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    servings: number;
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    instructions: mongoose.Types.DocumentArray<{
        step: number;
        instruction: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        step: number;
        instruction: string;
    }> & {
        step: number;
        instruction: string;
    }>;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    image?: {
        url: string;
        public_id: string;
    } | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    description: string;
    ingredients: mongoose.Types.DocumentArray<{
        name: string;
        amount: string;
        unit: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        name: string;
        amount: string;
        unit: string;
    }> & {
        name: string;
        amount: string;
        unit: string;
    }>;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    servings: number;
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    instructions: mongoose.Types.DocumentArray<{
        step: number;
        instruction: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        step: number;
        instruction: string;
    }> & {
        step: number;
        instruction: string;
    }>;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    image?: {
        url: string;
        public_id: string;
    } | null | undefined;
}> & {
    name: string;
    description: string;
    ingredients: mongoose.Types.DocumentArray<{
        name: string;
        amount: string;
        unit: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        name: string;
        amount: string;
        unit: string;
    }> & {
        name: string;
        amount: string;
        unit: string;
    }>;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    servings: number;
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    instructions: mongoose.Types.DocumentArray<{
        step: number;
        instruction: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        step: number;
        instruction: string;
    }> & {
        step: number;
        instruction: string;
    }>;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    image?: {
        url: string;
        public_id: string;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    description: string;
    ingredients: mongoose.Types.DocumentArray<{
        name: string;
        amount: string;
        unit: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        name: string;
        amount: string;
        unit: string;
    }> & {
        name: string;
        amount: string;
        unit: string;
    }>;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    servings: number;
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    instructions: mongoose.Types.DocumentArray<{
        step: number;
        instruction: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        step: number;
        instruction: string;
    }> & {
        step: number;
        instruction: string;
    }>;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    image?: {
        url: string;
        public_id: string;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    description: string;
    ingredients: mongoose.Types.DocumentArray<{
        name: string;
        amount: string;
        unit: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        name: string;
        amount: string;
        unit: string;
    }> & {
        name: string;
        amount: string;
        unit: string;
    }>;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    servings: number;
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    instructions: mongoose.Types.DocumentArray<{
        step: number;
        instruction: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        step: number;
        instruction: string;
    }> & {
        step: number;
        instruction: string;
    }>;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    image?: {
        url: string;
        public_id: string;
    } | null | undefined;
}>> & mongoose.FlatRecord<{
    name: string;
    description: string;
    ingredients: mongoose.Types.DocumentArray<{
        name: string;
        amount: string;
        unit: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        name: string;
        amount: string;
        unit: string;
    }> & {
        name: string;
        amount: string;
        unit: string;
    }>;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    servings: number;
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    instructions: mongoose.Types.DocumentArray<{
        step: number;
        instruction: string;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        step: number;
        instruction: string;
    }> & {
        step: number;
        instruction: string;
    }>;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    image?: {
        url: string;
        public_id: string;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
