import bcrypt from 'bcrypt';
import { IPasswordHasher } from "./auth.service.interface";

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number = 12) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}