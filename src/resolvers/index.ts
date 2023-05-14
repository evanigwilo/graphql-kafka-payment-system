// Apollo & Graphql
import { UserInputError, ForbiddenError, ApolloError } from 'apollo-server-express';
// Kafka
import { CompressionTypes } from 'kafkajs';
// Generators & Validators
import argon2 from 'argon2';
import { validate } from 'class-validator';
// MongoDb
import { WithId, Double } from 'mongodb';
// Middleware
import { accountInfo } from '../middleware/auth';
// Entities
import Account from '../entity/Account';
// Constants, Helpers & Types
import { getAccount } from '../helpers';
import { paymentTopic } from '../constants';
import { Collection, ErrorCode } from '../types/enum';
import { Balance, QueryMutation, Transaction } from '../types';

const resolver: QueryMutation = {
  Query: {
    account: (_, __, { req }): Account => {
      const account = accountInfo(req) as WithId<Account>;
      // set account identifier
      account.id = account._id.toString();
      return account;
    },
    balance: async (_, __, { req, paymentDb }): Promise<Double> => {
      const { email } = accountInfo(req);
      const balanceCollection = paymentDb.collection<Balance>(Collection.BALANCE);
      const accountBalance = (await balanceCollection.findOne({ email })) as Balance;
      return accountBalance.amount;
    },
    transactions: async (_, __, { req, paymentDb }): Promise<Transaction[]> => {
      // get transactions for current authenticated account
      const { email } = accountInfo(req);
      const transactionCollection = paymentDb.collection<Transaction>(Collection.TRANSACTION);
      const transactions = await transactionCollection
        .aggregate<Transaction>([
          /** Filter transactions based on sender and recipient */
          {
            $match: {
              $or: [
                {
                  'sender.email': email,
                },
                {
                  'recipient.email': email,
                },
              ],
            },
          },
          /** Transform fields into the required format for graphql */
          {
            $project: {
              _id: 0,
              id: '$_id',
              sender: 1,
              recipient: 1,
              amount: 1,
              timestamp: 1,
            },
          },
        ])
        /*
        .find({
          $or: [
            {
              'sender.email': email,
            },
            {
              'recipient.email': email,
            },
          ],
        })
        */
        .sort({ timestamp: 1 })
        .toArray();

      return transactions;
    },
  },
  Mutation: {
    createAccount: async (_, { name, email, password }, { req, paymentDb }): Promise<Account> => {
      const account = new Account({ name, email, password }) as WithId<Account>;

      // Validation of input for errors
      const errors = await validate(account);
      if (errors.length) {
        const { constraints } = errors[0];
        for (const key in constraints) {
          // throw first encountered error
          throw new UserInputError(ErrorCode.INPUT_ERROR, { createAccount: constraints[key] });
        }
      }

      // check if account with the provided credential already exists
      const accountCollection = paymentDb.collection<Account>(Collection.ACCOUNT);
      const findAccount = await getAccount(email, paymentDb);
      if (findAccount) {
        throw new ForbiddenError(ErrorCode.FORBIDDEN, { createAccount: 'Account already exist.' });
      }

      try {
        // hash password before creating account
        await account.hashPassword();
        await accountCollection.insertOne(account);
        // add initial balance on account creation
        const balanceCollection = paymentDb.collection<Balance>(Collection.BALANCE);
        await balanceCollection.insertOne({
          email,
          amount: new Double(1000),
        });
        // save user session
        req.session.account = { ...account };
        // set account identifier
        account.id = account._id.toString();
        return account;
      } catch {
        throw new ApolloError(ErrorCode.DATABASE_ERROR, '0', { createAccount: 'Failed to create account.' });
      }
    },
    login: async (_, { email, password }, { req, paymentDb }): Promise<Account> => {
      const account = await getAccount(email, paymentDb);
      // check if account exist
      if (!account) {
        throw new UserInputError(ErrorCode.INPUT_ERROR, { login: "Account doesn't exist." });
      }
      // verify hashed password
      const valid = await argon2.verify(account.password, password);
      if (!valid) {
        throw new UserInputError(ErrorCode.INPUT_ERROR, { login: 'Incorrect password.' });
      }
      // save user session
      req.session.account = { ...account };
      return account;
    },
    transfer: async (_, { email, amount }, { req, paymentDb, producer }): Promise<Transaction> => {
      // get current authenticated account or throw error if not authenticated
      const sender = accountInfo(req);
      // check if recipient is the same as sender
      if (sender.email === email) {
        throw new ForbiddenError(ErrorCode.FORBIDDEN, { transfer: 'Cannot transfer to self.' });
      }
      // check if recipient exist
      const recipient = await getAccount(email, paymentDb);
      if (!recipient) {
        throw new ForbiddenError(ErrorCode.FORBIDDEN, { transfer: 'Recipient does not exist.' });
      }
      // check if transfer amount is less than 0
      if (amount < 0) {
        throw new ForbiddenError(ErrorCode.FORBIDDEN, { transfer: 'Amount should be greater 0.' });
      }

      // get balances for both sender and recipient
      const balanceCollection = paymentDb.collection<Balance>(Collection.BALANCE);
      const recipientBalance = (await balanceCollection.findOne({ email: recipient.email })) as Balance;
      const senderBalance = (await balanceCollection.findOne({ email: sender.email })) as Balance;
      // sender and recipient balances
      const accountBalances = {
        sender: Number(senderBalance.amount.toString()),
        recipient: Number(recipientBalance.amount.toString()),
      };

      // check if amount to transfer is greater than sender balance
      if (amount > accountBalances.sender) {
        throw new ForbiddenError(ErrorCode.FORBIDDEN, { transfer: 'Insufficient balance.' });
      }

      // create and save transaction
      const transaction = {
        recipient,
        sender,
        amount: new Double(amount),
        timestamp: Date.now(),
      } as unknown as WithId<Transaction>;
      const transactionCollection = paymentDb.collection<Transaction>(Collection.TRANSACTION);
      await transactionCollection.insertOne(transaction);
      // update sender amount
      await balanceCollection.updateOne(
        { email: sender.email },
        { $set: { amount: new Double(accountBalances.sender - amount) } },
      );
      // update recipient amount
      await balanceCollection.updateOne(
        { email: recipient.email },
        { $set: { amount: new Double(accountBalances.recipient + amount) } },
      );

      // produce a message when a transfer is made
      producer.send({
        topic: paymentTopic,
        messages: [
          {
            key: transaction.id,
            value: JSON.stringify({
              sender: sender.email,
              recipient: recipient.email,
              amount,
            }),
          },
        ],
        compression: CompressionTypes.GZIP,
      });

      // set transaction identifier
      transaction.id = transaction._id.toString();
      return transaction;
    },
  },
};

export default {
  Query: {
    ...resolver.Query,
  },
  Mutation: {
    ...resolver.Mutation,
  },
};
