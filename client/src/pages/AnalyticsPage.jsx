import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, MetricCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

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

  // Calculate analytics from sample data
  const analytics = {
    overview: {
      // Calculate total spent: Portal (BDT) + Google/Facebook (USD converted to BDT)
      totalSpent: 73500 + (1115 * 110) + (1035 * 110), // Portal BDT + (Google USD * 110) + (Facebook USD * 110)
      totalImpressions: 665000,
      totalClicks: 23950,
      totalConversions: 1399,
      overallCTR: 3.6,
      overallConversionRate: 5.8,
      averageCPC: 7.5
    },
    platforms: {
      portal: { spent: 73500, campaigns: 4, impressions: 270000, clicks: 13500 },
      google: { spent: 1115, campaigns: 3, impressions: 260000, clicks: 6500 },
      facebook: { spent: 1035, campaigns: 4, impressions: 355000, clicks: 8950 }
    },
    performance: [
      { metric: 'ROI', value: '285%', change: '+12%', color: 'text-green-600' },
      { metric: 'Cost per Lead', value: '৳128', change: '-8%', color: 'text-green-600' },
      { metric: 'Quality Score', value: '8.2/10', change: '+0.3', color: 'text-blue-600' },
      { metric: 'Frequency', value: '2.1', change: '+0.1', color: 'text-yellow-600' }
    ]
  };

  const topCampaigns = [
    { name: 'Search Ads - Bangladesh News', platform: 'Google', spent: 450, conversions: 225, roi: '312%' },
    { name: 'Facebook Brand Awareness', platform: 'Facebook', spent: 285, conversions: 142, roi: '278%' },
    { name: 'Prothom Alo Homepage Banner', platform: 'Portal', spent: 45000, conversions: 312, roi: '345%' },
    { name: 'Daily Star Header Campaign', platform: 'Portal', spent: 38000, conversions: 285, roi: '298%' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Cross-platform performance insights and detailed campaign analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="min-w-[120px]"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">This year</option>
          </Select>
          <Button variant="outline" size="sm">
            📊 Export Report
          </Button>
          <Button size="sm">
            📈 Custom Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Spent"
          value={formatCurrency(analytics.overview.totalSpent)}
          subtitle={`Portal: ${formatCurrency(analytics.platforms.portal.spent)} | Global: ${formatCurrencyUSD(analytics.platforms.google.spent + analytics.platforms.facebook.spent)}`}
          icon="💰"
          trend={{ direction: 'up', value: '+12%' }}
        />
        <MetricCard
          title="Total Impressions"
          value={analytics.overview.totalImpressions.toLocaleString()}
          subtitle="Across all platforms"
          icon="👁️"
          trend={{ direction: 'up', value: '+18%' }}
        />
        <MetricCard
          title="Total Clicks"
          value={analytics.overview.totalClicks.toLocaleString()}
          subtitle="Last 30 days"
          icon="👆"
          trend={{ direction: 'up', value: '+22%' }}
        />
        <MetricCard
          title="Conversions"
          value={analytics.overview.totalConversions.toLocaleString()}
          subtitle="Total conversions"
          icon="🎯"
          trend={{ direction: 'up', value: '+15%' }}
        />
      </div>

      {/* Platform Performance */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Platform Performance Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portal */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Portal Campaigns</h3>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🌐</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-700">Spent:</span>
                <span className="font-bold text-blue-900">{formatCurrency(analytics.platforms.portal.spent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Campaigns:</span>
                <span className="font-bold text-blue-900">{analytics.platforms.portal.campaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">CTR:</span>
                <span className="font-bold text-blue-900">
                  {((analytics.platforms.portal.clicks / analytics.platforms.portal.impressions) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Google Ads */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900">Google Ads</h3>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔍</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">Spent:</span>
                <span className="font-bold text-green-900">{formatCurrencyUSD(analytics.platforms.google.spent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Campaigns:</span>
                <span className="font-bold text-green-900">{analytics.platforms.google.campaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">CTR:</span>
                <span className="font-bold text-green-900">
                  {((analytics.platforms.google.clicks / analytics.platforms.google.impressions) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Facebook Ads */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Facebook Ads</h3>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📱</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-700">Spent:</span>
                <span className="font-bold text-purple-900">{formatCurrencyUSD(analytics.platforms.facebook.spent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Campaigns:</span>
                <span className="font-bold text-purple-900">{analytics.platforms.facebook.campaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">CTR:</span>
                <span className="font-bold text-purple-900">
                  {((analytics.platforms.facebook.clicks / analytics.platforms.facebook.impressions) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Advanced Performance Metrics</h2>
          <div className="space-y-4">
            {analytics.performance.map((metric, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <span className="text-gray-700 font-medium">{metric.metric}</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{metric.value}</span>
                  <span className={`ml-2 text-sm font-medium ${metric.color}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Performing Campaigns</h2>
          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{campaign.name}</p>
                  <p className="text-xs text-gray-500">{campaign.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {campaign.platform === 'Google' || campaign.platform === 'Facebook' 
                      ? formatCurrencyUSD(campaign.spent) 
                      : formatCurrency(campaign.spent)}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">ROI: {campaign.roi}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Trends</h2>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Interactive Charts</h3>
            <p className="text-gray-600 text-sm">
              Advanced charting with Chart.js or D3.js integration coming soon
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Audience Insights</h2>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Demographic Analysis</h3>
            <p className="text-gray-600 text-sm">
              Age, gender, location, and interest targeting insights
            </p>
          </div>
        </Card>
      </div>

      {/* Bangladesh-specific Analytics */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">🇧🇩 Bangladesh Market Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">68%</div>
            <p className="text-sm text-gray-600">Mobile Traffic</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-1">৳7.2</div>
            <p className="text-sm text-gray-600">Avg. CPC (BDT)</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">4.1%</div>
            <p className="text-sm text-gray-600">Market CTR</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">2.8x</div>
            <p className="text-sm text-gray-600">Local vs Global ROI</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">📊 Market Recommendations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Optimize for mobile-first experience (68% mobile traffic)</li>
            <li>• Focus on Bengali language content for better engagement</li>
            <li>• Best performance window: 8 PM - 10 PM local time</li>
            <li>• Higher conversion rates during Bengali holidays and festivals</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}