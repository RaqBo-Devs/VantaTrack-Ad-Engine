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
import CampaignsPage from '@/pages/CampaignsPage';
import ClientsPage from '@/pages/ClientsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import PlacementManagerPage from '@/pages/PlacementManagerPage';
import AdminPage from '@/pages/AdminPage';
import { InvitePage } from '@/pages/InvitePage';

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
            <Route path="/invite/:code" component={InvitePage} />
            
            <ProtectedRoute>
              <Layout>
                <Switch>
                  <Route path="/" component={DashboardPage} />
                  <Route path="/campaigns">
                    <CampaignsPage />
                  </Route>
                  <Route path="/clients">
                    <ClientsPage />
                  </Route>
                  <Route path="/analytics">
                    <AnalyticsPage />
                  </Route>
                  <Route path="/placements">
                    <PlacementManagerPage />
                  </Route>
                  <Route path="/upload" component={UploadPage} />
                  <Route path="/templates" component={TemplatesPage} />
                  <Route path="/admin" component={AdminPage} />
                  
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