import "dotenv/config";
import mongoose from "mongoose";
import { postModel } from "../models/post.model.js";
import { categoryModel } from "../models/category.model.js";
import { userModel } from "../models/user.model.js";
import "../dbs/init.mongodb.js"; 

async function seedUITPost() {
  try {
    // 1. Refined Wait: Wait for connection AND authentication
    if (mongoose.connection.readyState !== 1) {
      console.log("⏳ Waiting for database to be fully ready and authenticated...");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("DB Authentication Timeout")), 10000);
        
        // Check every 100ms if the connection is ready
        const checkInterval = setInterval(() => {
          if (mongoose.connection.readyState === 1) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve(true);
          }
        }, 100);
      });
    }

    // Small extra buffer to ensure the MongoDB driver has finished the auth handshake
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("🚀 Connection verified. Finding dependencies...");

    // 2. Lookup existing Category (must be seeded first)
    const aiCategory = await categoryModel.findOne({ slug: "ai" }).lean();
    
    // 3. Lookup your User (Huy) - search for admin or first available user
    const author = await userModel.findOne({ role: "admin" }).lean() || await userModel.findOne({}).lean();

    if (!aiCategory) {
        throw new Error("Missing 'ai' Category. Run npm run seed:categories first!");
    }
    if (!author) {
        throw new Error("No User found in database. Please create a user first!");
    }

    // 4. UIT Post Data
    const uitPost = {
      authorId: author._id,
      category: aiCategory._id,
      title: "[UIT] Đầu tư NVIDIA DGX A100 – Đột phá AI tại Việt Nam",
      slug: "uit-dau-tu-nvidia-dgx-a100-dot-pha-ai-viet-nam",
      excerpt: "Trường Đại học Công nghệ Thông tin (UIT) trang bị siêu máy chủ NVIDIA DGX A100, nâng tầm nghiên cứu và đào tạo AI tại Việt Nam.",
      content: `
        <p><strong>Trường Đại học Công nghệ Thông tin, ĐHQG TP.HCM</strong> vừa công bố việc trang bị hệ thống siêu máy chủ <strong>NVIDIA DGX A100</strong>.</p>
        <h3>NVIDIA DGX A100 là gì?</h3>
        <p>Đây là thiết bị xử lý các tác vụ AI với hiệu suất lên tới 5 petaFLOPS.</p>
      `,
      status: "published",
      coverImage: "https://uit.edu.vn/sites/default/files/banner_dgx_a100.jpg",
      tags: [], 
      publishedAt: new Date(),
    };

    console.log("⏳ Syncing post to database...");

    const result = await postModel.updateOne(
      { slug: uitPost.slug },
      { $set: uitPost },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log("✅ Successfully created new UIT post!");
    } else {
      console.log("🔄 Existing UIT post updated.");
    }

  } catch (error) {
    console.error("❌ Error seeding post:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database disconnected.");
    process.exit(0);
  }
}

seedUITPost();