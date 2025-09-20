import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

export function InvitePage() {
  const [location, setLocation] = useLocation();
  const { loginMutation } = useAuth();
  
  // Extract invite code from URL using wouter route params
  const [match, params] = useRoute('/invite/:code');
  const inviteCode = params?.code;
  
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  // Load invite details on mount
  useEffect(() => {
    if (inviteCode) {
      fetchInviteDetails();
    } else {
      setError('Invalid invite link');
      setLoading(false);
    }
  }, [inviteCode]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invite/${inviteCode}`);
      const data = await res.json();
      
      if (res.ok) {
        setInviteDetails(data);
        // No need to pre-fill email since it's read-only from invite
      } else {
        setError(data.error || 'Invalid or expired invite code');
      }
    } catch (err) {
      setError('Failed to load invite details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      
      // Activate the account
      const res = await fetch(`/api/invite/${inviteCode}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Account created successfully, now log in using the invite email
        try {
          await loginMutation.mutateAsync({
            email: inviteDetails.invitedEmail,
            password: formData.password
          });
          
          // Redirect to dashboard
          setLocation('/');
        } catch (loginError) {
          // Account was created but login failed - redirect to login page
          setLocation('/auth');
        }
      } else {
        setError(data.error || 'Failed to activate account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invite details...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => setLocation('/auth')}
            className="w-full"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Activate Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join VantaTrack Ad Engine
          </p>
        </div>

        {inviteDetails && (
          <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Company Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-blue-800">Company:</span>
                <span className="ml-2 text-blue-700">{inviteDetails.clientName}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Email:</span>
                <span className="ml-2 text-blue-700">{inviteDetails.invitedEmail}</span>
              </div>
              {inviteDetails.packageAmountBdt && (
                <div>
                  <span className="font-medium text-blue-800">Package:</span>
                  <span className="ml-2 text-blue-700">৳{parseInt(inviteDetails.packageAmountBdt).toLocaleString()}/month</span>
                </div>
              )}
              <div>
                <span className="font-medium text-blue-800">Platform Access:</span>
                <div className="ml-2 text-blue-700">
                  {inviteDetails.permissions?.portalAccess && <span className="mr-2">📰 Portal Ads</span>}
                  {inviteDetails.permissions?.googleAccess && <span className="mr-2">🔍 Google Ads</span>}
                  {inviteDetails.permissions?.facebookAccess && <span className="mr-2">📘 Facebook Ads</span>}
                  {!inviteDetails.permissions?.portalAccess && !inviteDetails.permissions?.googleAccess && !inviteDetails.permissions?.facebookAccess && (
                    <span className="text-gray-500">No platform access configured</span>
                  )}
                </div>
              </div>
              {inviteDetails.contractStartDate && (
                <div>
                  <span className="font-medium text-blue-800">Contract Start:</span>
                  <span className="ml-2 text-blue-700">{new Date(inviteDetails.contractStartDate).toLocaleDateString()}</span>
                </div>
              )}
              {inviteDetails.expiresAt && (
                <div>
                  <span className="font-medium text-blue-800">Expires:</span>
                  <span className="ml-2 text-blue-700">{new Date(inviteDetails.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>


            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Create a password (min. 8 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Creating Account...' : 'Activate Account'}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => setLocation('/auth')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}