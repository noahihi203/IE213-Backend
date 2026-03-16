import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import StatisTicService from "../services/statistics.service.js";

class StatisticController {
  getDashboardStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get dashboard stats success",
      metadata: await StatisTicService.getDashboardStats(),
    }).send(res);
  };
  getUserStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get user statistics success",
      metadata: await StatisTicService.getUserStatistics(),
    }).send(res);
  };
  getPostStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get post statistics success",
      metadata: await StatisTicService.getPostStatistics(),
    }).send(res);
  };
  getActivityStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get activity statistics stats success",
      metadata: await StatisTicService.getActivityStatistics(),
    }).send(res);
  };
  getCategoryStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get category statistics success",
      metadata: await StatisTicService.getCategoryStatistics(),
    }).send(res);
  };
}

export default new StatisticController();
