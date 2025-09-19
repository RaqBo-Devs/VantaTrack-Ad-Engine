import { pgTable, serial, varchar, text, boolean, timestamp, integer, decimal, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - agencies, portal owners, clients
export const vantatrackUsers = pgTable("vantatrack_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // agency_admin, client_user, client_admin, portal_owner
  agencyId: integer("agency_id"),
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

// Export types
export type User = typeof vantatrackUsers.$inferSelect;
export type InsertUser = typeof vantatrackUsers.$inferInsert;
export type Client = typeof vantatrackClients.$inferSelect;
export type InsertClient = typeof vantatrackClients.$inferInsert;
export type Campaign = typeof vantatrackCampaigns.$inferSelect;
export type GoogleCampaign = typeof vantatrackGoogleCampaigns.$inferSelect;
export type FacebookCampaign = typeof vantatrackFacebookCampaigns.$inferSelect;
export type UploadHistory = typeof vantatrackUploadHistory.$inferSelect;