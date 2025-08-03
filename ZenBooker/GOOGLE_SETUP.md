# Google OAuth Setup for Gmail Integration

## 🔧 Step-by-Step Guide to Get Google API Credentials

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 2. Create a New Project (or select existing)
- Click on the project dropdown at the top
- Click "New Project"
- Name it something like "PromoPal Gmail Integration"
- Click "Create"

### 3. Enable Gmail API
- In the left sidebar, click "APIs & Services" > "Library"
- Search for "Gmail API"
- Click on "Gmail API"
- Click "Enable"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- If prompted, configure the OAuth consent screen first:
  - User Type: External
  - App name: "PromoPal"
  - User support email: Your email
  - Developer contact information: Your email
  - Save and continue through the steps

### 5. Configure OAuth Consent Screen
- App name: "PromoPal"
- User support email: Your email
- Developer contact information: Your email
- Authorized domains: Add "localhost" for development
- Scopes to add:
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/gmail.readonly` (optional)

### 6. Create OAuth 2.0 Client ID
- Application type: "Web application"
- Name: "PromoPal Web Client"
- Authorized redirect URIs:
  - `http://localhost:3001/api/integrations/gmail/callback`
- Click "Create"

### 7. Copy Your Credentials
You'll get:
- **Client ID**: A long string ending with `.apps.googleusercontent.com`
- **Client Secret**: A shorter string

### 8. Update Your .env File
Replace the placeholder values in your `.env` file:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/integrations/gmail/callback
```

### 9. Restart Your Server
After updating the credentials, restart your server:
```bash
pkill -f "tsx server/index.ts"
PORT=3001 NODE_ENV=development npx tsx server/index.ts
```

## 🚨 Important Notes

### For Development:
- The redirect URI must be exactly: `http://localhost:3001/api/integrations/gmail/callback`
- Make sure your server is running on port 3001

### For Production:
- You'll need to add your production domain to authorized redirect URIs
- Update the redirect URI in your `.env` file

### Testing:
- After setup, try clicking "Connect Gmail" in your PromoPal app
- You should be redirected to Google's OAuth consent screen
- After authorization, you'll be redirected back to PromoPal

## 🔍 Troubleshooting

### "Missing required parameter: client_id"
- Make sure `GOOGLE_CLIENT_ID` is set in your `.env` file
- Restart your server after updating `.env`

### "Redirect URI mismatch"
- Ensure the redirect URI in Google Console matches exactly: `http://localhost:3001/api/integrations/gmail/callback`
- Check that your server is running on port 3001

### "Access blocked"
- Make sure you've enabled the Gmail API
- Check that your OAuth consent screen is configured
- Verify your credentials are correct

## 📧 Gmail API Scopes

The app requests these permissions:
- `https://www.googleapis.com/auth/gmail.send` - Send emails on your behalf
- `https://www.googleapis.com/auth/gmail.readonly` - Read email metadata (optional)

This allows PromoPal to send win-back emails through your Gmail account while maintaining security. 