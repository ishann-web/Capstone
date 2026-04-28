const JIKAN_URL = "https://api.jikan.moe/v4/manga";
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const STORAGE_KEYS = {
  localVotes: "mediaVotesLocal",
  localVoted: "mediaVotedLocal",
  localCache: "mediaCacheLocal",
  theme: "mediaTheme",
  reduceMotion: "mediaReduceMotion",
  highContrast: "mediaHighContrast",
  clientId: "mediaClientId",
  favorites: "mediaFavorites",
  recentSearches: "mediaRecentSearches",
  profile: "mediaProfile",
  activity: "mediaActivity",
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

const defaultProfile = {
  name: "Guest User",
  bio: "Set a name and short vibe for your profile.",
};

const state = {
  activeTab: "manga",
  leaderboardFilter: "all",
  leaderboardMode: "votes",
  mangaResults: [],
  movieResults: [],
  localVotes: loadJson(STORAGE_KEYS.localVotes, {}),
  voted: loadJson(STORAGE_KEYS.localVoted, {}),
  cache: loadJson(STORAGE_KEYS.localCache, {}),
  remoteVoteCounts: {},
  remoteLeaderboard: [],
  favorites: loadJson(STORAGE_KEYS.favorites, {}),
  recentSearches: loadJson(STORAGE_KEYS.recentSearches, { manga: [], movie: [] }),
  profile: { ...defaultProfile, ...loadJson(STORAGE_KEYS.profile, {}) },
  activity: loadJson(STORAGE_KEYS.activity, []),
  comments: loadJson(STORAGE_KEYS.comments, {}),
  reportedComments: loadJson(STORAGE_KEYS.reportedComments, {}),
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  reduceMotion: localStorage.getItem(STORAGE_KEYS.reduceMotion) === "true",
  highContrast: localStorage.getItem(STORAGE_KEYS.highContrast) === "true",
  clientId: getOrCreateClientId(),
  filters: {
    manga: { sort: "relevance", favoritesOnly: false, minScore: 0, era: "all", genre: "" },
    movie: { sort: "relevance", favoritesOnly: false, minScore: 0, era: "all", genre: "" },
  },
  modalItem: null,
};

const mangaSearchInput = document.querySelector("#manga-search-input");
const movieSearchInput = document.querySelector("#movie-search-input");
const mangaSearchButton = document.querySelector("#manga-search-button");
const movieSearchButton = document.querySelector("#movie-search-button");
const mangaSearchStatus = document.querySelector("#manga-search-status");
const movieSearchStatus = document.querySelector("#movie-search-status");
const mangaResultsContainer = document.querySelector("#manga-results");
const movieResultsContainer = document.querySelector("#movie-results");
const leaderboardContainer = document.querySelector("#leaderboard");
const cardTemplate = document.querySelector("#result-card-template");
const tabButtons = document.querySelectorAll(".tab-button");
const tabViews = document.querySelectorAll(".tab-view");
const filterButtons = document.querySelectorAll(".filter-chip");
const modeButtons = document.querySelectorAll("[data-leaderboard-mode]");
const backendPill = document.querySelector("#backend-pill");
const socialPill = document.querySelector("#social-pill");
const setupStatus = document.querySelector("#setup-status");
const themeToggle = document.querySelector("#theme-toggle");
const motionToggle = document.querySelector("#motion-toggle");
const contrastToggle = document.querySelector("#contrast-toggle");
const favoritesCount = document.querySelector("#favorites-count");
const recentCount = document.querySelector("#recent-count");
const commentsCount = document.querySelector("#comments-count");
const discoveryHighlights = document.querySelector("#discovery-highlights");
const favoritesPreview = document.querySelector("#favorites-preview");
const recentSearchesGlobal = document.querySelector("#recent-searches-global");
const activityFeed = document.querySelector("#activity-feed");
const profileAvatar = document.querySelector("#profile-avatar");
const profileNameDisplay = document.querySelector("#profile-name-display");
const profileBioDisplay = document.querySelector("#profile-bio-display");
const profileNameInput = document.querySelector("#profile-name-input");
const profileBioInput = document.querySelector("#profile-bio-input");
const saveProfileButton = document.querySelector("#save-profile-button");
const socialStatus = document.querySelector("#social-status");
const tasteSummary = document.querySelector("#taste-summary");
const recommendationChips = document.querySelector("#recommendation-chips");
const comfortStatus = document.querySelector("#comfort-status");
const qualitySummary = document.querySelector("#quality-summary");
const healthChecks = document.querySelector("#health-checks");
const focusSearchButton = document.querySelector("#focus-search-button");
const runSelfCheckButton = document.querySelector("#run-self-check-button");
const exportDataButton = document.querySelector("#export-data-button");
const resetLocalButton = document.querySelector("#reset-local-button");
const recentSearchesByType = {
  manga: document.querySelector("#manga-recent-searches"),
  movie: document.querySelector("#movie-recent-searches"),
};
const clearRecentSearchesButton = document.querySelector("#clear-recent-searches");
const viewFavoritesButton = document.querySelector("#view-favorites-button");
const sortSelects = {
  manga: document.querySelector("#manga-sort-select"),
  movie: document.querySelector("#movie-sort-select"),
};
const scoreSelects = {
  manga: document.querySelector("#manga-score-select"),
  movie: document.querySelector("#movie-score-select"),
};
const eraSelects = {
  manga: document.querySelector("#manga-era-select"),
  movie: document.querySelector("#movie-era-select"),
};
const favoritesToggles = {
  manga: document.querySelector("#manga-favorites-toggle"),
  movie: document.querySelector("#movie-favorites-toggle"),
};
const genreContainers = {
  manga: document.querySelector("#manga-genre-chips"),
  movie: document.querySelector("#movie-genre-chips"),
};
const clearGenreButtons = {
  manga: document.querySelector("#clear-manga-genre"),
  movie: document.querySelector("#clear-movie-genre"),
};
const suggestionsContainers = {
  manga: document.querySelector("#manga-suggestions"),
  movie: document.querySelector("#movie-suggestions"),
};
const inputs = {
  manga: mangaSearchInput,
  movie: movieSearchInput,
};
const statuses = {
  manga: mangaSearchStatus,
  movie: movieSearchStatus,
};
const resultsContainers = {
  manga: mangaResultsContainer,
  movie: movieResultsContainer,
};
const detailsModal = document.querySelector("#details-modal");
const modalClose = document.querySelector("#modal-close");
const modalImage = document.querySelector("#modal-image");
const modalType = document.querySelector("#modal-type");
const modalTitle = document.querySelector("#modal-title");
const modalMeta = document.querySelector("#modal-meta");
const modalTags = document.querySelector("#modal-tags");
const modalStats = document.querySelector("#modal-stats");
const modalReasons = document.querySelector("#modal-reasons");
const modalSummary = document.querySelector("#modal-summary");
const modalFavorite = document.querySelector("#modal-favorite");
const modalShare = document.querySelector("#modal-share");
const commentsList = document.querySelector("#comments-list");
const commentInput = document.querySelector("#comment-input");
const commentStatus = document.querySelector("#comment-status");
const submitCommentButton = document.querySelector("#submit-comment-button");
const toastRegion = document.querySelector("#toast-region");
const appAnnouncer = document.querySelector("#app-announcer");

const searchTimers = { manga: null, movie: null };
const latestSearchToken = { manga: 0, movie: 0 };

let config = null;
let backend = null;
let appStarted = false;

window.addEventListener("media-config-ready", startApp, { once: true });
startApp();

function startApp() {
  if (appStarted) {
    return;
  }

  appStarted = true;
  const appConfig = window.APP_CONFIG || {};
  config = {
    tmdbToken: appConfig.tmdb?.readAccessToken?.trim() || "",
    supabaseUrl: trimTrailingSlash(appConfig.supabase?.url || ""),
    supabaseAnonKey: appConfig.supabase?.anonKey?.trim() || "",
  };

  backend = {
    sharedVotesEnabled: Boolean(config.supabaseUrl && config.supabaseAnonKey),
    moviesEnabled: Boolean(config.tmdbToken),
    sharedCommentsEnabled: Boolean(config.supabaseUrl && config.supabaseAnonKey),
  };

  initializeApp();
}

async function initializeApp() {
  applyTheme(state.theme);
  bindTabs();
  bindSearch();
  bindLeaderboardFilters();
  bindLeaderboardModes();
  bindThemeToggle();
  bindModal();
  hydrateSetupPanel();
  renderLeaderboard();
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
      backendPill.textContent = "Local votes";
      socialPill.textContent = "Local social";
    }
  }

  renderLeaderboard();
}

function bindTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab === "movies" ? "movie" : "manga");
    });
  });
}

function activateTab(mediaType) {
  state.activeTab = mediaType;
  const tabName = mediaType === "movie" ? "movies" : "manga";
  tabButtons.forEach((item) => item.classList.toggle("active", item.dataset.tab === tabName));
  tabViews.forEach((view) => view.classList.toggle("active", view.id === `${tabName}-tab`));
  updateUrlState();
}

function bindSearch() {
  Object.entries(inputs).forEach(([mediaType, input]) => {
    input.addEventListener("input", () => {
      queueSearch(mediaType);
      renderSuggestions(mediaType);
    });
    input.addEventListener("focus", () => renderSuggestions(mediaType));
    input.addEventListener("blur", () => {
      window.setTimeout(() => suggestionsContainers[mediaType].classList.add("hidden"), 120);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        triggerSearch(mediaType);
      }
    });
  });

  mangaSearchButton?.addEventListener("click", () => triggerSearch("manga"));
  movieSearchButton?.addEventListener("click", () => triggerSearch("movie"));

  Object.entries(sortSelects).forEach(([mediaType, select]) => {
    if (!select) {
      return;
    }
    select.addEventListener("change", () => {
      state.filters[mediaType].sort = select.value;
      renderMediaResults(mediaType);
    });
  });

  Object.entries(scoreSelects).forEach(([mediaType, select]) => {
    if (!select) {
      return;
    }
    select.addEventListener("change", () => {
      state.filters[mediaType].minScore = Number(select.value);
      renderMediaResults(mediaType);
    });
  });

  Object.entries(eraSelects).forEach(([mediaType, select]) => {
    if (!select) {
      return;
    }
    select.addEventListener("change", () => {
      state.filters[mediaType].era = select.value;
      renderMediaResults(mediaType);
    });
  });

  Object.entries(favoritesToggles).forEach(([mediaType, button]) => {
    if (!button) {
      return;
    }
    button.addEventListener("click", () => {
      state.filters[mediaType].favoritesOnly = !state.filters[mediaType].favoritesOnly;
      syncFilterControls();
      renderMediaResults(mediaType);
    });
  });

  Object.entries(clearGenreButtons).forEach(([mediaType, button]) => {
    if (!button) {
      return;
    }
    button.addEventListener("click", () => {
      state.filters[mediaType].genre = "";
      renderGenreFilters(mediaType);
      renderMediaResults(mediaType);
    });
  });
}

function bindLeaderboardFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.leaderboardFilter = button.dataset.leaderboardFilter;
      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderLeaderboard();
    });
  });
}

function bindLeaderboardModes() {
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.leaderboardMode = button.dataset.leaderboardMode;
      modeButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderLeaderboard();
    });
  });
}

function bindThemeToggle() {
  themeToggle.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });
}

function bindAccessibilityControls() {
  motionToggle.addEventListener("click", () => {
    applyMotionPreference(!state.reduceMotion);
    renderUtilityPanels();
    showToast(state.reduceMotion ? "Reduced motion enabled." : "Reduced motion disabled.");
  });

  contrastToggle.addEventListener("click", () => {
    applyContrastPreference(!state.highContrast);
    renderUtilityPanels();
    showToast(state.highContrast ? "High contrast enabled." : "High contrast disabled.");
  });

  focusSearchButton.addEventListener("click", () => {
    focusActiveSearch();
  });
}

function bindQualityControls() {
  runSelfCheckButton.addEventListener("click", () => {
    renderHealthChecks(true);
    showToast("Self-check completed.");
  });

  exportDataButton.addEventListener("click", () => {
    exportUserData();
  });

  resetLocalButton.addEventListener("click", () => {
    resetLocalData();
  });
}

function bindNetworkState() {
  window.addEventListener("online", () => {
    renderHealthChecks();
    showToast("You are back online.");
  });

  window.addEventListener("offline", () => {
    renderHealthChecks();
    showToast("You are offline. Cached app features still work.", true);
  });
}

function bindGlobalKeyboard() {
  window.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !isTypingTarget(event.target)
    ) {
      event.preventDefault();
      focusActiveSearch();
    }
  });
}

function bindUtilityControls() {
  clearRecentSearchesButton.addEventListener("click", () => {
    state.recentSearches = { manga: [], movie: [] };
    persistRecentSearches();
    renderUtilityPanels();
    addActivity("Cleared recent searches.");
    showToast("Recent searches cleared.");
  });

  viewFavoritesButton.addEventListener("click", () => {
    const hasMovieFavorites = Object.values(state.favorites).some((item) => item.mediaType === "movie");
    const targetType = hasMovieFavorites ? "movie" : "manga";
    activateTab(targetType);
    state.filters[targetType].favoritesOnly = true;
    syncFilterControls();
    renderMediaResults(targetType);
    showToast("Showing favorites first.");
  });
}

function bindProfileControls() {
  saveProfileButton.addEventListener("click", () => {
    state.profile.name = sanitizeProfileValue(profileNameInput.value, defaultProfile.name);
    state.profile.bio = sanitizeProfileValue(profileBioInput.value, defaultProfile.bio);
    persistProfile();
    hydrateProfile();
    addActivity(`Updated profile as ${state.profile.name}.`);
    renderUtilityPanels();
    showToast("Profile saved.");
  });
}

function bindModal() {
  modalClose.addEventListener("click", () => detailsModal.close());
  detailsModal.addEventListener("click", (event) => {
    const rect = detailsModal.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (outside) {
      detailsModal.close();
    }
  });

  modalFavorite.addEventListener("click", () => {
    if (state.modalItem) {
      toggleFavorite(state.modalItem);
      openDetailsModal(state.modalItem);
    }
  });

  modalShare.addEventListener("click", () => {
    if (state.modalItem) {
      shareItem(state.modalItem);
    }
  });

  submitCommentButton.addEventListener("click", () => {
    submitComment();
  });
}

function hydrateProfile() {
  if (!profileNameInput || !profileBioInput || !profileNameDisplay || !profileBioDisplay || !profileAvatar) {
    return;
  }
  profileNameInput.value = state.profile.name;
  profileBioInput.value = state.profile.bio;
  profileNameDisplay.textContent = state.profile.name;
  profileBioDisplay.textContent = state.profile.bio;
  profileAvatar.textContent = buildInitials(state.profile.name);
}

function getCurrentAuthorName() {
  return window.MEDIA_AUTH_STATE?.username || state.profile.name;
}

function syncFilterControls() {
  Object.entries(sortSelects).forEach(([mediaType, select]) => {
    if (!select) {
      return;
    }
    select.value = state.filters[mediaType].sort;
  });
  Object.entries(scoreSelects).forEach(([mediaType, select]) => {
    if (!select) {
      return;
    }
    select.value = String(state.filters[mediaType].minScore);
  });
  Object.entries(eraSelects).forEach(([mediaType, select]) => {
    if (!select) {
      return;
    }
    select.value = state.filters[mediaType].era;
  });
  Object.entries(favoritesToggles).forEach(([mediaType, button]) => {
    if (!button) {
      return;
    }
    button.classList.toggle("active", state.filters[mediaType].favoritesOnly);
    button.setAttribute("aria-pressed", String(state.filters[mediaType].favoritesOnly));
  });
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const query = params.get("q");

  if (tab === "movie" || tab === "manga") {
    activateTab(tab);
  }

  if (query) {
    const mediaType = tab === "movie" ? "movie" : state.activeTab;
    inputs[mediaType].value = query;
    triggerSearch(mediaType);
  }
}

function queueSearch(mediaType) {
  const query = inputs[mediaType].value.trim();
  window.clearTimeout(searchTimers[mediaType]);

  if (query.length < 2) {
    if (mediaType === "manga") {
      state.mangaResults = [];
      renderMediaResults("manga");
      renderGenreFilters("manga");
      setStatus(statuses.manga, "Start typing to search manga.", false);
    } else {
      state.movieResults = [];
      renderMediaResults("movie");
      renderGenreFilters("movie");
      setStatus(
        statuses.movie,
        backend.moviesEnabled
          ? "Start typing to search movies."
          : "Add a free TMDb token in config.js to enable movie search.",
        !backend.moviesEnabled
      );
    }
    return;
  }

  setStatus(statuses[mediaType], "Waiting for you to pause typing...", false);
  searchTimers[mediaType] = window.setTimeout(() => triggerSearch(mediaType), 350);
}

async function triggerSearch(mediaType) {
  activateTab(mediaType);
  const query = inputs[mediaType].value.trim();

  if (query.length < 2) {
    setStatus(
      statuses[mediaType],
      `Enter at least 2 characters to search ${mediaType === "manga" ? "manga" : "movies"}.`,
      true
    );
    return;
  }

  if (mediaType === "movie" && !backend.moviesEnabled) {
    setStatus(statuses.movie, "Movie search needs a free TMDb token in config.js.", true);
    renderMediaResults("movie", "Movie search is disabled until you add a TMDb token.");
    return;
  }

  addRecentSearch(mediaType, query);
  updateUrlState(mediaType, query);
  const searchToken = ++latestSearchToken[mediaType];
  setStatus(
    statuses[mediaType],
    `Searching ${mediaType === "manga" ? "Jikan" : "TMDb"} for "${query}"...`,
    false
  );
  renderSkeletons(mediaType);

  try {
    const results =
      mediaType === "manga"
        ? await fetchMangaSeries(query, searchToken)
        : await fetchMovies(query, searchToken);

    if (results === null) {
      return;
    }

    if (mediaType === "manga") {
      state.mangaResults = results;
    } else {
      state.movieResults = results;
    }

    cacheResults(results);
    await syncVisibleVoteCounts(mediaType, results);
    renderGenreFilters(mediaType);
    addActivity(`Searched ${mediaType} for "${query}".`);

    if (results.length === 0) {
      setStatus(
        statuses[mediaType],
        `No ${mediaType === "manga" ? "manga series" : "movies"} matched that search.`,
        false
      );
    } else {
      setStatus(statuses[mediaType], `Showing ${results.length} ${mediaType} result(s).`, false);
    }

    renderMediaResults(mediaType);
    renderUtilityPanels();
  } catch (error) {
    console.error(error);
    if (mediaType === "manga") {
      state.mangaResults = [];
    } else {
      state.movieResults = [];
    }
    setStatus(
      statuses[mediaType],
      `${mediaType === "manga" ? "Manga" : "Movie"} search failed. Check your network or API setup.`,
      true
    );
    renderMediaResults(mediaType, "Something went wrong while fetching results.");
  }
}

async function fetchMangaSeries(query, searchToken) {
  const url = new URL(JIKAN_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("sfw", "true");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jikan request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (searchToken !== latestSearchToken.manga) {
    return null;
  }
  return cleanMangaResults(payload.data || []);
}

async function fetchMovies(query, searchToken) {
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
  if (searchToken !== latestSearchToken.movie) {
    return null;
  }
  return cleanMovieResults(payload.results || []);
}

function cleanMangaResults(items) {
  const grouped = new Map();
  const preferredItems = items.filter((item) => item && ["Manga", "One-shot"].includes(item.type));
  const sourceItems = preferredItems.length > 0 ? preferredItems : items.filter((item) => item && item.title);

  sourceItems.forEach((item) => {
    const preferredTitle = item.title_english || item.title || "Untitled";
    const seriesTitle = formatSeriesTitle(preferredTitle);
    const seriesKey = slugify(seriesTitle);
    if (!seriesKey) {
      return;
    }

    const candidate = {
      id: String(item.mal_id),
      mediaType: "manga",
      seriesKey,
      title: seriesTitle,
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

function cleanMovieResults(items) {
  const grouped = new Map();
  items
    .filter((item) => item && item.title)
    .forEach((item) => {
      const year = item.release_date ? Number(item.release_date.slice(0, 4)) : 0;
      const title = item.title.trim();
      const seriesKey = slugify(`${title}-${year || item.id}`);

      const candidate = {
        id: String(item.id),
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
  if (item.published?.prop?.from?.year) {
    bits.push(String(item.published.prop.from.year));
  }
  if (item.volumes) {
    bits.push(`${item.volumes} vols`);
  }
  if (item.chapters) {
    bits.push(`${item.chapters} chapters`);
  }
  bits.push(item.type || "Manga");
  return bits.join(" | ");
}

function buildMovieMeta(item) {
  const bits = [];
  if (item.release_date) {
    bits.push(item.release_date.slice(0, 4));
  }
  if (item.original_language) {
    bits.push(item.original_language.toUpperCase());
  }
  if (item.vote_count) {
    bits.push(`${item.vote_count} ratings`);
  }
  return bits.join(" | ") || "Movie";
}

function renderMediaResults(mediaType, message = "") {
  const container = resultsContainers[mediaType];
  const results = getFilteredResults(mediaType);
  container.innerHTML = "";

  if (message) {
    container.append(createEmptyState(message));
    return;
  }

  if (results.length === 0) {
    const fallback = state.filters[mediaType].favoritesOnly
      ? "No favorites match this view yet."
      : mediaType === "manga"
        ? "Search for a manga series to see results here."
        : backend.moviesEnabled
          ? "Search for a movie to see results here."
          : "Movie search is waiting for a free TMDb token in config.js.";
    container.append(createEmptyState(fallback));
    return;
  }

  results.forEach((item) => {
    const fragment = cardTemplate.content.cloneNode(true);
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

    image.src = item.image;
    image.alt = `${item.title} artwork`;
    type.textContent = item.mediaType === "manga" ? "Manga series" : "Movie";
    score.textContent = item.scoreLabel;
    title.textContent = item.title;
    meta.textContent = item.meta;
    renderTagList(tags, item.genres || []);
    summary.textContent = item.summary;
    voteCount.textContent = formatVoteCount(getVoteCount(item));

    const voteId = buildVoteId(item.mediaType, item.seriesKey);
    const hasVoted = Boolean(state.voted[voteId]);
    const isFavorite = Boolean(state.favorites[voteId]);

    voteButton.disabled = hasVoted;
    voteButton.textContent = hasVoted ? "Voted" : "Vote";
    voteButton.addEventListener("click", () => handleVote(item));

    favoriteButton.textContent = isFavorite ? "Saved" : "Save";
    favoriteButton.classList.toggle("is-active", isFavorite);
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.addEventListener("click", () => toggleFavorite(item));

    detailsButton.addEventListener("click", async () => {
      await openDetailsModal(item);
    });
    shareButton.addEventListener("click", () => shareItem(item));

    container.append(fragment);
  });
}

function getFilteredResults(mediaType) {
  const baseResults = mediaType === "manga" ? state.mangaResults : state.movieResults;
  let results = [...baseResults];

  if (state.filters[mediaType].favoritesOnly) {
    results = results.filter((item) => state.favorites[buildVoteId(item.mediaType, item.seriesKey)]);
  }
  if (state.filters[mediaType].minScore > 0) {
    results = results.filter((item) => item.scoreValue >= state.filters[mediaType].minScore);
  }
  if (state.filters[mediaType].era !== "all") {
    results = results.filter((item) => matchesEra(item.yearValue, state.filters[mediaType].era));
  }
  if (state.filters[mediaType].genre) {
    results = results.filter((item) => (item.genres || []).includes(state.filters[mediaType].genre));
  }

  switch (state.filters[mediaType].sort) {
    case "title":
      results.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "year":
      results.sort((a, b) => b.yearValue - a.yearValue);
      break;
    case "score":
      results.sort((a, b) => b.scoreValue - a.scoreValue);
      break;
    case "votes":
      results.sort((a, b) => getVoteCount(b) - getVoteCount(a));
      break;
    case "personal":
      results.sort((a, b) => getPersonalScore(b) - getPersonalScore(a));
      break;
    default:
      break;
  }

  return results;
}

function renderGenreFilters(mediaType) {
  const container = genreContainers[mediaType];
  if (!container) {
    return;
  }
  const baseResults = mediaType === "manga" ? state.mangaResults : state.movieResults;
  const genres = [...new Set(baseResults.flatMap((item) => item.genres || []))].slice(0, 10);
  container.innerHTML = "";

  if (genres.length === 0) {
    const chip = document.createElement("span");
    chip.className = "chip is-empty";
    chip.textContent = "Search to load genres.";
    container.append(chip);
    return;
  }

  genres.forEach((genre) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${state.filters[mediaType].genre === genre ? " active" : ""}`;
    button.textContent = genre;
    button.addEventListener("click", () => {
      state.filters[mediaType].genre =
        state.filters[mediaType].genre === genre ? "" : genre;
      renderGenreFilters(mediaType);
      renderMediaResults(mediaType);
    });
    container.append(button);
  });
}

function renderSkeletons(mediaType) {
  const container = resultsContainers[mediaType];
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
  renderMediaResults("manga");
  renderMediaResults("movie");
  renderGenreFilters("manga");
  renderGenreFilters("movie");
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
        setVoteStatusMessage(item.mediaType, result.message, true);
        showToast(result.message, true);
        return;
      }
    } else {
      state.localVotes[voteId] = (state.localVotes[voteId] || 0) + 1;
      state.cache[voteId] = buildCacheRecord(item);
      persistLocalState();
    }

    state.voted[voteId] = true;
    state.cache[voteId] = buildCacheRecord(item);
    persistLocalState();
    await syncVisibleVoteCounts(item.mediaType, item.mediaType === "manga" ? state.mangaResults : state.movieResults);
    if (backend.sharedVotesEnabled) {
      await refreshRemoteLeaderboard();
    }

    renderMediaResults(item.mediaType);
    renderLeaderboard();
    renderUtilityPanels();
    renderGenreFilters(item.mediaType);
    addActivity(`Voted for ${item.title}.`);
    setVoteStatusMessage(item.mediaType, `Vote saved for ${item.title}.`, false);
    showToast(`Vote saved for ${item.title}.`);
  } catch (error) {
    console.error(error);
    setVoteStatusMessage(item.mediaType, "Vote failed. Check your backend configuration.", true);
    showToast("Vote failed. Check your backend configuration.", true);
  }
}

async function castRemoteVote(item) {
  const url = `${config.supabaseUrl}/rest/v1/rpc/cast_vote`;
  const response = await fetch(url, {
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
  if (wasInserted === false) {
    return { success: false, message: "This browser already voted for that item." };
  }

  return { success: true };
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
  state.remoteLeaderboard = payload.map((item) =>
    enrichLeaderboardEntry({
      mediaType: item.media_type,
      seriesKey: item.series_key,
      title: item.title,
      meta: item.meta,
      votes: item.votes,
    })
  );

  payload.forEach((item) => {
    const voteId = buildVoteId(item.media_type, item.series_key);
    const cached = state.cache[voteId] || {};
    state.remoteVoteCounts[voteId] = item.votes;
    state.cache[voteId] = {
      ...cached,
      mediaType: item.media_type,
      title: item.title,
      image: item.image_url || cached.image,
      meta: item.meta,
    };
  });

  persistLocalState();
}

async function syncVisibleVoteCounts(mediaType, items) {
  if (!items || items.length === 0) {
    return;
  }

  if (!backend.sharedVotesEnabled) {
    items.forEach((item) => {
      state.cache[buildVoteId(mediaType, item.seriesKey)] = buildCacheRecord(item);
    });
    persistLocalState();
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
    if (!state.cache[voteId]) {
      state.cache[voteId] = buildCacheRecord(item);
    }
  });

  persistLocalState();
}

function renderLeaderboard() {
  leaderboardContainer.innerHTML = "";

  const entries = getLeaderboardEntries()
    .filter((entry) => state.leaderboardFilter === "all" || entry.mediaType === state.leaderboardFilter)
    .sort(compareLeaderboardEntries)
    .slice(0, 10);

  if (entries.length === 0) {
    leaderboardContainer.append(
      createEmptyState(
        backend.sharedVotesEnabled
          ? "Shared leaderboard is empty. Search and cast the first vote."
          : "No votes yet. Search manga or movies and cast the first vote."
      )
    );
    return;
  }

  entries.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = "leaderboard-entry";
    card.innerHTML = `
      <span class="leaderboard-rank">${index + 1}</span>
      <div class="leaderboard-meta">
        <p class="leaderboard-title">${escapeHtml(entry.title)}</p>
        <span class="leaderboard-tag">${entry.mediaType === "manga" ? "Manga" : "Movie"}</span>
        <span class="leaderboard-tag">${escapeHtml(formatLeaderboardModeValue(entry))}</span>
        <span class="media-meta">${escapeHtml(entry.meta || "")}</span>
      </div>
      <span class="leaderboard-votes">${entry.votes} vote${entry.votes === 1 ? "" : "s"}</span>
    `;
    leaderboardContainer.append(card);
  });
}

function getLeaderboardEntries() {
  if (backend.sharedVotesEnabled && state.remoteLeaderboard.length > 0) {
    return [...state.remoteLeaderboard];
  }

  return Object.entries(state.localVotes).map(([voteId, votes]) => {
    const [mediaType, seriesKey] = voteId.split(":");
    const cached = state.cache[voteId] || {};
    return enrichLeaderboardEntry({
      mediaType,
      seriesKey,
      title: cached.title || `${mediaType} ${seriesKey}`,
      meta: cached.meta || "",
      votes,
      scoreValue: cached.scoreValue || 0,
      yearValue: cached.yearValue || 0,
      genres: cached.genres || [],
    });
  });
}

function hydrateSetupPanel() {
  if (backendPill) {
    backendPill.textContent = backend.sharedVotesEnabled ? "Shared votes" : "Local votes";
  }
  if (socialPill) {
    socialPill.textContent = backend.sharedCommentsEnabled ? "Shared comments" : "Local comments";
  }

  if (backend.moviesEnabled) {
    setStatus(statuses.movie, "Start typing to search movies.", false);
  } else {
    setStatus(statuses.movie, "Add a free TMDb token in config.js to enable movie search.", true);
  }
}

function renderUtilityPanels() {
  return;
}

function buildDiscoveryHighlights() {
  const items = [...state.mangaResults, ...state.movieResults];
  if (items.length === 0) {
    return [];
  }

  const genreCounts = new Map();
  items.forEach((item) => {
    (item.genres || []).forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });
  });

  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topRated = [...items].sort((a, b) => b.scoreValue - a.scoreValue)[0];
  const mostDiscussed = [...items].sort((a, b) => getCommentsForItem(b).length - getCommentsForItem(a).length)[0];
  const highlights = [];

  if (topGenre) {
    highlights.push({ label: `Genre: ${topGenre[0]}`, meta: "Popular now", action: () => {} });
  }
  if (topRated) {
    highlights.push({
      label: `Top rated: ${topRated.title}`,
      meta: topRated.mediaType,
      action: () => openDetailsModal(topRated),
    });
  }
  if (mostDiscussed && getCommentsForItem(mostDiscussed).length > 0) {
    highlights.push({
      label: `Most discussed: ${mostDiscussed.title}`,
      meta: `${getCommentsForItem(mostDiscussed).length} comments`,
      action: () => openDetailsModal(mostDiscussed),
    });
  }

  return highlights.slice(0, 4);
}

function buildTasteSummary() {
  const counts = getPreferenceCounts();
  const topGenres = [...counts.genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const mediaBalance = [...counts.mediaTypes.entries()].sort((a, b) => b[1] - a[1])[0];
  const summary = [];

  topGenres.forEach(([genre, score]) => {
    summary.push({ label: `${genre}`, meta: `Taste score ${score}`, action: () => {} });
  });

  if (mediaBalance) {
    summary.push({
      label: `Leaning ${mediaBalance[0] === "manga" ? "manga" : "movies"}`,
      meta: `${mediaBalance[1]} strong signals`,
      action: () => {},
    });
  }

  return summary;
}

function buildRecommendations() {
  const recommendations = getRecommendedItems().slice(0, 6);
  return recommendations.map((item) => ({
    label: item.title,
    meta: buildRecommendationReason(item),
    action: () => {
      activateTab(item.mediaType);
      openDetailsModal(item);
    },
  }));
}

function renderActivityFeed() {
  if (!activityFeed) {
    return;
  }
  activityFeed.innerHTML = "";
  const items = state.activity.slice(0, 10);

  if (items.length === 0) {
    activityFeed.append(createEmptyState("Your activity will appear here once you start exploring."));
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "activity-item";
    card.innerHTML = `
      <strong>${escapeHtml(item.message)}</strong>
      <span class="comment-meta">${escapeHtml(item.time)}</span>
    `;
    activityFeed.append(card);
  });
}

function addActivity(message) {
  const timestamp = new Date().toLocaleString();
  state.activity.unshift({ message, time: timestamp });
  state.activity = state.activity.slice(0, 40);
  persistActivity();
  renderActivityFeed();
}

function renderChipList(container, entries, emptyLabel) {
  if (!container) {
    return;
  }
  container.innerHTML = "";

  if (entries.length === 0) {
    const chip = document.createElement("span");
    chip.className = "chip is-empty";
    chip.textContent = emptyLabel;
    container.append(chip);
    return;
  }

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.className = "chip";
    button.type = "button";
    button.textContent = entry.label;
    button.title = entry.meta;
    button.addEventListener("click", entry.action);
    container.append(button);
  });
}

function renderSuggestions(mediaType) {
  const container = suggestionsContainers[mediaType];
  const query = inputs[mediaType].value.trim().toLowerCase();
  const suggestions = getSuggestions(mediaType, query);
  container.innerHTML = "";

  if (suggestions.length === 0) {
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
  const pool = [];
  const seen = new Set();

  const addSuggestion = (label, meta) => {
    const key = label.toLowerCase();
    if (!label || seen.has(key)) {
      return;
    }
    if (query && !key.includes(query)) {
      return;
    }
    seen.add(key);
    pool.push({ label, meta });
  };

  state.recentSearches[mediaType].forEach((item) => addSuggestion(item.query, "Recent search"));
  Object.values(state.favorites)
    .filter((item) => item.mediaType === mediaType)
    .forEach((item) => addSuggestion(item.title, "Favorite"));
  Object.values(state.cache)
    .filter((item) => item.mediaType === mediaType)
    .forEach((item) => addSuggestion(item.title, "Seen before"));
  DEMO_SUGGESTIONS[mediaType].forEach((label) => addSuggestion(label, "Quick idea"));

  return pool.slice(0, 6);
}

function applySuggestion(mediaType, value) {
  inputs[mediaType].value = value;
  suggestionsContainers[mediaType].classList.add("hidden");
  triggerSearch(mediaType);
}

function addRecentSearch(mediaType, query) {
  const cleaned = query.trim();
  if (!cleaned) {
    return;
  }

  const list = state.recentSearches[mediaType].filter(
    (item) => item.query.toLowerCase() !== cleaned.toLowerCase()
  );
  list.unshift({ query: cleaned, mediaType });
  state.recentSearches[mediaType] = list.slice(0, 6);
  persistRecentSearches();
  renderUtilityPanels();
}

function toggleFavorite(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  if (state.favorites[voteId]) {
    delete state.favorites[voteId];
    persistFavorites();
    renderMediaResults(item.mediaType);
    renderUtilityPanels();
    addActivity(`Removed ${item.title} from favorites.`);
    showToast(`Removed ${item.title} from favorites.`);
    return;
  }

  state.favorites[voteId] = buildCacheRecord(item);
  persistFavorites();
  renderMediaResults(item.mediaType);
  renderUtilityPanels();
  addActivity(`Saved ${item.title} to favorites.`);
  showToast(`Saved ${item.title} to favorites.`);
}

async function openDetailsModal(item) {
  state.modalItem = item;
  modalImage.src = item.image;
  modalImage.alt = `${item.title} artwork`;
  modalType.textContent = item.mediaType === "manga" ? "Manga series" : "Movie";
  modalTitle.textContent = item.title;
  modalMeta.textContent = item.meta;
  renderTagList(modalTags, item.genres || []);
  renderModalStats(item);
  renderRecommendationReasons(item);
  modalSummary.textContent = item.summary || "No summary available.";

  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  const isFavorite = Boolean(state.favorites[voteId]);
  modalFavorite.textContent = isFavorite ? "Saved" : "Save";
  modalFavorite.classList.toggle("active", isFavorite);
  commentInput.value = "";
  setCommentStatus("Share your take.", false);
  await renderComments(item);

  if (typeof detailsModal.showModal === "function" && !detailsModal.open) {
    detailsModal.showModal();
  }
}

function renderModalStats(item) {
  modalStats.innerHTML = "";
  const stats = [
    item.scoreValue ? `Score ${item.scoreValue.toFixed(1)}` : "",
    item.yearValue ? `Year ${item.yearValue}` : "",
    `Votes ${getVoteCount(item)}`,
    `Comments ${getCommentsForItem(item).length}`,
    `For you ${Math.round(getPersonalScore(item))}`,
  ].filter(Boolean);

  stats.forEach((value) => {
    const node = document.createElement("span");
    node.className = "modal-stat";
    node.textContent = value;
    modalStats.append(node);
  });
}

function renderRecommendationReasons(item) {
  const reason = buildRecommendationReason(item);
  renderChipList(
    modalReasons,
    reason ? [{ label: reason, meta: "Personalized", action: () => {} }] : [],
    "Keep exploring to unlock more personalized reasons."
  );
}

async function renderComments(item) {
  commentsList.innerHTML = "";
  const comments = getCommentsForItem(item);

  if (comments.length === 0) {
    commentsList.append(createEmptyState("No comments yet. Start the discussion."));
    return;
  }

  comments.forEach((comment) => {
    const card = document.createElement("article");
    card.className = "comment-card";
    card.innerHTML = `
      <strong>${escapeHtml(comment.author)}</strong>
      <span class="comment-meta">${escapeHtml(comment.time)}</span>
      <p>${escapeHtml(comment.text)}</p>
    `;
    commentsList.append(card);
  });
}

function getCommentsForItem(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  return state.comments[voteId] || [];
}

async function submitComment() {
  if (!state.modalItem) {
    return;
  }

  const text = commentInput.value.trim();
  if (!text) {
    setCommentStatus("Write a comment before posting.", true);
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

  commentInput.value = "";
  addActivity(`Commented on ${state.modalItem.title}.`);
  renderUtilityPanels();
  await renderComments(state.modalItem);
  renderModalStats(state.modalItem);
  showToast(`Comment saved for ${state.modalItem.title}.`);
}

async function postRemoteComment(item, comment) {
  const url = `${config.supabaseUrl}/rest/v1/media_comments`;
  const response = await fetch(url, {
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

function setCommentStatus(message, isError) {
  commentStatus.textContent = message;
  commentStatus.classList.toggle("is-error", Boolean(isError));
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
    addActivity(`Shared ${item.title}.`);
    showToast(`Share link ready for ${item.title}.`);
  } catch (error) {
    console.error(error);
    showToast("Sharing is not available in this browser.", true);
  }
}

function updateUrlState(mediaType = state.activeTab, query = inputs[mediaType]?.value.trim() || "") {
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

function cacheResults(results) {
  results.forEach((item) => {
    state.cache[buildVoteId(item.mediaType, item.seriesKey)] = buildCacheRecord(item);
  });
  persistLocalState();
}

function buildCacheRecord(item) {
  return {
    mediaType: item.mediaType,
    title: item.title,
    image: item.image,
    meta: item.meta,
    summary: item.summary,
    genres: item.genres,
    scoreValue: item.scoreValue,
    yearValue: item.yearValue,
  };
}

function buildVoteId(mediaType, seriesKey) {
  return `${mediaType}:${seriesKey}`;
}

function getVoteCount(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  return backend.sharedVotesEnabled ? state.remoteVoteCounts[voteId] || 0 : state.localVotes[voteId] || 0;
}

function formatVoteCount(votes) {
  return `${votes} vote${votes === 1 ? "" : "s"}`;
}

function renderTagList(container, tags) {
  container.innerHTML = "";
  (tags || []).slice(0, 3).forEach((tag) => {
    const node = document.createElement("span");
    node.className = "tag";
    node.textContent = tag;
    container.append(node);
  });
}

function matchesEra(yearValue, era) {
  if (!yearValue) {
    return false;
  }
  if (era === "2020s") {
    return yearValue >= 2020;
  }
  if (era === "2010s") {
    return yearValue >= 2010 && yearValue < 2020;
  }
  if (era === "2000s") {
    return yearValue >= 2000 && yearValue < 2010;
  }
  return yearValue < 2000;
}

function enrichLeaderboardEntry(entry) {
  const cached = state.cache[buildVoteId(entry.mediaType, entry.seriesKey)] || {};
  const scoreValue = entry.scoreValue || cached.scoreValue || 0;
  const yearValue = entry.yearValue || cached.yearValue || 0;
  const genres = entry.genres || cached.genres || [];
  return {
    ...entry,
    scoreValue,
    yearValue,
    genres,
    hotScore: (entry.votes || 0) * 10 + scoreValue * 4 + Math.max(0, yearValue - 1990),
    personalScore: getPersonalScore({
      mediaType: entry.mediaType,
      seriesKey: entry.seriesKey,
      title: entry.title,
      genres,
      scoreValue,
      yearValue,
    }),
  };
}

function compareLeaderboardEntries(a, b) {
  if (state.leaderboardMode === "hot") {
    return b.hotScore - a.hotScore;
  }
  if (state.leaderboardMode === "newest") {
    return b.yearValue - a.yearValue || b.votes - a.votes;
  }
  if (state.leaderboardMode === "personal") {
    return b.personalScore - a.personalScore || b.votes - a.votes;
  }
  return b.votes - a.votes;
}

function formatLeaderboardModeValue(entry) {
  if (state.leaderboardMode === "hot") {
    return `Hot ${Math.round(entry.hotScore)}`;
  }
  if (state.leaderboardMode === "newest") {
    return entry.yearValue ? `Year ${entry.yearValue}` : "Year n/a";
  }
  if (state.leaderboardMode === "personal") {
    return `For you ${Math.round(entry.personalScore)}`;
  }
  return `${entry.votes} votes`;
}

function getPreferenceCounts() {
  const counts = {
    genres: new Map(),
    mediaTypes: new Map(),
  };

  const weightItem = (item, weight) => {
    if (!item) {
      return;
    }
    counts.mediaTypes.set(item.mediaType, (counts.mediaTypes.get(item.mediaType) || 0) + weight);
    (item.genres || []).forEach((genre) => {
      counts.genres.set(genre, (counts.genres.get(genre) || 0) + weight);
    });
  };

  Object.values(state.favorites).forEach((item) => weightItem(item, 3));
  Object.entries(state.localVotes).forEach(([voteId]) => weightItem(state.cache[voteId], 2));
  state.recentSearches.manga.forEach(() => counts.mediaTypes.set("manga", (counts.mediaTypes.get("manga") || 0) + 1));
  state.recentSearches.movie.forEach(() => counts.mediaTypes.set("movie", (counts.mediaTypes.get("movie") || 0) + 1));
  Object.entries(state.comments).forEach(([voteId, comments]) => {
    weightItem(state.cache[voteId], comments.length * 2);
  });

  return counts;
}

function getPersonalScore(item) {
  const counts = getPreferenceCounts();
  let score = item.scoreValue * 2 + Math.max(0, item.yearValue - 2000) * 0.2;

  score += (counts.mediaTypes.get(item.mediaType) || 0) * 1.5;
  (item.genres || []).forEach((genre) => {
    score += counts.genres.get(genre) || 0;
  });

  if (state.favorites[buildVoteId(item.mediaType, item.seriesKey)]) {
    score += 12;
  }

  return score;
}

function getRecommendedItems() {
  const pool = Object.entries(state.cache)
    .map(([voteId, cached]) => ({
      ...cached,
      seriesKey: voteId.split(":")[1],
    }))
    .filter((item) => item.title);

  return pool
    .map((item) => ({ ...item, personalScore: getPersonalScore(item) }))
    .sort((a, b) => b.personalScore - a.personalScore)
    .filter((item) => !state.favorites[buildVoteId(item.mediaType, item.seriesKey)]);
}

function buildRecommendationReason(item) {
  const counts = getPreferenceCounts();
  const matchedGenre = (item.genres || []).find((genre) => (counts.genres.get(genre) || 0) > 0);
  if (matchedGenre) {
    return `Because you like ${matchedGenre}`;
  }
  if ((counts.mediaTypes.get(item.mediaType) || 0) > 0) {
    return `Because you engage with ${item.mediaType === "manga" ? "manga" : "movies"}`;
  }
  return "Because it fits your recent activity";
}

function setVoteStatusMessage(mediaType, message, isError) {
  setStatus(statuses[mediaType], message, isError);
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

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function sanitizeProfileValue(value, fallback) {
  const cleaned = String(value).trim();
  return cleaned || fallback;
}

function buildInitials(name) {
  return String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "MV";
}

function persistLocalState() {
  localStorage.setItem(STORAGE_KEYS.localVotes, JSON.stringify(state.localVotes));
  localStorage.setItem(STORAGE_KEYS.localVoted, JSON.stringify(state.voted));
  localStorage.setItem(STORAGE_KEYS.localCache, JSON.stringify(state.cache));
}

function persistFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
}

function persistRecentSearches() {
  localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(state.recentSearches));
}

function persistProfile() {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
}

function persistActivity() {
  localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(state.activity));
}

function persistComments() {
  localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(state.comments));
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
  return normalized.slice(0, 170) + (normalized.length > 170 ? "..." : "");
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
  if (!toastRegion) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " is-error" : ""}`;
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    socialPill.textContent = "Browser only";
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
