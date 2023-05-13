declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: string;
      API_VERSION: string;
      KAFKA_SERVER: string;
      KAFKA_CLIENT_ID: string;
      KAFKA_GROUP_ID: string;
      KAFKA_CLUSTER_API_KEY: string;
      KAFKA_CLUSTER_API_SECRET: string;
      SESSION_ID: string;
      SESSION_SECRET: string;
      REDIS_DB_HOST: string;
      REDIS_DB_PORT: string;
      MONGO_INITDB_ROOT_USERNAME: string;
      MONGO_INITDB_ROOT_PASSWORD: string;
      MONGO_INITDB_DATABASE: string;
      MONGO_DB_HOST: string;
      MONGO_DB_PORT: string;
    }
  }
}

export {};
