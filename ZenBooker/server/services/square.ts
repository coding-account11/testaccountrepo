import square from 'square';
import type { Customer, Booking, Location } from 'square';

export interface SquareConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
}

export interface SquareAuthResponse {
  accessToken: string;
  refreshToken: string;
  merchantId: string;
  expiresAt: Date;
}

export interface SquareCustomer {
  id: string;
  emailAddress: string;
  givenName: string;
  familyName: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SquareBooking {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  customerId: string;
  locationId: string;
  serviceVariationId: string;
  serviceVariationVersion: string;
}

class SquareService {
  private config: SquareConfig;
  private client: any;

  constructor(config: SquareConfig) {
    this.config = config;
    this.client = new square.SquareClient({
      environment: config.environment === 'production' ? square.SquareEnvironment.Production : square.SquareEnvironment.Sandbox,
    });
  }

  // Generate OAuth authorization URL
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: 'CUSTOMERS_READ APPOINTMENTS_READ MERCHANT_PROFILE_READ',
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://connect.squareup.com/oauth2/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<SquareAuthResponse> {
    try {
      const response = await fetch('https://connect.squareup.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-17',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Square OAuth error: ${error.error_description || error.error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        merchantId: data.merchant_id,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<SquareAuthResponse> {
    try {
      const response = await fetch('https://connect.squareup.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-17',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Square token refresh error: ${error.error_description || error.error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        merchantId: data.merchant_id,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Get Square client with access token
  private getSquareClient(accessToken: string): any {
    return new square.SquareClient({
      environment: this.config.environment === 'production' ? square.SquareEnvironment.Production : square.SquareEnvironment.Sandbox,
      accessToken,
    });
  }

  // Get merchant locations
  async getLocations(accessToken: string): Promise<Location[]> {
    try {
      const client = this.getSquareClient(accessToken);
      const response = await client.locationsApi.listLocations();
      
      if (response.result.locations) {
        return response.result.locations;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Square locations:', error);
      throw error;
    }
  }

  // Get customers from Square
  async getCustomers(accessToken: string, locationId?: string): Promise<SquareCustomer[]> {
    try {
      const client = this.getSquareClient(accessToken);
      const response = await client.customersApi.listCustomers();
      
      if (response.result.customers) {
        return response.result.customers.map(customer => ({
          id: customer.id!,
          emailAddress: customer.emailAddress?.address || '',
          givenName: customer.givenName || '',
          familyName: customer.familyName || '',
          phoneNumber: customer.phoneNumber ? `${customer.phoneNumber.callingCode}${customer.phoneNumber.nationalNumber}` : undefined,
          createdAt: customer.createdAt!,
          updatedAt: customer.updatedAt!,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Square customers:', error);
      throw error;
    }
  }

  // Get bookings from Square
  async getBookings(accessToken: string, locationId: string, startTime?: string, endTime?: string): Promise<SquareBooking[]> {
    try {
      const client = this.getSquareClient(accessToken);
      const response = await client.bookingsApi.listBookings({
        locationId,
        startAtRange: startTime && endTime ? {
          startAt: startTime,
          endAt: endTime,
        } : undefined,
      });
      
      if (response.result.bookings) {
        return response.result.bookings.map(booking => ({
          id: booking.id!,
          startAt: booking.startAt!,
          endAt: booking.endAt!,
          status: booking.status!,
          customerId: booking.customerId!,
          locationId: booking.locationId!,
          serviceVariationId: booking.appointmentSegments?.[0]?.serviceVariationId || '',
          serviceVariationVersion: booking.appointmentSegments?.[0]?.serviceVariationVersion || '',
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Square bookings:', error);
      throw error;
    }
  }

  // Revoke access token
  async revokeToken(accessToken: string): Promise<void> {
    try {
      const response = await fetch('https://connect.squareup.com/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-17',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Square token revocation error: ${error.error_description || error.error}`);
      }
    } catch (error) {
      console.error('Error revoking Square token:', error);
      throw error;
    }
  }
}

// Create and export Square service instance
const squareConfig: SquareConfig = {
  clientId: process.env.SQUARE_CLIENT_ID || '',
  clientSecret: process.env.SQUARE_CLIENT_SECRET || '',
  environment: (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  redirectUri: process.env.SQUARE_REDIRECT_URI || 'http://localhost:5000/api/integrations/square/callback',
};

export const squareService = new SquareService(squareConfig); 