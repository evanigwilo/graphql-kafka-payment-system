// Generators & Validators
import argon2 from 'argon2';
import { IsEmail, Length } from 'class-validator';

export default class Account {
  constructor(account: Partial<Account>) {
    Object.assign(this, account);
  }

  id: string;

  @IsEmail({}, { message: 'Email is invalid.' })
  email: string;

  @Length(3, 128, { message: 'Name must be between 3 to 128 characters long.' })
  name: string;

  @Length(6, 128, { message: 'Password must be at least 6 characters long.' })
  password: string;

  async hashPassword() {
    // hash password helper
    this.password = await argon2.hash(this.password);
  }
}
