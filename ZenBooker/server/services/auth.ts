import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import type { User, InsertUser } from '@shared/schema';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  businessName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  businessName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password
  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  private generateToken(user: AuthUser): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username 
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  // Verify JWT token
  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      };
    } catch (error) {
      return null;
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await storage.createUser({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      businessName: data.businessName,
    });

    // Generate token
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      businessName: user.businessName,
    };

    const token = this.generateToken(authUser);

    return { user: authUser, token };
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      businessName: user.businessName,
    };

    const token = this.generateToken(authUser);

    return { user: authUser, token };
  }

  // Get user by token
  async getUserFromToken(token: string): Promise<AuthUser | null> {
    const authUser = this.verifyToken(token);
    if (!authUser) {
      return null;
    }

    // Verify user still exists in database
    const user = await storage.getUser(authUser.id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      businessName: user.businessName,
    };
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password
    await storage.updateUser(userId, { password: hashedNewPassword });
  }
}

export const authService = new AuthService(); 