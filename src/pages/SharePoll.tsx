import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Check, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const SharePoll = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const [searchParams] = useSearchParams();
  const adminToken = searchParams.get("admin");
  
  const [poll, setPoll] = useState<{ title: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedVoting, setCopiedVoting] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const baseUrl = window.location.origin;
  const votingLink = `${baseUrl}/poll/${pollId}/vote`;
  const adminLink = `${baseUrl}/poll/${pollId}/results?admin=${adminToken}`;

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;
      
      const { data, error } = await supabase
        .from("polls")
        .select("title, description")
        .eq("id", pollId)
        .single();

      if (error) {
        console.error("Error fetching poll:", error);
      } else {
        setPoll(data);
      }
      setLoading(false);
    };

    fetchPoll();
  }, [pollId]);

  const copyToClipboard = async (text: string, type: "voting" | "admin") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "voting") {
        setCopiedVoting(true);
        setTimeout(() => setCopiedVoting(false), 2000);
      } else {
        setCopiedAdmin(true);
        setTimeout(() => setCopiedAdmin(false), 2000);
      }
      toast({ title: "Copied to clipboard!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Poll Created!</h1>
          {poll && (
            <p className="text-muted-foreground mt-2">"{poll.title}" is ready to share</p>
          )}
        </div>

        <div className="space-y-6">
          {/* Voting Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Voting Link
              </CardTitle>
              <CardDescription>
                Share this link with participants so they can vote on the best time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={votingLink} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(votingLink, "voting")}
                  className="shrink-0"
                >
                  {copiedVoting ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button asChild variant="secondary" className="w-full">
                <Link to={`/poll/${pollId}/vote`}>
                  Preview Voting Page
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Link */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Admin Link
              </CardTitle>
              <CardDescription>
                <strong>Keep this link private!</strong> Only you should have access to view all responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={adminLink} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(adminLink, "admin")}
                  className="shrink-0"
                >
                  {copiedAdmin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button asChild className="w-full">
                <Link to={`/poll/${pollId}/results?admin=${adminToken}`}>
                  View Results Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Create Another */}
          <div className="text-center pt-4">
            <Button asChild variant="ghost">
              <Link to="/">Create Another Poll</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePoll;
