"use strict";

import mongoose from "mongoose";
import logger from "../config/logger.config.js";

const connectString = process.env.MONGODB_URI as string;
//dev
class Database {
  private static instance: Database;

  private constructor() {
    this.connect();
  }
  // connect
  connect(_type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }
    mongoose
      .connect(connectString, { maxPoolSize: 50 })
      .then((_) => {
        logger.info(`Connected Mongodb Success to: ${connectString}`);
      })
      .catch((err) => logger.error(`Error Connect!${err}`));
  }
  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();

export default instanceMongodb;
