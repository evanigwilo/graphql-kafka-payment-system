// Apollo & Graphql
import { gql } from 'apollo-server-express';

const definition = gql`
  type Query {
    account: Account
    balance: Float!
    transactions: [Transaction]
  }

  type Mutation {
    createAccount(name: String!, email: String!, password: String!): Account
    login(email: String!, password: String!): Account
    transfer(email: String!, amount: Float!): Transaction
  }

  type Account {
    id: ID!
    name: String!
    email: String!
    password: String!
  }

  type Transaction {
    id: ID!
    sender: Account!
    recipient: Account!
    amount: Float!
    timestamp: String!
  }
`;

export default [definition];
