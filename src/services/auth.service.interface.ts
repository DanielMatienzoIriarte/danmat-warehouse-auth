export interface RegisterDTO {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'client';
  token?: string; // Access token if immediate login
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  signAccessToken(payload: object): string;
  signRefreshToken(payload: object): string;
  verifyToken(token: string): any;
}

export interface ICacheService {
  setSession(key: string, value: string, ttlSeconds: number): Promise<void>;
  getSession(key: string): Promise<string | null>;
  deleteSession(key: string): Promise<number>;
}

export interface IAuthService {
  /**
   * 
   * @param dto 
   * @param requestingUserRole 
   */
  register(dto: RegisterDTO, requestingUserRole: string): Promise<AuthResponse>;

  /**
   * 
   * @param dto 
   */
  login(dto: LoginDTO): Promise<{ accessToken: string; refreshToken: string; user: AuthResponse }>;

  /**
   * 
   * @param userId 
   */
  logout(userId: string): Promise<boolean>;

  /**
   * 
   * @param incomingRefreshToken 
   */
  refreshToken(incomingRefreshToken: string): Promise<{ accessToken: string }>;
}