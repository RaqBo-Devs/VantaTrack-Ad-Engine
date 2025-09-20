import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import {
  vantatrackUsers,
  vantatrackClients,
  vantatrackCampaigns,
  vantatrackGoogleCampaigns,
  vantatrackFacebookCampaigns,
  vantatrackUploadHistory,
  vantatrackInvites,
  vantatrackUserLoginActivity
} from '../shared/schema.js';
import { eq, and, desc, isNull, gt, sql } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export class DatabaseStorage {
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async createUser(user) {
    const [newUser] = await db.insert(vantatrackUsers).values(user).returning();
    return newUser;
  }

  async getUserByEmail(email) {
    const [user] = await db.select().from(vantatrackUsers).where(eq(vantatrackUsers.email, email));
    return user;
  }

  async getUser(id) {
    const [user] = await db.select().from(vantatrackUsers).where(eq(vantatrackUsers.id, id));
    return user;
  }

  async getUserByUsername(username) {
    // For compatibility with auth integration - username maps to email
    return this.getUserByEmail(username);
  }

  // Get clients that a user has access to (for client users/admins)
  async getClientsByUser(userId) {
    // For now, implement simple mapping - in production this would be through a junction table
    const user = await this.getUser(userId);
    if (!user) return [];
    
    if (user.role === 'agency_admin') {
      return await this.getClientsByAgency(user.agencyId);
    }
    
    if (user.role === 'portal_owner') {
      return await db.select().from(vantatrackClients).where(eq(vantatrackClients.isActive, true));
    }
    
    // Client users - for now return empty, would need user-client mapping table
    return [];
  }

  // Client management
  async createClient(client) {
    const [newClient] = await db.insert(vantatrackClients).values(client).returning();
    return newClient;
  }

  async getClientsByAgency(agencyId) {
    return await db.select().from(vantatrackClients)
      .where(and(eq(vantatrackClients.agencyId, agencyId), eq(vantatrackClients.isActive, true)));
  }

  async getClient(id) {
    const [client] = await db.select().from(vantatrackClients).where(eq(vantatrackClients.id, id));
    return client;
  }

  async updateClientPermissions(clientId, permissions) {
    const [updated] = await db.update(vantatrackClients)
      .set({
        portalAccess: permissions.portalAccess,
        googleAccess: permissions.googleAccess,
        facebookAccess: permissions.facebookAccess,
        updatedAt: new Date()
      })
      .where(eq(vantatrackClients.id, clientId))
      .returning();
    return updated;
  }

  async updateClient(clientId, updates) {
    const [updated] = await db.update(vantatrackClients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vantatrackClients.id, clientId))
      .returning();
    return updated;
  }

  // Campaign management
  async createPortalCampaign(campaign) {
    const [newCampaign] = await db.insert(vantatrackCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async createGoogleCampaign(campaign) {
    const [newCampaign] = await db.insert(vantatrackGoogleCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async createFacebookCampaign(campaign) {
    const [newCampaign] = await db.insert(vantatrackFacebookCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async getCampaignsByClient(clientId) {
    const portalCampaigns = await db.select().from(vantatrackCampaigns)
      .where(eq(vantatrackCampaigns.clientId, clientId));
    
    const googleCampaigns = await db.select().from(vantatrackGoogleCampaigns)
      .where(eq(vantatrackGoogleCampaigns.clientId, clientId));
      
    const facebookCampaigns = await db.select().from(vantatrackFacebookCampaigns)
      .where(eq(vantatrackFacebookCampaigns.clientId, clientId));

    return {
      portal: portalCampaigns,
      google: googleCampaigns,
      facebook: facebookCampaigns
    };
  }

  // Upload history
  async createUploadRecord(upload) {
    const [newUpload] = await db.insert(vantatrackUploadHistory).values(upload).returning();
    return newUpload;
  }

  async getUploadHistory(clientId, limit = 10) {
    return await db.select().from(vantatrackUploadHistory)
      .where(eq(vantatrackUploadHistory.clientId, clientId))
      .orderBy(desc(vantatrackUploadHistory.createdAt))
      .limit(limit);
  }

  // Analytics
  async getDashboardMetrics(clientId) {
    const campaigns = await this.getCampaignsByClient(clientId);
    
    const metrics = {
      totalCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalSpent: 0,
      platforms: {
        portal: { active: false, campaigns: 0, spent: 0 },
        google: { active: false, campaigns: 0, spent: 0 },
        facebook: { active: false, campaigns: 0, spent: 0 }
      }
    };

    // Portal metrics
    campaigns.portal.forEach(campaign => {
      metrics.totalCampaigns++;
      metrics.totalImpressions += campaign.impressions || 0;
      metrics.totalClicks += campaign.clicks || 0;
      metrics.totalSpent += parseFloat(campaign.costBdt || 0);
      metrics.platforms.portal.campaigns++;
      metrics.platforms.portal.spent += parseFloat(campaign.costBdt || 0);
      metrics.platforms.portal.active = true;
    });

    // Google metrics
    campaigns.google.forEach(campaign => {
      metrics.totalCampaigns++;
      metrics.totalImpressions += campaign.impressions || 0;
      metrics.totalClicks += campaign.clicks || 0;
      metrics.totalSpent += parseFloat(campaign.costBdt || 0);
      metrics.platforms.google.campaigns++;
      metrics.platforms.google.spent += parseFloat(campaign.costBdt || 0);
      metrics.platforms.google.active = true;
    });

    // Facebook metrics
    campaigns.facebook.forEach(campaign => {
      metrics.totalCampaigns++;
      metrics.totalImpressions += campaign.impressions || 0;
      metrics.totalClicks += campaign.clicks || 0;
      metrics.totalSpent += parseFloat(campaign.costBdt || 0);
      metrics.platforms.facebook.campaigns++;
      metrics.platforms.facebook.spent += parseFloat(campaign.costBdt || 0);
      metrics.platforms.facebook.active = true;
    });

    return metrics;
  }

  // Admin invite system methods
  async getClientsWithInviteStatus(agencyId) {
    // Subquery to get the latest invite per client
    const latestInviteSubquery = db
      .select({
        clientId: vantatrackInvites.clientId,
        latestInviteId: sql`MAX(${vantatrackInvites.id})`.as('latest_invite_id')
      })
      .from(vantatrackInvites)
      .groupBy(vantatrackInvites.clientId)
      .as('latest_invites');

    // Get clients with their latest invite information
    const clients = await db.select({
      id: vantatrackClients.id,
      clientName: vantatrackClients.clientName,
      agencyId: vantatrackClients.agencyId,
      contactEmail: vantatrackClients.contactEmail,
      phone: vantatrackClients.phone,
      portalAccess: vantatrackClients.portalAccess,
      googleAccess: vantatrackClients.googleAccess,
      facebookAccess: vantatrackClients.facebookAccess,
      monthlyPackageBdt: vantatrackClients.monthlyPackageBdt,
      contractStartDate: vantatrackClients.contractStartDate,
      notes: vantatrackClients.notes,
      status: vantatrackClients.status,
      createdAt: vantatrackClients.createdAt,
      // Latest invite information
      inviteId: vantatrackInvites.id,
      inviteExpiry: vantatrackInvites.expiresAt,
      inviteUsed: vantatrackInvites.usedAt
    })
      .from(vantatrackClients)
      .leftJoin(latestInviteSubquery, eq(vantatrackClients.id, latestInviteSubquery.clientId))
      .leftJoin(vantatrackInvites, eq(latestInviteSubquery.latestInviteId, vantatrackInvites.id))
      .where(eq(vantatrackClients.agencyId, agencyId))
      .orderBy(desc(vantatrackClients.createdAt));

    return clients;
  }

  async createInvite(inviteData) {
    const [newInvite] = await db.insert(vantatrackInvites).values(inviteData).returning();
    return newInvite;
  }

  async regenerateInvite(clientId, inviteData) {
    // First, mark any existing invites as used
    await db.update(vantatrackInvites)
      .set({ usedAt: new Date() })
      .where(and(eq(vantatrackInvites.clientId, clientId), isNull(vantatrackInvites.usedAt)));

    // Create new invite
    const [newInvite] = await db.insert(vantatrackInvites)
      .values({
        ...inviteData,
        clientId
      })
      .returning();

    return newInvite;
  }

  async getPendingInvites(agencyId) {
    const invites = await db.select({
      id: vantatrackInvites.id,
      clientId: vantatrackInvites.clientId,
      invitedEmail: vantatrackInvites.invitedEmail,
      role: vantatrackInvites.role,
      expiresAt: vantatrackInvites.expiresAt,
      createdAt: vantatrackInvites.createdAt,
      clientName: vantatrackClients.clientName,
      packageAmountBdt: vantatrackInvites.packageAmountBdt
    })
      .from(vantatrackInvites)
      .innerJoin(vantatrackClients, eq(vantatrackInvites.clientId, vantatrackClients.id))
      .where(and(
        eq(vantatrackClients.agencyId, agencyId),
        isNull(vantatrackInvites.usedAt),
        gt(vantatrackInvites.expiresAt, new Date())
      ))
      .orderBy(desc(vantatrackInvites.createdAt));

    return invites;
  }

  async getInviteByCodeHash(codeHash) {
    const [invite] = await db.select({
      id: vantatrackInvites.id,
      clientId: vantatrackInvites.clientId,
      invitedEmail: vantatrackInvites.invitedEmail,
      role: vantatrackInvites.role,
      portalAccess: vantatrackInvites.portalAccess,
      googleAccess: vantatrackInvites.googleAccess,
      facebookAccess: vantatrackInvites.facebookAccess,
      expiresAt: vantatrackInvites.expiresAt,
      usedAt: vantatrackInvites.usedAt,
      clientName: vantatrackClients.clientName,
      agencyId: vantatrackClients.agencyId
    })
      .from(vantatrackInvites)
      .innerJoin(vantatrackClients, eq(vantatrackInvites.clientId, vantatrackClients.id))
      .where(eq(vantatrackInvites.codeHash, codeHash));

    return invite;
  }

  async markInviteAsUsed(inviteId) {
    const [updated] = await db.update(vantatrackInvites)
      .set({ usedAt: new Date() })
      .where(eq(vantatrackInvites.id, inviteId))
      .returning();
    return updated;
  }

  async logUserActivity(userId, ipAddress, userAgent, loginMethod = 'password') {
    const [activity] = await db.insert(vantatrackUserLoginActivity)
      .values({
        userId,
        ipAddress,
        userAgent,
        loginMethod
      })
      .returning();
    return activity;
  }
}

export const storage = new DatabaseStorage();