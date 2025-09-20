import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// Dashboard overview API endpoint
router.get('/overview', async (req, res) => {
  try {
    // Get user's agency and accessible data
    const agencyId = req.user?.agencyId || 1; // Default to agency 1 for demo
    
    // Sample Bangladesh market data for dashboard
    const dashboardData = {
      metrics: {
        totalCampaigns: 12,
        activeCampaigns: 8,
        totalSpent: 245000, // Combined: Portal BDT + Google/Facebook USD converted to BDT
        monthlySpent: 85000, // in BDT
        totalImpressions: 1250000,
        totalClicks: 42500,
        overallCTR: 3.4,
        conversionRate: 5.8
      },
      platforms: {
        portal: {
          campaigns: 4,
          spent: 73500,
          impressions: 450000,
          clicks: 18900,
          ctr: 4.2
        },
        google: {
          campaigns: 3,
          spent: 810, // USD amount
          impressions: 520000,
          clicks: 15600,
          ctr: 3.0
        },
        facebook: {
          campaigns: 5,
          spent: 750, // USD amount
          impressions: 730000,
          clicks: 21950,
          ctr: 3.0
        }
      },
      recentActivity: [
        {
          type: 'campaign_created',
          message: 'New campaign "Dhaka Tribune Header" created',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          platform: 'portal'
        },
        {
          type: 'budget_alert',
          message: 'Facebook campaign "Brand Awareness" reached 80% budget',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          platform: 'facebook'
        },
        {
          type: 'performance_milestone',
          message: 'Google Ads campaign achieved 5% CTR milestone',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          platform: 'google'
        }
      ],
      topCampaigns: [
        {
          name: 'Prothom Alo Homepage Banner',
          platform: 'Portal',
          spent: 45000,
          impressions: 125000,
          clicks: 5250,
          conversions: 312,
          roi: 285
        },
        {
          name: 'Search Ads - Bangladesh News',
          platform: 'Google',
          spent: 350, // USD amount
          impressions: 98000,
          clicks: 2940,
          conversions: 176,
          roi: 245
        },
        {
          name: 'Facebook Brand Awareness',
          platform: 'Facebook',
          spent: 260, // USD amount
          impressions: 185000,
          clicks: 5550,
          conversions: 142,
          roi: 198
        }
      ],
      bangladesh: {
        currency: 'BDT',
        marketStats: {
          avgCpc: 7.2,
          avgCtr: 3.8,
          mobileTraffic: 68,
          topCities: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi'],
          peakHours: '20:00-22:00',
          conversionRateImprovement: 15.2
        }
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Sample data endpoint for demo
router.get('/sample-data', async (req, res) => {
  try {
    const sampleData = {
      clients: [
        {
          id: 1,
          clientName: 'Prothom Alo',
          contactEmail: 'contact@prothomalo.com',
          phone: '+880-1700-123456',
          address: 'Dhaka, Bangladesh',
          portalAccess: true,
          googleAccess: true,
          facebookAccess: true,
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          clientName: 'The Daily Star',
          contactEmail: 'contact@thedailystar.net',
          phone: '+880-1700-234567',
          address: 'Dhaka, Bangladesh',
          portalAccess: true,
          googleAccess: false,
          facebookAccess: true,
          createdAt: '2024-02-10'
        },
        {
          id: 3,
          clientName: 'Dhaka Tribune',
          contactEmail: 'contact@dhakatribune.com',
          phone: '+880-1700-345678',
          address: 'Dhaka, Bangladesh',
          portalAccess: true,
          googleAccess: true,
          facebookAccess: false,
          createdAt: '2024-02-25'
        }
      ],
      campaigns: {
        portal: [
          {
            campaignName: 'Prothom Alo Homepage Banner',
            campaignType: 'Display Banner',
            status: 'Active',
            budgetBdt: 45000,
            costBdt: 38500,
            impressions: 125000,
            clicks: 5250,
            conversions: 312,
            dataSource: 'manual'
          },
          {
            campaignName: 'Daily Star Header Campaign',
            campaignType: 'Header Banner',
            status: 'Active',
            budgetBdt: 35000,
            costBdt: 31250,
            impressions: 95000,
            clicks: 4275,
            conversions: 285,
            dataSource: 'manual'
          },
          {
            campaignName: 'Dhaka Tribune Sidebar',
            campaignType: 'Sidebar Display',
            status: 'Paused',
            budgetBdt: 25000,
            costBdt: 22100,
            impressions: 78000,
            clicks: 3120,
            conversions: 156,
            dataSource: 'manual'
          }
        ],
        google: [
          {
            campaignName: 'Search Ads - Bangladesh News',
            campaignObjective: 'Search',
            status: 'Active',
            budgetUsd: 450,
            costUsd: 385,
            impressions: 98000,
            clicks: 2940,
            conversions: 176,
            cpcUsd: 0.13,
            ctr: '3.0',
            dataSource: 'api'
          },
          {
            campaignName: 'Display Network - Bengali Content',
            campaignObjective: 'Display',
            status: 'Active',
            budgetUsd: 350,
            costUsd: 298,
            impressions: 145000,
            clicks: 2175,
            conversions: 87,
            cpcUsd: 0.14,
            ctr: '1.5',
            dataSource: 'api'
          },
          {
            campaignName: 'YouTube Ads - Bangladesh Market',
            campaignObjective: 'Video',
            status: 'Completed',
            budgetUsd: 275,
            costUsd: 268,
            impressions: 78000,
            clicks: 1560,
            conversions: 94,
            cpcUsd: 0.17,
            ctr: '2.0',
            dataSource: 'api'
          }
        ],
        facebook: [
          {
            campaignName: 'Facebook Brand Awareness',
            campaignObjective: 'Brand Awareness',
            status: 'Active',
            budgetUsd: 280,
            costUsd: 261,
            impressions: 185000,
            clicks: 5550,
            conversions: 142,
            dataSource: 'api'
          },
          {
            campaignName: 'Lead Generation Campaign',
            campaignObjective: 'Lead Generation',
            status: 'Active',
            budgetUsd: 420,
            costUsd: 385,
            impressions: 125000,
            clicks: 3750,
            conversions: 225,
            dataSource: 'manual'
          },
          {
            campaignName: 'Conversion Campaign - Bengali',
            campaignObjective: 'Conversions',
            status: 'Paused',
            budgetUsd: 350,
            costUsd: 312,
            impressions: 98000,
            clicks: 2940,
            conversions: 176,
            dataSource: 'api'
          },
          {
            campaignName: 'Instagram Stories - Mobile',
            campaignObjective: 'Traffic',
            status: 'Active',
            budgetUsd: 225,
            costUsd: 198,
            impressions: 156000,
            clicks: 4680,
            conversions: 94,
            dataSource: 'manual'
          }
        ]
      }
    };

    res.json(sampleData);
  } catch (error) {
    console.error('Sample data error:', error);
    res.status(500).json({ error: 'Failed to fetch sample data' });
  }
});

export default router;