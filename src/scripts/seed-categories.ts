import mongoose from "mongoose";
import "dotenv/config"; // Ensures it reads your .env file
import { categoryModel } from "../models/category.model.js";

const MONGO_URI = process.env.MONGODB_URI as string;

async function seedCategories() {
  try {
    console.log("⏳ Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database connected.");

    const categories = [
      {
        name: "Trường Đại học",
        slug: "universities",
        description: "Thông tin về các trường đại học",
        icon: "🎓",
      },
      {
        name: "Công nghệ",
        slug: "technology",
        description: "Tin tức và kiến thức công nghệ",
        icon: "💻",
      },
      {
        name: "Trí tuệ nhân tạo",
        slug: "ai",
        description: "AI, Machine Learning, Deep Learning",
        icon: "🤖",
      },
      {
        name: "Đời sống sinh viên",
        slug: "student-life",
        description: "Cuộc sống và trải nghiệm sinh viên",
        icon: "📚",
      },
      {
        name: "Góc nhìn",
        slug: "opinion",
        description: "Quan điểm và thảo luận",
        icon: "🧠",
      },
      {
        name: "Cơ hội nghề nghiệp",
        slug: "career",
        description: "Việc làm và cơ hội phát triển",
        icon: "🚀",
      },
    ];

    console.log("⏳ Seeding categories...");
    
    for (const cat of categories) {
      await categoryModel.updateOne(
        { slug: cat.slug }, // Search criteria
        { $set: cat },      // Data to update/insert
        { upsert: true }    // Create if it doesn't exist
      );
    }

    console.log("✅ Categories seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    // Always disconnect so the terminal doesn't hang
    await mongoose.disconnect();
    console.log("🔌 Database disconnected.");
    process.exit(0);
  }
}

seedCategories();