// Entities
import Account from '../src/entity/Account';

declare module 'express-session' {
  interface SessionData {
    account: Account;
  }
}

export {};
