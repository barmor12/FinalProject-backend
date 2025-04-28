import Expense from '../models/expenseModel';
import { Request, Response } from 'express';

export const createExpense = async (req: Request, res: Response) => {
    try {
        const { description, amount, date, category } = req.body;

        const expense = new Expense({ description, amount, date, category });
        await expense.save();

        res.status(201).json(expense);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const updateExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { description, amount, date, category } = req.body;

        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            { description, amount, date, category },
            { new: true } // מחזיר את ההוצאה המעודכנת
        );

        if (!updatedExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        res.status(200).json(updatedExpense);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllExpenses = async (req: Request, res: Response) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.status(200).json(expenses);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Expense.findByIdAndDelete(id);
        res.status(200).json({ message: "Expense deleted" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
