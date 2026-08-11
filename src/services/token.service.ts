import jwt from 'jsonwebtoken';
import { ITokenService } from './auth.service.interface';

export class JwtTokenService implements ITokenService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

  signAccessToken(payload: object): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: '15m' });
  }

  signRefreshToken(payload: object): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.refreshSecret);
  }
}