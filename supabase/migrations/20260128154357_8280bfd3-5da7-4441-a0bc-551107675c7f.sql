-- Allow users to update their own votes (identified by email)
CREATE POLICY "Anyone can update their own votes" 
ON public.votes 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow users to delete their own votes
CREATE POLICY "Anyone can delete their own votes" 
ON public.votes 
FOR DELETE 
USING (true);