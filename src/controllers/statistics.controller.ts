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
      message: "Get dashboard stats success",
      metadata: await StatisTicService.getDashboardStats(),
    }).send(res);
  };
  getPostStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get dashboard stats success",
      metadata: await StatisTicService.getDashboardStats(),
    }).send(res);
  };
  getActivityStats = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get dashboard stats success",
      metadata: await StatisTicService.getDashboardStats(),
    }).send(res);
  };
    getCategoryStats = async (req: Request, res: Response) => {
      new SuccessResponse({
        message: "Get dashboard stats success",
        metadata: await StatisTicService.getDashboardStats(),
      }).send(res);
  };
}

export default new StatisticController();
