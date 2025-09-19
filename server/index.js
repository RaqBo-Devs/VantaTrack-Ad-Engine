import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

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
app.get('/api/dashboard/overview', (req, res) => {
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