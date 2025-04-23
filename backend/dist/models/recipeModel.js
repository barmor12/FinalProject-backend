"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ingredientSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    amount: { type: String, required: true },
    unit: { type: String, required: true }
});
const instructionSchema = new mongoose_1.default.Schema({
    step: { type: Number, required: true },
    instruction: { type: String, required: true }
});
const recipeSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    servings: {
        type: Number,
        required: true,
        min: 1
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    makingTime: {
        type: String,
        required: true,
        default: "",
    },
    image: {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
    },
    ingredients: [ingredientSchema],
    instructions: [instructionSchema],
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
recipeSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
exports.default = mongoose_1.default.model("Recipe", recipeSchema);
//# sourceMappingURL=recipeModel.js.map