import { 
  users, clients, campaigns, appointments, integrations, campaignRecipients, businessProfiles,
  type User, type InsertUser, type Client, type InsertClient,
  type Campaign, type InsertCampaign, type Appointment, type InsertAppointment,
  type Integration, type InsertIntegration, type CampaignRecipient, type InsertCampaignRecipient,
  type BusinessProfile, type InsertBusinessProfile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Business Profile methods
  getBusinessProfile(userId: string): Promise<BusinessProfile | undefined>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(userId: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;

  // Client methods
  getClients(userId: string): Promise<Client[]>;
  getClient(id: string, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string, userId: string): Promise<boolean>;

  // Campaign methods
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: string, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string, userId: string): Promise<boolean>;

  // Appointment methods
  getAppointments(userId: string): Promise<Appointment[]>;
  getRecentAppointments(userId: string, days: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByCampaign(campaignId: string): Promise<Appointment[]>;

  // Integration methods
  getIntegrations(userId: string): Promise<Integration[]>;
  getIntegration(userId: string, provider: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;

  // Analytics methods
  getOverviewMetrics(userId: string): Promise<{
    appointmentsCount30d: number;
    appointmentsCount7d: number;
    topCampaign: { name: string; bookings: number } | null;
    appointmentsGrowth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updatedUser || undefined;
  }

  async getBusinessProfile(userId: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId));
    return profile || undefined;
  }

  async createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    const [newProfile] = await db.insert(businessProfiles).values(profile).returning();
    return newProfile;
  }

  async updateBusinessProfile(userId: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined> {
    const [updatedProfile] = await db.update(businessProfiles).set(profile).where(eq(businessProfiles.userId, userId)).returning();
    return updatedProfile || undefined;
  }

  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string, userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values({
      ...client,
      tags: client.tags || []
    }).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const updateData = { ...client };
    if (updateData.tags) {
      updateData.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
    }
    const [updatedClient] = await db.update(clients).set(updateData).where(eq(clients.id, id)).returning();
    return updatedClient || undefined;
  }

  async deleteClient(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string, userId: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return campaign || undefined;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const campaignData = { ...campaign };
    if (campaignData.audience && typeof campaignData.audience === 'object') {
      campaignData.audience = {
        segmentType: campaignData.audience.segmentType || 'all',
        filters: campaignData.audience.filters || {},
        clientIds: Array.isArray(campaignData.audience.clientIds) ? campaignData.audience.clientIds : []
      };
    }
    const [newCampaign] = await db.insert(campaigns).values(campaignData).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const updateData = { ...campaign };
    if (updateData.audience && typeof updateData.audience === 'object') {
      updateData.audience = {
        segmentType: updateData.audience.segmentType || 'all',
        filters: updateData.audience.filters || {},
        clientIds: Array.isArray(updateData.audience.clientIds) ? updateData.audience.clientIds : []
      };
    }
    const [updatedCampaign] = await db.update(campaigns).set(updateData).where(eq(campaigns.id, id)).returning();
    return updatedCampaign || undefined;
  }

  async deleteCampaign(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getAppointments(userId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(desc(appointments.createdAt));
  }

  async getRecentAppointments(userId: string, days: number): Promise<Appointment[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return await db.select()
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        gte(appointments.createdAt, since)
      ))
      .orderBy(desc(appointments.createdAt));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointmentsByCampaign(campaignId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.campaignId, campaignId));
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegration(userId: string, provider: string): Promise<Integration | undefined> {
    const [integration] = await db.select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)));
    return integration || undefined;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updatedIntegration] = await db.update(integrations).set(integration).where(eq(integrations.id, id)).returning();
    return updatedIntegration || undefined;
  }

  async getOverviewMetrics(userId: string): Promise<{
    appointmentsCount30d: number;
    appointmentsCount7d: number;
    topCampaign: { name: string; bookings: number } | null;
    appointmentsGrowth: number;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get appointments count for last 30 days
    const [appointments30d] = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        gte(appointments.createdAt, thirtyDaysAgo)
      ));

    // Get appointments count for last 7 days
    const [appointments7d] = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        gte(appointments.createdAt, sevenDaysAgo)
      ));

    // Get appointments count for previous 30 days (for growth calculation)
    const [appointmentsPrev30d] = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        gte(appointments.createdAt, sixtyDaysAgo),
        sql`${appointments.createdAt} < ${thirtyDaysAgo}`
      ));

    // Get top performing campaign
    const topCampaignResult = await db
      .select({
        name: campaigns.name,
        bookings: campaigns.appointmentsBooked,
      })
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.appointmentsBooked))
      .limit(1);

    const appointmentsCount30d = appointments30d?.count || 0;
    const appointmentsCount7d = appointments7d?.count || 0;
    const appointmentsPrevCount = appointmentsPrev30d?.count || 0;
    
    const appointmentsGrowth = appointmentsPrevCount > 0 
      ? ((appointmentsCount30d - appointmentsPrevCount) / appointmentsPrevCount) * 100
      : appointmentsCount30d > 0 ? 100 : 0;

    const topCampaign = topCampaignResult.length > 0 
      ? { name: topCampaignResult[0].name, bookings: topCampaignResult[0].bookings || 0 }
      : null;

    return {
      appointmentsCount30d,
      appointmentsCount7d,
      topCampaign,
      appointmentsGrowth,
    };
  }
}

export const storage = new DatabaseStorage();
