import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
    description: string;
    amount: number;
    date: Date;
    category: string; // למשל: שכירות, ציוד, חומרים וכו'
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
