import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, MetricCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Link } from 'wouter';

export default function CampaignsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');

  const { data: sampleData, isLoading } = useQuery({
    queryKey: ['/api/sample-data'],
    queryFn: getQueryFn(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const allCampaigns = [
    ...(sampleData?.campaigns?.portal || []).map(c => ({ ...c, platform: 'Portal', type: 'portal' })),
    ...(sampleData?.campaigns?.google || []).map(c => ({ ...c, platform: 'Google Ads', type: 'google' })),
    ...(sampleData?.campaigns?.facebook || []).map(c => ({ ...c, platform: 'Facebook Ads', type: 'facebook' }))
  ];

  const filteredCampaigns = allCampaigns.filter(campaign => {
    if (selectedPlatform === 'all') return true;
    return campaign.type === selectedPlatform;
  });

  const totalMetrics = allCampaigns.reduce((acc, campaign) => {
    acc.totalCampaigns += 1;
    acc.totalImpressions += campaign.impressions || 0;
    acc.totalClicks += campaign.clicks || 0;
    acc.totalSpent += parseFloat(campaign.costBdt || campaign.costUsd * 110 || 0);
    return acc;
  }, { totalCampaigns: 0, totalImpressions: 0, totalClicks: 0, totalSpent: 0 });

  const metrics = [
    {
      title: 'Active Campaigns',
      value: totalMetrics.totalCampaigns,
      subtitle: 'Across all platforms',
      icon: '🎯',
      trend: { direction: 'up', value: '+12%' }
    },
    {
      title: 'Total Impressions',
      value: totalMetrics.totalImpressions.toLocaleString(),
      subtitle: 'This month',
      icon: '👁️',
      trend: { direction: 'up', value: '+8.2%' }
    },
    {
      title: 'Total Clicks',
      value: totalMetrics.totalClicks.toLocaleString(),
      subtitle: 'This month',
      icon: '👆',
      trend: { direction: 'up', value: '+15.3%' }
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalMetrics.totalSpent),
      subtitle: 'This month',
      icon: '💰',
      trend: { direction: 'up', value: '+5.1%' }
    },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (type) => {
    switch (type) {
      case 'portal': return 'bg-blue-100 text-blue-800';
      case 'google': return 'bg-green-100 text-green-800';
      case 'facebook': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-2 text-gray-600">
            Multi-platform campaign management across Portal, Google Ads, and Facebook Ads
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link href="/analytics">
            <Button variant="outline" size="sm">
              📊 Export Report
            </Button>
          </Link>
          <Link href="/upload">
            <Button size="sm">
              ➕ New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            <Select
              label=""
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="all">All Platforms</option>
              <option value="portal">Portal Only</option>
              <option value="google">Google Ads</option>
              <option value="facebook">Facebook Ads</option>
            </Select>
            
            <Select
              label=""
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="all">All Clients</option>
              {sampleData?.clients?.map(client => (
                <option key={client.id} value={client.id}>{client.clientName}</option>
              ))}
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <Link href="/upload">
              <Button variant="outline" size="sm">
                📤 Bulk Upload
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" size="sm">
                📋 Templates
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.campaignName}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlatformColor(campaign.type)}`}>
                      {campaign.platform}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {campaign.campaignType || campaign.campaignObjective}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    📊 Analytics
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" size="sm">
                    ✏️ Edit
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" size="sm">
                    ⚙️ Settings
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Budget</p>
                <p className="text-lg font-bold text-gray-900">
                  {campaign.budgetBdt ? formatCurrency(campaign.budgetBdt) : 
                   campaign.budgetUsd ? formatCurrencyUSD(campaign.budgetUsd) : 'N/A'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-lg font-bold text-blue-600">{(campaign.impressions || 0).toLocaleString()}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-lg font-bold text-emerald-600">{(campaign.clicks || 0).toLocaleString()}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-lg font-bold text-purple-600">{campaign.conversions || 0}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Cost</p>
                <p className="text-lg font-bold text-red-600">
                  {campaign.costBdt ? formatCurrency(campaign.costBdt) : 
                   campaign.costUsd ? formatCurrencyUSD(campaign.costUsd) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">CTR:</span>
                  <span className="font-medium">{campaign.ctr || ((campaign.clicks / campaign.impressions) * 100).toFixed(2) || '0.00'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CPC:</span>
                  <span className="font-medium">
                    {campaign.cpcUsd ? formatCurrencyUSD(campaign.cpcUsd) : 
                     campaign.clicks ? formatCurrency((campaign.costBdt || 0) / campaign.clicks) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conv. Rate:</span>
                  <span className="font-medium">
                    {campaign.clicks ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Source:</span>
                  <span className={`font-medium ${campaign.dataSource === 'api' ? 'text-green-600' : 'text-blue-600'}`}>
                    {campaign.dataSource === 'api' ? '🔗 API' : '📤 Manual'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">
              {selectedPlatform === 'all' 
                ? 'Create your first campaign to start advertising'
                : `No campaigns found for ${selectedPlatform} platform`}
            </p>
            <Button>
              Create Your First Campaign
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}