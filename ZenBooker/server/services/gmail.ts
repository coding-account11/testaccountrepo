import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GmailAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
}

export interface GmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

class GmailService {
  private config: GmailConfig;
  private oauth2Client: OAuth2Client;

  constructor(config: GmailConfig) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  // Generate OAuth authorization URL
  generateAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force refresh token
      state: state
    });
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<GmailAuthResponse> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to get access and refresh tokens');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000)
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<GmailAuthResponse> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      return {
        accessToken: credentials.access_token!,
        refreshToken: refreshToken,
        expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000)
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  // Send email via Gmail API
  async sendEmail(accessToken: string, message: GmailMessage): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Create email in RFC 2822 format
      const emailLines = [
        `From: ${message.from || 'PromoPal <noreply@promopal.com>'}`,
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        '',
        message.body
      ];

      const email = emailLines.join('\r\n');
      const base64Email = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: base64Email
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending email via Gmail:', error);
      return false;
    }
  }

  // Revoke access token
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      console.error('Error revoking Gmail token:', error);
      throw error;
    }
  }

  // Check if token is expired
  isTokenExpired(expiryDate: Date): boolean {
    return new Date() >= expiryDate;
  }
}

// Create and export Gmail service instance
const gmailConfig: GmailConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/gmail/callback',
};

export const gmailService = new GmailService(gmailConfig); 