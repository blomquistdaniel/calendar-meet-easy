import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreatePoll from "./pages/CreatePoll";
import EditPoll from "./pages/EditPoll";
import SharePoll from "./pages/SharePoll";
import VotePoll from "./pages/VotePoll";
import PollResults from "./pages/PollResults";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/p/:code/edit" element={<EditPoll />} />
          <Route path="/p/:code/share" element={<SharePoll />} />
          <Route path="/p/:code/vote" element={<VotePoll />} />
          <Route path="/p/:code/results" element={<PollResults />} />
          <Route path="/p/:code/thanks" element={<ThankYou />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
