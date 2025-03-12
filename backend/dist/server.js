"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.server = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./config/firebaseConfig");
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const recipeRoute_1 = __importDefault(require("./routes/recipeRoute"));
const orderRoute_1 = __importDefault(require("./routes/orderRoute"));
const cakeRoute_1 = __importDefault(require("./routes/cakeRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const cartRoute_1 = __importDefault(require("./routes/cartRoute"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const adminRoute_1 = __importDefault(require("./routes/adminRoute"));
require("./passport");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
console.log("Serving static files from:", path_1.default.join(__dirname, "../src/uploads"));
const app = (0, express_1.default)();
exports.app = app;
app.enable("strict routing");
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use("/admin", adminRoute_1.default);
app.use("/auth", authRoute_1.default);
app.use("/recipes", recipeRoute_1.default);
app.use("/cakes", cakeRoute_1.default);
app.use("/order", orderRoute_1.default);
app.use("/cart", cartRoute_1.default);
app.use("/user", userRoute_1.default);
app.use("/inventory", inventoryRoutes_1.default);
const fs_1 = __importDefault(require("fs"));
const uploadsPath = path_1.default.join(__dirname, "../src/uploads");
fs_1.default.readdir(uploadsPath, (err, files) => {
    if (err) {
        console.error("Error reading uploads directory:", err);
    }
    else {
        console.log("Files in uploads directory:", files);
    }
});
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "./uploads")));
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect to MongoDB", err));
const server = http_1.default.createServer(app);
exports.server = server;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=server.js.map