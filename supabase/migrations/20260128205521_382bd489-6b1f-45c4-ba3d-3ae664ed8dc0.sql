-- Allow deletion of polls
CREATE POLICY "Anyone can delete polls"
ON public.polls
FOR DELETE
USING (true);

-- Allow deletion of poll options (for cascade)
CREATE POLICY "Anyone can delete poll options"
ON public.poll_options
FOR DELETE
USING (true);