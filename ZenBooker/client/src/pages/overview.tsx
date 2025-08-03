import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Mail, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Overview() {
  const { user } = useAuth();
  
  // If user is not authenticated, show login message
  if (!user) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-primary mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please log in to access your dashboard.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </main>
    );
  }
  
  const userId = user.id;

interface OverviewMetrics {
  appointmentsCount30d: number;
  appointmentsCount7d: number;
  topCampaign: { name: string; bookings: number } | null;
  appointmentsGrowth: number;
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: "success" | "info" | "neutral";
}

interface AutoCampaign {
  id: string;
  name: string;
  subject: string;
  autoCategory: string;
  scheduledAt: string;
  recipientCount: number;
}

  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d">("30d");

  const { data: metrics, isLoading } = useQuery<OverviewMetrics>({
    queryKey: ["/api/overview", userId],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentActivity = [] } = useQuery<RecentActivity[]>({
    queryKey: ["/api/activity", userId],
  });

  const { data: upcomingAutoCampaigns = [] } = useQuery<AutoCampaign[]>({
    queryKey: ["/api/auto-campaigns/upcoming", userId],
  });

  const { data: nextAutoCampaignDate } = useQuery<{ nextDate: string | null }>({
    queryKey: ["/api/auto-campaigns/next-date", userId],
  });

  const { data: integrations = [] } = useQuery<any[]>({
    queryKey: ["/api/integrations", userId],
  });

  const { toast } = useToast();

  const generateAutoCampaignsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auto-campaigns/generate", {
        userId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Campaigns Generated",
        description: `Successfully generated ${data.campaignsCreated} new campaigns`,
      });
      // Refresh the upcoming campaigns
      queryClient.invalidateQueries({ queryKey: ["/api/auto-campaigns/upcoming", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auto-campaigns/next-date", userId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate auto-campaigns. Please complete your business profile first.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAutoCampaigns = () => {
    generateAutoCampaignsMutation.mutate();
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </main>
    );
  }

  const displayCount = selectedPeriod === "30d" 
    ? metrics?.appointmentsCount30d || 0 
    : metrics?.appointmentsCount7d || 0;

  const gmailConnected = integrations.some(int => int.provider === "gmail" && int.isActive);
  const squareConnected = integrations.some(int => int.provider === "square" && int.isActive);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-2">Overview</h2>
        <p className="text-muted-foreground">Track your email campaign performance and auto-campaigns</p>
      </div>

      {/* Metrics Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* New Appointments Tile */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">New Appointments</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant={selectedPeriod === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("7d")}
                  className="text-xs h-7 px-2"
                >
                  7d
                </Button>
                <Button
                  variant={selectedPeriod === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("30d")}
                  className="text-xs h-7 px-2"
                >
                  30d
                </Button>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold text-primary mb-1">
                  {displayCount}
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">
                    +{Math.round(metrics?.appointmentsGrowth || 0)}%
                  </span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                from email campaigns
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Campaign Tile */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Top Performing Campaign</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-lg font-medium text-primary mb-1">
                  {metrics?.topCampaign?.name || "No campaigns yet"}
                </div>
                <div className="text-3xl font-semibold text-primary mb-1">
                  {metrics?.topCampaign?.bookings || 0}
                </div>
                <div className="text-sm text-muted-foreground">appointments booked</div>
              </div>
              {metrics?.topCampaign && (
                <div className="text-xs text-muted-foreground">
                  View details
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Campaigns Section */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Auto-Campaigns
            </h3>
            <Button
              onClick={handleGenerateAutoCampaigns}
              disabled={generateAutoCampaignsMutation.isPending}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generateAutoCampaignsMutation.isPending ? 'animate-spin' : ''}`} />
              {generateAutoCampaignsMutation.isPending ? "Generating..." : "Generate Campaigns"}
            </Button>
          </div>
          
          {upcomingAutoCampaigns.length > 0 ? (
            <div>
              <div className="text-sm text-muted-foreground mb-4">
                {nextAutoCampaignDate?.nextDate ? (
                  `Next in ${Math.ceil((new Date(nextAutoCampaignDate.nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                ) : (
                  "No upcoming campaigns"
                )}
              </div>
              <div className="space-y-3">
              {upcomingAutoCampaigns.slice(0, 3).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-primary">{campaign.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {campaign.autoCategory}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{campaign.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.recipientCount} recipients • {new Date(campaign.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Send
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No auto-campaigns generated yet</p>
              <p className="text-sm text-muted-foreground">
                Complete your business profile and import clients to generate personalized campaigns
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Checklist */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-primary mb-4">Setup Checklist</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                gmailConnected ? "border-green-500 bg-green-500" : "border-gray-300"
              }`}>
                {gmailConnected ? (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                )}
              </div>
              <span className="text-sm">Connect Gmail for email sending</span>
              <Link href="/integrations">
                <Button variant="outline" size="sm">
                  {gmailConnected ? "Connected" : "Connect Gmail"}
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                squareConnected ? "border-green-500 bg-green-500" : "border-gray-300"
              }`}>
                {squareConnected ? (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                )}
              </div>
              <span className="text-sm">Connect Square (optional)</span>
              <Link href="/integrations">
                <Button variant="outline" size="sm">
                  {squareConnected ? "Connected" : "Connect Square"}
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </div>
              <span className="text-sm">Complete your business profile</span>
              <Link href="/business-profile">
                <Button variant="outline" size="sm">Complete Profile</Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </div>
              <span className="text-sm">Import your customer list</span>
              <Link href="/clients">
                <Button variant="outline" size="sm">Import Customers</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Button */}
      <div className="flex justify-center mb-12">
        <Link href="/create-campaign">
          <Button className="bg-accent hover:bg-accent/90 text-white font-medium px-8 py-3 h-auto">
            <Plus className="w-5 h-5 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-primary mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-green-500"
                          : activity.type === "info"
                          ? "bg-blue-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm text-primary">{activity.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}