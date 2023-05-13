// Apollo & Graphql
import { AuthenticationError } from 'apollo-server-core';
// Express
import { Request } from 'express';
// Constants, Helpers & Types
import { ErrorCode } from '../types/enum';

// authentication information
export const accountInfo = (req: Request) => {
  const account = req.session?.account;
  if (!account) {
    throw new AuthenticationError(ErrorCode.UNAUTHENTICATED, {
      account: 'User not authenticated.',
    });
  }
  return account;
};
