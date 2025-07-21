import { generateUserJwtToken, verifyJwtToken } from './jwt';



export interface User {
  id: string;
  email: string;
  name?: string;
  isPremium: boolean;
  hasStripeCustomer?: boolean;
  hasActiveSubscription?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

class AuthService {
  private static instance: AuthService;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with email and password
  async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const response = await fetch('/api/auth/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.storeAuthData(data.token, data.user);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // Sign up new user
  async signup(email: string, password: string, name: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      return response.ok;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }

  // Get stored token
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user data
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const payload = await verifyJwtToken(token);
      return payload !== null;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Check if user has premium access
  async hasPremiumAccess(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const payload = await verifyJwtToken(token);
      return payload?.isPremium || false;
    } catch (error) {
      console.error('Premium check error:', error);
      return false;
    }
  }

  // Get current user ID
  async getCurrentUserId(): Promise<string | null> {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const payload = await verifyJwtToken(token);
      return payload?.userId || null;
    } catch (error) {
      console.error('Get user ID error:', error);
      return null;
    }
  }

  // Sync premium status with server
  async syncPremiumStatus(): Promise<boolean> {
    try {
      const token = this.getStoredToken();
      if (!token) return false;

      const response = await fetch('/api/auth/premium/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = this.getStoredUser();
        if (user) {
          user.isPremium = data.isPremium;
          this.storeUserData(user);
        }
        return data.isPremium;
      }
      return false;
    } catch (error) {
      console.error('Premium sync error:', error);
      return false;
    }
  }

  // Update premium status
  async updatePremiumStatus(isPremium: boolean): Promise<boolean> {
    try {
      const token = this.getStoredToken();
      if (!token) return false;

      const response = await fetch('/api/auth/premium/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPremium }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = this.getStoredUser();
        if (user) {
          user.isPremium = data.isPremium;
          this.storeUserData(user);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Premium update error:', error);
      return false;
    }
  }

  // Logout user
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Store authentication data
  private async storeAuthData(token: string, user: User): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
    this.storeUserData(user);
  }

  // Store user data
  private storeUserData(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Get auth headers for API calls
  getAuthHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export default AuthService; 