import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const features = [
    "Unlimited email campaigns",
    "AI-powered content generation", 
    "Square integration & client sync",
    "Smart client segmentation",
    "Real-time booking tracking",
    "Mobile-responsive campaign builder",
    "Email delivery from your domain",
    "Priority customer support",
    "Advanced analytics dashboard",
    "Team collaboration tools"
  ];

  const handleContactUs = (plan: string) => {
    const subject = encodeURIComponent(`BookingAI ${plan} Plan Inquiry`);
    const body = encodeURIComponent(`Hi, I'm interested in the ${plan} plan for BookingAI. Please contact me with more details.`);
    window.open(`mailto:hello@bookingai.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-primary">BookingAI</span>
        </div>
        <Link href="/login">
          <Button>Get Started</Button>
        </Link>
      </nav>

      {/* Pricing Header */}
      <section className="px-6 py-16 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-4">
          Simple, Transparent Pricing
        </Badge>
        <h1 className="text-4xl font-bold text-primary mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          All plans include every feature. No hidden fees, no limits on campaigns or clients.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-primary mb-2">Monthly</CardTitle>
              <div className="mb-4">
                <span className="text-4xl font-bold text-primary">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">
                Perfect for getting started quickly
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleContactUs('Monthly')}
              >
                Contact Us
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                No setup fees • Cancel anytime
              </p>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className="relative border-2 border-accent">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-accent text-white">
                Save $840/year
              </Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl text-primary mb-2">Yearly</CardTitle>
              <div className="mb-2">
                <span className="text-4xl font-bold text-primary">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="mb-4">
                <span className="text-lg text-muted-foreground line-through">$99/month</span>
                <span className="text-accent font-medium ml-2">70% off</span>
              </div>
              <p className="text-muted-foreground">
                Best value for committed businesses
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full bg-accent hover:bg-accent/90" 
                size="lg"
                onClick={() => handleContactUs('Yearly')}
              >
                Contact Us
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Billed annually ($348/year) • 30-day money back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-primary text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              What's included in both plans?
            </h3>
            <p className="text-muted-foreground">
              Everything. Both plans include all features, unlimited campaigns, unlimited clients, 
              Square integration, AI content generation, and priority support.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              How does the Square integration work?
            </h3>
            <p className="text-muted-foreground">
              Simply log into your Square account through our secure integration. We'll automatically 
              sync your client data and segment them based on booking patterns.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Do I need to provide my own email API?
            </h3>
            <p className="text-muted-foreground">
              No. Emails are sent from your business email address through our integrated delivery system. 
              No technical setup required.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-muted-foreground">
              Yes. Cancel anytime with no penalties. Yearly plans include a 30-day money-back guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-800 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of service businesses using BookingAI to fill their calendars
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" onClick={() => handleContactUs('Monthly')}>
              Contact Us Today
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}