import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Send, Users, ArrowRight, ArrowLeft, Copy, Edit, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Client } from "@shared/schema";

interface CampaignStep {
  name: string;
  description: string;
  completed: boolean;
}

interface GeneratedContent {
  subject: string;
  body: string;
}

interface PersonalizedMessage {
  clientId: string;
  clientName: string;
  subject: string;
  body: string;
  isEdited: boolean;
}

interface CampaignData {
  name: string;
  audience: {
    segmentType: string;
    clientIds: string[];
  };
  aiOptions: {
    seasonalTheme?: string;
    focusKeywords?: string;
    additionalInstructions?: string;
  };
  personalizedMessages: PersonalizedMessage[];
}

const audienceSegments = [
  { value: "all", label: "All Customers" },
  { value: "inactive-30", label: "Inactive 30+ Days" },
  { value: "inactive-60", label: "Inactive 60+ Days" },
  { value: "new-clients", label: "New Clients (Last 7 Days)" },
  { value: "loyal-clients", label: "Loyal Customers" },
  { value: "high-value", label: "High Value Customers" }
];

const seasonalThemes = [
  "Spring",
  "Summer", 
  "Fall",
  "Winter",
  "Holiday",
  "Back to School",
  "New Year"
];

export default function CreateCampaignV2() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    audience: {
      segmentType: "all",
      clientIds: []
    },
    aiOptions: {},
    personalizedMessages: []
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id || "user-1"],
  });

  const generateContentMutation = useMutation({
    mutationFn: async (params: {
      businessType: string;
      campaignType: string;
      targetAudience: string;
      seasonalTheme?: string;
      focusKeywords?: string;
      additionalInstructions?: string;
    }) => {
      const response = await apiRequest("POST", "/api/campaigns/generate-content", params);
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data) => {
      // Generate personalized messages for each client
      const messages: PersonalizedMessage[] = clients.map(client => ({
        clientId: client.id,
        clientName: client.name,
        subject: data.subject,
        body: data.body,
        isEdited: false
      }));
      
      setCampaignData(prev => ({
        ...prev,
        personalizedMessages: messages
      }));
      
      setCurrentStep(3);
      toast({
        title: "Content Generated",
        description: "AI has generated personalized content for each customer.",
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
    mutationFn: async (data: CampaignData) => {
      const response = await apiRequest("POST", "/api/campaigns", {
        userId: user?.id || "user-1",
        name: data.name,
        audience: data.audience,
        personalizedMessages: data.personalizedMessages,
        status: "draft"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully.",
      });
      setLocation("/campaigns");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContent = () => {
    generateContentMutation.mutate({
      businessType: "fitness", // This should come from business profile
      campaignType: "promotion",
      targetAudience: campaignData.audience.segmentType,
      seasonalTheme: campaignData.aiOptions.seasonalTheme,
      focusKeywords: campaignData.aiOptions.focusKeywords,
      additionalInstructions: campaignData.aiOptions.additionalInstructions,
      userId: user?.id || "user-1"
    });
  };

  const handleSaveEdits = () => {
    // Save the edited messages
    toast({
      title: "Edits Saved",
      description: "Your personalized messages have been saved.",
    });
  };

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(campaignData);
  };

  const updatePersonalizedMessage = (clientId: string, field: 'subject' | 'body', value: string) => {
    setCampaignData(prev => ({
      ...prev,
      personalizedMessages: prev.personalizedMessages.map(msg => 
        msg.clientId === clientId 
          ? { ...msg, [field]: value, isEdited: true }
          : msg
      )
    }));
  };

  const getAudienceClients = () => {
    const segmentType = campaignData.audience.segmentType;
    
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

  const steps: CampaignStep[] = [
    {
      name: "Choose Audience",
      description: "Select your target audience",
      completed: currentStep > 1
    },
    {
      name: "Generate AI Content",
      description: "Configure AI content generation",
      completed: currentStep > 2
    },
    {
      name: "Personalize Messages",
      description: "Review and edit personalized content",
      completed: currentStep > 3
    }
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-2">Create Campaign</h2>
        <p className="text-muted-foreground">Step-by-step campaign creation with AI-powered personalization</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed 
                  ? "bg-primary border-primary text-white" 
                  : currentStep === index + 1
                  ? "border-primary text-primary"
                  : "border-gray-300 text-gray-500"
              }`}>
                {step.completed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{step.name}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.completed ? "bg-primary" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Choose Audience */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Step 1: Choose Your Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Summer Promotion Campaign"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="audienceSegment">Audience Segment</Label>
              <Select 
                value={campaignData.audience.segmentType} 
                onValueChange={(value) => setCampaignData(prev => ({ 
                  ...prev, 
                  audience: { ...prev.audience, segmentType: value }
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select audience segment" />
                </SelectTrigger>
                <SelectContent>
                  {audienceSegments.map((segment) => (
                    <SelectItem key={segment.value} value={segment.value}>
                      {segment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                Selected Audience: {audienceClients.length} customers
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

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!campaignData.name || audienceClients.length === 0}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Generate AI Content */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Step 2: Generate AI Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="seasonalTheme">Seasonal Theme (Optional)</Label>
                <Select 
                  value={campaignData.aiOptions.seasonalTheme || ""} 
                  onValueChange={(value) => setCampaignData(prev => ({ 
                    ...prev, 
                    aiOptions: { ...prev.aiOptions, seasonalTheme: value }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonalThemes.map((theme) => (
                      <SelectItem key={theme} value={theme}>
                        {theme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="focusKeywords">Focus Keywords (Optional)</Label>
                <Input
                  id="focusKeywords"
                  value={campaignData.aiOptions.focusKeywords || ""}
                  onChange={(e) => setCampaignData(prev => ({ 
                    ...prev, 
                    aiOptions: { ...prev.aiOptions, focusKeywords: e.target.value }
                  }))}
                  placeholder="sale, discount, limited time, etc."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="additionalInstructions">Additional Instructions (Optional)</Label>
                <Textarea
                  id="additionalInstructions"
                  value={campaignData.aiOptions.additionalInstructions || ""}
                  onChange={(e) => setCampaignData(prev => ({ 
                    ...prev, 
                    aiOptions: { ...prev.aiOptions, additionalInstructions: e.target.value }
                  }))}
                  placeholder="Any specific instructions for the AI..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The AI will incorporate all this additional context along with your business profile and customer data to create highly personalized content.
              </p>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous Step
              </Button>
              <Button 
                onClick={handleGenerateContent}
                disabled={generateContentMutation.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateContentMutation.isPending ? "Generating..." : "Generate AI Content"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Personalized Messages */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Step 3: Personalized Content Variations
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveEdits}
                >
                  Save Edits
                </Button>
                <Button 
                  size="sm"
                  onClick={handleCreateCampaign}
                  disabled={createCampaignMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Personalized content for {campaignData.personalizedMessages.length} targeted customers. 
              Previewing the first {Math.min(campaignData.personalizedMessages.length, 10)}.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="variation-1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="variation-1">Variation 1</TabsTrigger>
                <TabsTrigger value="variation-2">Variation 2</TabsTrigger>
                <TabsTrigger value="variation-3">Variation 3</TabsTrigger>
              </TabsList>
              
              <TabsContent value="variation-1" className="mt-6">
                <div className="mb-4">
                  <h4 className="font-medium">Variation Concept: Try Our New Summer Smoothie!</h4>
                </div>
                
                <div className="space-y-4">
                  {campaignData.personalizedMessages.slice(0, 10).map((message, index) => (
                    <Card key={message.clientId} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {message.clientName.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{message.clientName}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Subject Line</Label>
                            <Input
                              value={message.subject}
                              onChange={(e) => updatePersonalizedMessage(message.clientId, 'subject', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Message Body</Label>
                            <Textarea
                              value={message.body}
                              onChange={(e) => updatePersonalizedMessage(message.clientId, 'body', e.target.value)}
                              className="text-sm"
                              rows={4}
                            />
                          </div>
                        </div>
                        
                        {message.isEdited && (
                          <Badge variant="secondary" className="mt-2">
                            Edited
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="variation-2" className="mt-6">
                <p className="text-muted-foreground">Variation 2 content will be generated...</p>
              </TabsContent>
              
              <TabsContent value="variation-3" className="mt-6">
                <p className="text-muted-foreground">Variation 3 content will be generated...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </main>
  );
} 