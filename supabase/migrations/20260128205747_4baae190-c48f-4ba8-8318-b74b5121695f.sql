-- Allow updating polls
CREATE POLICY "Anyone can update polls"
ON public.polls
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow updating poll options
CREATE POLICY "Anyone can update poll options"
ON public.poll_options
FOR UPDATE
USING (true)
WITH CHECK (true);