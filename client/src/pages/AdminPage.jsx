import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiRequest } from '@/lib/queryClient';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Redirect if not admin
  if (user && user.role !== 'agency_admin') {
    return <Redirect to="/" />;
  }

  // Form state for creating/editing clients
  const [formData, setFormData] = useState({
    clientName: '',
    contactEmail: '',
    phone: '',
    portalAccess: false,
    googleAccess: false,
    facebookAccess: false,
    monthlyPackageBdt: '',
    contractStartDate: '',
    notes: ''
  });

  // Load data on component mount, but only for admin users
  useEffect(() => {
    if (user?.role === 'agency_admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsRes, invitesRes] = await Promise.all([
        apiRequest('GET', '/api/admin/clients'),
        apiRequest('GET', '/api/admin/invites')
      ]);
      
      const clientsData = await clientsRes.json();
      const invitesData = await invitesRes.json();
      
      setClients(clientsData.clients || []);
      setInvites(invitesData.invites || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('POST', '/api/admin/clients', formData);
      const data = await res.json();
      
      if (res.ok) {
        // Show success message with invite code
        const inviteCode = data.client?.inviteCode || data.inviteCode;
        alert(`Client created successfully!\n\nInvite Code: ${inviteCode}\n\nShare this code with the client to activate their account.`);
        
        // Reset form and reload data
        setFormData({
          clientName: '',
          contactEmail: '',
          phone: '',
          portalAccess: false,
          googleAccess: false,
          facebookAccess: false,
          monthlyPackageBdt: '',
          contractStartDate: '',
          notes: ''
        });
        setShowCreateForm(false);
        await loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('PATCH', `/api/admin/clients/${editingClient.id}`, formData);
      const data = await res.json();
      
      if (res.ok) {
        alert('Client updated successfully!');
        setEditingClient(null);
        await loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client');
    }
  };

  const handleRegenerateInvite = async (clientId) => {
    try {
      const res = await apiRequest('POST', `/api/admin/clients/${clientId}/invite/regenerate`);
      const data = await res.json();
      
      if (res.ok) {
        alert(`New invite code generated!\n\nInvite Code: ${data.inviteCode}\n\nShare this code with the client.`);
        await loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error regenerating invite:', error);
      alert('Failed to regenerate invite');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const startEdit = (client) => {
    setFormData({
      clientName: client.clientName,
      contactEmail: client.contactEmail,
      phone: client.phone || '',
      portalAccess: client.portalAccess,
      googleAccess: client.googleAccess,
      facebookAccess: client.facebookAccess,
      monthlyPackageBdt: client.monthlyPackageBdt || '',
      contractStartDate: client.contractStartDate || '',
      notes: client.notes || ''
    });
    setEditingClient(client);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setFormData({
      clientName: '',
      contactEmail: '',
      phone: '',
      portalAccess: false,
      googleAccess: false,
      facebookAccess: false,
      monthlyPackageBdt: '',
      contractStartDate: '',
      notes: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage clients and invitations</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Clients ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invites'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Invites ({invites.length})
            </button>
          </nav>
        </div>

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Client Management</h2>
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingClient(null);
                  cancelEdit();
                }}
                className="bg-primary-600 hover:bg-primary-700"
              >
                + Create Client
              </Button>
            </div>

            {/* Create/Edit Form */}
            {(showCreateForm || editingClient) && (
              <div className="bg-white rounded-lg shadow mb-6 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingClient ? 'Edit Client' : 'Create New Client'}
                </h3>
                <form onSubmit={editingClient ? handleEditClient : handleCreateClient}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Client Name"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter client name"
                    />
                    <Input
                      label="Contact Email"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleFormChange}
                      required
                      placeholder="client@example.com"
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+880-1700-000000"
                    />
                    <Input
                      label="Monthly Package (BDT)"
                      name="monthlyPackageBdt"
                      type="number"
                      value={formData.monthlyPackageBdt}
                      onChange={handleFormChange}
                      placeholder="50000"
                    />
                    <Input
                      label="Contract Start Date"
                      name="contractStartDate"
                      type="date"
                      value={formData.contractStartDate}
                      onChange={handleFormChange}
                    />
                  </div>

                  {/* Platform Access */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Access
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="portalAccess"
                          checked={formData.portalAccess}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Portal Access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="googleAccess"
                          checked={formData.googleAccess}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Google Ads Access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="facebookAccess"
                          checked={formData.facebookAccess}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Facebook Ads Access</span>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Additional notes about the client..."
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3">
                    <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                      {editingClient ? 'Update Client' : 'Create Client'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        cancelEdit();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Clients List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform Access
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{client.clientName}</div>
                            <div className="text-sm text-gray-500">{client.contactEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            client.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {client.portalAccess && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Portal</span>}
                            {client.googleAccess && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Google</span>}
                            {client.facebookAccess && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Facebook</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.monthlyPackageBdt ? `৳${parseInt(client.monthlyPackageBdt).toLocaleString()}` : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => startEdit(client)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRegenerateInvite(client.id)}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Regenerate Invite
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {clients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No clients found. Create your first client to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Invites Tab */}
        {activeTab === 'invites' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Invitations</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invites.map((invite) => (
                      <tr key={invite.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invite.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invite.invitedEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invite.packageAmountBdt ? `৳${parseInt(invite.packageAmountBdt).toLocaleString()}` : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {invites.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending invitations.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}