import express from 'express';
import { storage } from '../storage.js';
import googleAdsIntegration from '../integrations/googleAds.js';
import facebookAdsIntegration from '../integrations/facebookAds.js';

const router = express.Router();

// Get integration status overview
router.get('/status', async (req, res) => {
  try {
    const [googleStatus, facebookStatus] = await Promise.all([
      googleAdsIntegration.checkConnection(),
      facebookAdsIntegration.checkConnection()
    ]);

    res.json({
      platform: 'VantaTrack Multi-Platform Integration',
      integrations: {
        google_ads: googleStatus,
        facebook_ads: facebookStatus
      },
      fallback_mode: {
        manual_upload: true,
        csv_excel_support: true,
        description: 'Manual upload available when API credentials not configured'
      }
    });
  } catch (error) {
    console.error('Integration status error:', error);
    res.status(500).json({ error: 'Failed to fetch integration status' });
  }
});

// Google Ads endpoints
router.get('/google/campaigns/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const accessToken = req.headers['x-google-access-token'];
    
    const campaigns = await googleAdsIntegration.fetchCampaignData(customerId, accessToken);
    
    res.json({
      campaigns,
      totalCampaigns: campaigns.length,
      dataSource: campaigns[0]?.dataSource || 'manual',
      customerId,
      lastFetch: new Date().toISOString()
    });
  } catch (error) {
    console.error('Google Ads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Google Ads campaigns' });
  }
});

router.post('/google/sync/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const accessToken = req.headers['x-google-access-token'];
    const agencyId = req.user?.agencyId || 1;
    
    const result = await googleAdsIntegration.syncCampaigns(customerId, accessToken, agencyId);
    
    res.json({
      message: 'Google Ads campaigns synced successfully',
      ...result
    });
  } catch (error) {
    console.error('Google Ads sync error:', error);
    res.status(500).json({ error: 'Failed to sync Google Ads campaigns' });
  }
});

// Facebook Ads endpoints
router.get('/facebook/campaigns/:adAccountId', async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const accessToken = req.headers['x-facebook-access-token'];
    
    const campaigns = await facebookAdsIntegration.fetchCampaignData(adAccountId, accessToken);
    
    res.json({
      campaigns,
      totalCampaigns: campaigns.length,
      dataSource: campaigns[0]?.dataSource || 'manual',
      adAccountId,
      lastFetch: new Date().toISOString()
    });
  } catch (error) {
    console.error('Facebook Ads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Facebook Ads campaigns' });
  }
});

router.post('/facebook/sync/:adAccountId', async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const accessToken = req.headers['x-facebook-access-token'];
    const agencyId = req.user?.agencyId || 1;
    
    const result = await facebookAdsIntegration.syncCampaigns(adAccountId, accessToken, agencyId);
    
    res.json({
      message: 'Facebook Ads campaigns synced successfully',
      ...result
    });
  } catch (error) {
    console.error('Facebook Ads sync error:', error);
    res.status(500).json({ error: 'Failed to sync Facebook Ads campaigns' });
  }
});

router.get('/facebook/accounts', async (req, res) => {
  try {
    const accessToken = req.headers['x-facebook-access-token'];
    
    const accounts = await facebookAdsIntegration.getAdAccounts(accessToken);
    
    res.json({
      message: 'Facebook Ad accounts retrieved',
      ...accounts
    });
  } catch (error) {
    console.error('Facebook accounts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Facebook Ad accounts' });
  }
});

// Manual upload endpoints for fallback
router.post('/manual/upload', async (req, res) => {
  try {
    const { platform, campaignData } = req.body;
    const agencyId = req.user?.agencyId || 1;

    if (!['google', 'facebook', 'portal'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform. Use: google, facebook, or portal' });
    }

    if (!campaignData || typeof campaignData !== 'object') {
      return res.status(400).json({ error: 'campaignData is required and must be an object' });
    }

    // Process manual upload based on platform
    let result;
    switch (platform) {
      case 'google':
        result = await storage.createGoogleCampaign({ ...campaignData, agencyId, dataSource: 'manual' });
        break;
      case 'facebook':
        result = await storage.createFacebookCampaign({ ...campaignData, agencyId, dataSource: 'manual' });
        break;
      case 'portal':
        result = await storage.createCampaign({ ...campaignData, agencyId, dataSource: 'manual' });
        break;
    }

    res.json({
      message: `${platform} campaign uploaded successfully`,
      campaignId: result.id,
      platform,
      dataSource: 'manual'
    });
  } catch (error) {
    console.error('Manual upload error:', error);
    res.status(500).json({ error: 'Failed to upload manual campaign data' });
  }
});

export default router;