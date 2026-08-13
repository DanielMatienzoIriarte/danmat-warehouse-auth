import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { ITokenService, JwtConfig } from './auth.service.interface';

export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtConfig) {
    if (!config.accessSecret || !config.refreshSecret) {
      throw new Error('Critical Security Error: JWT secrets must be explicitly provided.');
    }
  }

  signAccessToken(payload: object): string {
    const options: SignOptions = { expiresIn: (this.config.accessExpiresIn || '15m') as any };
    return jwt.sign(payload, this.config.accessSecret, options);
  }

  signRefreshToken(payload: object): string {
    const options: SignOptions = { expiresIn: (this.config.refreshExpiresIn || '7d') as any };
    return jwt.sign(payload, this.config.refreshSecret, options);
  }

  verifyAccessToken(token: string): JwtPayload | string {
    return jwt.verify(token, this.config.accessSecret);
  }

  verifyRefreshToken(token: string): JwtPayload | string {
    return jwt.verify(token, this.config.refreshSecret);
  }
}