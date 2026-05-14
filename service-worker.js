const JIKAN_URL = "https://api.jikan.moe/v4/manga";
const TMDB_TV_SEARCH_URL = "https://api.themoviedb.org/3/search/tv";
const GENIUS_SEARCH_URL = "https://api.genius.com/search";
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const GUEST_AUTHOR = "Guest User";

const STORAGE_KEYS = {
  localVotes: "mediaVotesLocal",
  localVoted: "mediaVotedLocal",
  localCache: "mediaCacheLocal",
  theme: "mediaTheme",
  clientId: "mediaClientId",
  favorites: "mediaFavorites",
  recentSearches: "mediaRecentSearches",
  comments: "mediaComments",
  reportedComments: "mediaReportedComments",
};

const COMMENT_RULES = [
  { pattern: /\b(?:idiot|stupid|dumbass|moron)\b/i, message: "Please rewrite that comment without insults." },
  { pattern: /\b(?:kill yourself|kys|die)\b/i, message: "Please remove harmful language before posting." },
  { pattern: /(https?:\/\/[^\s]+.*){2,}/i, message: "Please avoid spammy link-heavy comments." },
];

const DEMO_SUGGESTIONS = {
  manga: ["One Piece", "Berserk", "Naruto", "Monster", "Vagabond", "Vinland Saga"],
  anime: ["Fullmetal Alchemist", "Steins;Gate", "Cowboy Bebop", "Frieren", "Attack on Titan", "Haikyuu"],
  artist: ["Kendrick Lamar", "Paramore", "Radiohead", "Beyonce", "Tyler, The Creator", "Arctic Monkeys"],
  song: ["Alright", "Bohemian Rhapsody", "Mr. Brightside", "N95", "Super Shy", "Bad Romance"],
  movie: ["Dune", "Spider-Man", "Interstellar", "Alien", "Arrival", "Inception"],
};

const MOVIE_GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const state = {
  activeTab: "manga",
  leaderboardFilter: "all",
  mangaResults: [],
  animeResults: [],
  artistResults: [],
  songResults: [],
  movieResults: [],
  localVotes: loadJson(STORAGE_KEYS.localVotes, {}),
  voted: loadJson(STORAGE_KEYS.localVoted, {}),
  cache: loadJson(STORAGE_KEYS.localCache, {}),
  favorites: loadJson(STORAGE_KEYS.favorites, {}),
  recentSearches: loadJson(STORAGE_KEYS.recentSearches, {
    manga: [],
    anime: [],
    artist: [],
    song: [],
    movie: [],
  }),
  comments: loadJson(STORAGE_KEYS.comments, {}),
  reportedComments: loadJson(STORAGE_KEYS.reportedComments, {}),
  remoteVoteCounts: {},
  remoteLeaderboard: [],
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  clientId: getOrCreateClientId(),
  modalItem: null,
  lastVotedVoteId: "",
};

const dom = {
  tabButtons: document.querySelectorAll(".tab-button"),
  tabViews: document.querySelectorAll(".tab-view"),
  filterButtons: document.querySelectorAll(".filter-chip"),
  themeToggle: document.querySelector("#theme-toggle"),
  backendPill: document.querySelector("#backend-pill"),
  socialPill: document.querySelector("#social-pill"),
  leaderboard: document.querySelector("#leaderboard"),
  template: document.querySelector("#result-card-template"),
  toastRegion: document.querySelector("#toast-region"),
  detailsModal: document.querySelector("#details-modal"),
  modalClose: document.querySelector("#modal-close"),
  modalImage: document.querySelector("#modal-image"),
  modalType: document.querySelector("#modal-type"),
  modalTitle: document.querySelector("#modal-title"),
  modalMeta: document.querySelector("#modal-meta"),
  modalTags: document.querySelector("#modal-tags"),
  modalStats: document.querySelector("#modal-stats"),
  modalReasons: document.querySelector("#modal-reasons"),
  modalSummary: document.querySelector("#modal-summary"),
  modalFavorite: document.querySelector("#modal-favorite"),
  modalShare: document.querySelector("#modal-share"),
  commentsList: document.querySelector("#comments-list"),
  commentInput: document.querySelector("#comment-input"),
  commentStatus: document.querySelector("#comment-status"),
  submitCommentButton: document.querySelector("#submit-comment-button"),
  movieSetupCard: document.querySelector("#movie-setup-card"),
  artistSetupCard: document.querySelector("#artist-setup-card"),
  songSetupCard: document.querySelector("#song-setup-card"),
  search: {
    manga: {
      input: document.querySelector("#manga-search-input"),
      button: document.querySelector("#manga-search-button"),
      status: document.querySelector("#manga-search-status"),
      results: document.querySelector("#manga-results"),
      suggestions: document.querySelector("#manga-suggestions"),
    },
    anime: {
      input: document.querySelector("#anime-search-input"),
      button: document.querySelector("#anime-search-button"),
      status: document.querySelector("#anime-search-status"),
      results: document.querySelector("#anime-results"),
      suggestions: document.querySelector("#anime-suggestions"),
    },
    artist: {
      input: document.querySelector("#artist-search-input"),
      button: document.querySelector("#artist-search-button"),
      status: document.querySelector("#artist-search-status"),
      results: document.querySelector("#artist-results"),
      suggestions: document.querySelector("#artist-suggestions"),
    },
    song: {
      input: document.querySelector("#song-search-input"),
      button: document.querySelector("#song-search-button"),
      status: document.querySelector("#song-search-status"),
      results: document.querySelector("#song-results"),
      suggestions: document.querySelector("#song-suggestions"),
    },
    movie: {
      input: document.querySelector("#movie-search-input"),
      button: document.querySelector("#movie-search-button"),
      status: document.querySelector("#movie-search-status"),
      results: document.querySelector("#movie-results"),
      suggestions: document.querySelector("#movie-suggestions"),
    },
  },
};

const searchTimers = { manga: null, anime: null, artist: null, song: null, movie: null };
const latestSearchToken = { manga: 0, anime: 0, artist: 0, song: 0, movie: 0 };

let config = null;
let backend = null;
let appStarted = false;

window.addEventListener("media-config-ready", startApp, { once: true });

function startApp() {
  if (appStarted) {
    return;
  }

  appStarted = true;
  const appConfig = window.APP_CONFIG || {};
  config = {
    geniusToken: appConfig.genius?.accessToken?.trim() || "",
    tmdbToken: appConfig.tmdb?.readAccessToken?.trim() || "",
    supabaseUrl: trimTrailingSlash(appConfig.supabase?.url || ""),
    supabaseAnonKey: appConfig.supabase?.anonKey?.trim() || "",
  };

  backend = {
    musicEnabled: Boolean(config.geniusToken),
    moviesEnabled: Boolean(config.tmdbToken),
    sharedVotesEnabled: Boolean(config.supabaseUrl && config.supabaseAnonKey),
    sharedCommentsEnabled: Boolean(config.supabaseUrl && config.supabaseAnonKey),
  };

  initializeApp().catch((error) => {
    console.error(error);
    showToast("The app failed to start cleanly.", true);
  });
}

async function initializeApp() {
  applyTheme(state.theme);
  bindTabs();
  bindFilters();
  bindThemeToggle();
  bindSearch();
  bindModal();
  hydrateSetupPanel();
  renderEmptyStates();
  hydrateFromUrl();
  registerServiceWorker();

  if (backend.sharedVotesEnabled) {
    try {
      await refreshRemoteLeaderboard();
    } catch (error) {
      console.error(error);
      backend.sharedVotesEnabled = false;
      backend.sharedCommentsEnabled = false;
      hydrateSetupPanel();
    }
  }

  renderLeaderboard();
}

function bindTabs() {
  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(mapTabNameToMediaType(button.dataset.tab));
    });
  });
}

function bindFilters() {
  dom.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.leaderboardFilter = button.dataset.leaderboardFilter;
      dom.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderLeaderboard();
    });
  });
}

function bindThemeToggle() {
  dom.themeToggle?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });
}

function bindSearch() {
  Object.entries(dom.search).forEach(([mediaType, group]) => {
    group.input?.addEventListener("input", () => {
      queueSearch(mediaType);
      renderSuggestions(mediaType);
    });

    group.input?.addEventListener("focus", () => {
      renderSuggestions(mediaType);
    });

    group.input?.addEventListener("blur", () => {
      window.setTimeout(() => group.suggestions?.classList.add("hidden"), 120);
    });

    group.input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        triggerSearch(mediaType);
      }
    });

    group.button?.addEventListener("click", () => {
      triggerSearch(mediaType);
    });
  });
}

function bindModal() {
  dom.modalClose?.addEventListener("click", () => dom.detailsModal.close());

  dom.detailsModal?.addEventListener("click", (event) => {
    const rect = dom.detailsModal.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (outside) {
      dom.detailsModal.close();
    }
  });

  dom.modalFavorite?.addEventListener("click", () => {
    if (!state.modalItem) {
      return;
    }
    toggleFavorite(state.modalItem);
    openDetailsModal(state.modalItem);
  });

  dom.modalShare?.addEventListener("click", () => {
    if (state.modalItem) {
      shareItem(state.modalItem);
    }
  });

  dom.submitCommentButton?.addEventListener("click", () => {
    submitComment();
  });
}

function activateTab(mediaType) {
  state.activeTab = mediaType;
  const tabName = mapMediaTypeToTabName(mediaType);

  dom.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  dom.tabViews.forEach((view) => {
    view.classList.toggle("active", view.id === `${tabName}-tab`);
  });

  updateUrlState();
}

function hydrateSetupPanel() {
  if (dom.backendPill) {
    dom.backendPill.textContent = backend.sharedVotesEnabled ? "Shared votes" : "Local votes";
  }

  if (dom.socialPill) {
    dom.socialPill.textContent = backend.sharedCommentsEnabled ? "Shared comments" : "Local comments";
  }

  if (backend.moviesEnabled) {
    setStatus(dom.search.anime.status, "Start typing to search anime.", false);
  } else {
    setStatus(dom.search.anime.status, "Add a free TMDb token in config.js to enable anime search.", true);
  }

  if (backend.musicEnabled) {
    setStatus(dom.search.artist.status, "Start typing to search artists.", false);
    setStatus(dom.search.song.status, "Start typing to search songs.", false);
    dom.artistSetupCard?.classList.add("hidden");
    dom.songSetupCard?.classList.add("hidden");
  } else {
    setStatus(dom.search.artist.status, "Add a free Genius token in config.js to enable artist search.", true);
    setStatus(dom.search.song.status, "Add a free Genius token in config.js to enable song search.", true);
    dom.artistSetupCard?.classList.remove("hidden");
    dom.songSetupCard?.classList.remove("hidden");
  }

  if (backend.moviesEnabled) {
    setStatus(dom.search.movie.status, "Start typing to search movies.", false);
    dom.movieSetupCard?.classList.add("hidden");
  } else {
    setStatus(dom.search.movie.status, "Add a free TMDb token in config.js to enable movie search.", true);
    dom.movieSetupCard?.classList.remove("hidden");
  }
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const query = params.get("q");

  if (["movie", "manga", "anime", "artist", "song"].includes(tab)) {
    activateTab(tab);
  }

  if (query) {
    const mediaType = ["movie", "manga", "anime", "artist", "song"].includes(tab) ? tab : state.activeTab;
    dom.search[mediaType].input.value = query;
    triggerSearch(mediaType);
  }
}

function queueSearch(mediaType) {
  const query = dom.search[mediaType].input.value.trim();
  window.clearTimeout(searchTimers[mediaType]);

  if (query.length < 2) {
    updateResults(mediaType, []);
    setStatus(
      dom.search[mediaType].status,
      mediaType === "movie" && !backend.moviesEnabled
        ? "Add a free TMDb token in config.js to enable movie search."
        : mediaType === "anime" && !backend.moviesEnabled
          ? "Add a free TMDb token in config.js to enable anime search."
        : isMusicType(mediaType) && !backend.musicEnabled
          ? `Add a free Genius token in config.js to enable ${getMediaPluralLabel(mediaType).toLowerCase()} search.`
        : `Start typing to search ${getMediaPluralLabel(mediaType).toLowerCase()}.`,
      ((mediaType === "movie" || mediaType === "anime") && !backend.moviesEnabled) ||
        (isMusicType(mediaType) && !backend.musicEnabled)
    );
    return;
  }

  setStatus(dom.search[mediaType].status, "Waiting for you to pause typing...", false);
  searchTimers[mediaType] = window.setTimeout(() => triggerSearch(mediaType), 350);
}

async function triggerSearch(mediaType) {
  activateTab(mediaType);
  const query = dom.search[mediaType].input.value.trim();

  if (query.length < 2) {
    setStatus(
      dom.search[mediaType].status,
      `Enter at least 2 characters to search ${getMediaPluralLabel(mediaType).toLowerCase()}.`,
      true
    );
    return;
  }

  if (mediaType === "movie" && !backend.moviesEnabled) {
    setStatus(dom.search.movie.status, "Movie search needs a free TMDb token in config.js.", true);
    renderResults("movie", [], "Movie search is disabled until you add a TMDb token.");
    return;
  }

  if (mediaType === "anime" && !backend.moviesEnabled) {
    setStatus(dom.search.anime.status, "Anime search needs a free TMDb token in config.js.", true);
    renderResults("anime", [], "Anime search is disabled until you add a TMDb token.");
    return;
  }

  if (isMusicType(mediaType) && !backend.musicEnabled) {
    setStatus(
      dom.search[mediaType].status,
      `${getMediaSingularLabel(mediaType)} search needs a free Genius token in config.js.`,
      true
    );
    renderResults(
      mediaType,
      [],
      `${getMediaSingularLabel(mediaType)} search is disabled until you add a Genius token.`
    );
    return;
  }

  addRecentSearch(mediaType, query);
  updateUrlState(mediaType, query);
  const token = ++latestSearchToken[mediaType];
  setStatus(
    dom.search[mediaType].status,
    `Searching ${getSearchSourceLabel(mediaType)} for "${query}"...`,
    false
  );
  renderSkeletons(mediaType);

  try {
    const results =
      mediaType === "manga"
        ? await fetchMangaSeries(query, token)
        : mediaType === "anime"
          ? await fetchAnimeSeries(query, token)
          : mediaType === "artist"
            ? await fetchGeniusArtists(query, token)
            : mediaType === "song"
              ? await fetchGeniusSongs(query, token)
          : await fetchMovies(query, token);

    if (results === null) {
      return;
    }

    cacheResults(results);
    await syncVisibleVoteCounts(mediaType, results);
    updateResults(mediaType, results);

    setStatus(
      dom.search[mediaType].status,
      results.length === 0
        ? `No ${getMediaResultLabel(mediaType).toLowerCase()} matched that search.`
        : `Showing ${results.length} ${getMediaPluralLabel(mediaType).toLowerCase()} result(s).`,
      false
    );
  } catch (error) {
    console.error(error);
    updateResults(mediaType, []);
    setStatus(
      dom.search[mediaType].status,
      `${getMediaSingularLabel(mediaType)} search failed. Check your network or API setup.`,
      true
    );
    renderResults(mediaType, [], "Something went wrong while fetching results.");
  }
}

async function fetchMangaSeries(query, token) {
  const url = new URL(JIKAN_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("sfw", "true");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jikan request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return token === latestSearchToken.manga ? cleanMangaResults(payload.data || []) : null;
}

async function fetchAnimeSeries(query, token) {
  const url = new URL(TMDB_TV_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${config.tmdbToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`TMDb TV request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return token === latestSearchToken.anime ? cleanAnimeResults(payload.results || []) : null;
}

async function fetchMovies(query, token) {
  const url = new URL(TMDB_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${config.tmdbToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`TMDb request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return token === latestSearchToken.movie ? cleanMovieResults(payload.results || []) : null;
}

async function fetchGeniusArtists(query, token) {
  const payload = await fetchGeniusSearch(query);
  return token === latestSearchToken.artist ? cleanArtistResults(payload.response?.hits || []) : null;
}

async function fetchGeniusSongs(query, token) {
  const payload = await fetchGeniusSearch(query);
  return token === latestSearchToken.song ? cleanSongResults(payload.response?.hits || []) : null;
}

async function fetchGeniusSearch(query) {
  const url = new URL(GENIUS_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", config.geniusToken);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Genius request failed with status ${response.status}`);
  }

  return response.json();
}

function cleanMangaResults(items) {
  const grouped = new Map();
  const candidates = items.filter((item) => item && item.title && ["Manga", "One-shot"].includes(item.type));
  const source = candidates.length > 0 ? candidates : items.filter((item) => item && item.title);

  source.forEach((item) => {
    const title = formatSeriesTitle(item.title_english || item.title || "Untitled");
    const seriesKey = slugify(title);

    if (!seriesKey) {
      return;
    }

    const candidate = {
      mediaType: "manga",
      seriesKey,
      title,
      image:
        item.images?.jpg?.large_image_url ||
        item.images?.jpg?.image_url ||
        "https://placehold.co/600x800/e4ecd9/27492d?text=Manga",
      meta: buildMangaMeta(item),
      genres: (item.genres || []).map((genre) => genre.name),
      summary: trimSummary(item.synopsis || "No synopsis available yet."),
      scoreLabel: item.score ? `Score ${item.score}` : "Manga",
      scoreValue: Number(item.score || 0),
      yearValue: Number(item.published?.prop?.from?.year || 0),
      rankingScore: Number(item.score || 0) * 100000 + Number(item.members || 0),
    };

    const existing = grouped.get(seriesKey);
    if (!existing || candidate.rankingScore > existing.rankingScore) {
      grouped.set(seriesKey, candidate);
    }
  });

  return [...grouped.values()].slice(0, 10);
}

function cleanAnimeResults(items) {
  const grouped = new Map();
  const source = items.filter((item) => item && item.name && isLikelyAnimeTvResult(item));

  source.forEach((item) => {
    const title = formatSeriesTitle(item.name || item.original_name || "Untitled");
    const year = item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : 0;
    const seriesKey = slugify(`${title}-${year || item.id}`);

    if (!seriesKey) {
      return;
    }

    const candidate = {
      mediaType: "anime",
      seriesKey,
      title,
      image:
        (item.poster_path
          ? `${TMDB_IMAGE_URL}${item.poster_path}`
          : item.backdrop_path
            ? `${TMDB_IMAGE_URL}${item.backdrop_path}`
            : "") ||
        "https://placehold.co/600x800/dcf3df/1e5631?text=Anime",
      meta: buildAnimeMeta(item),
      genres: [],
      summary: trimSummary(item.overview || "No synopsis available yet."),
      scoreLabel: item.vote_average ? `TMDb ${item.vote_average.toFixed(1)}` : "Anime",
      scoreValue: Number(item.vote_average || 0),
      yearValue: year,
      rankingScore: Number(item.popularity || 0),
    };

    const existing = grouped.get(seriesKey);
    if (!existing || candidate.rankingScore > existing.rankingScore) {
      grouped.set(seriesKey, candidate);
    }
  });

  return [...grouped.values()].slice(0, 10);
}

function isLikelyAnimeTvResult(item) {
  const genreIds = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  const isAnimation = genreIds.includes(16);
  const isJapanese =
    item.original_language === "ja" ||
    (Array.isArray(item.origin_country) && item.origin_country.includes("JP"));

  return isAnimation && isJapanese;
}

function cleanMovieResults(items) {
  const grouped = new Map();

  items
    .filter((item) => item && item.title)
    .forEach((item) => {
      const year = item.release_date ? Number(item.release_date.slice(0, 4)) : 0;
      const title = item.title.trim();
      const seriesKey = slugify(`${title}-${year || item.id}`);
      const candidate = {
        mediaType: "movie",
        seriesKey,
        title,
        image: item.poster_path
          ? `${TMDB_IMAGE_URL}${item.poster_path}`
          : "https://placehold.co/600x800/d9e2ec/203344?text=Movie",
        meta: buildMovieMeta(item),
        genres: (item.genre_ids || []).map((id) => MOVIE_GENRE_MAP[id]).filter(Boolean),
        summary: trimSummary(item.overview || "No overview available yet."),
        scoreLabel: item.vote_average ? `TMDb ${item.vote_average.toFixed(1)}` : "Movie",
        scoreValue: Number(item.vote_average || 0),
        yearValue: year,
        rankingScore: Number(item.popularity || 0),
      };

      const existing = grouped.get(seriesKey);
      if (!existing || candidate.rankingScore > existing.rankingScore) {
        grouped.set(seriesKey, candidate);
      }
    });

  return [...grouped.values()].slice(0, 10);
}

function cleanArtistResults(hits) {
  const grouped = new Map();

  hits.forEach((hit) => {
    const artist = hit?.result?.primary_artist;
    if (!artist?.id || !artist.name) {
      return;
    }

    const image = artist.image_url || artist.header_image_url || hit.result.song_art_image_thumbnail_url || "";
    const seriesKey = slugify(`${artist.name}-${artist.id}`);
    const matchingSongs = grouped.get(seriesKey)?.matchingSongs || [];
    const nextMatchingSongs = [...new Set([...matchingSongs, hit.result.title].filter(Boolean))].slice(0, 3);
    const candidate = {
      mediaType: "artist",
      seriesKey,
      title: artist.name.trim(),
      image: image || "https://placehold.co/600x800/e7f6ea/1e5631?text=Artist",
      meta: buildArtistMeta(artist, nextMatchingSongs.length),
      genres: [],
      summary: nextMatchingSongs.length
        ? `Matching songs: ${nextMatchingSongs.join(", ")}.`
        : "Artist result from Genius.",
      scoreLabel: "Artist",
      scoreValue: nextMatchingSongs.length,
      yearValue: 0,
      rankingScore: nextMatchingSongs.length,
      matchingSongs: nextMatchingSongs,
    };

    const existing = grouped.get(seriesKey);
    if (!existing || candidate.rankingScore >= existing.rankingScore) {
      grouped.set(seriesKey, candidate);
    }
  });

  return [...grouped.values()].slice(0, 10);
}

function cleanSongResults(hits) {
  const grouped = new Map();

  hits.forEach((hit) => {
    const song = hit?.result;
    if (!song?.id || !song.title) {
      return;
    }

    const primaryArtist = song.primary_artist?.name || "Unknown artist";
    const title = song.full_title || `${song.title} - ${primaryArtist}`;
    const seriesKey = slugify(`${song.id}-${song.title}`);
    const candidate = {
      mediaType: "song",
      seriesKey,
      title,
      image:
        song.song_art_image_url ||
        song.song_art_image_thumbnail_url ||
        song.primary_artist?.image_url ||
        "https://placehold.co/600x800/e7f6ea/1e5631?text=Song",
      meta: buildSongMeta(song),
      genres: [],
      summary: trimSummary(`Artist: ${primaryArtist}. ${song.url ? "Open the Genius page for full lyrics and annotations." : ""}`),
      scoreLabel: "Song",
      scoreValue: Number(song.stats?.pageviews || 0),
      yearValue: 0,
      rankingScore: Number(song.stats?.pageviews || 0),
    };

    grouped.set(seriesKey, candidate);
  });

  return [...grouped.values()].slice(0, 10);
}

function updateResults(mediaType, results) {
  if (mediaType === "manga") {
    state.mangaResults = results;
  } else if (mediaType === "anime") {
    state.animeResults = results;
  } else if (mediaType === "artist") {
    state.artistResults = results;
  } else if (mediaType === "song") {
    state.songResults = results;
  } else {
    state.movieResults = results;
  }
  renderResults(mediaType, results);
}

function renderResults(mediaType, results, message = "") {
  const container = dom.search[mediaType].results;
  container.innerHTML = "";

  if (message) {
    container.append(createEmptyState(message));
    return;
  }

  if (results.length === 0) {
    const emptyMessage =
      mediaType === "movie" && !backend.moviesEnabled
        ? "Movie search is waiting for a free TMDb token in config.js."
        : mediaType === "anime" && !backend.moviesEnabled
          ? "Anime search is waiting for a free TMDb token in config.js."
        : isMusicType(mediaType) && !backend.musicEnabled
          ? `${getMediaSingularLabel(mediaType)} search is waiting for a free Genius token in config.js.`
        : `Search for ${getSearchPromptLabel(mediaType)} to see results here.`;
    container.append(createEmptyState(emptyMessage));
    return;
  }

  results.forEach((item) => {
    const fragment = dom.template.content.cloneNode(true);
    const image = fragment.querySelector(".media-image");
    const type = fragment.querySelector(".media-type");
    const score = fragment.querySelector(".media-score");
    const title = fragment.querySelector(".media-title");
    const meta = fragment.querySelector(".media-meta");
    const tags = fragment.querySelector(".media-tags");
    const summary = fragment.querySelector(".media-summary");
    const voteCount = fragment.querySelector(".vote-count");
    const voteButton = fragment.querySelector(".vote-button");
    const favoriteButton = fragment.querySelector(".favorite-button");
    const detailsButton = fragment.querySelector(".details-button");
    const shareButton = fragment.querySelector(".share-button");

    const voteId = buildVoteId(item.mediaType, item.seriesKey);
    const isFavorite = Boolean(state.favorites[voteId]);
    const hasVoted = Boolean(state.voted[voteId]);

    image.src = item.image;
    image.alt = `${item.title} artwork`;
    type.textContent = getMediaResultLabel(item.mediaType);
    score.textContent = item.scoreLabel;
    title.textContent = item.title;
    meta.textContent = item.meta;
    summary.textContent = item.summary;
    voteCount.textContent = formatVoteCount(getVoteCount(item));
    renderTagList(tags, item.genres || []);

    favoriteButton.textContent = isFavorite ? "Saved" : "Save";
    favoriteButton.classList.toggle("is-active", isFavorite);
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.addEventListener("click", () => toggleFavorite(item));

    voteButton.textContent = hasVoted ? "Voted" : "Vote";
    voteButton.disabled = hasVoted;
    voteButton.addEventListener("click", () => handleVote(item));

    detailsButton.addEventListener("click", () => {
      openDetailsModal(item);
    });

    shareButton.addEventListener("click", () => {
      shareItem(item);
    });

    container.append(fragment);
  });
}

async function handleVote(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  if (state.voted[voteId]) {
    return;
  }

  try {
    if (backend.sharedVotesEnabled) {
      const result = await castRemoteVote(item);
      if (!result.success) {
        setVoteStatus(item.mediaType, result.message, true);
        showToast(result.message, true);
        return;
      }
    } else {
      state.localVotes[voteId] = (state.localVotes[voteId] || 0) + 1;
    }

    state.voted[voteId] = true;
    state.lastVotedVoteId = voteId;
    state.cache[voteId] = buildCacheRecord(item);
    persistVotes();
    await syncVisibleVoteCounts(item.mediaType, getResultsForType(item.mediaType));

    if (backend.sharedVotesEnabled) {
      await refreshRemoteLeaderboard();
    }

    renderResults(item.mediaType, getResultsForType(item.mediaType));
    renderLeaderboard();
    setVoteStatus(item.mediaType, `Vote saved for ${item.title}.`, false);
    showToast(`Vote saved for ${item.title}.`);
  } catch (error) {
    console.error(error);
    setVoteStatus(item.mediaType, "Vote failed. Check your backend configuration.", true);
    showToast("Vote failed. Check your backend configuration.", true);
  }
}

async function castRemoteVote(item) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/cast_vote`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({
      p_client_id: state.clientId,
      p_media_type: item.mediaType,
      p_series_key: item.seriesKey,
      p_title: item.title,
      p_image_url: item.image,
      p_meta: item.meta,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, message: `Shared vote request failed${text ? `: ${text}` : "."}` };
  }

  const payload = await response.json();
  const wasInserted = Array.isArray(payload) ? payload[0]?.was_inserted : payload?.was_inserted;
  return wasInserted === false
    ? { success: false, message: "This browser already voted for that item." }
    : { success: true };
}

async function refreshRemoteLeaderboard() {
  const url = new URL(`${config.supabaseUrl}/rest/v1/media_votes`);
  url.searchParams.set("select", "media_type,series_key,title,image_url,meta,votes");
  url.searchParams.set("order", "votes.desc");
  url.searchParams.set("limit", "15");

  const response = await fetch(url, { headers: supabaseHeaders() });
  if (!response.ok) {
    throw new Error(`Supabase leaderboard failed with status ${response.status}`);
  }

  const payload = await response.json();
  state.remoteLeaderboard = payload.map((item) => ({
    mediaType: item.media_type,
    seriesKey: item.series_key,
    title: item.title,
    meta: item.meta,
    image: item.image_url || "",
    votes: item.votes,
  }));

  payload.forEach((item) => {
    const voteId = buildVoteId(item.media_type, item.series_key);
    state.remoteVoteCounts[voteId] = item.votes;
    state.cache[voteId] = {
      ...(state.cache[voteId] || {}),
      mediaType: item.media_type,
      title: item.title,
      image: item.image_url || state.cache[voteId]?.image,
      meta: item.meta,
    };
  });

  persistCache();
}

async function syncVisibleVoteCounts(mediaType, items) {
  if (!items.length) {
    return;
  }

  if (!backend.sharedVotesEnabled) {
    items.forEach((item) => {
      state.cache[buildVoteId(mediaType, item.seriesKey)] = buildCacheRecord(item);
    });
    persistCache();
    return;
  }

  const keys = items.map((item) => item.seriesKey).filter(Boolean);
  const url = new URL(`${config.supabaseUrl}/rest/v1/media_votes`);
  url.searchParams.set("select", "media_type,series_key,votes,title,image_url,meta");
  url.searchParams.set("media_type", `eq.${mediaType}`);
  url.searchParams.set("series_key", `in.(${keys.join(",")})`);

  const response = await fetch(url, { headers: supabaseHeaders() });
  if (!response.ok) {
    throw new Error(`Supabase vote sync failed with status ${response.status}`);
  }

  const payload = await response.json();
  payload.forEach((item) => {
    const voteId = buildVoteId(item.media_type, item.series_key);
    state.remoteVoteCounts[voteId] = item.votes;
    state.cache[voteId] = {
      ...(state.cache[voteId] || {}),
      mediaType: item.media_type,
      title: item.title,
      image: item.image_url || state.cache[voteId]?.image,
      meta: item.meta,
    };
  });

  items.forEach((item) => {
    const voteId = buildVoteId(item.mediaType, item.seriesKey);
    state.cache[voteId] = state.cache[voteId] || buildCacheRecord(item);
  });

  persistCache();
}

function renderLeaderboard() {
  dom.leaderboard.innerHTML = "";
  const entries = getLeaderboardEntries()
    .filter((entry) => state.leaderboardFilter === "all" || entry.mediaType === state.leaderboardFilter)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10);

  if (!entries.length) {
    dom.leaderboard.append(
      createEmptyState(
        backend.sharedVotesEnabled
          ? "Shared leaderboard is empty. Search and cast the first vote."
          : "No votes yet. Search manga, anime, artists, songs, or movies and cast the first vote."
      )
    );
    return;
  }

  entries.forEach((entry, index) => {
    const card = document.createElement("article");
    const voteId = buildVoteId(entry.mediaType, entry.seriesKey);
    card.className = "leaderboard-entry";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${entry.title}`);

    if (voteId === state.lastVotedVoteId) {
      card.classList.add("is-highlighted");
    }

    card.innerHTML = `
      <span class="leaderboard-rank">${index + 1}</span>
      <div class="leaderboard-meta">
        <p class="leaderboard-title">${escapeHtml(entry.title)}</p>
        <span class="leaderboard-tag">${escapeHtml(getMediaSingularLabel(entry.mediaType))}</span>
        <span class="media-meta">${escapeHtml(entry.meta || "")}</span>
      </div>
      <span class="leaderboard-votes">${entry.votes} vote${entry.votes === 1 ? "" : "s"}</span>
    `;

    card.addEventListener("click", () => {
      const cached = state.cache[voteId];
      if (!cached) {
        return;
      }
      openDetailsModal({
        ...cached,
        mediaType: entry.mediaType,
        seriesKey: entry.seriesKey,
      });
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });

    dom.leaderboard.append(card);
  });
}

function getLeaderboardEntries() {
  if (backend.sharedVotesEnabled && state.remoteLeaderboard.length) {
    return state.remoteLeaderboard.map((entry) => ({
      ...entry,
      votes: state.remoteVoteCounts[buildVoteId(entry.mediaType, entry.seriesKey)] || entry.votes || 0,
    }));
  }

  return Object.entries(state.localVotes).map(([voteId, votes]) => {
    const [mediaType, seriesKey] = voteId.split(":");
    const cached = state.cache[voteId] || {};
    return {
      mediaType,
      seriesKey,
      title: cached.title || `${mediaType} ${seriesKey}`,
      meta: cached.meta || "",
      image: cached.image || "",
      votes,
    };
  });
}

async function openDetailsModal(item) {
  state.modalItem = item;
  dom.modalImage.src = item.image;
  dom.modalImage.alt = `${item.title} artwork`;
  dom.modalType.textContent = getMediaResultLabel(item.mediaType);
  dom.modalTitle.textContent = item.title;
  dom.modalMeta.textContent = item.meta;
  dom.modalSummary.textContent = item.summary || "No summary available.";
  dom.modalFavorite.textContent = state.favorites[buildVoteId(item.mediaType, item.seriesKey)] ? "Saved" : "Save";
  dom.modalFavorite.classList.toggle(
    "active",
    Boolean(state.favorites[buildVoteId(item.mediaType, item.seriesKey)])
  );

  renderTagList(dom.modalTags, item.genres || []);
  renderModalStats(item);
  renderModalReason(item);
  dom.commentInput.value = "";
  setCommentStatus("Share your take.", false);
  await renderComments(item);

  if (typeof dom.detailsModal.showModal === "function" && !dom.detailsModal.open) {
    dom.detailsModal.showModal();
  }
}

function renderModalStats(item) {
  dom.modalStats.innerHTML = "";
  const stats = [
    item.scoreValue ? `Score ${item.scoreValue.toFixed(1)}` : "",
    item.yearValue ? `Year ${item.yearValue}` : "",
    `Votes ${getVoteCount(item)}`,
    `Comments ${getCommentsForItem(item).length}`,
  ].filter(Boolean);

  stats.forEach((value) => {
    const stat = document.createElement("span");
    stat.className = "modal-stat";
    stat.textContent = value;
    dom.modalStats.append(stat);
  });
}

function renderModalReason(item) {
  const reason = item.genres?.[0] ? `Genres: ${item.genres.slice(0, 2).join(", ")}` : "";
  renderChipList(
    dom.modalReasons,
    reason ? [{ label: reason, meta: "Details", action: () => {} }] : [],
    "Search and explore to learn more about each title."
  );
}

async function renderComments(item) {
  dom.commentsList.innerHTML = "";
  const comments = getCommentsForItem(item);

  if (!comments.length) {
    dom.commentsList.append(createEmptyState("No comments yet. Start the discussion."));
    return;
  }

  comments.forEach((comment) => {
    const reportKey = buildCommentReportKey(item, comment);
    const reports = state.reportedComments[reportKey] || 0;
    const card = document.createElement("article");
    card.className = "comment-card";
    card.innerHTML = `
      <div class="comment-header">
        <div>
          <strong>${escapeHtml(comment.author)}</strong>
          <span class="comment-meta">${escapeHtml(comment.time)}</span>
        </div>
        <button class="report-button" type="button">${reports > 0 ? `Reported (${reports})` : "Report"}</button>
      </div>
      <p class="comment-body">${escapeHtml(comment.text)}</p>
    `;

    card.querySelector(".report-button")?.addEventListener("click", () => {
      reportComment(item, comment);
    });

    dom.commentsList.append(card);
  });
}

async function submitComment() {
  if (!state.modalItem) {
    return;
  }

  const text = dom.commentInput.value.trim();
  if (!text) {
    setCommentStatus("Write a comment before posting.", true);
    return;
  }

  const moderationMessage = validateCommentText(text);
  if (moderationMessage) {
    setCommentStatus(moderationMessage, true);
    return;
  }

  const comment = {
    author: getCurrentAuthorName(),
    text,
    time: new Date().toLocaleString(),
  };

  const voteId = buildVoteId(state.modalItem.mediaType, state.modalItem.seriesKey);
  state.comments[voteId] = [comment, ...(state.comments[voteId] || [])].slice(0, 50);
  persistComments();

  if (backend.sharedCommentsEnabled) {
    try {
      await postRemoteComment(state.modalItem, comment);
      setCommentStatus("Comment posted.", false);
    } catch (error) {
      console.error(error);
      setCommentStatus("Saved locally. Shared comments need Phase 3 SQL in Supabase.", true);
    }
  } else {
    setCommentStatus("Comment posted locally.", false);
  }

  dom.commentInput.value = "";
  await renderComments(state.modalItem);
  renderModalStats(state.modalItem);
  showToast(`Comment saved for ${state.modalItem.title}.`);
}

function reportComment(item, comment) {
  const key = buildCommentReportKey(item, comment);
  state.reportedComments[key] = (state.reportedComments[key] || 0) + 1;
  persistReportedComments();
  renderComments(item);
  showToast("Comment reported locally.");
}

async function postRemoteComment(item, comment) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/media_comments`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      media_type: item.mediaType,
      series_key: item.seriesKey,
      author_name: comment.author,
      body: comment.text,
      client_id: state.clientId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Comment sync failed with status ${response.status}`);
  }
}

async function shareItem(item) {
  const url = buildShareUrl(item.mediaType, item.title);

  try {
    if (navigator.share) {
      await navigator.share({
        title: item.title,
        text: `Check out ${item.title} on Media Voting Platform`,
        url,
      });
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      throw new Error("Clipboard unavailable");
    }

    showToast(`Share link ready for ${item.title}.`);
  } catch (error) {
    console.error(error);
    showToast("Sharing is not available in this browser.", true);
  }
}

function renderSuggestions(mediaType) {
  const container = dom.search[mediaType].suggestions;
  const query = dom.search[mediaType].input.value.trim().toLowerCase();
  const suggestions = getSuggestions(mediaType, query);
  container.innerHTML = "";

  if (!suggestions.length) {
    container.classList.add("hidden");
    return;
  }

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.innerHTML = `
      <span>${escapeHtml(suggestion.label)}</span>
      <span class="suggestion-meta">${escapeHtml(suggestion.meta)}</span>
    `;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applySuggestion(mediaType, suggestion.label);
    });
    container.append(button);
  });

  container.classList.remove("hidden");
}

function getSuggestions(mediaType, query) {
  const suggestions = [];
  const seen = new Set();
  const recentItems = Array.isArray(state.recentSearches[mediaType]) ? state.recentSearches[mediaType] : [];

  const addSuggestion = (label, meta) => {
    const normalized = label.toLowerCase();
    if (!label || seen.has(normalized)) {
      return;
    }
    if (query && !normalized.includes(query)) {
      return;
    }
    seen.add(normalized);
    suggestions.push({ label, meta });
  };

  recentItems.forEach((item) => addSuggestion(item.query, "Recent"));
  Object.values(state.favorites)
    .filter((item) => item.mediaType === mediaType)
    .forEach((item) => addSuggestion(item.title, "Saved"));
  Object.values(state.cache)
    .filter((item) => item.mediaType === mediaType)
    .forEach((item) => addSuggestion(item.title, "Seen"));
  DEMO_SUGGESTIONS[mediaType].forEach((label) => addSuggestion(label, "Idea"));

  return suggestions.slice(0, 6);
}

function applySuggestion(mediaType, query) {
  dom.search[mediaType].input.value = query;
  dom.search[mediaType].suggestions.classList.add("hidden");
  triggerSearch(mediaType);
}

function renderSkeletons(mediaType) {
  const container = dom.search[mediaType].results;
  container.innerHTML = "";

  for (let index = 0; index < 6; index += 1) {
    const skeleton = document.createElement("article");
    skeleton.className = "media-card skeleton-card";
    skeleton.innerHTML = `
      <div class="skeleton-block"></div>
      <div class="skeleton-content">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-pill"></div>
      </div>
    `;
    container.append(skeleton);
  }
}

function renderEmptyStates() {
  renderResults("manga", state.mangaResults);
  renderResults("anime", state.animeResults);
  renderResults("artist", state.artistResults);
  renderResults("song", state.songResults);
  renderResults("movie", state.movieResults);
}

function toggleFavorite(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);

  if (state.favorites[voteId]) {
    delete state.favorites[voteId];
    persistFavorites();
    renderResults(item.mediaType, getResultsForType(item.mediaType));
    showToast(`Removed ${item.title} from saved.`);
    return;
  }

  state.favorites[voteId] = buildCacheRecord(item);
  persistFavorites();
  renderResults(item.mediaType, getResultsForType(item.mediaType));
  showToast(`Saved ${item.title}.`);
}

function addRecentSearch(mediaType, query) {
  const cleaned = query.trim();
  if (!cleaned) {
    return;
  }

  const currentItems = Array.isArray(state.recentSearches[mediaType]) ? state.recentSearches[mediaType] : [];
  const list = currentItems.filter(
    (item) => item.query.toLowerCase() !== cleaned.toLowerCase()
  );
  list.unshift({ query: cleaned });
  state.recentSearches[mediaType] = list.slice(0, 6);
  localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(state.recentSearches));
}

function getResultsForType(mediaType) {
  return mediaType === "manga"
    ? state.mangaResults
    : mediaType === "anime"
      ? state.animeResults
      : mediaType === "artist"
        ? state.artistResults
        : mediaType === "song"
          ? state.songResults
      : state.movieResults;
}

function getVoteCount(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  return backend.sharedVotesEnabled ? state.remoteVoteCounts[voteId] || 0 : state.localVotes[voteId] || 0;
}

function getCommentsForItem(item) {
  return state.comments[buildVoteId(item.mediaType, item.seriesKey)] || [];
}

function getCurrentAuthorName() {
  return window.MEDIA_AUTH_STATE?.username || GUEST_AUTHOR;
}

function validateCommentText(text) {
  const brokenRule = COMMENT_RULES.find((rule) => rule.pattern.test(text));
  return brokenRule ? brokenRule.message : "";
}

function formatSeriesTitle(title) {
  return title
    .replace(/\[[^\]]*]/g, "")
    .replace(/\([^)]*(edition|omnibus|deluxe|complete|special)[^)]*\)/gi, "")
    .replace(/\b(vol(?:ume)?\.?\s*\d+.*)$/i, "")
    .replace(/\b(part\s*\d+.*)$/i, "")
    .replace(/\b(chapter\s*\d+.*)$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildMangaMeta(item) {
  const bits = [];
  if (item.published?.prop?.from?.year) bits.push(String(item.published.prop.from.year));
  if (item.volumes) bits.push(`${item.volumes} vols`);
  if (item.chapters) bits.push(`${item.chapters} chapters`);
  bits.push(item.type || "Manga");
  return bits.join(" | ");
}

function buildAnimeMeta(item) {
  const bits = [];
  if (item.first_air_date) bits.push(item.first_air_date.slice(0, 4));
  if (item.original_language) bits.push(item.original_language.toUpperCase());
  if (item.vote_count) bits.push(`${item.vote_count} ratings`);
  return bits.join(" | ") || "Anime";
}

function buildMovieMeta(item) {
  const bits = [];
  if (item.release_date) bits.push(item.release_date.slice(0, 4));
  if (item.original_language) bits.push(item.original_language.toUpperCase());
  if (item.vote_count) bits.push(`${item.vote_count} ratings`);
  return bits.join(" | ") || "Movie";
}

function buildArtistMeta(artist, matches) {
  const bits = [];
  if (artist.iq) bits.push(`IQ ${artist.iq}`);
  if (matches) bits.push(`${matches} matching song${matches === 1 ? "" : "s"}`);
  bits.push("Artist");
  return bits.join(" | ");
}

function buildSongMeta(song) {
  const bits = [];
  if (song.primary_artist?.name) bits.push(song.primary_artist.name);
  if (song.stats?.pageviews) bits.push(`${formatCompactNumber(song.stats.pageviews)} views`);
  bits.push("Song");
  return bits.join(" | ");
}

function renderTagList(container, tags) {
  container.innerHTML = "";
  tags.slice(0, 3).forEach((tag) => {
    const node = document.createElement("span");
    node.className = "tag";
    node.textContent = tag;
    container.append(node);
  });
}

function renderChipList(container, entries, emptyLabel) {
  container.innerHTML = "";

  if (!entries.length) {
    const chip = document.createElement("span");
    chip.className = "chip is-empty";
    chip.textContent = emptyLabel;
    container.append(chip);
    return;
  }

  entries.forEach((entry) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.textContent = entry.label;
    chip.title = entry.meta;
    chip.addEventListener("click", entry.action);
    container.append(chip);
  });
}

function buildCacheRecord(item) {
  return {
    mediaType: item.mediaType,
    seriesKey: item.seriesKey,
    title: item.title,
    image: item.image,
    meta: item.meta,
    summary: item.summary,
    genres: item.genres,
    scoreValue: item.scoreValue || 0,
    yearValue: item.yearValue || 0,
  };
}

function cacheResults(results) {
  results.forEach((item) => {
    state.cache[buildVoteId(item.mediaType, item.seriesKey)] = buildCacheRecord(item);
  });
  persistCache();
}

function buildVoteId(mediaType, seriesKey) {
  return `${mediaType}:${seriesKey}`;
}

function buildCommentReportKey(item, comment) {
  return `${buildVoteId(item.mediaType, item.seriesKey)}:${comment.author}:${comment.time}`;
}

function formatVoteCount(votes) {
  return `${votes} vote${votes === 1 ? "" : "s"}`;
}

function setVoteStatus(mediaType, message, isError) {
  setStatus(dom.search[mediaType].status, message, isError);
}

function setCommentStatus(message, isError) {
  dom.commentStatus.textContent = message;
  dom.commentStatus.classList.toggle("is-error", Boolean(isError));
}

function setStatus(element, message, isError) {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.toggle("is-error", Boolean(isError));
}

function createEmptyState(message) {
  const box = document.createElement("div");
  box.className = "empty-state";
  box.textContent = message;
  return box;
}

function getMediaSingularLabel(mediaType) {
  if (mediaType === "artist") return "Artist";
  if (mediaType === "song") return "Song";
  if (mediaType === "anime") return "Anime";
  if (mediaType === "movie") return "Movie";
  return "Manga";
}

function getMediaPluralLabel(mediaType) {
  if (mediaType === "artist") return "Artists";
  if (mediaType === "song") return "Songs";
  if (mediaType === "anime") return "Anime";
  if (mediaType === "movie") return "Movies";
  return "Manga";
}

function getMediaResultLabel(mediaType) {
  if (mediaType === "artist") return "Artist";
  if (mediaType === "song") return "Song";
  if (mediaType === "anime") return "Anime series";
  if (mediaType === "movie") return "Movie";
  return "Manga series";
}

function getSearchPromptLabel(mediaType) {
  if (mediaType === "artist") return "an artist or band";
  if (mediaType === "song") return "an individual song";
  if (mediaType === "anime") return "an anime series";
  if (mediaType === "movie") return "a movie";
  return "a manga series";
}

function getSearchSourceLabel(mediaType) {
  if (mediaType === "movie" || mediaType === "anime") {
    return "TMDb";
  }
  if (isMusicType(mediaType)) {
    return "Genius";
  }
  return "Jikan";
}

function isMusicType(mediaType) {
  return mediaType === "artist" || mediaType === "song";
}

function mapMediaTypeToTabName(mediaType) {
  if (mediaType === "movie") return "movies";
  if (mediaType === "artist") return "artists";
  if (mediaType === "song") return "songs";
  return mediaType;
}

function mapTabNameToMediaType(tabName) {
  if (tabName === "movies") return "movie";
  if (tabName === "artists") return "artist";
  if (tabName === "songs") return "song";
  return tabName;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function updateUrlState(mediaType = state.activeTab, query = dom.search[mediaType]?.input.value.trim() || "") {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", mediaType);
  if (query) {
    url.searchParams.set("q", query);
  } else {
    url.searchParams.delete("q");
  }
  window.history.replaceState({}, "", url);
}

function buildShareUrl(mediaType, query) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", mediaType);
  url.searchParams.set("q", query);
  return url.toString();
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark", theme === "dark");
  if (dom.themeToggle) {
    dom.themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    dom.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  }
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function persistVotes() {
  localStorage.setItem(STORAGE_KEYS.localVotes, JSON.stringify(state.localVotes));
  localStorage.setItem(STORAGE_KEYS.localVoted, JSON.stringify(state.voted));
  persistCache();
}

function persistCache() {
  localStorage.setItem(STORAGE_KEYS.localCache, JSON.stringify(state.cache));
}

function persistFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
}

function persistComments() {
  localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(state.comments));
}

function persistReportedComments() {
  localStorage.setItem(STORAGE_KEYS.reportedComments, JSON.stringify(state.reportedComments));
}

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Failed to parse storage key ${key}`, error);
    return fallback;
  }
}

function getOrCreateClientId() {
  const existing = localStorage.getItem(STORAGE_KEYS.clientId);
  if (existing) {
    return existing;
  }
  const clientId = `client-${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem(STORAGE_KEYS.clientId, clientId);
  return clientId;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function trimSummary(value) {
  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized.length > 170 ? `${normalized.slice(0, 170)}...` : normalized;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function supabaseHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character];
  });
}

function showToast(message, isError = false) {
  if (!dom.toastRegion) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast${isError ? " is-error" : ""}`;
  toast.textContent = message;
  dom.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      console.error(error);
    }
  });
}
