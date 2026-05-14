<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1E5631" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; media-src 'self' https: data:; upgrade-insecure-requests"
    />
    <meta
      http-equiv="Permissions-Policy"
      content="camera=(), microphone=(), geolocation=(), browsing-topics=()"
    />
    <title>Rankings | Media Voting</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Work+Sans:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./rankings.css" />
  </head>
  <body>
    <main class="rankings-shell">
      <div class="rankings-topbar">
        <a class="back-link" href="./index.html">Back to media voting</a>
        <button id="rankings-theme-toggle" class="secondary-button theme-toggle" type="button" aria-pressed="false">
          Dark mode
        </button>
      </div>

      <header class="rankings-hero">
        <div>
          <p class="eyebrow">Full leaderboard</p>
          <h1>Browse every ranking.</h1>
          <p class="hero-copy">
            A bigger, easier-to-scan rankings page with clear rank order, title details, and paging.
          </p>
        </div>
        <div class="hero-badges">
          <span>Wider layout</span>
          <span>All entries</span>
          <span>Manga, anime, artists, songs, and movies</span>
        </div>
      </header>

      <section class="rankings-panel">
        <div class="rankings-toolbar">
          <div class="rankings-filters" role="tablist" aria-label="Ranking filters">
            <button class="filter-chip active" type="button" data-ranking-filter="all">All</button>
            <button class="filter-chip" type="button" data-ranking-filter="manga">Manga</button>
            <button class="filter-chip" type="button" data-ranking-filter="anime">Anime</button>
            <button class="filter-chip" type="button" data-ranking-filter="artist">Artists</button>
            <button class="filter-chip" type="button" data-ranking-filter="song">Songs</button>
            <button class="filter-chip" type="button" data-ranking-filter="movie">Movies</button>
          </div>

          <label class="search-wrap">
            <span class="sr-only">Search rankings</span>
            <input id="rankings-search" type="search" placeholder="Search ranked titles" />
          </label>
        </div>

        <p id="rankings-status" class="status-row">Loading rankings...</p>

        <div class="rankings-head" aria-hidden="true">
          <span>Rank</span>
          <span>Title</span>
          <span>Votes</span>
        </div>

        <div id="rankings-list" class="rankings-list"></div>

        <div class="pager">
          <button id="pager-prev" class="secondary-button" type="button">Previous</button>
          <p id="pager-status" class="pager-status">Page 1</p>
          <button id="pager-next" class="secondary-button" type="button">Next</button>
        </div>
      </section>
    </main>

    <script src="./config.js"></script>
    <script src="./config-loader.js"></script>
    <script src="./rankings.js"></script>
  </body>
</html>
