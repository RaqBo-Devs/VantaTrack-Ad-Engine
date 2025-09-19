import express from 'express';
import { storage } from '../storage.js';
import { verifyClientAccess, verifyPlatformAccess } from '../middleware/authorization.js';

const router = express.Router();

// Get all campaigns for a client
router.get('/client/:clientId', verifyClientAccess, async (req, res) => {
  try {
    const { clientId } = req.params;
    const campaigns = await storage.getCampaignsByClient(parseInt(clientId));
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create portal campaign
router.post('/portal', verifyClientAccess, verifyPlatformAccess('portal'), async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const campaign = await storage.createPortalCampaign(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating portal campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Create Google campaign
router.post('/google', verifyClientAccess, verifyPlatformAccess('google'), async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      dataSource: req.body.dataSource || 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const campaign = await storage.createGoogleCampaign(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating Google campaign:', error);
    res.status(500).json({ error: 'Failed to create Google campaign' });
  }
});

// Create Facebook campaign
router.post('/facebook', verifyClientAccess, verifyPlatformAccess('facebook'), async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      dataSource: req.body.dataSource || 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const campaign = await storage.createFacebookCampaign(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating Facebook campaign:', error);
    res.status(500).json({ error: 'Failed to create Facebook campaign' });
  }
});

// Bulk create Google campaigns from CSV upload
router.post('/google/bulk', verifyClientAccess, verifyPlatformAccess('google'), async (req, res) => {
  try {
    const { campaigns, clientId, userId } = req.body;
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const campaignData of campaigns) {
      try {
        // Convert USD to BDT (assuming 1 USD = 110 BDT)
        const usdToBdt = 110;
        const campaign = await storage.createGoogleCampaign({
          ...campaignData,
          clientId: parseInt(clientId),
          budgetBdt: campaignData.budgetUsd ? (parseFloat(campaignData.budgetUsd) * usdToBdt).toFixed(2) : null,
          costBdt: campaignData.costUsd ? (parseFloat(campaignData.costUsd) * usdToBdt).toFixed(2) : null,
          dataSource: 'manual',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        results.push({ success: true, campaign });
        successCount++;
      } catch (error) {
        results.push({ success: false, error: error.message });
        failCount++;
      }
    }

    // Record upload history
    await storage.createUploadRecord({
      clientId: parseInt(clientId),
      userId: parseInt(userId),
      platform: 'google',
      fileName: req.body.fileName || 'bulk_upload.csv',
      recordsProcessed: campaigns.length,
      recordsSuccess: successCount,
      recordsFailed: failCount,
      uploadStatus: failCount === 0 ? 'completed' : 'completed_with_errors',
      errorDetails: failCount > 0 ? JSON.stringify(results.filter(r => !r.success)) : null
    });

    res.json({
      success: true,
      processed: campaigns.length,
      successful: successCount,
      failed: failCount,
      results
    });
  } catch (error) {
    console.error('Error bulk creating Google campaigns:', error);
    res.status(500).json({ error: 'Failed to bulk create campaigns' });
  }
});

// Bulk create Facebook campaigns from CSV upload
router.post('/facebook/bulk', verifyClientAccess, verifyPlatformAccess('facebook'), async (req, res) => {
  try {
    const { campaigns, clientId, userId } = req.body;
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const campaignData of campaigns) {
      try {
        // Convert USD to BDT
        const usdToBdt = 110;
        const campaign = await storage.createFacebookCampaign({
          ...campaignData,
          clientId: parseInt(clientId),
          budgetBdt: campaignData.budgetUsd ? (parseFloat(campaignData.budgetUsd) * usdToBdt).toFixed(2) : null,
          costBdt: campaignData.costUsd ? (parseFloat(campaignData.costUsd) * usdToBdt).toFixed(2) : null,
          dataSource: 'manual',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        results.push({ success: true, campaign });
        successCount++;
      } catch (error) {
        results.push({ success: false, error: error.message });
        failCount++;
      }
    }

    // Record upload history
    await storage.createUploadRecord({
      clientId: parseInt(clientId),
      userId: parseInt(userId),
      platform: 'facebook',
      fileName: req.body.fileName || 'bulk_upload.csv',
      recordsProcessed: campaigns.length,
      recordsSuccess: successCount,
      recordsFailed: failCount,
      uploadStatus: failCount === 0 ? 'completed' : 'completed_with_errors',
      errorDetails: failCount > 0 ? JSON.stringify(results.filter(r => !r.success)) : null
    });

    res.json({
      success: true,
      processed: campaigns.length,
      successful: successCount,
      failed: failCount,
      results
    });
  } catch (error) {
    console.error('Error bulk creating Facebook campaigns:', error);
    res.status(500).json({ error: 'Failed to bulk create campaigns' });
  }
});

export default router;