import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import PageNavigation from "@/components/PageNavigation";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  admin_token: string;
}

const Index = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolls = async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPolls(data);
      }
      setLoading(false);
    };

    fetchPolls();
  }, []);

  const filteredPolls = polls.filter((poll) =>
    poll.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex gap-6 items-start">
          {/* Navigation buttons */}
          <PageNavigation showBack={false} className="shrink-0" />

          {/* Main content */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold tracking-tight">My Polls</h1>
              <Link to="/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </Link>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search polls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading polls...
              </div>
            ) : filteredPolls.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No polls match your search." : "No polls yet."}
                </p>
                {!searchQuery && (
                  <Link to="/create">
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create your first poll
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPolls.map((poll) => (
                  <Card key={poll.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{poll.title}</h3>
                        {poll.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {poll.description}
                          </p>
                        )}
                      </div>
                      <Link to={`/poll/${poll.id}/results?token=${poll.admin_token}`}>
                        <Button variant="ghost" size="icon" className="ml-4 shrink-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
