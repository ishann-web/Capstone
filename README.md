const STORAGE_KEYS = {
  localVotes: "mediaVotesLocal",
  localCache: "mediaCacheLocal",
  theme: "mediaTheme",
};

const state = {
  filter: "all",
  query: "",
  page: 1,
  pageSize: 25,
  entries: [],
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
};

const dom = {
  themeToggle: document.querySelector("#rankings-theme-toggle"),
  filterButtons: document.querySelectorAll("[data-ranking-filter]"),
  searchInput: document.querySelector("#rankings-search"),
  status: document.querySelector("#rankings-status"),
  list: document.querySelector("#rankings-list"),
  prevButton: document.querySelector("#pager-prev"),
  nextButton: document.querySelector("#pager-next"),
  pagerStatus: document.querySelector("#pager-status"),
};

let config = null;
let backend = null;
let started = false;

window.addEventListener("media-config-ready", startRankings, { once: true });

function startRankings() {
  if (started) {
    return;
  }

  started = true;
  const appConfig = window.APP_CONFIG || {};
  config = {
    supabaseUrl: trimTrailingSlash(appConfig.supabase?.url || ""),
    supabaseAnonKey: appConfig.supabase?.anonKey?.trim() || "",
  };

  backend = {
    sharedVotesEnabled: Boolean(config.supabaseUrl && config.supabaseAnonKey),
  };

  bindUi();
  applyTheme(state.theme);
  loadRankings().catch((error) => {
    console.error(error);
    setStatus("Could not load rankings right now.", true);
    renderEntries([]);
  });
}

function bindUi() {
  dom.themeToggle?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });

  dom.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.rankingFilter;
      state.page = 1;
      dom.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderRankings();
    });
  });

  dom.searchInput?.addEventListener("input", () => {
    state.query = dom.searchInput.value.trim().toLowerCase();
    state.page = 1;
    renderRankings();
  });

  dom.prevButton?.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      renderRankings();
    }
  });

  dom.nextButton?.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredEntries().length / state.pageSize));
    if (state.page < totalPages) {
      state.page += 1;
      renderRankings();
    }
  });
}

async function loadRankings() {
  setStatus("Loading rankings...", false);
  state.entries = backend.sharedVotesEnabled ? await loadRemoteEntries() : loadLocalEntries();
  renderRankings();
}

async function loadRemoteEntries() {
  const url = new URL(`${config.supabaseUrl}/rest/v1/media_votes`);
  url.searchParams.set("select", "media_type,series_key,title,image_url,meta,votes");
  url.searchParams.set("order", "votes.desc");
  url.searchParams.set("limit", "500");

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase rankings failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.map((item) => ({
    mediaType: item.media_type,
    seriesKey: item.series_key,
    title: item.title,
    meta: item.meta || "",
    votes: item.votes || 0,
  }));
}

function loadLocalEntries() {
  const votes = loadJson(STORAGE_KEYS.localVotes, {});
  const cache = loadJson(STORAGE_KEYS.localCache, {});

  return Object.entries(votes)
    .map(([voteId, voteCount]) => {
      const [mediaType, seriesKey] = voteId.split(":");
      const cached = cache[voteId] || {};
      return {
        mediaType,
        seriesKey,
        title: cached.title || `${mediaType} ${seriesKey}`,
        meta: cached.meta || "",
        votes: voteCount,
      };
    })
    .sort((a, b) => b.votes - a.votes);
}

function renderRankings() {
  const filtered = getFilteredEntries();
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.pageSize;
  const pageEntries = filtered.slice(start, start + state.pageSize);

  setStatus(
    filtered.length
      ? `Showing ${start + 1}-${Math.min(start + pageEntries.length, filtered.length)} of ${filtered.length} ranked titles.`
      : "No rankings match this view yet.",
    false
  );

  dom.pagerStatus.textContent = `Page ${state.page} of ${totalPages}`;
  dom.prevButton.disabled = state.page === 1;
  dom.nextButton.disabled = state.page >= totalPages;
  renderEntries(pageEntries, start);
}

function getFilteredEntries() {
  return state.entries.filter((entry) => {
    const matchesFilter = state.filter === "all" || entry.mediaType === state.filter;
    const matchesQuery =
      !state.query ||
      entry.title.toLowerCase().includes(state.query) ||
      entry.meta.toLowerCase().includes(state.query);
    return matchesFilter && matchesQuery;
  });
}

function renderEntries(entries, offset = 0) {
  dom.list.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No ranked titles found for this view.";
    dom.list.append(empty);
    return;
  }

  entries.forEach((entry, index) => {
    const row = document.createElement("article");
    row.className = "rankings-row";
    row.innerHTML = `
      <span class="rank-number">${offset + index + 1}</span>
      <div class="rank-title">
        <strong>${escapeHtml(entry.title)}</strong>
        <span class="rank-type">${formatMediaType(entry.mediaType)}</span>
        <span class="ranking-meta">${escapeHtml(entry.meta || "No extra details yet.")}</span>
      </div>
      <span class="rank-votes">${entry.votes} vote${entry.votes === 1 ? "" : "s"}</span>
    `;
    dom.list.append(row);
  });
}

function setStatus(message, isError) {
  dom.status.textContent = message;
  dom.status.classList.toggle("is-error", Boolean(isError));
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark", theme === "dark");
  dom.themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  dom.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  localStorage.setItem(STORAGE_KEYS.theme, theme);
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

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
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

function formatMediaType(mediaType) {
  if (mediaType === "artist") {
    return "Artist";
  }
  if (mediaType === "song") {
    return "Song";
  }
  if (mediaType === "anime") {
    return "Anime";
  }
  if (mediaType === "movie") {
    return "Movie";
  }
  return "Manga";
}
