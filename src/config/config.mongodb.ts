interface AppConfig {
  app: {
    port: number | string;
  };
  db: {
    host: string;
    port: number | string;
    name: string;
  };
}

const dev: AppConfig = {
  app: {
    port: process.env.DEV_APP_PORT || 3006,
  },
  db: {
    host: process.env.DEV_DB_HOST || "localhost",
    port: process.env.DEV_DB_PORT || 10236,
    name: process.env.DEV_DB_NAME || "IE213",
  },
};

const prod: AppConfig = {
  app: {
    port: process.env.PROD_APP_PORT || 3000,
  },
  db: {
    host: process.env.PROD_DB_HOST || "localhost",
    port: process.env.PROD_DB_PORT || 10236,
    name: process.env.PROD_DB_NAME || "IE213",
  },
};

const config: Record<string, AppConfig> = { dev, prod };
const env = process.env.NODE_ENV || "dev";

export default config[env];
