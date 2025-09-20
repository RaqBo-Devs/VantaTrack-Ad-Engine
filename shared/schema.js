import { pgTable, serial, varchar, text, boolean, timestamp, integer, decimal, date } from "drizzle-orm/pg-core";

// Users table - agencies, portal owners, clients
export const vantatrackUsers = pgTable("vantatrack_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // agency_admin, client_user, client_admin, portal_owner
  agencyId: integer("agency_id"),
  clientId: integer("client_id"), // For client users - links to vantatrackClients
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Clients table with platform permissions
export const vantatrackClients = pgTable("vantatrack_clients", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  agencyId: integer("agency_id").notNull(),
  portalAccess: boolean("portal_access").default(false),
  googleAccess: boolean("google_access").default(false),
  facebookAccess: boolean("facebook_access").default(false),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  monthlyPackageBdt: decimal("monthly_package_bdt", { precision: 15, scale: 2 }), // Package amount in BDT
  contractStartDate: date("contract_start_date"), // Contract start date
  notes: text("notes"), // Admin notes about the client
  status: varchar("status", { length: 50 }).default("invited"), // invited, active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Portal campaigns
export const vantatrackCampaigns = pgTable("vantatrack_campaigns", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  campaignType: varchar("campaign_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  budgetBdt: decimal("budget_bdt", { precision: 15, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  costBdt: decimal("cost_bdt", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Google campaigns
export const vantatrackGoogleCampaigns = pgTable("vantatrack_google_campaigns", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  googleCampaignId: varchar("google_campaign_id", { length: 255 }),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  campaignType: varchar("campaign_type", { length: 100 }),
  status: varchar("status", { length: 50 }),
  budgetUsd: decimal("budget_usd", { precision: 15, scale: 2 }),
  budgetBdt: decimal("budget_bdt", { precision: 15, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  costUsd: decimal("cost_usd", { precision: 15, scale: 2 }).default("0"),
  costBdt: decimal("cost_bdt", { precision: 15, scale: 2 }).default("0"),
  ctr: decimal("ctr", { precision: 5, scale: 4 }),
  cpcUsd: decimal("cpc_usd", { precision: 10, scale: 4 }),
  dataSource: varchar("data_source", { length: 50 }).default("manual"), // api or manual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook campaigns
export const vantatrackFacebookCampaigns = pgTable("vantatrack_facebook_campaigns", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  facebookCampaignId: varchar("facebook_campaign_id", { length: 255 }),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  campaignObjective: varchar("campaign_objective", { length: 100 }),
  status: varchar("status", { length: 50 }),
  budgetUsd: decimal("budget_usd", { precision: 15, scale: 2 }),
  budgetBdt: decimal("budget_bdt", { precision: 15, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  costUsd: decimal("cost_usd", { precision: 15, scale: 2 }).default("0"),
  costBdt: decimal("cost_bdt", { precision: 15, scale: 2 }).default("0"),
  ctr: decimal("ctr", { precision: 5, scale: 4 }),
  cpcUsd: decimal("cpc_usd", { precision: 10, scale: 4 }),
  dataSource: varchar("data_source", { length: 50 }).default("manual"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Upload history
export const vantatrackUploadHistory = pgTable("vantatrack_upload_history", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  userId: integer("user_id").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // google, facebook
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  recordsProcessed: integer("records_processed").default(0),
  recordsSuccess: integer("records_success").default(0),
  recordsFailed: integer("records_failed").default(0),
  uploadStatus: varchar("upload_status", { length: 50 }).default("processing"),
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invites table for invite-only client onboarding
export const vantatrackInvites = pgTable("vantatrack_invites", {
  id: serial("id").primaryKey(),
  codeHash: varchar("code_hash", { length: 255 }).notNull().unique(), // SHA-256 hash of invite code
  clientId: integer("client_id").notNull(), // References vantatrackClients
  invitedEmail: varchar("invited_email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("client_admin"), // Role for invited user
  portalAccess: boolean("portal_access").default(false),
  googleAccess: boolean("google_access").default(false),
  facebookAccess: boolean("facebook_access").default(false),
  packageAmountBdt: decimal("package_amount_bdt", { precision: 15, scale: 2 }),
  contractStartDate: date("contract_start_date"),
  notes: text("notes"),
  expiresAt: timestamp("expires_at").notNull(), // 7 days from creation
  usedAt: timestamp("used_at"), // When invite was activated
  createdByUserId: integer("created_by_user_id").notNull(), // Admin who created invite
  createdAt: timestamp("created_at").defaultNow(),
});

// User login activity tracking
export const vantatrackUserLoginActivity = pgTable("vantatrack_user_login_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  loginMethod: varchar("login_method", { length: 50 }).default("password"), // password, jwt, etc
  createdAt: timestamp("created_at").defaultNow(),
});