import mongoose from "mongoose";
import os from "os";
import process from "process";
import logger from "../config/logger.config.js";
const _SECONDS = 5000;

//count connect
const countConnect = () => {
  const numConnection = mongoose.connections.length;
  logger.info(`Number of connections:${numConnection}`);
};

// check over load
const checkOverload = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;
    // Example maximum number of connections based on number of cores
    const maxConnections = numCores * 5;

    logger.info(`Active connections: ${numConnection}`);
    logger.info(`Memory usage: ${memoryUsage / 1024 / 1025} MB`);

    if (numConnection > maxConnections) {
      logger.info(`Connection overload detected!`);
    }
  }, _SECONDS); //Monitor every 5 seconds
};

export { countConnect, checkOverload };
