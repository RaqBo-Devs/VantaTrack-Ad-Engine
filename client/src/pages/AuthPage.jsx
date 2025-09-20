import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    loginMutation.mutate({
      email: formData.email,
      password: formData.password
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-vanta rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VantaTrack</h1>
                <p className="text-sm text-gray-600">Ad Engine</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back to VantaTrack
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  loading={loginMutation.isPending}
                  disabled={loginMutation.isPending}
                >
                  Sign in
                </Button>
              </div>

              {loginMutation.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    {loginMutation.error?.message || 'Authentication failed. Please try again.'}
                  </p>
                </div>
              )}
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  VantaTrack uses invite-only access.
                  <br />
                  Contact your administrator for account access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-vanta">
          <div className="flex items-center justify-center h-full px-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-6">
                Complete Media Management for Bangladesh
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Unified campaign management across Portal, Google Ads, and Facebook Ads platforms
              </p>
              <div className="grid grid-cols-1 gap-4 text-left max-w-md mx-auto">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-300">✓</span>
                  </div>
                  <span>Multi-platform campaign tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-300">✓</span>
                  </div>
                  <span>CSV/Excel data upload system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-300">✓</span>
                  </div>
                  <span>Real-time analytics dashboard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-300">✓</span>
                  </div>
                  <span>Bangladeshi Taka currency support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}