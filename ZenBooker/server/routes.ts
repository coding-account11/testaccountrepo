import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertClientSchema, insertCampaignSchema, insertAppointmentSchema, insertIntegrationSchema, insertBusinessProfileSchema
} from "@shared/schema";
import { generateCampaignContent, cleanClientData } from "./services/gemini";
import { squareService } from "./services/square";
import { gmailService } from "./services/gmail";
import { autoCampaignService } from "./services/auto-campaign";
import { authService } from "./services/auth";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const user = await authService.getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, businessName } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      const result = await authService.register({
        username,
        email,
        password,
        businessName,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await authService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Overview metrics
  app.get("/api/overview/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const metrics = await storage.getOverviewMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching overview metrics:", error);
      res.status(500).json({ message: "Failed to fetch overview metrics" });
    }
  });

  // Activity tracking
  app.get("/api/activity/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get recent activity - campaigns sent, appointments booked, etc.
      const recentCampaigns = await storage.getCampaigns(userId);
      const recentAppointments = await storage.getAppointments(userId);
      
      const activities: any[] = [];
      
      // Add campaign activities
      recentCampaigns
        .filter(c => c.sentAt)
        .slice(0, 3)
        .forEach(campaign => {
          activities.push({
            id: `campaign-${campaign.id}`,
            description: `Campaign "${campaign.name}" sent to ${campaign.recipientCount || 0} clients`,
            timestamp: formatTimeAgo(campaign.sentAt!.toString()),
            type: "success"
          });
        });

      // Add appointment activities
      recentAppointments
        .slice(0, 3)
        .forEach(appointment => {
          activities.push({
            id: `appointment-${appointment.id}`,
            description: `New appointment booked${appointment.campaignId ? ` from campaign` : ''}`,
            timestamp: formatTimeAgo(appointment.createdAt!.toString()),
            type: "info"
          });
        });

      // Sort by timestamp and limit to recent items
      activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      
      res.json(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Clients endpoints
  app.get("/api/clients/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id/:userId", async (req, res) => {
    try {
      const { id, userId } = req.params;
      const success = await storage.deleteClient(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // CSV upload with file handling
  app.post("/api/clients/upload-csv", upload.single('file'), async (req, res) => {
    try {
      const { userId } = req.body;
      const file = req.file;
      
      if (!file || !userId) {
        return res.status(400).json({ message: "CSV file and user ID are required" });
      }

      // Convert buffer to string
      const csvData = file.buffer.toString('utf-8');

      // Clean and structure the CSV data using Gemini AI
      const cleanedData = await cleanClientData(csvData);

      // Create clients from cleaned data
      const createdClients = [];
      for (const clientData of cleanedData) {
        try {
          const client = await storage.createClient({
            ...clientData,
            userId,
          });
          createdClients.push(client);
        } catch (error) {
          console.error("Error creating client from CSV:", error);
        }
      }

      res.json({ 
        message: `Successfully imported ${createdClients.length} clients`,
        clients: createdClients 
      });
    } catch (error) {
      console.error("Error processing CSV upload:", error);
      res.status(500).json({ message: "Failed to process CSV upload" });
    }
  });

  // Campaigns endpoints
  app.get("/api/campaigns/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(400).json({ message: "Failed to create campaign" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaignData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(id, campaignData);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(400).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id/:userId", async (req, res) => {
    try {
      const { id, userId } = req.params;
      const success = await storage.deleteCampaign(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // AI-powered campaign content generation
  app.post("/api/campaigns/generate-content", async (req, res) => {
    try {
      const { 
        businessType, 
        campaignType, 
        targetAudience, 
        customPrompt,
        seasonalTheme,
        focusKeywords,
        additionalInstructions,
        userId
      } = req.body;
      
      // Fetch business profile for better personalization
      let businessProfile = null;
      if (userId) {
        try {
          const profile = await storage.getBusinessProfile(userId);
          if (profile) {
            businessProfile = {
              businessName: profile.businessName || undefined,
              businessCategory: profile.businessCategory || undefined,
              location: profile.location || undefined,
              brandVoice: profile.brandVoice || undefined,
              shortBusinessBio: profile.shortBusinessBio || undefined,
              productsServices: profile.productsServices || undefined,
              businessMaterials: profile.businessMaterials || undefined
            };
          }
        } catch (error) {
          console.error("Error fetching business profile:", error);
          // Continue without business profile if there's an error
        }
      }
      
      const content = await generateCampaignContent({
        businessType,
        campaignType,
        targetAudience,
        customPrompt,
        seasonalTheme,
        focusKeywords,
        additionalInstructions,
        businessProfile: businessProfile || undefined,
      });
      
      res.json(content);
    } catch (error) {
      console.error("Error generating campaign content:", error);
      res.status(500).json({ message: "Failed to generate campaign content" });
    }
  });

  // Send campaign
  app.post("/api/campaigns/:id/send", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const campaign = await storage.getCampaign(id, userId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Get campaign recipients
      const clients = await storage.getClients(userId);
      const recipients = campaign.audience?.clientIds 
        ? clients.filter(client => campaign.audience!.clientIds.includes(client.id))
        : clients;

      // Send personalized emails to each recipient
      const emailPromises = recipients.map(async (client) => {
        try {
          // Use campaign subject and body (personalization can be added later)
          const subject = campaign.subject;
          const body = campaign.body;

          // Send email via Gmail (implemented in gmail.ts)
          // await gmailService.sendEmail(accessToken, {
          //   to: client.email,
          //   subject,
          //   body,
          // });

          return { success: true, clientId: client.id };
        } catch (error) {
          console.error(`Failed to send email to ${client.email}:`, error);
          return { success: false, clientId: client.id, error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      // Update campaign status
      await storage.updateCampaign(id, {
        status: "sent",
        sentAt: new Date(),
        recipientCount: recipients.length,
      });

      res.json({
        message: `Campaign sent to ${success} recipients (${failed} failed)`,
        success,
        failed,
        results
      });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  // Appointments endpoints
  app.get("/api/appointments/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      
      // Update campaign booking count if associated with a campaign
      if (appointment.campaignId) {
        const campaignAppointments = await storage.getAppointmentsByCampaign(appointment.campaignId);
        await storage.updateCampaign(appointment.campaignId, {
          appointmentsBooked: campaignAppointments.length,
        });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: "Failed to create appointment" });
    }
  });

  // Integrations endpoints
  app.get("/api/integrations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const integrations = await storage.getIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      const integrationData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(integrationData);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(400).json({ message: "Failed to create integration" });
    }
  });

  app.put("/api/integrations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const integrationData = insertIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(id, integrationData);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(400).json({ message: "Failed to update integration" });
    }
  });

  // Square OAuth integration
  app.get("/api/integrations/square/auth", async (req, res) => {
    try {
      const userId = "user-1"; // In real app, get from session
      
      // Generate state parameter for security
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      
      // Generate Square OAuth URL
      const authUrl = squareService.generateAuthUrl(state);
      
      // Store state in session or temporary storage (for demo, we'll redirect directly)
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error generating Square OAuth URL:", error);
      res.redirect('/integrations?error=square_auth_failed');
    }
  });

  app.get("/api/integrations/square/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.redirect('/integrations?error=no_auth_code');
      }

      if (!state) {
        return res.redirect('/integrations?error=no_state');
      }

      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const userId = stateData.userId;

      // Exchange authorization code for access token
      const authResponse = await squareService.exchangeCodeForToken(code as string);
      
      // Get merchant locations
      const locations = await squareService.getLocations(authResponse.accessToken);
      const primaryLocation = locations.find(loc => loc.status === 'ACTIVE') || locations[0];
      
      // Create or update integration record
      const integration = await storage.createIntegration({
        userId,
        provider: "square",
        apiKey: authResponse.accessToken,
        settings: JSON.stringify({
          autoSync: true,
          syncInterval: "24h",
          locationId: primaryLocation?.id,
          merchantId: authResponse.merchantId,
          refreshToken: authResponse.refreshToken,
          expiresAt: authResponse.expiresAt.toISOString(),
          locations: locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            status: loc.status,
          })),
        }),
        isActive: true
      });

      // Sync customers from Square
      try {
        const customers = await squareService.getCustomers(authResponse.accessToken);
        for (const customer of customers) {
          // Check if customer already exists
          const existingClients = await storage.getClients(userId);
          const existingClient = existingClients.find(c => c.email === customer.emailAddress);
          
          if (!existingClient) {
            await storage.createClient({
              userId,
              name: `${customer.givenName} ${customer.familyName}`.trim(),
              email: customer.emailAddress,
              phone: customer.phoneNumber,
              squareCustomerId: customer.id,
              tags: ['square-import'],
              metadata: {
                squareCustomerId: customer.id,
                importedAt: new Date().toISOString(),
              },
            });
          }
        }
      } catch (syncError) {
        console.error("Error syncing customers from Square:", syncError);
        // Don't fail the OAuth flow if sync fails
      }

      res.redirect('/integrations?connected=square');
    } catch (error) {
      console.error("Error handling Square callback:", error);
      res.redirect('/integrations?error=square_callback_failed');
    }
  });

  // Sync data from Square
  app.post("/api/integrations/square/sync", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get Square integration
      const integration = await storage.getIntegration(userId, "square");
      if (!integration || !integration.isActive) {
        return res.status(400).json({ message: "Square integration not found or inactive" });
      }

      const settings = JSON.parse(integration.settings);
      let accessToken = integration.apiKey;

      // Check if token is expired and refresh if needed
      if (settings.expiresAt && new Date(settings.expiresAt) <= new Date()) {
        try {
          const authResponse = await squareService.refreshToken(settings.refreshToken);
          
          // Update integration with new tokens
          await storage.updateIntegration(integration.id, {
            apiKey: authResponse.accessToken,
            settings: JSON.stringify({
              ...settings,
              refreshToken: authResponse.refreshToken,
              expiresAt: authResponse.expiresAt.toISOString(),
            }),
          });
          
          // Use new access token
          accessToken = authResponse.accessToken;
        } catch (refreshError) {
          console.error("Error refreshing Square token:", refreshError);
          return res.status(401).json({ message: "Square token expired and could not be refreshed" });
        }
      }

      const syncResults = {
        customers: { synced: 0, errors: 0 },
        bookings: { synced: 0, errors: 0 },
      };

      // Sync customers
      try {
        const customers = await squareService.getCustomers(accessToken);
        for (const customer of customers) {
          try {
            const existingClients = await storage.getClients(userId);
            const existingClient = existingClients.find(c => c.email === customer.emailAddress);
            
            if (!existingClient) {
              await storage.createClient({
                userId,
                name: `${customer.givenName} ${customer.familyName}`.trim(),
                email: customer.emailAddress,
                phone: customer.phoneNumber,
                squareCustomerId: customer.id,
                tags: ['square-import'],
                metadata: {
                  squareCustomerId: customer.id,
                  importedAt: new Date().toISOString(),
                },
              });
              syncResults.customers.synced++;
            }
          } catch (error) {
            console.error(`Error syncing customer ${customer.id}:`, error);
            syncResults.customers.errors++;
          }
        }
      } catch (error) {
        console.error("Error syncing customers:", error);
        syncResults.customers.errors++;
      }

      // Sync bookings (if location is available)
      if (settings.locationId) {
        try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const bookings = await squareService.getBookings(
            accessToken,
            settings.locationId,
            thirtyDaysAgo.toISOString(),
            new Date().toISOString()
          );
          
          for (const booking of bookings) {
            try {
              // Check if appointment already exists
              const existingAppointments = await storage.getAppointments(userId);
              const existingAppointment = existingAppointments.find(a => a.squareAppointmentId === booking.id);
              
              if (!existingAppointment) {
                await storage.createAppointment({
                  userId,
                  squareAppointmentId: booking.id,
                  appointmentDate: new Date(booking.startAt),
                  service: "Square Booking", // You might want to get service name from Square
                  status: booking.status === "ACCEPTED" ? "booked" : "pending",
                  amount: 0, // You might want to get amount from Square
                });
                syncResults.bookings.synced++;
              }
            } catch (error) {
              console.error(`Error syncing booking ${booking.id}:`, error);
              syncResults.bookings.errors++;
            }
          }
        } catch (error) {
          console.error("Error syncing bookings:", error);
          syncResults.bookings.errors++;
        }
      }

      res.json({
        message: "Square sync completed",
        results: syncResults,
      });
    } catch (error) {
      console.error("Error syncing from Square:", error);
      res.status(500).json({ message: "Failed to sync from Square" });
    }
  });

  // Disconnect Square integration
  app.post("/api/integrations/square/disconnect", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get Square integration
      const integration = await storage.getIntegration(userId, "square");
      if (!integration) {
        return res.status(404).json({ message: "Square integration not found" });
      }

      // Revoke access token
      try {
        await squareService.revokeToken(integration.apiKey);
      } catch (revokeError) {
        console.error("Error revoking Square token:", revokeError);
        // Continue with disconnection even if revocation fails
      }

      // Deactivate integration
      await storage.updateIntegration(integration.id, {
        isActive: false,
        settings: JSON.stringify({
          ...JSON.parse(integration.settings),
          disconnectedAt: new Date().toISOString(),
        }),
      });

      res.json({ message: "Square integration disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Square:", error);
      res.status(500).json({ message: "Failed to disconnect Square" });
    }
  });

  // Gmail OAuth integration
  app.get("/api/integrations/gmail/auth", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Generate state parameter for security
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      
      // Generate Gmail OAuth URL
      const authUrl = gmailService.generateAuthUrl(state);
      
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error generating Gmail OAuth URL:", error);
      res.redirect('/integrations?error=gmail_auth_failed');
    }
  });

  app.get("/api/integrations/gmail/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.redirect('/integrations?error=no_auth_code');
      }

      if (!state) {
        return res.redirect('/integrations?error=no_state');
      }

      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const userId = stateData.userId;

      // Exchange authorization code for tokens
      const authResponse = await gmailService.exchangeCodeForTokens(code as string);
      
      // Create or update integration record
      const integration = await storage.createIntegration({
        userId,
        provider: "gmail",
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        tokenExpiry: authResponse.expiryDate,
        settings: JSON.stringify({
          autoSync: true,
          syncInterval: "24h",
          connectedAt: new Date().toISOString(),
        }),
        isActive: true
      });

      res.redirect('/integrations?connected=gmail');
    } catch (error) {
      console.error("Error handling Gmail callback:", error);
      res.redirect('/integrations?error=gmail_callback_failed');
    }
  });

  // Send email via Gmail
  app.post("/api/integrations/gmail/send", async (req, res) => {
    try {
      const { userId, to, subject, body, from } = req.body;
      
      if (!userId || !to || !subject || !body) {
        return res.status(400).json({ message: "User ID, recipient, subject, and body are required" });
      }

      // Get Gmail integration
      const integration = await storage.getIntegration(userId, "gmail");
      if (!integration || !integration.isActive) {
        return res.status(400).json({ message: "Gmail integration not found or inactive" });
      }

      let accessToken = integration.accessToken;

      // Check if token is expired and refresh if needed
      if (integration.tokenExpiry && gmailService.isTokenExpired(new Date(integration.tokenExpiry))) {
        try {
          const authResponse = await gmailService.refreshAccessToken(integration.refreshToken!);
          
          // Update integration with new tokens
          await storage.updateIntegration(integration.id, {
            accessToken: authResponse.accessToken,
            refreshToken: authResponse.refreshToken,
            tokenExpiry: authResponse.expiryDate,
          });
          
          // Use new access token
          accessToken = authResponse.accessToken;
        } catch (refreshError) {
          console.error("Error refreshing Gmail token:", refreshError);
          return res.status(401).json({ message: "Gmail token expired and could not be refreshed" });
        }
      }

      // Send email
      const success = await gmailService.sendEmail(accessToken, {
        to,
        subject,
        body,
        from
      });

      if (success) {
        res.json({ message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending email via Gmail:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Disconnect Gmail integration
  app.post("/api/integrations/gmail/disconnect", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get Gmail integration
      const integration = await storage.getIntegration(userId, "gmail");
      if (!integration) {
        return res.status(404).json({ message: "Gmail integration not found" });
      }

      // Revoke access token
      try {
        await gmailService.revokeToken(integration.accessToken!);
      } catch (revokeError) {
        console.error("Error revoking Gmail token:", revokeError);
        // Continue with disconnection even if revocation fails
      }

      // Deactivate integration
      await storage.updateIntegration(integration.id, {
        isActive: false,
        settings: JSON.stringify({
          ...JSON.parse(integration.settings),
          disconnectedAt: new Date().toISOString(),
        }),
      });

      res.json({ message: "Gmail integration disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      res.status(500).json({ message: "Failed to disconnect Gmail" });
    }
  });

  // Auto-campaign endpoints
  app.post("/api/auto-campaigns/generate", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const result = await autoCampaignService.generateAutoCampaigns(userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error generating auto-campaigns:", error);
      res.status(500).json({ message: "Failed to generate auto-campaigns" });
    }
  });

  app.get("/api/auto-campaigns/upcoming/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const campaigns = await autoCampaignService.getUpcomingAutoCampaigns(userId);
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching upcoming auto-campaigns:", error);
      res.status(500).json({ message: "Failed to fetch upcoming auto-campaigns" });
    }
  });

  app.get("/api/auto-campaigns/next-date/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const nextDate = await autoCampaignService.getNextAutoCampaignDate(userId);
      
      res.json({ nextDate });
    } catch (error) {
      console.error("Error fetching next auto-campaign date:", error);
      res.status(500).json({ message: "Failed to fetch next auto-campaign date" });
    }
  });

  // Webhook endpoint for Square booking notifications
  app.post("/api/webhooks/square", async (req, res) => {
    try {
      const { data, event_type } = req.body;
      
      if (event_type === "booking.created" && data?.booking) {
        const booking = data.booking;
        
        // Extract campaign ID from the booking URL or metadata
        const campaignId = booking.appointment_segments?.[0]?.service_variation?.metadata?.campaign_id;
        
        if (campaignId) {
          // Create appointment record
          await storage.createAppointment({
            userId: "user-id-from-booking", // You'll need to determine this from the booking data
            squareAppointmentId: booking.id,
            campaignId,
            appointmentDate: new Date(booking.appointment_segments[0].start_time),
            service: booking.appointment_segments[0].service_variation?.name,
            status: "booked",
          });
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing Square webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Business profile endpoints
  app.post("/api/business-profile", async (req, res) => {
    try {
      const { userId, ...profileData } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ 
          message: "User not found. Please log in first or create an account." 
        });
      }

      // Include userId in the data to be validated
      const dataToValidate = {
        ...profileData,
        userId,
      };

      const validatedData = insertBusinessProfileSchema.parse(dataToValidate);
      
      // Check if profile exists
      const existingProfile = await storage.getBusinessProfile(userId);
      
      let profile;
      if (existingProfile) {
        // Update existing profile
        profile = await storage.updateBusinessProfile(userId, profileData);
      } else {
        // Create new profile
        profile = await storage.createBusinessProfile(validatedData);
      }
      
      res.json({ message: "Business profile updated successfully", profile });
    } catch (error: any) {
      console.error("Error updating business profile:", error);
      res.status(500).json({ message: error.message || "Failed to update business profile" });
    }
  });

  app.get("/api/business-profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getBusinessProfile(userId);
      
      res.json({ profile: profile || null });
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  // Helper function for time formatting
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  const httpServer = createServer(app);
  return httpServer;
}
