import { Link } from "react-router-dom";
import { Calendar, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container max-w-4xl py-16 px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Find the Perfect Meeting Time
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a poll, share it with your team, and let everyone vote on the best time. 
            No signups required.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <Button asChild size="lg" className="gap-2 text-lg px-8">
            <Link to="/create">
              Create a Poll
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-xl bg-muted/30">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">1. Pick Dates</h3>
            <p className="text-sm text-muted-foreground">
              Select potential dates and times for your meeting from an interactive calendar.
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-muted/30">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">2. Share & Vote</h3>
            <p className="text-sm text-muted-foreground">
              Share the link with participants. They vote Yes, No, or Maybe on each option.
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-muted/30">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">3. Pick the Best</h3>
            <p className="text-sm text-muted-foreground">
              View results in real-time and easily identify the time that works for everyone.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            ✓ No account needed &nbsp;·&nbsp; ✓ Private admin results &nbsp;·&nbsp; ✓ Real-time updates
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
