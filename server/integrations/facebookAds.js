// Facebook Marketing API v18+ Integration for VantaTrack
// Production-ready stubs with manual upload fallback

import { storage } from '../storage.js';

class FacebookAdsIntegration {
  constructor() {
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.isConnected = process.env.FACEBOOK_APP_ID && 
                      process.env.FACEBOOK_APP_SECRET;
  }

  // Main method to fetch campaign data
  async fetchCampaignData(adAccountId, accessToken) {
    if (!this.isConnected) {
      console.log('Facebook Marketing API not configured, using manual upload data');
      return await this.getManualUploadData(adAccountId);
    }

    try {
      // Production Facebook Marketing API call would go here
      const campaigns = await this.callFacebookAdsAPI(adAccountId, accessToken);
      return this.formatCampaignData(campaigns);
    } catch (error) {
      console.error('Facebook Marketing API error:', error);
      // Fallback to manual upload data
      return await this.getManualUploadData(adAccountId);
    }
  }

  // Facebook Marketing API call (production implementation)
  async callFacebookAdsAPI(adAccountId, accessToken) {
    const fields = [
      'id', 'name', 'objective', 'status', 'daily_budget', 'lifetime_budget',
      'created_time', 'updated_time', 'effective_status'
    ].join(',');

    const insights = [
      'impressions', 'clicks', 'spend', 'actions',
      'ctr', 'cpc', 'cpm', 'cpp'
    ].join(',');

    // Fetch campaigns
    const campaignsUrl = `${this.baseUrl}/act_${adAccountId}/campaigns`;
    const campaignsResponse = await fetch(`${campaignsUrl}?fields=${fields}&access_token=${accessToken}`);
    
    if (!campaignsResponse.ok) {
      throw new Error(`Facebook API error: ${campaignsResponse.statusText}`);
    }

    const campaignsData = await campaignsResponse.json();

    // Fetch insights for each campaign
    const campaignsWithInsights = await Promise.all(
      campaignsData.data.map(async (campaign) => {
        try {
          const insightsUrl = `${this.baseUrl}/${campaign.id}/insights`;
          const insightsResponse = await fetch(
            `${insightsUrl}?fields=${insights}&date_preset=last_30d&access_token=${accessToken}`
          );
          
          if (insightsResponse.ok) {
            const insightsData = await insightsResponse.json();
            return {
              ...campaign,
              insights: insightsData.data[0] || {}
            };
          }
          return { ...campaign, insights: {} };
        } catch (error) {
          console.error(`Error fetching insights for campaign ${campaign.id}:`, error);
          return { ...campaign, insights: {} };
        }
      })
    );

    return campaignsWithInsights;
  }

  // Format Facebook Ads data for VantaTrack
  formatCampaignData(apiResponse) {
    return apiResponse.map(campaign => {
      const insights = campaign.insights || {};
      
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignObjective: campaign.objective,
        status: campaign.effective_status || campaign.status,
        budgetUsd: Math.round(parseFloat(campaign.daily_budget || campaign.lifetime_budget || 0) / 100),
        budgetBdt: Math.round((parseFloat(campaign.daily_budget || campaign.lifetime_budget || 0) / 100) * 110),
        impressions: parseInt(insights.impressions) || 0,
        clicks: parseInt(insights.clicks) || 0,
        conversions: this.extractConversions(insights.actions) || 0,
        costUsd: Math.round(parseFloat(insights.spend || 0)),
        costBdt: Math.round(parseFloat(insights.spend || 0) * 110),
        ctr: parseFloat(insights.ctr) || 0,
        cpcUsd: parseFloat(insights.cpc) || 0,
        cpmUsd: parseFloat(insights.cpm) || 0,
        dataSource: 'api',
        createdAt: campaign.created_time,
        lastUpdated: campaign.updated_time
      };
    });
  }

  // Fallback to manual upload data
  async getManualUploadData(adAccountId) {
    try {
      // Fetch manually uploaded Facebook Ads data from database
      const manualCampaigns = await storage.getFacebookCampaigns(adAccountId);
      return manualCampaigns.map(campaign => ({
        ...campaign,
        dataSource: 'manual',
        lastUpdated: campaign.updatedAt || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Manual upload data fetch error:', error);
      return [];
    }
  }

  // Extract conversions from Facebook actions data
  extractConversions(actions) {
    if (!actions || !Array.isArray(actions)) return 0;
    
    // Look for conversion actions (purchase, lead, complete_registration, etc.)
    const conversionActions = actions.filter(action => 
      ['purchase', 'lead', 'complete_registration', 'page_engagement', 'post_engagement'].includes(action.action_type)
    );
    
    return conversionActions.reduce((total, action) => total + parseInt(action.value || 0), 0);
  }

  // Check API connection status
  async checkConnection() {
    return {
      isConnected: this.isConnected,
      apiVersion: this.apiVersion,
      requirements: {
        app_id: !!process.env.FACEBOOK_APP_ID,
        app_secret: !!process.env.FACEBOOK_APP_SECRET
      },
      fallback: 'Manual upload available',
      status: this.isConnected ? 'ready' : 'fallback_mode'
    };
  }

  // Sync campaigns with VantaTrack database
  async syncCampaigns(adAccountId, accessToken, agencyId) {
    const campaigns = await this.fetchCampaignData(adAccountId, accessToken);
    
    for (const campaign of campaigns) {
      await storage.upsertFacebookCampaign({
        ...campaign,
        agencyId,
        adAccountId,
        syncedAt: new Date().toISOString()
      });
    }

    return {
      synced: campaigns.length,
      dataSource: campaigns[0]?.dataSource || 'manual',
      timestamp: new Date().toISOString()
    };
  }

  // Get available ad accounts
  async getAdAccounts(accessToken) {
    if (!this.isConnected) {
      return { accounts: [], source: 'manual' };
    }

    try {
      const url = `${this.baseUrl}/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accounts: data.data.map(account => ({
          id: account.id.replace('act_', ''),
          name: account.name,
          status: account.account_status,
          currency: account.currency
        })),
        source: 'api'
      };
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      return { accounts: [], source: 'manual', error: error.message };
    }
  }
}

export default new FacebookAdsIntegration();