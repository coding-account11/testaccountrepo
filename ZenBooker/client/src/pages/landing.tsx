import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, Users, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    "AI-powered email content generation",
    "Gmail integration for personal email sending",
    "Smart client segmentation",
    "Auto-campaign system",
    "Mobile-responsive campaign builder",
    "Real-time performance metrics"
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      business: "Elegant Hair Studio",
      quote: "PromoPal helped us bring back 40% of inactive clients with personalized campaigns."
    },
    {
      name: "Dr. James K.",
      business: "Downtown Dental",
      quote: "The AI writes better emails than I do. Saved us hours and increased re-engagement by 60%."
    },
    {
      name: "Lisa R.",
      business: "Zen Spa & Wellness",
      quote: "Simple, clean interface. No complicated charts - just results that matter."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-primary">PromoPal</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/pricing">
            <Button variant="ghost">Pricing</Button>
          </Link>
          <Button onClick={() => setLocation("/login")}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-4">
          AI-Powered Email Marketing
        </Badge>
        <h1 className="text-5xl font-bold text-primary mb-6 leading-tight">
          Turn Email Campaigns Into 
          <span className="text-accent"> Win-Back Success</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          The minimalist email platform built for service businesses. 
          AI writes your campaigns, Gmail sends them personally, you track what matters: re-engagement.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Button size="lg" onClick={() => setLocation("/login")} className="px-8">
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground mb-8">Trusted by 500+ service businesses</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-medium text-primary">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary mb-4">Everything You Need, Nothing You Don't</h2>
          <p className="text-lg text-muted-foreground">Clean, focused tools that drive appointment bookings</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardContent className="p-8">
              <Sparkles className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-3">AI Content Generation</h3>
              <p className="text-muted-foreground">Let AI write personalized emails that bring clients back</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <Mail className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-3">Gmail Integration</h3>
              <p className="text-muted-foreground">Personal email sending through your Gmail account</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <TrendingUp className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-3">Auto-Campaign System</h3>
              <p className="text-muted-foreground">Automatically generated campaigns for maximum engagement</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-primary mb-8 text-center">Complete Feature List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Win Back Your Clients?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of service businesses using AI to bring back inactive clients
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setLocation("/login")}
            className="px-8"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">PromoPal</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}