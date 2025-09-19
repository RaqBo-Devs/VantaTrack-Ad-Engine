import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Router, Route, Switch } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/lib/ProtectedRoute';
import { Layout } from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import UploadPage from '@/pages/UploadPage';

// Placeholder pages for complete navigation
function CampaignsPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaigns</h1>
      <p className="text-gray-600">Multi-platform campaign management coming soon!</p>
    </div>
  );
}

function ClientsPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Clients</h1>
      <p className="text-gray-600">Client management portal coming soon!</p>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
      <p className="text-gray-600">Advanced analytics dashboard coming soon!</p>
    </div>
  );
}

function TemplatesPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Templates</h1>
      <p className="text-gray-600">Template management coming soon!</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            
            <ProtectedRoute>
              <Layout>
                <Switch>
                  <Route path="/" component={DashboardPage} />
                  <Route path="/campaigns" component={CampaignsPage} />
                  <Route path="/clients" component={ClientsPage} />
                  <Route path="/analytics" component={AnalyticsPage} />
                  <Route path="/upload" component={UploadPage} />
                  <Route path="/templates" component={TemplatesPage} />
                  
                  <Route>
                    <div className="text-center py-12">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                    </div>
                  </Route>
                </Switch>
              </Layout>
            </ProtectedRoute>
          </Switch>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;