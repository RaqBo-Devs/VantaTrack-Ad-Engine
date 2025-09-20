import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

export default function ClientsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    contactEmail: '',
    phone: '',
    address: '',
    portalAccess: false,
    googleAccess: false,
    facebookAccess: false
  });

  // Fetch clients from the admin API
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      try {
        const data = await getQueryFn()({ queryKey: ['/api/admin/clients'] });
        return data?.clients || [];
      } catch (error) {
        console.error('Failed to fetch clients:', error);
        // Return sample data for demo if API fails
        return [
          {
            id: 1,
            clientName: 'Demo Agency Ltd',
            contactEmail: 'demo@agency.com',
            phone: '+880-1700-000001',
            portalAccess: true,
            googleAccess: true,
            facebookAccess: true
          }
        ];
      }
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData) => {
      const res = await apiRequest('POST', '/api/clients', clientData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/sample-data']);
      setShowCreateForm(false);
      setFormData({
        clientName: '',
        contactEmail: '',
        phone: '',
        address: '',
        portalAccess: false,
        googleAccess: false,
        facebookAccess: false
      });
    }
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ clientId, permissions }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}/permissions`, permissions);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/sample-data']);
    }
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    createClientMutation.mutate({
      ...formData,
      agencyId: 1 // Demo agency ID
    });
  };

  const handlePermissionChange = (clientId, platform, value) => {
    const permissions = {
      portalAccess: platform === 'portal' ? value : clients.find(c => c.id === clientId)?.portalAccess,
      googleAccess: platform === 'google' ? value : clients.find(c => c.id === clientId)?.googleAccess,
      facebookAccess: platform === 'facebook' ? value : clients.find(c => c.id === clientId)?.facebookAccess,
    };
    
    updatePermissionsMutation.mutate({ clientId, permissions });
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
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="mt-2 text-gray-600">
            Manage client access and platform permissions
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="mt-4 sm:mt-0"
        >
          ➕ Add New Client
        </Button>
      </div>

      {/* Create Client Form */}
      {showCreateForm && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Client</h2>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                placeholder="Enter client name"
              />
              <Input
                label="Contact Email"
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                placeholder="client@example.com"
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+880-1700-000000"
              />
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Office address"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.portalAccess}
                    onChange={(e) => setFormData({...formData, portalAccess: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Portal Access</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.googleAccess}
                    onChange={(e) => setFormData({...formData, googleAccess: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Google Ads</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.facebookAccess}
                    onChange={(e) => setFormData({...formData, facebookAccess: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Facebook Ads</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button type="submit" loading={createClientMutation.isPending}>
                Create Client
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

      {/* Clients List */}
      <div className="grid grid-cols-1 gap-6">
        {Array.isArray(clients) && clients.map((client) => (
          <Card key={client.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{client.clientName}</h3>
                <p className="text-gray-600">{client.contactEmail}</p>
                {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  📊 View Analytics
                </Button>
                <Button variant="outline" size="sm">
                  ⚙️ Settings
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Portal Access */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Portal Access</h4>
                    <p className="text-sm text-blue-700">Direct portal campaigns</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={client.portalAccess}
                      onChange={(e) => handlePermissionChange(client.id, 'portal', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Google Access */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">Google Ads</h4>
                    <p className="text-sm text-green-700">Search & Display campaigns</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={client.googleAccess}
                      onChange={(e) => handlePermissionChange(client.id, 'google', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Facebook Access */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-purple-900">Facebook Ads</h4>
                    <p className="text-sm text-purple-700">Social media campaigns</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={client.facebookAccess}
                      onChange={(e) => handlePermissionChange(client.id, 'facebook', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Client Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium text-gray-900">Total Campaigns</p>
                <p className="text-2xl font-bold text-primary-600">3</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Monthly Spend</p>
                <p className="text-2xl font-bold text-emerald-600">৳85,000</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Impressions</p>
                <p className="text-2xl font-bold text-blue-600">245K</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">CTR</p>
                <p className="text-2xl font-bold text-purple-600">4.2%</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-4">Create your first client to start managing campaigns</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Add Your First Client
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}