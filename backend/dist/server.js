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
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const recipeRoute_1 = __importDefault(require("./routes/recipeRoute"));
const orderRoute_1 = __importDefault(require("./routes/orderRoute"));
const cakeRoute_1 = __importDefault(require("./routes/cakeRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
require("./passport");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("uploads"));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use("/auth", authRoute_1.default);
app.use("/recipes", recipeRoute_1.default);
app.use("/cakes", cakeRoute_1.default);
app.use("/order", orderRoute_1.default);
app.use("/user", userRoute_1.default);
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