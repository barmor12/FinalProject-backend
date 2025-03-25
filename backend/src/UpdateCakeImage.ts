import mongoose from "mongoose";
import Cake from "./models/cakeModel"; // ודא שהנתיב למודל נכון

// חיבור ישיר למסד הנתונים
const MONGO_URI =
  "mongodb+srv://cakemanagmentpro:MzylM633tLcURB7n@cluster0.burwp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// מאגר תמונות מעודכן
const updatedImages: { [key: string]: string } = {
  "Chocolate Chip 55":
    "https://cdn.loveandlemons.com/wp-content/uploads/2024/08/chocolate-chip-cookie-recipe.jpg",
  "Vanilla Cupcake 23":
    "https://www.mybakingaddiction.com/wp-content/uploads/2011/07/unwrapped-vanilla-cupcake-hero.jpg",
  "Cheese Danish 34":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS0jqpDzmSGTwQCT9uqYtE9kw2UipsMn6iXA&s",
  "Carrot Cake 44":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQj6e6rNhN1XxOABiO2aykaXAZ67iFSw5Z0xA&s",
  "Blueberry Muffin 21":
    "https://food.fnr.sndimg.com/content/dam/images/food/fullset/2019/9/9/0/FNK_the-best-blueberry-muffins_H_s4x3.jpg.rend.hgtvcom.616.462.85.suffix/1568040661674.webp",
  "Chocolate Croissant 88":
    "https://bakingamoment.com/wp-content/uploads/2023/01/IMG_1641-chocolate-croissant.jpg",
  "Cinnamon Roll 66":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHsQV4dpjVfWULFyCqYwUOxqUmD3yS8TDJeA&s",
  "Red Velvet 77":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSvdSzuK7T8Br_Lr1BIKp0-O_gN2IEPqQulg&s",
};

const updateCakeImages = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // שליפת כל העוגות ממסד הנתונים
    const cakes = await Cake.find();
    console.log(`📌 Found ${cakes.length} cakes in DB`);

    for (const cake of cakes) {
      if (updatedImages.hasOwnProperty(cake.name)) {
        cake.image = { url: updatedImages[cake.name] };
        cake.updatedAt = new Date();
        await cake.save();
        console.log(`✅ Updated image for: ${cake.name}`);
      } else {
        console.log(`⚠️ No matching image found for: ${cake.name}`);
      }
    }

    console.log("🎉 All cake images updated successfully!");
  } catch (error) {
    console.error("❌ Error updating cake images:", error);
  } finally {
    console.log("🔌 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// הפעלת הפונקציה
updateCakeImages();
