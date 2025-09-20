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

// ============ AD SERVING ENGINE TABLES ============

// Publishers (Bangladesh newspaper portals)
export const vantatrackPublishers = pgTable("vantatrack_publishers", {
  id: serial("id").primaryKey(),
  publisherName: varchar("publisher_name", { length: 255 }).notNull(), // Daily Star, Dhaka Tribune, etc
  domain: varchar("domain", { length: 255 }).notNull().unique(), // thedailystar.net
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  revenueSplit: decimal("revenue_split", { precision: 5, scale: 4 }).default("0.7000"), // 70% to publisher
  status: varchar("status", { length: 50 }).default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sites under each publisher
export const vantatrackSites = pgTable("vantatrack_sites", {
  id: serial("id").primaryKey(),
  publisherId: integer("publisher_id").notNull(),
  siteName: varchar("site_name", { length: 255 }).notNull(),
  siteUrl: varchar("site_url", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }), // news, sports, tech, etc
  language: varchar("language", { length: 10 }).default("bn"), // bn for Bengali, en for English
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad placements/units on sites
export const vantatrackPlacements = pgTable("vantatrack_placements", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  placementKey: varchar("placement_key", { length: 100 }).notNull().unique(), // embed key
  placementName: varchar("placement_name", { length: 255 }).notNull(),
  adSize: varchar("ad_size", { length: 50 }).notNull(), // 728x90, 300x250, 320x50, etc
  position: varchar("position", { length: 100 }), // header, sidebar, footer, content
  floorPriceBdt: decimal("floor_price_bdt", { precision: 10, scale: 2 }).default("0.50"), // minimum CPM
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad creatives/banners
export const vantatrackCreatives = pgTable("vantatrack_creatives", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  creativeName: varchar("creative_name", { length: 255 }).notNull(),
  creativeType: varchar("creative_type", { length: 50 }).notNull(), // banner, text, native
  adSize: varchar("ad_size", { length: 50 }).notNull(),
  htmlContent: text("html_content"), // For HTML banners
  imageUrl: varchar("image_url", { length: 500 }), // For image banners
  clickUrl: varchar("click_url", { length: 500 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign line items with targeting
export const vantatrackLineItems = pgTable("vantatrack_line_items", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(), // References vantatrackCampaigns
  creativeId: integer("creative_id").notNull(),
  lineItemName: varchar("line_item_name", { length: 255 }).notNull(),
  bidCpmBdt: decimal("bid_cpm_bdt", { precision: 10, scale: 2 }).notNull(), // CPM bid in BDT
  weight: integer("weight").default(100), // For rotation priority
  targetingSites: text("targeting_sites"), // JSON array of site IDs
  targetingCategories: text("targeting_categories"), // JSON array of categories
  targetingLanguages: text("targeting_languages"), // JSON array of languages
  targetingDevices: text("targeting_devices"), // JSON array: mobile, desktop, tablet
  dailyBudgetBdt: decimal("daily_budget_bdt", { precision: 15, scale: 2 }),
  totalBudgetBdt: decimal("total_budget_bdt", { precision: 15, scale: 2 }),
  spentBdt: decimal("spent_bdt", { precision: 15, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad serving events (impressions, clicks)
export const vantatrackAdEvents = pgTable("vantatrack_ad_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 20 }).notNull(), // impression, click
  placementId: integer("placement_id").notNull(),
  creativeId: integer("creative_id").notNull(),
  lineItemId: integer("line_item_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  clientId: integer("client_id").notNull(),
  siteId: integer("site_id").notNull(),
  publisherId: integer("publisher_id").notNull(),
  userIp: varchar("user_ip", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: varchar("referrer", { length: 500 }),
  deviceType: varchar("device_type", { length: 20 }), // mobile, desktop, tablet
  country: varchar("country", { length: 10 }), // BD, IN, etc
  revenueBdt: decimal("revenue_bdt", { precision: 10, scale: 4 }).default("0"), // Revenue for this event
  createdAt: timestamp("created_at").defaultNow(),
});

// Hourly aggregated metrics for fast reporting
export const vantatrackAdAggregates = pgTable("vantatrack_ad_aggregates", {
  id: serial("id").primaryKey(),
  hour: timestamp("hour").notNull(), // Truncated to hour: 2024-01-01 14:00:00
  placementId: integer("placement_id"),
  creativeId: integer("creative_id"),
  lineItemId: integer("line_item_id"),
  campaignId: integer("campaign_id"),
  clientId: integer("client_id"),
  siteId: integer("site_id"),
  publisherId: integer("publisher_id"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  revenueBdt: decimal("revenue_bdt", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});