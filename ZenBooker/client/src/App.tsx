import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Pricing from "@/pages/pricing";
import Overview from "@/pages/overview";
import Clients from "@/pages/clients";
import Campaigns from "@/pages/campaigns";
import CreateCampaign from "@/pages/create-campaign";
import CreateCampaignV2 from "@/pages/create-campaign-v2";
import Integrations from "@/pages/integrations";
import BusinessProfile from "@/pages/business-profile";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Public routes without navigation
  const publicRoutes = ['/', '/login', '/pricing'];
  const isPublicRoute = publicRoutes.includes(location);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return <Login />;
  }

  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Protected routes with navigation
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <Switch>
        <Route path="/dashboard" component={Overview} />
        <Route path="/clients" component={Clients} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/create-campaign" component={CreateCampaignV2} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/settings" component={BusinessProfile} />
        <Route path="/business-profile" component={BusinessProfile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
