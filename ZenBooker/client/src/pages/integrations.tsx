import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Plus, RefreshCw, LogOut, Mail } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Integration {
  id: string;
  provider: string;
  isActive: boolean;
  settings: any;
  lastSync?: string;
}

// Mock user ID
const MOCK_USER_ID = "user-1";

export default function Integrations() {
  const { toast } = useToast();

  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations", MOCK_USER_ID],
  });

  const gmailConnectMutation = useMutation({
    mutationFn: async () => {
      // Redirect to Gmail OAuth
      window.location.href = `/api/integrations/gmail/auth?userId=${MOCK_USER_ID}`;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to connect to Gmail",
        variant: "destructive",
      });
    },
  });

  const gmailDisconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/integrations/gmail/disconnect", {
        userId: MOCK_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gmail integration disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", MOCK_USER_ID] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect Gmail",
        variant: "destructive",
      });
    },
  });

  const squareConnectMutation = useMutation({
    mutationFn: async () => {
      // Redirect to Square OAuth
      window.location.href = '/api/integrations/square/auth';
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to connect to Square",
        variant: "destructive",
      });
    },
  });

  const squareSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/integrations/square/sync", {
        userId: MOCK_USER_ID,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Sync completed: ${data.results.customers.synced} customers, ${data.results.bookings.synced} bookings`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", MOCK_USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", MOCK_USER_ID] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync from Square",
        variant: "destructive",
      });
    },
  });

  const squareDisconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/integrations/square/disconnect", {
        userId: MOCK_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Square integration disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", MOCK_USER_ID] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect Square",
        variant: "destructive",
      });
    },
  });

  const handleGmailConnect = () => {
    gmailConnectMutation.mutate();
  };

  const handleGmailDisconnect = () => {
    if (confirm("Are you sure you want to disconnect Gmail? This will stop email sending.")) {
      gmailDisconnectMutation.mutate();
    }
  };

  const handleSquareConnect = () => {
    squareConnectMutation.mutate();
  };

  const handleSquareSync = () => {
    squareSyncMutation.mutate();
  };

  const handleSquareDisconnect = () => {
    if (confirm("Are you sure you want to disconnect Square? This will stop automatic syncing.")) {
      squareDisconnectMutation.mutate();
    }
  };

  const getIntegrationStatus = (provider: string) => {
    return integrations.find(int => int.provider === provider && int.isActive);
  };

  const gmailIntegration = getIntegrationStatus("gmail");
  const squareIntegration = getIntegrationStatus("square");

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-48">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-2">Integrations</h2>
        <p className="text-muted-foreground">Connect your accounts to enable email sending and data sync</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Gmail Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Gmail
              </div>
              {gmailIntegration ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Gmail account to send personalized win-back emails directly from your email address.
            </p>
            
            {gmailIntegration ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Email sending enabled - emails sent from your Gmail account
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connected: {gmailIntegration.lastSync ? new Date(gmailIntegration.lastSync).toLocaleString() : 'Recently'}
                </p>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGmailDisconnect}
                    disabled={gmailDisconnectMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {gmailDisconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleGmailConnect}
                disabled={gmailConnectMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {gmailConnectMutation.isPending ? "Connecting..." : "Connect Gmail"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Square Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Square
              {squareIntegration ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Square account to automatically sync client data and track appointment bookings.
            </p>
            
            {squareIntegration ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Auto sync enabled - updates every 24 hours
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last sync: {squareIntegration.lastSync ? new Date(squareIntegration.lastSync).toLocaleString() : 'Never'}
                </p>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSquareSync}
                    disabled={squareSyncMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${squareSyncMutation.isPending ? 'animate-spin' : ''}`} />
                    {squareSyncMutation.isPending ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSquareDisconnect}
                    disabled={squareDisconnectMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {squareDisconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleSquareConnect}
                disabled={squareConnectMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {squareConnectMutation.isPending ? "Connecting..." : "Connect Square"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}