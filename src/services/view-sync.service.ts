import { redisService } from "./redis.service.js";
import { Types } from "mongoose";
import { postModel } from "../models/post.model.js";

const VIEW_PREFIX = "post:views:";

interface ViewUpdate {
  postId: string;
  views: number;
}

const normalizeScannedKeys = (scanResult: string | string[]): string[] => {
  return Array.isArray(scanResult) ? scanResult : [scanResult];
};

const syncViewsToDatabase = async (viewUpdates: ViewUpdate[]) => {
  const operations = viewUpdates
    .filter(({ postId, views }) => Types.ObjectId.isValid(postId) && views > 0)
    .map(({ postId, views }) => ({
      updateOne: {
        filter: { _id: postId },
        update: { $inc: { viewCount: views } },
      },
    }));

  if (operations.length === 0) return;

  await postModel.bulkWrite(operations, { ordered: false });
};

// Gọi API này khi user xem bài viết
export const recordPostView = async (postId: string) => {
  const key = `${VIEW_PREFIX}${postId}`;
  await redisService.incr(key);
};

// Chạy hàm này 1 lần khi khởi động app
export const startViewSyncWorker = () => {
  setInterval(async () => {
    try {
      const bulkUpdates: ViewUpdate[] = [];
      const keysToDelete: string[] = [];

      // Dùng scanIterator thay cho keys() để không gây nghẽn Redis Server
      for await (const scanResult of redisService.client.scanIterator({
        MATCH: `${VIEW_PREFIX}*`,
        COUNT: 100, // Quét mỗi lần 100 keys
      })) {
        const keys = normalizeScannedKeys(scanResult);
        if (keys.length === 0) continue;

        const viewsByKey = await redisService.client.mGet(keys);

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const views = Number.parseInt(viewsByKey[i] ?? "0", 10);

          if (!Number.isFinite(views) || views <= 0) {
            continue;
          }

          const postId = key.replace(VIEW_PREFIX, "");
          bulkUpdates.push({ postId, views });
          keysToDelete.push(key);
        }
      }

      if (bulkUpdates.length > 0) {
        // Cập nhật MongoDB theo batch để giảm số lần ghi
        await syncViewsToDatabase(bulkUpdates);

        // Xóa các key đã sync thành công
        await redisService.del(keysToDelete);
        console.log(`Đã đồng bộ ${bulkUpdates.length} bài viết xuống DB.`);
      }
    } catch (error) {
      console.error("Lỗi khi đồng bộ lượt xem:", error);
    }
  }, 30 * 1000); // 30 giây chạy 1 lần
};
