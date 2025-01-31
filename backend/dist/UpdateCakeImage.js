"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const cakeModel_1 = __importDefault(require("./models/cakeModel"));
const MONGO_URI = "mongodb+srv://cakemanagmentpro:MzylM633tLcURB7n@cluster0.burwp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const updatedImages = {
    "Chocolate Chip 55": "https://cdn.loveandlemons.com/wp-content/uploads/2024/08/chocolate-chip-cookie-recipe.jpg",
    "Vanilla Cupcake 23": "https://www.mybakingaddiction.com/wp-content/uploads/2011/07/unwrapped-vanilla-cupcake-hero.jpg",
    "Cheese Danish 34": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS0jqpDzmSGTwQCT9uqYtE9kw2UipsMn6iXA&s",
    "Carrot Cake 44": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQj6e6rNhN1XxOABiO2aykaXAZ67iFSw5Z0xA&s",
    "Blueberry Muffin 21": "https://food.fnr.sndimg.com/content/dam/images/food/fullset/2019/9/9/0/FNK_the-best-blueberry-muffins_H_s4x3.jpg.rend.hgtvcom.616.462.85.suffix/1568040661674.webp",
    "Chocolate Croissant 88": "https://bakingamoment.com/wp-content/uploads/2023/01/IMG_1641-chocolate-croissant.jpg",
    "Cinnamon Roll 66": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHsQV4dpjVfWULFyCqYwUOxqUmD3yS8TDJeA&s",
    "Red Velvet 77": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSvdSzuK7T8Br_Lr1BIKp0-O_gN2IEPqQulg&s",
};
const updateCakeImages = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔄 Connecting to MongoDB...");
        yield mongoose_1.default.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");
        const cakes = yield cakeModel_1.default.find();
        console.log(`📌 Found ${cakes.length} cakes in DB`);
        for (const cake of cakes) {
            if (updatedImages.hasOwnProperty(cake.name)) {
                cake.image = updatedImages[cake.name];
                cake.updatedAt = new Date();
                yield cake.save();
                console.log(`✅ Updated image for: ${cake.name}`);
            }
            else {
                console.log(`⚠️ No matching image found for: ${cake.name}`);
            }
        }
        console.log("🎉 All cake images updated successfully!");
    }
    catch (error) {
        console.error("❌ Error updating cake images:", error);
    }
    finally {
        console.log("🔌 Disconnecting from MongoDB...");
        yield mongoose_1.default.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
});
updateCakeImages();
//# sourceMappingURL=UpdateCakeImage.js.map