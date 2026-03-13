import { commentModel } from "../models/comment.model.js";
import { likePostModel } from "../models/likePost.model.js";
import { postModel } from "../models/post.model.js";
import { shareModel } from "../models/share.model.js";
import { userModel } from "../models/user.model.js";

class StatisTicService {
  static getDashboardStats = async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 4 query chạy song song thay vì 12 query tuần tự
    const [commentCount, likeCount, shareCount, [userStats], [postStats]] =
      await Promise.all([
        commentModel.countDocuments(),
        likePostModel.countDocuments(),
        shareModel.countDocuments(),

        // 1 query user: tổng + new7d + new30d
        userModel.aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              new7d: [
                {
                  $match: {
                    createdOn: { $gte: sevenDaysAgo, $lte: now },
                    isActive: true,
                  },
                },
                { $count: "count" },
              ],
              new30d: [
                {
                  $match: {
                    createdOn: { $gte: thirtyDaysAgo, $lte: now },
                    isActive: true,
                  },
                },
                { $count: "count" },
              ],
            },
          },
        ]),

        // 1 query post: tổng + views + contentHealth + new7d + new30d + topCategories
        postModel.aggregate([
          {
            $facet: {
              overview: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
                    published: {
                      $sum: {
                        $cond: [{ $eq: ["$status", "published"] }, 1, 0],
                      },
                    },
                    draft: {
                      $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
                    },
                    archived: {
                      $sum: {
                        $cond: [{ $eq: ["$status", "archived"] }, 1, 0],
                      },
                    },
                  },
                },
              ],
              new7d: [
                {
                  $match: {
                    createdOn: { $gte: sevenDaysAgo, $lte: now },
                    status: "published",
                  },
                },
                { $count: "count" },
              ],
              new30d: [
                {
                  $match: {
                    createdOn: { $gte: thirtyDaysAgo, $lte: now },
                    status: "published",
                  },
                },
                { $count: "count" },
              ],
              topCategories: [
                { $group: { _id: "$category", postCount: { $sum: 1 } } },
                { $sort: { postCount: -1 } },
                { $limit: 5 },
                {
                  $lookup: {
                    from: "Categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "info",
                  },
                },
                { $unwind: "$info" },
                {
                  $project: {
                    _id: 0,
                    categoryId: "$_id",
                    name: "$info.name",
                    postCount: 1,
                  },
                },
              ],
            },
          },
        ]),
      ]);

    // Extract user stats
    const usersCount = userStats.total[0]?.count ?? 0;
    const newUsers7d = userStats.new7d[0]?.count ?? 0;
    const newUsers30d = userStats.new30d[0]?.count ?? 0;

    // Extract post stats
    const postOverview = postStats.overview[0] ?? {
      total: 0,
      totalViews: 0,
      published: 0,
      draft: 0,
      archived: 0,
    };
    const postsCount = postOverview.total;
    const viewsCount = postOverview.totalViews;
    const newPosts7d = postStats.new7d[0]?.count ?? 0;
    const newPosts30d = postStats.new30d[0]?.count ?? 0;

    // Content health rates
    const publishedRate =
      postsCount > 0 ? (postOverview.published / postsCount) * 100 : 0;
    const draftRate =
      postsCount > 0 ? (postOverview.draft / postsCount) * 100 : 0;
    const archivedRate =
      postsCount > 0 ? (postOverview.archived / postsCount) * 100 : 0;

    // Engagement rate
    const totalInteractions = likeCount + commentCount + shareCount;
    const engagementRate = viewsCount > 0 ? totalInteractions / viewsCount : 0;

    return {
      totals: {
        usersCount,
        postsCount,
        commentsCount: commentCount,
        likesCount: likeCount,
        sharesCount: shareCount,
        viewsCount,
      },
      growth: { newUsers7d, newUsers30d, newPosts7d, newPosts30d },
      contentHealth: { publishedRate, draftRate, archivedRate },
      engagement: { engagementRate },
      topCategoriesByPosts: postStats.topCategories,
    };
  };

  static getUserStatistics = async () => {
    // 1 query duy nhất: phân loại theo role + active/inactive
    const [stats] = await userModel.aggregate([
      {
        $facet: {
          byRole: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
          byStatus: [
            {
              $group: {
                _id: null,
                active: {
                  $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
                },
                inactive: {
                  $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
                },
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Format byRole thành object dễ đọc: { admin: 2, user: 10, author: 5 }
    const byRole: Record<string, number> = {};
    for (const item of stats.byRole) {
      byRole[item._id] = item.count;
    }

    const statusData = stats.byStatus[0] ?? {
      active: 0,
      inactive: 0,
      total: 0,
    };

    // Top 5 contributors: user có tổng engagement (likes+comments+shares) cao nhất trên các bài viết
    const topContributors = await postModel.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$authorId",
          postCount: { $sum: 1 },
          totalLikes: { $sum: "$likesCount" },
          totalComments: { $sum: "$commentsCount" },
          totalShares: { $sum: "$sharesCount" },
          totalEngagement: {
            $sum: {
              $add: ["$likesCount", "$commentsCount", "$sharesCount"],
            },
          },
        },
      },
      { $sort: { totalEngagement: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "Users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          fullName: "$userInfo.fullName",
          avatar: "$userInfo.avatar",
          postCount: 1,
          totalEngagement: 1,
        },
      },
    ]);

    return {
      byRole,
      byStatus: {
        active: statusData.active,
        inactive: statusData.inactive,
        total: statusData.total,
      },
      topContributors,
    };
  };

  static getPostStatistics = async () => {
    // Top 10 posts theo views & engagement
    const topPosts = await postModel.aggregate([
      { $match: { status: "published" } },
      {
        $addFields: {
          engagementScore: {
            $add: ["$likesCount", "$commentsCount", "$sharesCount"],
          },
        },
      },
      { $sort: { engagementScore: -1, viewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "Users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorInfo",
        },
      },
      { $unwind: "$authorInfo" },
      {
        $lookup: {
          from: "Categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          _id: 0,
          postId: "$_id",
          title: 1,
          slug: 1,
          viewCount: 1,
          likesCount: 1,
          commentsCount: 1,
          sharesCount: 1,
          engagementScore: 1,
          publishedAt: 1,
          author: "$authorInfo.fullName",
          category: "$categoryInfo.name",
        },
      },
    ]);

    return { topPosts };
  };

  static getActivityStatistics = async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 3 query song song: likes, comments, shares theo ngày (30 ngày gần nhất)
    const [likeTrend, commentTrend, shareTrend] = await Promise.all([
      likePostModel.aggregate([
        { $match: { createdOn: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdOn" },
              },
              hour: { $hour: "$createdOn" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            total: { $sum: "$count" },
            byHour: {
              $push: { hour: "$_id.hour", count: "$count" },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: "$total",
            byHour: 1,
          },
        },
      ]),

      commentModel.aggregate([
        { $match: { createdOn: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdOn" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      shareModel.aggregate([
        { $match: { createdOn: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdOn" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
    ]);

    // Giờ hoạt động nhiều nhất (từ like data vì có byHour)
    const hourMap: Record<number, number> = {};
    for (const day of likeTrend) {
      for (const h of day.byHour) {
        hourMap[h.hour] = (hourMap[h.hour] ?? 0) + h.count;
      }
    }
    const peakHours = Object.entries(hourMap)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      trends: {
        likes: likeTrend.map(({ date, count }) => ({ date, count })),
        comments: commentTrend,
        shares: shareTrend,
      },
      peakHours,
    };
  };

  static getCategoryStatistics = async () => {
    // 1 query: posts + engagement per category
    const categories = await postModel.aggregate([
      {
        $group: {
          _id: "$category",
          postCount: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
          totalLikes: { $sum: "$likesCount" },
          totalComments: { $sum: "$commentsCount" },
          totalShares: { $sum: "$sharesCount" },
          totalEngagement: {
            $sum: {
              $add: ["$likesCount", "$commentsCount", "$sharesCount"],
            },
          },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          archived: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalEngagement: -1 } },
      {
        $lookup: {
          from: "Categories",
          localField: "_id",
          foreignField: "_id",
          as: "info",
        },
      },
      { $unwind: "$info" },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          name: "$info.name",
          slug: "$info.slug",
          postCount: 1,
          totalViews: 1,
          totalLikes: 1,
          totalComments: 1,
          totalShares: 1,
          totalEngagement: 1,
          avgEngagementPerPost: {
            $cond: [
              { $gt: ["$postCount", 0] },
              { $divide: ["$totalEngagement", "$postCount"] },
              0,
            ],
          },
          byStatus: {
            published: "$published",
            draft: "$draft",
            archived: "$archived",
          },
        },
      },
    ]);

    return { categories };
  };
}

export default StatisTicService;
