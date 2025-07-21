import jwt from 'jsonwebtoken';

// Import environment configuration
const envConfig = require('../env.config.js');

const JWT_SECRET = process.env.JWT_SECRET || envConfig.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || envConfig.REFRESH_TOKEN_SECRET || JWT_SECRET + '_refresh';

interface JwtPayload {
  userId: string;
  email: string;
  isPremium: boolean;
  iat?: number;
  exp?: number;
}

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Token expiration times
const TOKEN_EXPIRATION = {
  ACCESS: '15m',      // 15 minutes for access tokens
  REFRESH: '7d',      // 7 days for refresh tokens
  LONG_TERM: '30d',   // 30 days for long-term tokens
};

export async function generateJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiration: string = TOKEN_EXPIRATION.ACCESS): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: expiration,
      },
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      }
    );
  });
}

export async function generateRefreshToken(userId: string, tokenVersion: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId, tokenVersion },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: TOKEN_EXPIRATION.REFRESH,
      },
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      }
    );
  });
}

export async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        resolve(null);
      } else {
        resolve(decoded as JwtPayload);
      }
    });
  });
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.error('Refresh token verification error:', err);
        resolve(null);
      } else {
        resolve(decoded as RefreshTokenPayload);
      }
    });
  });
}

// Generate JWT token with real user data from database
export async function generateUserJwtToken(userId: string, email: string, isPremium: boolean, expiration: string = TOKEN_EXPIRATION.ACCESS): Promise<string> {
  return generateJwtToken({
    userId,
    email,
    isPremium,
  }, expiration);
}

// Generate both access and refresh tokens
export async function generateTokenPair(userId: string, email: string, isPremium: boolean, tokenVersion: number = 1): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateUserJwtToken(userId, email, isPremium, TOKEN_EXPIRATION.ACCESS),
    generateRefreshToken(userId, tokenVersion),
  ]);
  
  return { accessToken, refreshToken };
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string, userData: { userId: string; email: string; isPremium: boolean }): Promise<string | null> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return null;
  
  return generateUserJwtToken(userData.userId, userData.email, userData.isPremium, TOKEN_EXPIRATION.ACCESS);
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

// Get token expiration time
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

// Check if user has premium access from token
export function isPremiumFromToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded.isPremium || false;
  } catch (error) {
    return false;
  }
}

// Get user ID from token
export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Get token expiration times for different use cases
export const TOKEN_TIMES = {
  ACCESS: TOKEN_EXPIRATION.ACCESS,
  REFRESH: TOKEN_EXPIRATION.REFRESH,
  LONG_TERM: TOKEN_EXPIRATION.LONG_TERM,
}; 