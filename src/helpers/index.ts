// MongoDb
import { Db, MongoClient } from 'mongodb';
// Entities
import Account from '../entity/Account';
// Constants, Helpers & Types
import { Collection } from '../types/enum';
import {
  MONGO_DB_HOST,
  MONGO_DB_PORT,
  MONGO_INITDB_ROOT_PASSWORD,
  MONGO_INITDB_ROOT_USERNAME,
  MONGO_INITDB_DATABASE,
} from '../constants';

// mongo database connection helper
export const mongoConnect = async () => {
  const url = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_DB_HOST}:${MONGO_DB_PORT}/${MONGO_INITDB_DATABASE}?authSource=${MONGO_INITDB_ROOT_USERNAME}`;
  const client = new MongoClient(url);
  // Use connect method to connect to the server
  await client.connect();
  // create a database instance
  const paymentDb = client.db(MONGO_INITDB_DATABASE);
  // create unique index on the email field of the accounts collection
  await paymentDb.collection(Collection.ACCOUNT).createIndex({ email: 1 }, { unique: true });
  // create unique index on the email field of the balances collection
  await paymentDb.collection(Collection.BALANCE).createIndex({ email: 1 }, { unique: true });

  return paymentDb;
};

export const getAccount = async (email: string, paymentDb: Db) => {
  const accountCollection = paymentDb.collection<Account>(Collection.ACCOUNT);
  const account = await accountCollection.findOne({
    email,
  });
  // set account identifier
  if (account) {
    account.id = account._id.toString();
  }
  return account;
};
