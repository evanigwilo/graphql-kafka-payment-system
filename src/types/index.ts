// Express
import { Request, Response } from 'express';
// Kafka
import { Producer } from 'kafkajs';
// MongoDb
import { Db, Double } from 'mongodb';
// Entities
import Account from '../entity/Account';

export type KeyValue<T = string> = {
  [key: string | number]: T;
};

export type Balance = {
  email: string;
  amount: Double;
};

export type Transaction = {
  id: string;
  sender: Account;
  recipient: Account;
  amount: Double;
  timestamp: number;
};

export type QueryMutation = Partial<
  Record<
    'Query' | 'Mutation',
    KeyValue<
      (
        parent: undefined,
        args: {
          name: string;
          email: string;
          password: string;
          amount: number;
        },
        context: QueryMutationContext,
      ) => void
    >
  >
>;

export type QueryMutationContext = {
  req: Request;
  res: Response;
  paymentDb: Db;
  producer: Producer;
};
