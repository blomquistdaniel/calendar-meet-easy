import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Check, X, HelpCircle, Crown, MessageSquare, Users, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  admin_token: string;
}

interface PollOption {
  id: string;
  date: string;
  time_slot: string | null;
}

interface Vote {
  id: string;
  option_id: string;
  voter_name: string;
  voter_email: string;
  vote: "yes" | "no" | "maybe";
  comment: string | null;
}

const PollResults = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adminToken = searchParams.get("admin");

  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const fetchData = async () => {
    if (!pollId) return;

    const [pollResult, optionsResult, votesResult] = await Promise.all([
      supabase.from("polls").select("*").eq("id", pollId).single(),
      supabase.from("poll_options").select("*").eq("poll_id", pollId).order("date").order("time_slot"),
      supabase.from("votes").select("*").eq("poll_id", pollId)
    ]);

    if (pollResult.error) {
      toast({ title: "Poll not found", variant: "destructive" });
      navigate("/");
      return;
    }

    // Verify admin token
    if (pollResult.data.admin_token !== adminToken) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    setIsAuthorized(true);
    setPoll(pollResult.data);
    setOptions(optionsResult.data || []);
    setVotes((votesResult.data || []) as Vote[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`votes-${pollId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `poll_id=eq.${pollId}` },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, adminToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need the admin link to view poll results. Only the poll creator has access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/">Create Your Own Poll</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) return null;

  // Get unique voters
  const voterMap = new Map<string, { name: string; email: string }>();
  votes.forEach(v => {
    voterMap.set(v.voter_email, { name: v.voter_name, email: v.voter_email });
  });
  const voters = Array.from(voterMap.values());

  // Calculate vote counts per option
  const voteCounts = options.map(opt => {
    const optVotes = votes.filter(v => v.option_id === opt.id);
    return {
      option: opt,
      yes: optVotes.filter(v => v.vote === "yes").length,
      no: optVotes.filter(v => v.vote === "no").length,
      maybe: optVotes.filter(v => v.vote === "maybe").length,
      total: optVotes.length,
      score: optVotes.filter(v => v.vote === "yes").length + optVotes.filter(v => v.vote === "maybe").length * 0.5
    };
  });

  // Find best option (highest yes count)
  const bestOption = voteCounts.reduce((best, curr) => 
    curr.score > best.score ? curr : best
  , voteCounts[0]);

  const getVoteForCell = (optionId: string, email: string) => {
    return votes.find(v => v.option_id === optionId && v.voter_email === email);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{poll.title}</h1>
            {poll.description && (
              <p className="text-muted-foreground mt-2">{poll.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{voters.length}</p>
                  <p className="text-sm text-muted-foreground">Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{votes.filter(v => v.vote === "yes").length}</p>
                  <p className="text-sm text-muted-foreground">Yes Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {bestOption && voters.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Best Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(bestOption.option.date), "MMM d")}
                      {bestOption.option.time_slot && ` at ${bestOption.option.time_slot}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Responses</CardTitle>
            <CardDescription>
              See how each participant voted for each time slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {voters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No responses yet. Share the voting link to collect responses!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10">Participant</TableHead>
                      {options.map(opt => (
                        <TableHead key={opt.id} className="text-center min-w-[100px]">
                          <div className={cn(
                            "space-y-1",
                            bestOption?.option.id === opt.id && "text-primary font-semibold"
                          )}>
                            <div>{format(parseISO(opt.date), "MMM d")}</div>
                            <div className="text-xs font-normal text-muted-foreground">
                              {opt.time_slot || "All day"}
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voters.map(voter => (
                      <TableRow key={voter.email}>
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div>
                            <div className="font-medium">{voter.name}</div>
                            <div className="text-xs text-muted-foreground">{voter.email}</div>
                          </div>
                        </TableCell>
                        {options.map(opt => {
                          const vote = getVoteForCell(opt.id, voter.email);
                          return (
                            <TableCell key={opt.id} className="text-center">
                              {vote ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center justify-center">
                                      {vote.vote === "yes" && (
                                        <Badge variant="outline" className="bg-green-100 border-green-300 text-green-700">
                                          <Check className="h-3 w-3" />
                                        </Badge>
                                      )}
                                      {vote.vote === "no" && (
                                        <Badge variant="outline" className="bg-red-100 border-red-300 text-red-700">
                                          <X className="h-3 w-3" />
                                        </Badge>
                                      )}
                                      {vote.vote === "maybe" && (
                                        <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-yellow-700">
                                          <HelpCircle className="h-3 w-3" />
                                        </Badge>
                                      )}
                                      {vote.comment && (
                                        <MessageSquare className="h-3 w-3 ml-1 text-muted-foreground" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {vote.comment && (
                                    <TooltipContent>
                                      <p className="max-w-xs">{vote.comment}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {/* Summary Row */}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell className="sticky left-0 bg-muted/50 z-10">Summary</TableCell>
                      {voteCounts.map(vc => (
                        <TableCell key={vc.option.id} className="text-center">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="text-green-600">{vc.yes}✓</span>
                            <span className="text-red-600">{vc.no}✗</span>
                            <span className="text-yellow-600">{vc.maybe}~</span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Button asChild variant="outline">
            <Link to={`/poll/${pollId}/vote`}>View Voting Page</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Create New Poll</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PollResults;
