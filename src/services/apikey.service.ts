import { apiKeyModel } from "../models/apikey.model.js";

class apiKeyService {
  static findById = async (key: string) => {
    console.log("[4]:::key in service:", key);

    const objKey = await apiKeyModel.findOne({ key, status: true }).lean();
    console.log("[5]:::objKey:", objKey);

    return objKey;
  };
}

export default apiKeyService;
