

# Shorter URLs for Meeting Poll Scheduler

## Current State

Your URLs use UUIDs (36 characters each):
- Poll ID: `2c28312d-f484-4170-b012-47721f8cdbe9`
- Admin Token: `fab866ef-6bab-4de1-a328-6fbbdb1d336e`

**Example current URL:**
```
/poll/2c28312d-f484-4170-b012-47721f8cdbe9/vote
```

## Solution: Short Codes

Add `short_code` and `admin_short_code` columns to the `polls` table using alphanumeric strings.

**Example new URL:**
```
/p/Kj7mX9/vote
```

That's a reduction from 60+ characters to just 6-8 characters per code.

---

## Implementation Plan

### 1. Database Changes

Add two new columns to the `polls` table:
- `short_code` - 6-8 character alphanumeric code for public access (voting link)
- `admin_short_code` - 8-10 character alphanumeric code for admin access

Create a database function to generate unique short codes automatically on insert.

### 2. Route Updates

Update all routes in `App.tsx`:

| Current Route | New Route |
|---------------|-----------|
| `/poll/:pollId/vote` | `/p/:code/vote` |
| `/poll/:pollId/results` | `/p/:code/results` |
| `/poll/:pollId/share` | `/p/:code/share` |
| `/poll/:pollId/thanks` | `/p/:code/thanks` |

### 3. Page Updates

Update all pages to:
- Use `code` param instead of `pollId`
- Query database using `short_code` instead of `id`
- Use `admin_short_code` instead of `admin_token` in URLs

**Files to update:**
- `src/App.tsx`
- `src/pages/CreatePoll.tsx`
- `src/pages/SharePoll.tsx`
- `src/pages/VotePoll.tsx`
- `src/pages/PollResults.tsx`
- `src/pages/ThankYou.tsx`
- `src/pages/Index.tsx`

---

## URL Comparison

| Page | Before | After |
|------|--------|-------|
| Voting | `/poll/2c28312d-f484-4170-b012-47721f8cdbe9/vote` | `/p/Kj7mX9/vote` |
| Results | `/poll/.../results?admin=fab866ef-...` | `/p/Kj7mX9/results?admin=Hq9pL3nW` |
| Share | `/poll/.../share?admin=fab866ef-...` | `/p/Kj7mX9/share?admin=Hq9pL3nW` |

---

## Technical Details

### Short Code Generation

A Postgres function will generate codes using:
- Characters: `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789` (excludes confusing characters like 0/O, 1/l/I)
- Length: 6 characters for poll codes, 8 for admin codes
- Unique constraint ensures no duplicates

### Database Migration

```sql
-- Add new columns
ALTER TABLE public.polls 
  ADD COLUMN short_code TEXT UNIQUE,
  ADD COLUMN admin_short_code TEXT UNIQUE;

-- Create function to generate short codes
CREATE OR REPLACE FUNCTION generate_short_code(length INT) ...

-- Set defaults for new rows
ALTER TABLE public.polls 
  ALTER COLUMN short_code SET DEFAULT generate_short_code(6),
  ALTER COLUMN admin_short_code SET DEFAULT generate_short_code(8);

-- Backfill existing polls
UPDATE public.polls SET 
  short_code = generate_short_code(6),
  admin_short_code = generate_short_code(8)
WHERE short_code IS NULL;
```

### Collision Handling

The function will retry with a new code if a duplicate is generated (extremely rare with 6+ characters from 57 character set = billions of combinations).

