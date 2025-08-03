# Database Setup Guide

This guide will help you set up and access the PostgreSQL database for ZenBooker.

## Database Options

### Option 1: Neon (Recommended - Free Tier)
1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from the dashboard
4. Add it to your `.env` file as `DATABASE_URL`

### Option 2: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a new database: `createdb zenbooker`
3. Set `DATABASE_URL=postgresql://username:password@localhost:5432/zenbooker`

### Option 3: Supabase (Free Tier)
1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Copy the connection string from Settings > Database
4. Add it to your `.env` file as `DATABASE_URL`

## Environment Variables

Add this to your `.env` file:
```env
DATABASE_URL=your_database_connection_string_here
```

## Database Schema

The application uses Drizzle ORM with the following tables:

### Users Table
- `id`: Primary key (UUID)
- `username`: Unique username
- `email`: User email
- `password`: Hashed password
- `businessName`: Business name
- `createdAt`: Account creation timestamp

### Clients Table
- `id`: Primary key (UUID)
- `userId`: Foreign key to users
- `name`: Client name
- `email`: Client email
- `phone`: Phone number
- `squareCustomerId`: Square customer ID
- `lastVisit`: Last visit date
- `tags`: Array of tags
- `metadata`: JSON metadata
- `createdAt`: Record creation timestamp

### Campaigns Table
- `id`: Primary key (UUID)
- `userId`: Foreign key to users
- `name`: Campaign name
- `subject`: Email subject
- `body`: Email body
- `audience`: JSON audience configuration
- `status`: Campaign status (draft, sending, sent, scheduled)
- `scheduledAt`: Scheduled send time
- `sentAt`: Actual send time
- `recipientCount`: Number of recipients
- `appointmentsBooked`: Number of appointments booked
- `createdAt`: Campaign creation timestamp

### Appointments Table
- `id`: Primary key (UUID)
- `userId`: Foreign key to users
- `clientId`: Foreign key to clients
- `campaignId`: Foreign key to campaigns
- `squareAppointmentId`: Square appointment ID
- `appointmentDate`: Appointment date/time
- `service`: Service name
- `amount`: Amount in cents
- `status`: Appointment status
- `createdAt`: Record creation timestamp

### Integrations Table
- `id`: Primary key (UUID)
- `userId`: Foreign key to users
- `provider`: Integration provider (square, sendgrid, etc.)
- `apiKey`: API key or token
- `settings`: JSON settings
- `isActive`: Integration status
- `createdAt`: Record creation timestamp

## Database Commands

### Push Schema to Database
```bash
npm run db:push
```

### Generate Migration
```bash
npx drizzle-kit generate
```

### Apply Migrations
```bash
npx drizzle-kit migrate
```

### View Database in Browser
```bash
npx drizzle-kit studio
```

## Database Access Methods

### 1. Drizzle Studio (Web Interface)
```bash
npx drizzle-kit studio
```
This opens a web interface at `http://localhost:4983` where you can:
- View all tables
- Browse and edit data
- Run queries
- Export data

### 2. Direct Database Connection
If using Neon or Supabase, you can connect directly:
- **Neon**: Use the SQL Editor in the dashboard
- **Supabase**: Use the Table Editor in the dashboard
- **Local**: Use `psql` command line tool

### 3. Programmatic Access
The application uses Drizzle ORM for all database operations:

```typescript
// Example: Get all clients for a user
const clients = await storage.getClients(userId);

// Example: Create a new campaign
const campaign = await storage.createCampaign({
  userId,
  name: "Spring Campaign",
  subject: "Welcome back!",
  body: "We miss you...",
  audience: { segmentType: "all", filters: {}, clientIds: [] },
  status: "draft"
});
```

## Testing the Database

### 1. Start the Application
```bash
npm run dev
```

### 2. Create a Test User
- Go to `/login`
- Click "Sign up"
- Create a new account
- This will create a user in the database

### 3. Verify Data
- Use Drizzle Studio: `npx drizzle-kit studio`
- Check the `users` table for your new user
- The application will automatically create related records

## Troubleshooting

### Common Issues

1. **"DATABASE_URL must be set"**
   - Make sure your `.env` file has the `DATABASE_URL` variable
   - Check that the connection string is correct

2. **"Connection failed"**
   - Verify your database is running
   - Check firewall settings
   - Ensure the connection string is correct

3. **"Table does not exist"**
   - Run `npm run db:push` to create tables
   - Check that the schema is correct

4. **"Permission denied"**
   - Check database user permissions
   - Ensure the user has CREATE, SELECT, INSERT, UPDATE, DELETE permissions

### Database Reset
To reset the database (WARNING: This deletes all data):
```bash
# Drop all tables and recreate
npx drizzle-kit drop
npm run db:push
```

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for database users
- Enable SSL for production database connections
- Regularly backup your database
- Use connection pooling for production deployments 