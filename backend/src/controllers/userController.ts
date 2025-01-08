import { Request, Response } from "express";
import User from "../models/userModel";

// קבלת פרטי משתמש מחובר
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.body.userId;

  try {
    const user = await User.findById(userId).select(
      "-password -refresh_tokens"
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// עדכון פרטי משתמש
export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.body.userId;
  const { nickname, email } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    user.nickname = nickname || user.nickname;
    user.email = email || user.email;

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Failed to update user profile:", err);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};
