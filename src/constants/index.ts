// .env destructuring
export const {
  SERVER_PORT,
  API_VERSION,
  KAFKA_SERVER,
  KAFKA_CLIENT_ID,
  KAFKA_GROUP_ID,
  KAFKA_CLUSTER_API_KEY,
  KAFKA_CLUSTER_API_SECRET,
  SESSION_ID,
  SESSION_SECRET,
  REDIS_DB_HOST,
  REDIS_DB_PORT,
  MONGO_INITDB_ROOT_USERNAME,
  MONGO_INITDB_ROOT_PASSWORD,
  MONGO_INITDB_DATABASE,
  MONGO_DB_HOST,
  MONGO_DB_PORT,
} = process.env;

// message events topic
export const paymentTopic = 'payment_transfers';

// cookie max age in ms for 1 hour
export const maxAge = 1000 * 60 * 60;
