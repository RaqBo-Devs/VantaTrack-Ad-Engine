import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

export default function PlacementManagerPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [formData, setFormData] = useState({
    publisherName: '',
    domain: '',
    siteName: '',
    siteUrl: '',
    placementName: '',
    adSize: '728x90',
    position: 'header'
  });

  // Fetch placements - mock data for now
  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['/api/admin/placements'],
    queryFn: async () => {
      try {
        const data = await getQueryFn()({ queryKey: ['/api/admin/placements'] });
        return data?.placements || [];
      } catch (error) {
        console.error('Failed to fetch placements:', error);
        // Return sample placements for demo
        return [
          {
            id: 1,
            placementKey: 'daily-star-header-728x90',
            placementName: 'Daily Star Header Banner',
            publisherName: 'The Daily Star',
            domain: 'thedailystar.net',
            siteName: 'Main Site',
            adSize: '728x90',
            position: 'header',
            status: 'active'
          },
          {
            id: 2,
            placementKey: 'dhaka-tribune-sidebar-300x250',
            placementName: 'Dhaka Tribune Sidebar',
            publisherName: 'Dhaka Tribune',
            domain: 'dhakatribune.com',
            siteName: 'Main Site',
            adSize: '300x250',
            position: 'sidebar',
            status: 'active'
          }
        ];
      }
    },
  });

  const adSizes = [
    { value: '728x90', label: 'Leaderboard (728×90)' },
    { value: '300x250', label: 'Medium Rectangle (300×250)' },
    { value: '320x50', label: 'Mobile Banner (320×50)' },
    { value: '336x280', label: 'Large Rectangle (336×280)' },
    { value: '160x600', label: 'Wide Skyscraper (160×600)' },
    { value: '970x90', label: 'Super Banner (970×90)' },
    { value: '300x600', label: 'Half Page (300×600)' }
  ];

  const positions = [
    { value: 'header', label: 'Header' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'footer', label: 'Footer' },
    { value: 'content', label: 'In Content' },
    { value: 'popup', label: 'Popup' }
  ];

  const createPlacementMutation = useMutation({
    mutationFn: async (placementData) => {
      const res = await apiRequest('POST', '/api/admin/placements', placementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/placements']);
      setShowCreateForm(false);
      setFormData({
        publisherName: '',
        domain: '',
        siteName: '',
        siteUrl: '',
        placementName: '',
        adSize: '728x90',
        position: 'header'
      });
    }
  });

  const handleCreatePlacement = (e) => {
    e.preventDefault();
    createPlacementMutation.mutate(formData);
  };

  const generateEmbedCode = (placement) => {
    const embedCode = `<!-- VantaTrack Ad Placement -->
<div id="vanta-ad-${placement.placementKey}" data-vanta-placement="${placement.placementKey}"></div>
<script src="${window.location.origin}/ad/v1/tag.js"></script>
<script>
  VantaAdTag.init('${placement.placementKey}', 'vanta-ad-${placement.placementKey}');
</script>`;
    
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ad Placement Manager</h1>
          <p className="mt-2 text-gray-600">
            Manage ad placements for Bangladesh newspaper portals
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="mt-4 sm:mt-0"
        >
          ➕ Create New Placement
        </Button>
      </div>

      {/* Create Placement Form */}
      {showCreateForm && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Ad Placement</h2>
          <form onSubmit={handleCreatePlacement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Publisher Name"
                required
                value={formData.publisherName}
                onChange={(e) => setFormData({...formData, publisherName: e.target.value})}
                placeholder="The Daily Star"
              />
              <Input
                label="Domain"
                required
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="thedailystar.net"
              />
              <Input
                label="Site Name"
                required
                value={formData.siteName}
                onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                placeholder="Main Site"
              />
              <Input
                label="Site URL"
                type="url"
                required
                value={formData.siteUrl}
                onChange={(e) => setFormData({...formData, siteUrl: e.target.value})}
                placeholder="https://www.thedailystar.net"
              />
              <Input
                label="Placement Name"
                required
                value={formData.placementName}
                onChange={(e) => setFormData({...formData, placementName: e.target.value})}
                placeholder="Header Banner"
              />
              <Select
                label="Ad Size"
                value={formData.adSize}
                onChange={(e) => setFormData({...formData, adSize: e.target.value})}
                options={adSizes}
              />
              <Select
                label="Position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                options={positions}
              />
            </div>

            <div className="flex space-x-3">
              <Button type="submit" loading={createPlacementMutation.isPending}>
                Create Placement
              </Button>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Placements List */}
      <div className="grid grid-cols-1 gap-6">
        {Array.isArray(placements) && placements.map((placement) => (
          <Card key={placement.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{placement.placementName}</h3>
                <p className="text-gray-600">{placement.publisherName} - {placement.domain}</p>
                <p className="text-sm text-gray-500">
                  Size: {placement.adSize} | Position: {placement.position}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateEmbedCode(placement)}
                >
                  📋 Copy Embed Code
                </Button>
                <Button variant="outline" size="sm">
                  📊 View Stats
                </Button>
              </div>
            </div>

            {/* Placement Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900">Placement Key</h4>
                <code className="text-sm text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded">
                  {placement.placementKey}
                </code>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-900">Status</h4>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  placement.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {placement.status}
                </span>
              </div>
            </div>

            {/* Integration Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Integration Instructions</h4>
              <p className="text-sm text-gray-600 mb-3">
                Copy and paste this code into your website where you want the ad to appear:
              </p>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
{`<!-- VantaTrack Ad Placement -->
<div id="vanta-ad-${placement.placementKey}" data-vanta-placement="${placement.placementKey}"></div>
<script src="${window.location.origin}/ad/v1/tag.js"></script>
<script>
  VantaAdTag.init('${placement.placementKey}', 'vanta-ad-${placement.placementKey}');
</script>`}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {placements.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No placements yet</h3>
            <p className="text-gray-600 mb-4">Create your first ad placement for newspaper portals</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Placement
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}