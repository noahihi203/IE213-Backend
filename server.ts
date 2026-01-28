import app from "./src/app";
// const { initRedis } = require("./src/services/redis.service");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  // await initRedis();
  console.log(`WSV eCommerce start with port ${PORT}`);
});

// process.on("SIGINT", () => {
//   server.close(() => console.log(`Exit Server Express`));
// });
