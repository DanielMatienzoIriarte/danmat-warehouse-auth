import { FastifyReply, FastifyRequest } from "fastify";
import { LoginDTO, RegisterDTO } from "../services/auth.service.interface";
import { AuthService } from "../services/auth.service";
import { JWT_PUBLIC_KEY } from "../config/keys";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: FastifyRequest<{ Body: RegisterDTO }>, reply: FastifyReply) => {
    try {
      //the gateway passes user claims via headers (e.g., X-User-Role)
      const requestingUserRole = (req.headers['x-user-role'] as string) || 'client';

      const result = await this.authService.register(req.body, requestingUserRole);

      return reply.code(201).send({
        success: true,
        message: 'User Successfully registered.',
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message || 'Registration failed',
      });
    }
  }

  public login = async (req: FastifyRequest<{ Body: LoginDTO }>, reply: FastifyReply) => {
    try {
      const {accessToken, refreshToken, user} = await this.authService.login(req.body);

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60
      });

      return reply.code(200).send({
        success: true,
        message: 'Login successful.',
        data: {
          accessToken,
          user
        }
      });
    } catch (error: any) {
      return reply.code(401).send({
        success: false,
        error: error.message || 'Authentication failed.'
      });
    }
  }

  public refresh = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const incomingRefreshToken = req.cookies.refreshToken;
      if (!incomingRefreshToken) {
        return reply.code(401).send({ success: false, error: 'Refresh token cookie missing.' });
      }

      const { accessToken } = await this.authService.refreshToken(incomingRefreshToken);

      return reply.code(200).send({
        success: true,
        message: 'Token refreshed successfully.',
        data: { accessToken }
      });
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message || 'Token refresh failed.'
      });
    }
  };

  public logout = async (req: FastifyRequest<{ Headers: { 'x-user-id'?: string } }>, reply: FastifyReply) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return reply.code(400).send({ success: false, error: 'User identifier missing.' });
      }

      await this.authService.logout(userId);

      reply.clearCookie('refreshToken', { path: '/' });

      return reply.code(200).send({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: error.message || 'Logout failed.'
      });
    }
  }

  public getPublicKey = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!JWT_PUBLIC_KEY) {
        return reply.code(500).send({ success: false, error: 'Public key not configured.' });
      }
      return reply.code(200).send({
        success: true,
        publicKey: JWT_PUBLIC_KEY
      });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: 'Failed to retrieve public key.' });
    }
  };
}