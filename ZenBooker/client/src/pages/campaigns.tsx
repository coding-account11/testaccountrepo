import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Copy, Trash2, Send } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Campaign } from "@shared/schema";

// Mock user ID
const MOCK_USER_ID = "user-1";

interface CampaignWithFormatted extends Campaign {
  formattedDate?: string;
  statusColor?: string;
}

export default function Campaigns() {
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", MOCK_USER_ID],
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("DELETE", `/api/campaigns/${campaignId}/${MOCK_USER_ID}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", MOCK_USER_ID] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/send`, {
        userId: MOCK_USER_ID,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", MOCK_USER_ID] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    },
  });

  // Format campaigns data
  const formattedCampaigns: CampaignWithFormatted[] = campaigns.map(campaign => ({
    ...campaign,
    formattedDate: campaign.sentAt 
      ? new Date(campaign.sentAt).toLocaleDateString()
      : campaign.createdAt 
      ? new Date(campaign.createdAt).toLocaleDateString()
      : "",
    statusColor: campaign.status === "sent" ? "green" : 
                campaign.status === "sending" ? "blue" :
                campaign.status === "scheduled" ? "yellow" : "gray",
  }));

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "sent": return "default";
      case "sending": return "secondary";
      case "scheduled": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-2">Campaigns</h2>
          <p className="text-muted-foreground">View history of campaigns sent</p>
        </div>
        <Link href="/create-campaign">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {formattedCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No campaigns created yet.</p>
            <Link href="/create-campaign">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-medium line-clamp-2">
                    {campaign.name}
                  </CardTitle>
                  <Badge variant={getStatusVariant(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-muted-foreground">
                    {campaign.status === "sent" ? "Sent" : "Created"}: {campaign.formattedDate}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{campaign.recipientCount || 0}</span> recipients
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-primary">
                      {campaign.appointmentsBooked || 0}
                    </span> appointments booked
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                      disabled={deleteCampaignMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {campaign.status === "draft" && (
                    <Button 
                      size="sm"
                      onClick={() => sendCampaignMutation.mutate(campaign.id)}
                      disabled={sendCampaignMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendCampaignMutation.isPending ? "Sending..." : "Send"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}