import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import SeoRenderService from "../services/seo-render.service.js";
import { postModel } from "../models/post.model.js";
import "../dbs/init.mongodb.js";

async function generateStaticPostPages() {
  const outputDir = path.resolve(
    process.cwd(),
    SeoRenderService.getSsgOutputDirectory(),
  );
  const postsDir = path.join(outputDir, "posts");
  const limit = Number(process.env.SSG_POST_LIMIT || 200);

  await fs.mkdir(postsDir, { recursive: true });

  const posts = await postModel
    .find({ status: "published" })
    .sort({ publishedAt: -1, createdOn: -1 })
    .limit(limit)
    .populate("authorId", "fullName username")
    .populate("category", "name")
    .lean();

  let generated = 0;

  for (const post of posts) {
    if (!post.slug) continue;

    const html = SeoRenderService.renderPostDocument({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      authorId: post.authorId as any,
      category: post.category as any,
    });

    const targetPath = path.join(postsDir, `${post.slug}.html`);
    await fs.writeFile(targetPath, html, "utf8");
    generated += 1;
  }

  console.log(`Generated ${generated} static post page(s) in ${postsDir}`);
}

generateStaticPostPages()
  .catch((error) => {
    console.error("Failed to generate static post pages", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
