# Media Voting Platform

A free-only static browser app for searching manga, anime, artists, songs, and movies, saving favorites, commenting, and browsing a lightweight personalized experience.

## Phase 4 upgrades

This package includes the Phase 4 personalization pass on top of the earlier social and discovery work:

- secure account creation with Supabase Auth
- email + username + password flow
- password reset by email
- personalized ranking mode
- recommendation chips
- taste profile summary
- because-you-liked reasoning
- profile name and bio
- local activity feed
- comments in the details modal
- local-first social features
- optional shared comments with free Supabase
- search suggestions
- recent searches
- favorites
- discovery filters
- leaderboard modes
- richer cards and modal stats
- shareable links
- toast feedback
- dark mode
- installable PWA shell

## Files

- `index.html`
- `rankings.html`
- `account.html`
- `styles.css`
- `rankings.css`
- `account.css`
- `script.js`
- `rankings.js`
- `auth.js`
- `account.js`
- `config.js`
- `config.local.example.js`
- `manifest.json`
- `service-worker.js`
- `supabase-setup.sql`
- `supabase-phase3.sql`
- `supabase-auth-setup.sql`
- `.gitignore`

## Free stack only

- Jikan for manga search
- TMDb free API token for anime and movie search
- Genius free client access token for artist and song search
- Supabase free tier for optional shared votes and shared comments
- Supabase free Auth for secure email/password accounts
- GitHub Pages for free hosting

## What works right away

- Manga search
- Anime search
- Artist search with Genius
- Song search with Genius
- Local voting
- Favorites
- Profile editing
- Local activity feed
- Local comments
- Discovery filters
- Personalized ranking
- Recommendations
- Details modal
- Theme toggle
- Account auth with email reset flow
- Full rankings page with paging and search

## What needs free credentials

### Artists and songs

Add a free Genius client access token in:

- `config.js` for public publishing
- `config.local.js` for local/private testing

Genius says commercial API use requires a separate license, so this setup is best for personal, school, or portfolio use.

### Movies

Add a free TMDb read token in:

- `config.js` for public publishing
- `config.local.js` for local/private testing

### Shared votes and comments

Add your free Supabase URL and anon key in:

- `config.js`
- `config.local.js`

Then run:

1. `supabase-setup.sql`
2. `supabase-phase3.sql`

### Auth setup

For secure email/password accounts with reset emails:

1. Use the same free Supabase project in `config.js` or `config.local.js`
2. In Supabase Auth, keep email confirmations enabled
3. Add your local and production URLs to the allowed redirect URLs
4. Run `supabase-auth-setup.sql`
5. Use the reset-password and signup email flows from Supabase Auth

The account system uses Supabase Auth instead of storing passwords in this frontend.

## Safe GitHub workflow

1. Keep `config.js` blank in the public repo if you do not want to expose your own values.
2. Copy `config.local.example.js` to `config.local.js` for local testing.
3. Do not commit `config.local.js`.

## GitHub Pages

1. Create a new GitHub repo
2. Upload everything in this folder
3. Push to `main`
4. In GitHub open `Settings > Pages`
5. Set source to `Deploy from a branch`
6. Choose `main` and `/ (root)`

## Local testing

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Important note

- TMDb tokens in a static frontend are visible to users
- Supabase anon keys are intended for frontend use
- Passwords are handled by Supabase Auth, not stored in this frontend code
- Never commit any service-role or private secret key
