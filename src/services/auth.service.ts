import { v4 as uuidv4 } from 'uuid';
import {
  IAuthService,
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  IPasswordHasher,
  ITokenService,
  ICacheService
} from './auth.service.interface.js';
import { IUserRepository } from '../repositories/user.repository.interface.js';

export class AuthService implements IAuthService {

  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService,
    private cacheService: ICacheService
  ) {}

  /**
   * @inheritdoc
   */
  async register(dto: RegisterDTO, requestingUserRole: string): Promise<AuthResponse> {
    if (requestingUserRole !== 'admin') {
      throw new Error('Unauthorized: Only administrators can register new users.');
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('Email is already registered.');
    }

    const hashedPassword = await this.passwordHasher.hash(dto.password);

    const newUser = await this.userRepository.create({
      user_id: uuidv4(),
      full_name: dto.full_name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: dto.role,
      created_at: new Date()
    });

    return {
      user_id: newUser.user_id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role
    };
  }

  /**
   * @inheritdoc
   */
  async login(dto: LoginDTO): Promise<{ accessToken: string; refreshToken: string; user: AuthResponse }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isPasswordValid = await this.passwordHasher.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    };

    // RS256 Asymmetric Signing
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = this.tokenService.signRefreshToken(payload);

    await this.cacheService.setSession(`session:${user.user_id}`, refreshToken, 7 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    };
  }

  /**
   * @inheritdoc
   */
  async refreshToken(incomingRefreshToken: string): Promise<{ accessToken: string }> {
    if (!incomingRefreshToken) {
      throw new Error('Refresh token missing.');
    }

    let decoded: any;
    try {
      decoded = this.tokenService.verifyRefreshToken(incomingRefreshToken);
    } catch (err) {
      throw new Error('Invalid or expired refresh token.');
    }

    const storedToken = await this.cacheService.getSession(`session:${decoded.user_id}`);
    if (!storedToken || storedToken !== incomingRefreshToken) {
      throw new Error('Session revoked or invalid.');
    }

    const newPayload = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };

    const accessToken = this.tokenService.signAccessToken(newPayload);

    return { accessToken };
  }

  /**
   * @inheritdoc
   */
  async logout(userId: string): Promise<boolean> {
    const deleted = await this.cacheService.deleteSession(`session:${userId}`);
    return deleted > 0;
  }
}