import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface BusinessProfile {
  businessName: string;
  businessCategory: string;
  location: string;
  businessEmail: string;
  brandVoice: "friendly" | "professional" | "playful" | "sophisticated";
  shortBusinessBio: string;
  productsServices: string;
  businessMaterials: string;
}

const businessCategories = [
  "Healthcare",
  "Fitness & Wellness",
  "Beauty & Salon",
  "Restaurant & Food",
  "Retail",
  "Professional Services",
  "Education",
  "Entertainment",
  "Other"
];

export default function BusinessProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // If user is not authenticated, show login message
  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-primary mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please log in to access your business profile.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </main>
    );
  }
  
  const userId = user.id;
  
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: "",
    businessCategory: "Healthcare",
    location: "",
    businessEmail: "",
    brandVoice: "playful",
    shortBusinessBio: "",
    productsServices: "",
    businessMaterials: ""
  });

  // Load existing business profile
  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ["/api/business-profile", userId],
    enabled: !!userId,
  });

  // Update form when existing profile loads
  useEffect(() => {
    if (existingProfile?.profile) {
      setProfile({
        businessName: existingProfile.profile.businessName || "",
        businessCategory: existingProfile.profile.businessCategory || "Healthcare",
        location: existingProfile.profile.location || "",
        businessEmail: existingProfile.profile.businessEmail || "",
        brandVoice: (existingProfile.profile.brandVoice as any) || "playful",
        shortBusinessBio: existingProfile.profile.shortBusinessBio || "",
        productsServices: existingProfile.profile.productsServices || "",
        businessMaterials: existingProfile.profile.businessMaterials || ""
      });
    }
  }, [existingProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: BusinessProfile) => {
      const response = await apiRequest("POST", "/api/business-profile", {
        userId,
        ...data
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your business profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-2">Edit Business Profile</h2>
        <p className="text-muted-foreground">
          Help AI create better marketing content by providing information about your business
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Business Information
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic details about your business that will be used to personalize your content.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name*</Label>
                <Input
                  id="businessName"
                  value={profile.businessName}
                  onChange={(e) => setProfile({...profile, businessName: e.target.value})}
                  placeholder="Your Business Name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="businessCategory">Business Category*</Label>
                <select
                  id="businessCategory"
                  value={profile.businessCategory}
                  onChange={(e) => setProfile({...profile, businessCategory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {businessCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="location">Location*</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                  placeholder="City, State"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={profile.businessEmail}
                  onChange={(e) => setProfile({...profile, businessEmail: e.target.value})}
                  placeholder="hello@yourbusiness.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This email will be used for sending emails and cannot be changed here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Brand Voice & Tone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Brand Voice & Tone
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the tone that best represents your brand's personality.
              </p>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={profile.brandVoice}
                onValueChange={(value) => setProfile({...profile, brandVoice: value as any})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="friendly" id="friendly" />
                  <Label htmlFor="friendly" className="flex-1">
                    <div className="font-medium">Friendly</div>
                    <div className="text-sm text-muted-foreground">Warm, approachable, and conversational</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professional" id="professional" />
                  <Label htmlFor="professional" className="flex-1">
                    <div className="font-medium">Professional</div>
                    <div className="text-sm text-muted-foreground">Formal, expert, and trustworthy</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="playful" id="playful" />
                  <Label htmlFor="playful" className="flex-1">
                    <div className="font-medium">Playful</div>
                    <div className="text-sm text-muted-foreground">Fun, energetic, and creative</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sophisticated" id="sophisticated" />
                  <Label htmlFor="sophisticated" className="flex-1">
                    <div className="font-medium">Sophisticated</div>
                    <div className="text-sm text-muted-foreground">Elegant, refined, and premium</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Business Description */}
          <Card>
            <CardHeader>
              <CardTitle>Business Description</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell us about your business in your own words.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shortBusinessBio">Short Business Bio</Label>
                <Textarea
                  id="shortBusinessBio"
                  value={profile.shortBusinessBio}
                  onChange={(e) => setProfile({...profile, shortBusinessBio: e.target.value})}
                  placeholder="Describe your business..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {profile.shortBusinessBio.length}/500 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="productsServices">Products, Services, or Menu</Label>
                <Textarea
                  id="productsServices"
                  value={profile.productsServices}
                  onChange={(e) => setProfile({...profile, productsServices: e.target.value})}
                  placeholder="List your main products, services, or menu items..."
                  rows={4}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Be as detailed as possible. This helps our AI create more relevant content.
              </p>
            </CardContent>
          </Card>

          {/* Additional Business Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Business Materials</CardTitle>
              <p className="text-sm text-muted-foreground">
                Include details about your visual style, color preferences, typical layouts, social media aesthetic, and any specific branding elements you use.
              </p>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="businessMaterials">Business Materials Description</Label>
                <Textarea
                  id="businessMaterials"
                  value={profile.businessMaterials}
                  onChange={(e) => setProfile({...profile, businessMaterials: e.target.value})}
                  placeholder="Describe your brand aesthetic, visual style, social media presence..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Update Profile Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
} 