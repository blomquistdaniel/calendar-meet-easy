

## Meeting Poll Scheduler - "When2Meet" Style

A simple, modern tool for scheduling meetings by collecting availability from participants.

### Core Flow

**1. Create a Poll**
- Enter a title for your meeting/event (e.g., "Team Standup Planning")
- Optionally add a description with meeting details
- Select multiple potential dates from an interactive calendar
- For each date, optionally add specific time slots (e.g., "10:00 AM", "2:00 PM")
- Click "Create Poll" to generate your unique poll

**2. Share Your Poll**
- Get two links after creation:
  - **Voting link** - share with participants
  - **Admin link** - keep private to view all results
- Copy the voting link and share via email, Slack, etc.

**3. Participants Vote**
- Participants enter their name and email
- View all proposed dates/times in a clean grid
- Vote Yes ✓ / No ✗ / Maybe ~ for each option
- Optionally add comments to explain availability
- Submit vote (no account needed)

**4. View Results (Admin Only)**
- Access with your private admin link
- See all responses in a summary table
- Each participant's votes displayed in rows
- Visual highlighting shows the best options (most "Yes" votes)
- View individual comments from participants
- Easily identify the winning time slot

### Design & Experience

- **Modern, polished look** with smooth interactions
- Clean calendar picker for selecting dates
- Color-coded votes (green for yes, red for no, yellow for maybe)
- Mobile-responsive design so participants can vote on any device
- Clear visual summary showing which time works best

### Technical Approach

- **Backend**: Supabase database to store polls and votes
- **No authentication required** - polls identified by unique IDs
- **Admin access** via a secret admin token in the URL
- **Real-time updates** so you see new votes as they come in

