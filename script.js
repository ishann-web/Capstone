const JIKAN_URL = "https://api.jikan.moe/v4/manga";
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const STORAGE_KEYS = {
  localVotes: "mediaVotesLocal",
  localVoted: "mediaVotedLocal",
  localCache: "mediaCacheLocal",
  theme: "mediaTheme",
  clientId: "mediaClientId",
};

const state = {
  activeTab: "manga",
  leaderboardFilter: "all",
  mangaResults: [],
  movieResults: [],
  localVotes: loadJson(STORAGE_KEYS.localVotes, {}),
  voted: loadJson(STORAGE_KEYS.localVoted, {}),
  cache: loadJson(STORAGE_KEYS.localCache, {}),
  remoteVoteCounts: {},
  remoteLeaderboard: [],
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  clientId: getOrCreateClientId(),
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
const backendPill = document.querySelector("#backend-pill");
const setupStatus = document.querySelector("#setup-status");
const themeToggle = document.querySelector("#theme-toggle");

const searchTimers = {
  manga: null,
  movie: null,
};

const latestSearchToken = {
  manga: 0,
  movie: 0,
};

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
  };

  initializeApp();
}

async function initializeApp() {
  applyTheme(state.theme);
  bindTabs();
  bindSearch();
  bindLeaderboardFilters();
  bindThemeToggle();
  hydrateSetupPanel();
  renderLeaderboard();
  renderEmptyStates();

  if (backend.sharedVotesEnabled) {
    try {
      await refreshRemoteLeaderboard();
    } catch (error) {
      console.error(error);
      backend.sharedVotesEnabled = false;
      backendPill.textContent = "Local votes";
      setupStatus.textContent =
        "Supabase shared votes could not be reached. The app fell back to local votes.";
      setupStatus.classList.add("is-error");
    }
  }

  renderLeaderboard();
}

function bindTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { tab } = button.dataset;
      state.activeTab = tab === "movies" ? "movie" : "manga";

      tabButtons.forEach((item) => item.classList.toggle("active", item === button));
      tabViews.forEach((view) =>
        view.classList.toggle("active", view.id === `${button.dataset.tab}-tab`)
      );
    });
  });
}

function bindSearch() {
  mangaSearchInput.addEventListener("input", () => queueSearch("manga"));
  movieSearchInput.addEventListener("input", () => queueSearch("movie"));
  mangaSearchButton.addEventListener("click", () => triggerSearch("manga"));
  movieSearchButton.addEventListener("click", () => triggerSearch("movie"));
  mangaSearchInput.addEventListener("keydown", (event) => handleEnterSearch(event, "manga"));
  movieSearchInput.addEventListener("keydown", (event) => handleEnterSearch(event, "movie"));
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

function bindThemeToggle() {
  themeToggle.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
}

function handleEnterSearch(event, mediaType) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  triggerSearch(mediaType);
}

function queueSearch(mediaType) {
  const input = mediaType === "manga" ? mangaSearchInput : movieSearchInput;
  const status = mediaType === "manga" ? mangaSearchStatus : movieSearchStatus;
  const query = input.value.trim();

  window.clearTimeout(searchTimers[mediaType]);

  if (query.length < 2) {
    if (mediaType === "manga") {
      state.mangaResults = [];
      renderMediaResults("manga");
      setStatus(status, "Start typing to search manga.", false);
    } else {
      state.movieResults = [];
      renderMediaResults("movie");
      setStatus(
        status,
        backend.moviesEnabled
          ? "Start typing to search movies."
          : "Add a free TMDb token in config.js to enable movie search.",
        !backend.moviesEnabled
      );
    }

    return;
  }

  setStatus(status, "Waiting for you to pause typing...", false);
  searchTimers[mediaType] = window.setTimeout(() => triggerSearch(mediaType), 350);
}

async function triggerSearch(mediaType) {
  const input = mediaType === "manga" ? mangaSearchInput : movieSearchInput;
  const status = mediaType === "manga" ? mangaSearchStatus : movieSearchStatus;
  const query = input.value.trim();

  if (query.length < 2) {
    setStatus(status, `Enter at least 2 characters to search ${mediaType === "manga" ? "manga" : "movies"}.`, true);
    return;
  }

  if (mediaType === "movie" && !backend.moviesEnabled) {
    setStatus(status, "Movie search needs a free TMDb token in config.js.", true);
    renderMediaResults("movie", "Movie search is disabled until you add a TMDb token.");
    return;
  }

  const searchToken = ++latestSearchToken[mediaType];
  setStatus(status, `Searching ${mediaType === "manga" ? "Jikan" : "TMDb"} for "${query}"...`, false);
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

    await syncVisibleVoteCounts(mediaType, results);

    if (results.length === 0) {
      setStatus(
        status,
        `No ${mediaType === "manga" ? "manga series" : "movies"} matched that search.`,
        false
      );
    } else {
      setStatus(status, `Showing ${results.length} ${mediaType} result(s).`, false);
    }

    renderMediaResults(mediaType);
  } catch (error) {
    console.error(error);

    if (searchToken !== latestSearchToken[mediaType]) {
      return;
    }

    if (mediaType === "manga") {
      state.mangaResults = [];
    } else {
      state.movieResults = [];
    }

    setStatus(
      status,
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

  sourceItems
    .forEach((item) => {
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
        rawTitle: preferredTitle,
        image:
          item.images?.jpg?.large_image_url ||
          item.images?.jpg?.image_url ||
          "https://placehold.co/600x800/e4ecd9/27492d?text=Manga",
        meta: buildMangaMeta(item),
        scoreLabel: item.score ? `Score ${item.score}` : "Manga",
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
      const year = item.release_date ? item.release_date.slice(0, 4) : "";
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
        scoreLabel: item.vote_average ? `TMDb ${item.vote_average.toFixed(1)}` : "Movie",
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
  const year = item.published?.prop?.from?.year;

  if (year) {
    bits.push(String(year));
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
  const results = mediaType === "manga" ? state.mangaResults : state.movieResults;
  const container = mediaType === "manga" ? mangaResultsContainer : movieResultsContainer;

  container.innerHTML = "";

  if (message) {
    container.append(createEmptyState(message));
    return;
  }

  if (results.length === 0) {
    const defaultMessage =
      mediaType === "manga"
        ? "Search for a manga series to see results here."
        : backend.moviesEnabled
          ? "Search for a movie to see results here."
          : "Movie search is waiting for a free TMDb token in config.js.";

    container.append(createEmptyState(defaultMessage));
    return;
  }

  results.forEach((item) => {
    const fragment = cardTemplate.content.cloneNode(true);
    const image = fragment.querySelector(".media-image");
    const type = fragment.querySelector(".media-type");
    const score = fragment.querySelector(".media-score");
    const title = fragment.querySelector(".media-title");
    const meta = fragment.querySelector(".media-meta");
    const voteCount = fragment.querySelector(".vote-count");
    const voteButton = fragment.querySelector(".vote-button");

    image.src = item.image;
    image.alt = `${item.title} artwork`;
    type.textContent = item.mediaType === "manga" ? "Manga series" : "Movie";
    score.textContent = item.scoreLabel;
    title.textContent = item.title;
    meta.textContent = item.meta;
    voteCount.textContent = formatVoteCount(getVoteCount(item));

    const voteId = buildVoteId(item.mediaType, item.seriesKey);
    const hasVoted = Boolean(state.voted[voteId]);
    voteButton.disabled = hasVoted;
    voteButton.textContent = hasVoted ? "Voted" : "Vote";
    voteButton.addEventListener("click", () => handleVote(item));

    container.append(fragment);
  });
}

function renderSkeletons(mediaType) {
  const container = mediaType === "manga" ? mangaResultsContainer : movieResultsContainer;
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
        return;
      }
    } else {
      state.localVotes[voteId] = (state.localVotes[voteId] || 0) + 1;
      state.cache[voteId] = buildCacheRecord(item);
      persistLocalState();
    }

    state.voted[voteId] = true;
    localStorage.setItem(STORAGE_KEYS.localVoted, JSON.stringify(state.voted));
    state.cache[voteId] = buildCacheRecord(item);
    persistLocalState();

    await syncVisibleVoteCounts(item.mediaType, item.mediaType === "manga" ? state.mangaResults : state.movieResults);
    if (backend.sharedVotesEnabled) {
      await refreshRemoteLeaderboard();
    }

    renderMediaResults(item.mediaType);
    renderLeaderboard();
    setVoteStatusMessage(item.mediaType, `Vote saved for ${item.title}.`, false);
  } catch (error) {
    console.error(error);
    setVoteStatusMessage(item.mediaType, "Vote failed. Check your backend configuration.", true);
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
    return {
      success: false,
      message: `Shared vote request failed${text ? `: ${text}` : "."}`,
    };
  }

  const payload = await response.json();
  const wasInserted = Array.isArray(payload) ? payload[0]?.was_inserted : payload?.was_inserted;

  if (wasInserted === false) {
    return {
      success: false,
      message: "This browser already voted for that item.",
    };
  }

  return { success: true, message: "Vote saved." };
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
    image: item.image_url,
    meta: item.meta,
    votes: item.votes,
  }));

  payload.forEach((item) => {
    const voteId = buildVoteId(item.media_type, item.series_key);
    state.remoteVoteCounts[voteId] = item.votes;
    state.cache[voteId] = {
      mediaType: item.media_type,
      title: item.title,
      image: item.image_url,
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
      const voteId = buildVoteId(mediaType, item.seriesKey);
      state.cache[voteId] = buildCacheRecord(item);
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
      mediaType: item.media_type,
      title: item.title,
      image: item.image_url,
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
        <span class="media-meta">${escapeHtml(entry.meta || "")}</span>
      </div>
      <span class="leaderboard-votes">${entry.votes} vote${entry.votes === 1 ? "" : "s"}</span>
    `;

    leaderboardContainer.append(card);
  });
}

function getLeaderboardEntries() {
  if (backend.sharedVotesEnabled && state.remoteLeaderboard.length > 0) {
    return [...state.remoteLeaderboard].sort((a, b) => b.votes - a.votes);
  }

  return Object.entries(state.localVotes)
    .map(([voteId, votes]) => {
      const [mediaType, seriesKey] = voteId.split(":");
      const cached = state.cache[voteId] || {
        title: `${mediaType} ${seriesKey}`,
        meta: "",
      };

      return {
        mediaType,
        seriesKey,
        title: cached.title,
        meta: cached.meta,
        votes,
      };
    })
    .sort((a, b) => b.votes - a.votes);
}

function getVoteCount(item) {
  const voteId = buildVoteId(item.mediaType, item.seriesKey);
  return backend.sharedVotesEnabled
    ? state.remoteVoteCounts[voteId] || 0
    : state.localVotes[voteId] || 0;
}

function hydrateSetupPanel() {
  backendPill.textContent = backend.sharedVotesEnabled ? "Shared votes" : "Local votes";

  const messages = [];
  if (backend.moviesEnabled) {
    messages.push("TMDb movie search is enabled.");
    setStatus(movieSearchStatus, "Start typing to search movies.", false);
  } else {
    messages.push("Movie search is waiting for a free TMDb read token.");
    setStatus(movieSearchStatus, "Add a free TMDb token in config.js to enable movie search.", true);
  }

  if (backend.sharedVotesEnabled) {
    messages.push("Shared votes are enabled through Supabase.");
  } else {
    messages.push("Shared votes are disabled until Supabase credentials are added.");
  }

  setupStatus.textContent = messages.join(" ");
  setupStatus.classList.toggle("is-error", !backend.moviesEnabled || !backend.sharedVotesEnabled);
}

function buildCacheRecord(item) {
  return {
    mediaType: item.mediaType,
    title: item.title,
    image: item.image,
    meta: item.meta,
  };
}

function buildVoteId(mediaType, seriesKey) {
  return `${mediaType}:${seriesKey}`;
}

function formatVoteCount(votes) {
  return `${votes} vote${votes === 1 ? "" : "s"}`;
}

function setVoteStatusMessage(mediaType, message, isError) {
  const status = mediaType === "manga" ? mangaSearchStatus : movieSearchStatus;
  setStatus(status, message, isError);
}

function setStatus(element, message, isError) {
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

function persistLocalState() {
  localStorage.setItem(STORAGE_KEYS.localVotes, JSON.stringify(state.localVotes));
  localStorage.setItem(STORAGE_KEYS.localVoted, JSON.stringify(state.voted));
  localStorage.setItem(STORAGE_KEYS.localCache, JSON.stringify(state.cache));
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
