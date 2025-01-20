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

import "./passport";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

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
app.use("/auth", authRoute);
app.use("/recipes", recipeRoute);
app.use("/cakes", cakeRoute);
app.use("/order", orderRoute);
app.use("/user", userRoute);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Create HTTP Server
const server = http.createServer(app);

export { server, app };
