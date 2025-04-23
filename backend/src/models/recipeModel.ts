import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: true }, // e.g., "2 cups", "1/2 teaspoon"
  unit: { type: String, required: true } // e.g., "cup", "tablespoon", "piece"
});

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  instruction: { type: String, required: true }
});

const recipeSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
recipeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Recipe", recipeSchema);