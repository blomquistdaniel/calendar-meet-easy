-- Create polls table
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  admin_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create poll_options table (dates/times to vote on)
CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  voter_email TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'maybe')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Polls: anyone can create, anyone can read (public voting links)
CREATE POLICY "Anyone can create polls" ON public.polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view polls" ON public.polls FOR SELECT USING (true);

-- Poll options: anyone can create (when creating poll), anyone can read
CREATE POLICY "Anyone can create poll options" ON public.poll_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view poll options" ON public.poll_options FOR SELECT USING (true);

-- Votes: anyone can create, anyone can read (results shown on admin page)
CREATE POLICY "Anyone can submit votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Create index for faster lookups
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);