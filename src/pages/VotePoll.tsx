import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Check, X, HelpCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type VoteValue = "yes" | "no" | "maybe" | null;

interface PollOption {
  id: string;
  date: string;
  time_slot: string | null;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
}

const VotePoll = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;

      const [pollResult, optionsResult] = await Promise.all([
        supabase.from("polls").select("*").eq("id", pollId).single(),
        supabase.from("poll_options").select("*").eq("poll_id", pollId).order("date").order("time_slot")
      ]);

      if (pollResult.error) {
        console.error("Error fetching poll:", pollResult.error);
        toast({ title: "Poll not found", variant: "destructive" });
        navigate("/");
        return;
      }

      setPoll(pollResult.data);
      setOptions(optionsResult.data || []);
      
      // Initialize votes
      const initialVotes: Record<string, VoteValue> = {};
      (optionsResult.data || []).forEach(opt => {
        initialVotes[opt.id] = null;
      });
      setVotes(initialVotes);
      
      setLoading(false);
    };

    fetchPoll();
  }, [pollId, navigate]);

  const setVote = (optionId: string, value: VoteValue) => {
    setVotes(prev => ({ ...prev, [optionId]: value }));
  };

  const handleSubmit = async () => {
    if (!voterName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    if (!voterEmail.trim() || !voterEmail.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }

    const votesToSubmit = Object.entries(votes).filter(([_, v]) => v !== null);
    if (votesToSubmit.length === 0) {
      toast({ title: "Please vote on at least one option", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const voteRecords = votesToSubmit.map(([optionId, vote]) => ({
        poll_id: pollId!,
        option_id: optionId,
        voter_name: voterName.trim(),
        voter_email: voterEmail.trim().toLowerCase(),
        vote: vote!,
        comment: comments[optionId]?.trim() || null
      }));

      const { error } = await supabase.from("votes").insert(voteRecords);

      if (error) throw error;

      toast({ title: "Vote submitted successfully!" });
      navigate(`/poll/${pollId}/thanks`);
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({ title: "Failed to submit vote", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading poll...</div>
      </div>
    );
  }

  if (!poll) return null;

  // Group options by date
  const groupedOptions = options.reduce((acc, opt) => {
    if (!acc[opt.date]) acc[opt.date] = [];
    acc[opt.date].push(opt);
    return acc;
  }, {} as Record<string, PollOption[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4">
        {/* Poll Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{poll.title}</h1>
          {poll.description && (
            <p className="text-muted-foreground mt-2">{poll.description}</p>
          )}
        </div>

        <div className="space-y-6">
          {/* Voter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Let us know who you are</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={voterEmail}
                  onChange={(e) => setVoterEmail(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Voting Options */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Availability</CardTitle>
              <CardDescription>
                Click to vote: <span className="text-green-600">✓ Yes</span> · <span className="text-red-600">✗ No</span> · <span className="text-yellow-600">~ Maybe</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedOptions).map(([date, dateOptions]) => (
                <div key={date} className="space-y-3">
                  <h4 className="font-medium text-sm border-b pb-2">
                    {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                  </h4>
                  
                  {dateOptions.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <span className="font-medium">
                            {option.time_slot || "All day"}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-10 h-10",
                              votes[option.id] === "yes" && "bg-green-100 border-green-500 text-green-700 hover:bg-green-200"
                            )}
                            onClick={() => setVote(option.id, votes[option.id] === "yes" ? null : "yes")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-10 h-10",
                              votes[option.id] === "no" && "bg-red-100 border-red-500 text-red-700 hover:bg-red-200"
                            )}
                            onClick={() => setVote(option.id, votes[option.id] === "no" ? null : "no")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-10 h-10",
                              votes[option.id] === "maybe" && "bg-yellow-100 border-yellow-500 text-yellow-700 hover:bg-yellow-200"
                            )}
                            onClick={() => setVote(option.id, votes[option.id] === "maybe" ? null : "maybe")}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {votes[option.id] && (
                        <Textarea
                          placeholder="Add a comment (optional)"
                          value={comments[option.id] || ""}
                          onChange={(e) => setComments(prev => ({ ...prev, [option.id]: e.target.value }))}
                          rows={2}
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full gap-2"
            size="lg"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit My Votes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VotePoll;
