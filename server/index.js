import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupAuth } from './auth.js';
import { storage } from './storage.js';
import campaignsRouter from './routes/campaigns.js';
import clientsRouter from './routes/clients.js';
import uploadRouter from './routes/upload.js';
import { authLimiter, apiLimiter, uploadLimiter } from './middleware/rateLimiting.js';

dotenv.config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is required');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/auth/', authLimiter);
app.use('/api/upload/', uploadLimiter);
app.use('/api/', apiLimiter);

// Setup authentication
const { requireAuth, requireRole } = setupAuth(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'VantaTrack Ad Engine API is running',
    timestamp: new Date().toISOString()
  });
});

// VantaTrack API routes
app.get('/api/vantatrack/status', (req, res) => {
  res.json({
    platform: 'VantaTrack Ad Engine',
    version: '1.0.0',
    tagline: 'Complete Media Management for Bangladesh Agencies',
    features: [
      'Multi-platform campaign management',
      'CSV/Excel data upload',
      'Real-time analytics',
      'Multi-tenant access control'
    ]
  });
});

// Dashboard data endpoint
app.get('/api/dashboard/overview', requireAuth, async (req, res) => {
  try {
    // For now, return basic overview - will be enhanced with client-specific data
    res.json({
      totalCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalSpent: 0,
      currency: 'BDT',
      platforms: {
        portal: { active: true, campaigns: 0 },
        google: { active: false, campaigns: 0 },
        facebook: { active: false, campaigns: 0 }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// VantaTrack API Routes
app.use('/api/campaigns', requireAuth, campaignsRouter);
app.use('/api/clients', requireAuth, clientsRouter);
app.use('/api/upload', requireAuth, uploadRouter);

// Sample data endpoint for Bangladesh market testing
app.get('/api/sample-data', requireAuth, (req, res) => {
  res.json({
    clients: [
      {
        id: 1,
        clientName: 'Prothom Alo Digital',
        agencyId: 1,
        portalAccess: true,
        googleAccess: true,
        facebookAccess: true,
        contactEmail: 'marketing@prothomalo.com',
        phone: '+880-1700-000001'
      },
      {
        id: 2,
        clientName: 'Daily Star Online',
        agencyId: 1,
        portalAccess: true,
        googleAccess: false,
        facebookAccess: true,
        contactEmail: 'ads@thedailystar.net',
        phone: '+880-1700-000002'
      }
    ],
    campaigns: {
      portal: [
        {
          id: 1,
          campaignName: 'Prothom Alo Homepage Banner',
          campaignType: 'Display',
          status: 'active',
          budgetBdt: 50000,
          impressions: 125000,
          clicks: 6250,
          conversions: 312,
          costBdt: 45000
        }
      ],
      google: [
        {
          id: 1,
          campaignName: 'Search Ads - Bangladesh News',
          campaignType: 'Search',
          status: 'active',
          budgetUsd: 500,
          budgetBdt: 55000,
          impressions: 75000,
          clicks: 3750,
          costUsd: 450,
          costBdt: 49500
        }
      ],
      facebook: [
        {
          id: 1,
          campaignName: 'Facebook Brand Awareness',
          campaignObjective: 'REACH',
          status: 'active',
          budgetUsd: 300,
          budgetBdt: 33000,
          impressions: 95000,
          clicks: 2850,
          costUsd: 285,
          costBdt: 31350
        }
      ]
    }
  });
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, '../client/dist/index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VantaTrack Ad Engine server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Dashboard API: http://localhost:${PORT}/api/dashboard/overview`);
  console.log(`💼 Platform: VantaTrack - Complete Media Management for Bangladesh Agencies`);
});

export default app;