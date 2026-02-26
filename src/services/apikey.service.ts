import logger from "../config/logger.config.js";
import { apiKeyModel } from "../models/apikey.model.js";

class apiKeyService {
  static findById = async (key: string) => {
    logger.debug("[4]:::key in service:", key);
    const objKey = await apiKeyModel.findOne({ key, status: true }).lean();
    logger.debug("[5]:::objKey:", objKey);

    return objKey;
  };
}

export default apiKeyService;
