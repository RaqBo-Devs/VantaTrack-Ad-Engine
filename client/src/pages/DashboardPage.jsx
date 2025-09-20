import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, MetricCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'wouter';

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/overview'],
    queryFn: getQueryFn(),
  });

  const { data: sampleData } = useQuery({
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

  const metrics = [
    {
      title: 'Total Campaigns',
      value: dashboardData?.metrics?.totalCampaigns || 0,
      subtitle: 'Active campaigns',
      icon: '🎯',
      trend: { direction: 'up', value: '+12%' }
    },
    {
      title: 'Total Impressions',
      value: (dashboardData?.metrics?.totalImpressions || 0).toLocaleString(),
      subtitle: 'This month',
      icon: '👁️',
      trend: { direction: 'up', value: '+8.2%' }
    },
    {
      title: 'Total Clicks',
      value: (dashboardData?.metrics?.totalClicks || 0).toLocaleString(),
      subtitle: 'This month',
      icon: '👆',
      trend: { direction: 'up', value: '+15.3%' }
    },
    {
      title: 'Total Spent',
      value: formatCurrency(dashboardData?.metrics?.totalSpent || 0),
      subtitle: dashboardData?.platforms ? `Portal: ${formatCurrency(dashboardData.platforms.portal?.spent || 0)} | Global: ${formatCurrencyUSD((dashboardData.platforms.google?.spent || 0) + (dashboardData.platforms.facebook?.spent || 0))}` : 'This month',
      icon: '💰',
      trend: { direction: 'up', value: '+5.1%' }
    },
  ];

  const platforms = dashboardData?.platforms || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Complete overview of your multi-platform campaigns
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Portal Campaigns</h3>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🌐</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-blue-900">
              {platforms.portal?.campaigns || 0}
            </p>
            <p className="text-blue-700">
              Status: {platforms.portal?.active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-blue-600">
              Direct portal advertising campaigns
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900">Google Ads</h3>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🔍</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-green-900">
              {platforms.google?.campaigns || 0}
            </p>
            <p className="text-green-700">
              Status: {platforms.google?.active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-green-600">
              Search & Display campaigns
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900">Facebook Ads</h3>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📱</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-purple-900">
              {platforms.facebook?.campaigns || 0}
            </p>
            <p className="text-purple-700">
              Status: {platforms.facebook?.active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-purple-600">
              Social media campaigns
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns</h3>
          {dashboardData?.topCampaigns ? (
            <div className="space-y-4">
              {dashboardData.topCampaigns.slice(0, 3).map((campaign, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">{campaign.platform} • ROI: {campaign.roi}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {campaign.platform === 'Google' || campaign.platform === 'Facebook' 
                        ? formatCurrencyUSD(campaign.spent) 
                        : formatCurrency(campaign.spent)}
                    </p>
                    <p className="text-xs text-emerald-600">{campaign.clicks?.toLocaleString()} clicks</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No campaigns available</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/placements" className="block">
              <Button variant="outline" className="w-full justify-start">
                📺 Create New Placement
              </Button>
            </Link>
            <Link href="/upload" className="block">
              <Button variant="outline" className="w-full justify-start">
                📤 Upload Google Ads Data
              </Button>
            </Link>
            <Link href="/upload" className="block">
              <Button variant="outline" className="w-full justify-start">
                📤 Upload Facebook Ads Data
              </Button>
            </Link>
            <Link href="/templates" className="block">
              <Button variant="outline" className="w-full justify-start">
                📋 Download CSV Templates
              </Button>
            </Link>
            <Link href="/clients" className="block">
              <Button variant="outline" className="w-full justify-start">
                👥 Manage Clients
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}