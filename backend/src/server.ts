import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import session from "express-session";

import authRoute from "./routes/authRoute";
import recipeRoute from "./routes/recipeRoute";
import orderRoute from "./routes/orderRoute";
import cakeRoute from "./routes/cakeRoute";
import userRoute from "./routes/userRoute";
import cartRoute from "./routes/cartRoute";
import inventoryRoute from "./routes/inventoryRoutes";
import adminRoute from "./routes/adminRoute";
import addressRoute from "./routes/addressRoute";
import discountRoutes from "./routes/discountRoute";
import emailRoute from "./routes/emailRoute";

import "./passport";
import path from "path";

dotenv.config();
console.log(
  "Serving static files from:",
  path.join(__dirname, "../src/uploads")
);
const app = express();
app.enable("strict routing");
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use("/admin", adminRoute);
app.use("/auth", authRoute);
app.use("/recipes", recipeRoute);
app.use("/discount", discountRoutes);
app.use("/cakes", cakeRoute);
app.use("/order", orderRoute);
app.use("/cart", cartRoute);
app.use("/user", userRoute);
app.use("/address", addressRoute);
app.use("/inventory", inventoryRoute);
app.use("/sendEmail", emailRoute);
import fs from "fs";
const uploadsPath = path.join(__dirname, "../src/uploads");
fs.readdir(uploadsPath, (err, files) => {
  if (err) {
    console.error("Error reading uploads directory:", err);
  } else {
    console.log("Files in uploads directory:", files);
  }
});
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Database Connection
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Create HTTP Server
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
export { server, app };