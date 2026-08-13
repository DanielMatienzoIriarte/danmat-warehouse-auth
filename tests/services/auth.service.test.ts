import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../../src/services/auth.service.js';
import { IUserRepository } from '../../src/repositories/user.repository.interface.js';
import { IPasswordHasher, ITokenService, ICacheService } from '../../src/services/auth.service.interface.js';
import { IUser } from '../../src/models/user.model.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockCacheService: jest.Mocked<ICacheService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockTokenService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };

    mockCacheService = {
      setSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
    };

    authService = new AuthService(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService,
      mockCacheService
    );
  });

  describe('register', () => {
    const validRegisterDTO = {
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePassword123!',
      role: 'client' as const,
    };

    it('should throw an error if requesting user role is not admin', async () => {
      await expect(
        authService.register(validRegisterDTO, 'client')
      ).rejects.toThrow('Unauthorized: Only administrators can register new users.');

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw an error if email is already registered', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ email: 'john@example.com' } as IUser);

      await expect(
        authService.register(validRegisterDTO, 'admin')
      ).rejects.toThrow('Email is already registered.');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
    });

    it('should successfully register a user when valid and requested by an admin', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed_password');
      
      mockUserRepository.create.mockResolvedValue({
        user_id: 'uuid-123',
        full_name: validRegisterDTO.full_name,
        email: validRegisterDTO.email,
        role: validRegisterDTO.role,
      } as IUser);

      const result = await authService.register(validRegisterDTO, 'admin');

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(validRegisterDTO.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: expect.any(String),
          full_name: validRegisterDTO.full_name,
          email: validRegisterDTO.email,
          password: 'hashed_password',
          role: validRegisterDTO.role,
        })
      );
      expect(result).toEqual({
        user_id: 'uuid-123',
        email: validRegisterDTO.email,
        full_name: validRegisterDTO.full_name,
        role: 'client',
      });
    });
  });

  describe('login', () => {
    const loginDTO = {
      email: 'john@example.com',
      password: 'SecurePassword123!',
    };

    const mockUser = {
      user_id: 'uuid-123',
      email: 'john@example.com',
      full_name: 'John Doe',
      password: 'hashed_password',
      role: 'client',
    } as IUser;

    it('should throw an error if user is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDTO)).rejects.toThrow('Invalid email or password.');
    });

    it('should throw an error if password does not match', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(false);

      await expect(authService.login(loginDTO)).rejects.toThrow('Invalid email or password.');
    });

    it('should return tokens and user details on successful login', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(true);
      
      mockTokenService.signAccessToken.mockReturnValue('mock_access_token');
      mockTokenService.signRefreshToken.mockReturnValue('mock_refresh_token');

      const result = await authService.login(loginDTO);

      expect(mockCacheService.setSession).toHaveBeenCalledWith(
        'session:uuid-123',
        'mock_refresh_token',
        7 * 24 * 60 * 60
      );
      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        user: {
          user_id: 'uuid-123',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'client',
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should throw an error if refresh token is missing', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow('Refresh token missing.');
    });

    it('should throw an error if token verification fails', async () => {
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('JWT expired');
      });

      await expect(authService.refreshToken('invalid_token')).rejects.toThrow(
        'Invalid or expired refresh token.'
      );
    });

    it('should throw an error if session does not exist in Redis', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ user_id: 'uuid-123', email: 'john@example.com', role: 'client' });
      mockCacheService.getSession.mockResolvedValue(null);

      await expect(authService.refreshToken('valid_token')).rejects.toThrow(
        'Session revoked or invalid.'
      );
    });

    it('should return a new access token on valid refresh token and active session', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ user_id: 'uuid-123', email: 'john@example.com', role: 'client' });
      mockCacheService.getSession.mockResolvedValue('valid_token');
      mockTokenService.signAccessToken.mockReturnValue('new_access_token');

      const result = await authService.refreshToken('valid_token');

      expect(result).toEqual({ accessToken: 'new_access_token' });
    });
  });

  describe('logout', () => {
    it('should delete the session from Redis and return true if deleted', async () => {
      mockCacheService.deleteSession.mockResolvedValue(1);

      const result = await authService.logout('uuid-123');

      expect(mockCacheService.deleteSession).toHaveBeenCalledWith('session:uuid-123');
      expect(result).toBe(true);
    });

    it('should return false if session was not found in Redis', async () => {
      mockCacheService.deleteSession.mockResolvedValue(0);

      const result = await authService.logout('uuid-999');

      expect(result).toBe(false);
    });
  });
});