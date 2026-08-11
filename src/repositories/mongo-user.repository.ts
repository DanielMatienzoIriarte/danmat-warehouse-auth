import { IUser, User } from "../models/user.model";
import { IUserRepository } from "./user.repository.interface";

export class UserRepository implements IUserRepository {
  async findByEmail(email: String): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);

    return user.save();
  }
}