# Square OAuth Integration Setup

This guide will help you set up the Square OAuth integration for ZenBooker.

## Prerequisites

1. A Square Developer account
2. A Square application created in the Square Developer Dashboard

## Step 1: Create a Square Application

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Click "New Application"
3. Give your application a name (e.g., "ZenBooker Integration")
4. Select the appropriate permissions:
   - **Customers**: Read access to customer data
   - **Bookings**: Read access to booking data
   - **Merchant Profile**: Read access to merchant information

## Step 2: Configure OAuth Settings

1. In your Square application dashboard, go to "OAuth" in the left sidebar
2. Add the following redirect URI:
   ```
   http://localhost:5000/api/integrations/square/callback
   ```
3. For production, add your production domain:
   ```
   https://yourdomain.com/api/integrations/square/callback
   ```

## Step 3: Get Your Credentials

1. In your Square application dashboard, go to "Credentials"
2. Copy your **Application ID** (this is your Client ID)
3. Copy your **Application Secret** (this is your Client Secret)

## Step 4: Set Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Square API Configuration
SQUARE_CLIENT_ID=your_application_id_here
SQUARE_CLIENT_SECRET=your_application_secret_here
SQUARE_ENVIRONMENT=sandbox
SQUARE_REDIRECT_URI=http://localhost:5000/api/integrations/square/callback

# Other required variables
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_database_url_here
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the Integrations page in your app
3. Click "Connect Square"
4. You should be redirected to Square's OAuth page
5. After authorization, you'll be redirected back to your app
6. Your Square customers should be automatically synced

## Features

Once connected, the Square integration provides:

- **Automatic Customer Sync**: Imports all customers from Square
- **Booking Tracking**: Syncs recent bookings and appointments
- **Token Management**: Automatically refreshes expired tokens
- **Manual Sync**: Button to manually sync data
- **Disconnect**: Ability to revoke access and disconnect

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Make sure the redirect URI in your Square app matches exactly
   - Check for trailing slashes or protocol mismatches

2. **"Invalid client_id" error**
   - Verify your SQUARE_CLIENT_ID environment variable is correct
   - Make sure you're using the Application ID, not the Application Secret

3. **"Access denied" error**
   - Check that your Square app has the required permissions
   - Ensure you're using the correct environment (sandbox vs production)

4. **Token refresh failures**
   - The app will automatically try to refresh expired tokens
   - If refresh fails, users will need to reconnect their Square account

### Testing in Sandbox

- Use Square's sandbox environment for testing
- Create test customers and bookings in the Square sandbox
- Switch to production environment when ready to go live

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive credentials
- The app automatically handles token refresh and revocation
- Square access tokens are encrypted and stored securely

## Production Deployment

For production deployment:

1. Update `SQUARE_ENVIRONMENT` to `production`
2. Update `SQUARE_REDIRECT_URI` to your production domain
3. Ensure your Square app is approved for production use
4. Set up proper SSL certificates for secure OAuth flow 