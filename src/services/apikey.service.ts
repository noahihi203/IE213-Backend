import logger from "../config/logger.config.js";
import { apiKeyModel } from "../models/apikey.model.js";
import crypto from "crypto";

class apiKeyService {
  static findById = async (key: string) => {
    logger.debug("[4]:::key in service:", key);
    // const newKey = apiKeyModel.create({
    //   key: crypto.randomBytes(64).toString("hex"),
    //   permissions: ["0000"],
    // });

    const objKey = await apiKeyModel.findOne({ key, status: true }).lean();
    logger.debug("[5]:::objKey:", objKey);

    return objKey;
  };
}

export default apiKeyService;
