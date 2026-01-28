import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Check, X, HelpCircle, Send, Pencil, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import PageNavigation from "@/components/PageNavigation";

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

interface ExistingVote {
  id: string;
  option_id: string;
  vote: "yes" | "no" | "maybe";
  comment: string | null;
}

const VotePoll = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  
  const [existingVotes, setExistingVotes] = useState<ExistingVote[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      if (!code) return;

      // First fetch the poll by short_code to get the ID
      const pollResult = await supabase.from("polls").select("*").eq("short_code", code).maybeSingle();

      if (pollResult.error || !pollResult.data) {
        console.error("Error fetching poll:", pollResult.error);
        toast({ title: "Poll not found", variant: "destructive" });
        navigate("/");
        return;
      }

      const pollData = pollResult.data;
      
      // Now fetch options using the poll ID
      const optionsResult = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", pollData.id)
        .order("date")
        .order("time_slot");

      setPoll(pollData);
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
  }, [code, navigate]);

  const checkExistingVotes = useCallback(async (email: string) => {
    if (!email.includes("@") || !poll) return;
    
    setCheckingEmail(true);
    
    const { data, error } = await supabase
      .from("votes")
      .select("id, option_id, vote, comment, voter_name")
      .eq("poll_id", poll.id)
      .eq("voter_email", email.trim().toLowerCase());
    
    setCheckingEmail(false);
    
    if (error) {
      console.error("Error checking existing votes:", error);
      return;
    }
    
    if (data && data.length > 0) {
      setExistingVotes(data as ExistingVote[]);
      // Pre-fill the name from existing vote
      if (data[0].voter_name) {
        setVoterName(data[0].voter_name);
      }
    } else {
      setExistingVotes([]);
      setIsEditMode(false);
    }
  }, [poll]);

  const handleEmailBlur = () => {
    if (voterEmail.includes("@")) {
      checkExistingVotes(voterEmail);
    }
  };

  const startEditing = () => {
    setIsEditMode(true);
    
    // Pre-fill votes and comments from existing data
    const prefilledVotes: Record<string, VoteValue> = {};
    const prefilledComments: Record<string, string> = {};
    
    options.forEach(opt => {
      prefilledVotes[opt.id] = null;
    });
    
    existingVotes.forEach(ev => {
      prefilledVotes[ev.option_id] = ev.vote;
      if (ev.comment) {
        prefilledComments[ev.option_id] = ev.comment;
      }
    });
    
    setVotes(prefilledVotes);
    setComments(prefilledComments);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your votes? This cannot be undone.")) {
      return;
    }
    
    if (!poll) return;
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("poll_id", poll.id)
        .eq("voter_email", voterEmail.trim().toLowerCase());
      
      if (error) throw error;
      
      toast({ title: "Your votes have been deleted" });
      
      // Reset form
      setExistingVotes([]);
      setIsEditMode(false);
      const initialVotes: Record<string, VoteValue> = {};
      options.forEach(opt => {
        initialVotes[opt.id] = null;
      });
      setVotes(initialVotes);
      setComments({});
    } catch (error) {
      console.error("Error deleting votes:", error);
      toast({ title: "Failed to delete votes", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
      const normalizedEmail = voterEmail.trim().toLowerCase();
      
      // If editing, delete old votes first
      if (isEditMode && existingVotes.length > 0) {
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("poll_id", poll!.id)
          .eq("voter_email", normalizedEmail);
        
        if (deleteError) throw deleteError;
      }
      
      // Insert new votes
      const voteRecords = votesToSubmit.map(([optionId, vote]) => ({
        poll_id: poll!.id,
        option_id: optionId,
        voter_name: voterName.trim(),
        voter_email: normalizedEmail,
        vote: vote!,
        comment: comments[optionId]?.trim() || null
      }));

      const { error } = await supabase.from("votes").insert(voteRecords);

      if (error) throw error;

      toast({ title: isEditMode ? "Votes updated successfully!" : "Vote submitted successfully!" });
      navigate(`/p/${code}/thanks`);
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

  const hasExistingVotes = existingVotes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex gap-6 items-start">
          {/* Navigation buttons */}
          <PageNavigation className="shrink-0" />

          {/* Main content */}
          <div className="flex-1 max-w-3xl">
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
              <CardDescription>
                {hasExistingVotes && !isEditMode 
                  ? "We found your previous response" 
                  : "Let us know who you are"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    disabled={hasExistingVotes && !isEditMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={voterEmail}
                    onChange={(e) => {
                      setVoterEmail(e.target.value);
                      // Reset existing votes when email changes
                      if (existingVotes.length > 0) {
                        setExistingVotes([]);
                        setIsEditMode(false);
                      }
                    }}
                    onBlur={handleEmailBlur}
                    disabled={isEditMode}
                  />
                  {checkingEmail && (
                    <p className="text-xs text-muted-foreground">Checking for existing votes...</p>
                  )}
                </div>
              </div>
              
              {/* Existing votes found alert */}
              {hasExistingVotes && !isEditMode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>You've already voted on this poll. Would you like to edit or delete your response?</span>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={startEditing} className="gap-1">
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDelete} className="gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Voting Options - only show if no existing votes or in edit mode */}
          {(!hasExistingVotes || isEditMode) && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isEditMode ? "Update Your Availability" : "Select Your Availability"}
                  </CardTitle>
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
              <div className="flex gap-3">
                {isEditMode && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditMode(false);
                      // Reset votes
                      const initialVotes: Record<string, VoteValue> = {};
                      options.forEach(opt => {
                        initialVotes[opt.id] = null;
                      });
                      setVotes(initialVotes);
                      setComments({});
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : isEditMode ? "Update My Votes" : "Submit My Votes"}
                </Button>
              </div>
            </>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotePoll;
