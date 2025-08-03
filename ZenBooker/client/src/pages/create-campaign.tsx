import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Send, Calendar, Eye, Smartphone, Monitor } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

// Mock user ID
const MOCK_USER_ID = "user-1";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject line is required"),
  body: z.string().min(10, "Email body must be at least 10 characters"),
  segmentType: z.string(),
  businessType: z.string().optional(),
  campaignType: z.string().optional(),
  targetAudience: z.string().optional(),
});

interface GeneratedContent {
  subject: string;
  body: string;
}

export default function CreateCampaign() {
  const [, setLocation] = useLocation();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      segmentType: "all",
      businessType: "salon",
      campaignType: "reactivation",
      targetAudience: "inactive-clients",
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", MOCK_USER_ID],
  });

  const generateContentMutation = useMutation({
    mutationFn: async (params: {
      businessType: string;
      campaignType: string;
      targetAudience: string;
    }) => {
      const response = await apiRequest("POST", "/api/campaigns/generate-content", params);
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data) => {
      form.setValue("subject", data.subject);
      form.setValue("body", data.body);
      toast({
        title: "Content Generated",
        description: "AI has generated your campaign content. You can edit it as needed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof campaignSchema>) => {
      const response = await apiRequest("POST", "/api/campaigns", {
        userId: MOCK_USER_ID,
        name: data.name,
        subject: data.subject,
        body: data.body,
        audience: {
          segmentType: data.segmentType,
          filters: {},
          clientIds: selectedClients,
        },
        status: "draft",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      setLocation("/campaigns");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContent = () => {
    const businessType = form.getValues("businessType") || "salon";
    const campaignType = form.getValues("campaignType") || "reactivation";
    const targetAudience = form.getValues("targetAudience") || "inactive-clients";

    setIsGenerating(true);
    generateContentMutation.mutate({
      businessType,
      campaignType,
      targetAudience,
    });
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const onSubmit = (data: z.infer<typeof campaignSchema>) => {
    createCampaignMutation.mutate(data);
  };

  const getAudienceClients = () => {
    const segmentType = form.watch("segmentType");
    
    switch (segmentType) {
      case "inactive-30":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return clients.filter(client => 
          !client.lastVisit || new Date(client.lastVisit) < thirtyDaysAgo
        );
      case "inactive-60":
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return clients.filter(client => 
          !client.lastVisit || new Date(client.lastVisit) < sixtyDaysAgo
        );
      case "new-clients":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return clients.filter(client => 
          client.createdAt && new Date(client.createdAt) > sevenDaysAgo
        );
      default:
        return clients;
    }
  };

  const audienceClients = getAudienceClients();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-2">Create Campaign</h2>
        <p className="text-muted-foreground">Compose & send personalized campaigns</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Choose Audience */}
        <Card>
          <CardHeader>
            <CardTitle>1. Choose Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="segment">Audience Segment</Label>
              <Select 
                value={form.watch("segmentType")} 
                onValueChange={(value) => form.setValue("segmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="inactive-30">Inactive 30+ Days</SelectItem>
                  <SelectItem value="inactive-60">Inactive 60+ Days</SelectItem>
                  <SelectItem value="new-clients">New Clients (Last 7 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                Selected Audience: {audienceClients.length} clients
              </p>
              <div className="flex flex-wrap gap-2">
                {audienceClients.slice(0, 5).map((client) => (
                  <Badge key={client.id} variant="secondary">
                    {client.name}
                  </Badge>
                ))}
                {audienceClients.length > 5 && (
                  <Badge variant="outline">+{audienceClients.length - 5} more</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: AI Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle>2. AI Message Composer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select 
                  value={form.watch("businessType")} 
                  onValueChange={(value) => form.setValue("businessType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon">Hair Salon</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="clinic">Medical Clinic</SelectItem>
                    <SelectItem value="dental">Dental Office</SelectItem>
                    <SelectItem value="fitness">Fitness Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select 
                  value={form.watch("campaignType")} 
                  onValueChange={(value) => form.setValue("campaignType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reactivation">Reactivation</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select 
                  value={form.watch("targetAudience")} 
                  onValueChange={(value) => form.setValue("targetAudience", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive-clients">Inactive Clients</SelectItem>
                    <SelectItem value="new-clients">New Clients</SelectItem>
                    <SelectItem value="loyal-clients">Loyal Clients</SelectItem>
                    <SelectItem value="high-value">High Value Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="button" 
              onClick={handleGenerateContent}
              disabled={isGenerating || generateContentMutation.isPending}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating || generateContentMutation.isPending ? "Generating..." : "Generate AI Content"}
            </Button>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  {...form.register("name")}
                  placeholder="e.g., Spring Reactivation Campaign"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input 
                  {...form.register("subject")}
                  placeholder="e.g., We miss you! Come back for 20% off"
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea 
                  {...form.register("body")}
                  rows={8}
                  placeholder="Your personalized email content will appear here..."
                />
                {form.formState.errors.body && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.body.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Preview Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              3. Preview Email
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`mx-auto bg-white border border-gray-300 rounded-lg overflow-hidden ${
              previewMode === "mobile" ? "max-w-sm" : "max-w-2xl"
            }`}>
              <div className="bg-gray-100 px-4 py-2 border-b text-sm">
                <div className="font-medium">From: BookingAI</div>
                <div className="font-medium">Subject: {form.watch("subject") || "Your subject line..."}</div>
              </div>
              <div className="p-6">
                <div className="whitespace-pre-wrap text-gray-900">
                  {form.watch("body") || "Your email content will appear here..."}
                </div>
                <div className="mt-6">
                  <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg">
                    Book Now
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Send or Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>4. Send Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ready to send to {audienceClients.length} recipients
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button type="button" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button 
                  type="submit"
                  disabled={createCampaignMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}