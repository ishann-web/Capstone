:root {
  --bg: #a9dfbf;
  --bg-strong: #d8f1e1;
  --panel: rgba(248, 255, 249, 0.8);
  --panel-strong: rgba(242, 255, 246, 0.96);
  --panel-muted: rgba(76, 175, 80, 0.12);
  --line: rgba(30, 86, 49, 0.16);
  --text: #1e5631;
  --muted: #2e8b57;
  --accent: #228b22;
  --accent-strong: #1e5631;
  --accent-soft: rgba(169, 223, 191, 0.75);
  --gold: #2e8b57;
  --danger: #b14f44;
  --shadow: 0 24px 60px rgba(30, 86, 49, 0.16);
  --shadow-soft: 0 12px 30px rgba(30, 86, 49, 0.18);
  --radius-lg: 30px;
  --radius-md: 22px;
  --radius-sm: 16px;
}

body.dark {
  --bg: #153322;
  --bg-strong: #1e5631;
  --panel: rgba(22, 56, 35, 0.88);
  --panel-strong: rgba(30, 86, 49, 0.94);
  --panel-muted: rgba(76, 175, 80, 0.14);
  --line: rgba(169, 223, 191, 0.16);
  --text: #eef9f2;
  --muted: #b9e8c9;
  --accent: #4caf50;
  --accent-strong: #d8f1e1;
  --accent-soft: rgba(76, 175, 80, 0.18);
  --gold: #a9dfbf;
  --danger: #ff9b90;
  --shadow: 0 28px 70px rgba(5, 22, 10, 0.36);
  --shadow-soft: 0 14px 28px rgba(5, 22, 10, 0.28);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Work Sans", sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 12%, rgba(34, 139, 34, 0.22), transparent 20%),
    radial-gradient(circle at 88% 10%, rgba(76, 175, 80, 0.24), transparent 24%),
    radial-gradient(circle at 50% 100%, rgba(46, 139, 87, 0.18), transparent 32%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg-strong) 100%);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.4;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(30, 86, 49, 0.08) 0 14%, transparent 15%),
    radial-gradient(circle at 80% 25%, rgba(34, 139, 34, 0.07) 0 12%, transparent 13%),
    linear-gradient(125deg, transparent 0 92%, rgba(30, 86, 49, 0.08) 92% 93%, transparent 93% 100%);
  background-size: 320px 320px, 260px 260px, 220px 220px;
}

button,
input,
textarea,
dialog {
  font: inherit;
}

.page-shell {
  width: min(1220px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.5rem 0 4rem;
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -3rem;
  z-index: 100;
  padding: 0.8rem 1rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
}

.skip-link:focus {
  top: 1rem;
}

.hero {
  padding: 1rem 0 1.75rem;
}

.hero::after {
  content: "";
  display: block;
  height: 1px;
  margin-top: 1.5rem;
  background: linear-gradient(90deg, transparent, rgba(30, 86, 49, 0.35), transparent);
}

.hero-topbar,
.hero-grid,
.hero-actions,
.search-row,
.media-head,
.media-footer,
.leaderboard-entry,
.leaderboard-toolbar,
.leaderboard-filters,
.tabs,
.media-actions,
.modal-actions,
.modal-stats,
.comment-actions,
.comment-header {
  display: flex;
}

.hero-topbar,
.media-head,
.media-footer,
.leaderboard-entry,
.leaderboard-toolbar,
.comment-header,
.comment-actions {
  justify-content: space-between;
}

.hero-topbar,
.media-head,
.media-footer,
.hero-actions,
.leaderboard-entry,
.leaderboard-toolbar,
.leaderboard-filters,
.tabs,
.media-actions,
.modal-actions,
.modal-stats,
.comment-actions {
  align-items: center;
}

.hero-grid,
.search-panel,
.results-grid,
.modal-grid,
.comments-section {
  display: grid;
  gap: 1.2rem;
}

.hero-grid,
.search-panel {
  grid-template-columns: 1fr;
}

.hero-grid {
  margin-top: 1rem;
}

.eyebrow,
.section-kicker,
.media-type {
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
  color: var(--gold);
}

.hero h1,
.section-heading h2,
.hero-note h2,
.modal-content h2 {
  margin: 0.35rem 0 0;
  font-family: "Space Grotesk", sans-serif;
  line-height: 0.98;
}

.hero h1 {
  max-width: 11ch;
  font-size: clamp(3rem, 8vw, 5.5rem);
}

.hero-copy,
.hero-note li,
.status-row,
.media-meta,
.media-summary,
.empty-state,
.modal-summary,
.modal-meta,
.comment-meta,
.setup-card p {
  color: var(--muted);
  line-height: 1.6;
}

.hero-note,
.panel,
.media-card,
.details-modal .modal-shell,
.comment-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.hero-note,
.panel {
  padding: 1.2rem;
}

.hero-note {
  max-width: 540px;
  background:
    linear-gradient(145deg, rgba(46, 139, 87, 0.12), rgba(169, 223, 191, 0.24)),
    var(--panel);
}

.hero-note ul {
  margin: 0.9rem 0 0;
  padding-left: 1.1rem;
}

.hero-actions {
  gap: 0.7rem;
  flex-wrap: wrap;
}

.chip-list,
.media-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.pill,
.ghost-button,
.tab-button,
.filter-chip,
.primary-button,
.secondary-button,
.vote-button,
.chip,
.favorite-button,
.report-button {
  border-radius: 999px;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    opacity 180ms ease,
    border-color 180ms ease;
}

.pill,
.chip {
  padding: 0.65rem 1rem;
  background: rgba(242, 255, 246, 0.68);
  border: 1px solid var(--line);
}

.ghost-button,
.tab-button,
.filter-chip,
.primary-button,
.secondary-button,
.vote-button,
.favorite-button,
.report-button,
.chip {
  border: 1px solid transparent;
  cursor: pointer;
}

.ghost-button,
.tab-button,
.filter-chip,
.secondary-button,
.report-button {
  color: var(--muted);
}

.ghost-button {
  padding: 0.75rem 1rem;
  border-color: var(--line);
  background: rgba(242, 255, 246, 0.3);
}

.pill {
  color: var(--accent-strong);
  font-weight: 700;
}

.muted-pill {
  opacity: 0.8;
}

.app-shell {
  display: grid;
  gap: 1.3rem;
}

.spotlight {
  background:
    linear-gradient(135deg, rgba(169, 223, 191, 0.38), transparent 42%),
    radial-gradient(circle at top right, rgba(76, 175, 80, 0.18), transparent 28%),
    var(--panel);
}

.input-stack {
  display: grid;
  gap: 0.35rem;
}

.comment-form textarea,
.search-row input {
  width: 100%;
  min-width: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(30, 86, 49, 0.16);
  background: var(--panel-strong);
  color: var(--text);
  outline: none;
}

.comment-form textarea:focus,
.search-row input:focus {
  border-color: rgba(45, 102, 64, 0.46);
  box-shadow: 0 0 0 4px rgba(45, 102, 64, 0.12);
}

.tabs {
  gap: 0.55rem;
  padding: 0.45rem;
  width: fit-content;
  border-radius: 999px;
  background: rgba(18, 44, 25, 0.08);
}

.tab-button,
.filter-chip,
.secondary-button {
  padding: 0.8rem 1.15rem;
  font-weight: 700;
  background: transparent;
}

.tab-button.active,
.filter-chip.active,
.primary-button,
.vote-button,
.favorite-button.is-active,
.secondary-button.active {
  background: var(--accent);
  color: #f8f5ea;
  box-shadow: var(--shadow-soft);
}

.tab-button:hover,
.filter-chip:hover,
.ghost-button:hover,
.primary-button:hover,
.vote-button:hover:not(:disabled),
.secondary-button:hover,
.favorite-button:hover,
.report-button:hover,
.chip:hover:not(.is-empty) {
  transform: translateY(-1px);
}

.primary-button,
.vote-button {
  padding: 0.95rem 1.2rem;
  background: linear-gradient(135deg, #228b22, #2e8b57);
}

.secondary-button {
  border-color: var(--line);
  background: rgba(242, 255, 246, 0.42);
}

.tab-view {
  display: none;
}

.tab-view.active {
  display: block;
}

.search-controls {
  display: grid;
  gap: 0.9rem;
}

.search-row,
.media-actions,
.modal-actions,
.leaderboard-filters,
.modal-stats {
  gap: 0.75rem;
}

.leaderboard-filters {
  flex-wrap: wrap;
}

.search-field {
  position: relative;
  flex: 1;
}

.search-row input {
  min-height: 3.5rem;
  border-radius: 999px;
  padding-inline: 1.25rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.suggestions-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 0.35rem;
  padding: 0.65rem;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: var(--panel-strong);
  box-shadow: var(--shadow-soft);
}

.suggestions-panel.hidden,
.hidden {
  display: none;
}

.suggestion-item {
  width: 100%;
  padding: 0.8rem 0.9rem;
  text-align: left;
  border-radius: 14px;
  border: 0;
  background: transparent;
  color: var(--text);
}

.suggestion-item:hover {
  background: var(--accent-soft);
}

.suggestion-meta {
  display: block;
  color: var(--muted);
  font-size: 0.86rem;
}

.setup-card {
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: rgba(242, 255, 246, 0.52);
}

.setup-link {
  width: fit-content;
  text-decoration: none;
}

.results-section {
  margin-top: 1.35rem;
}

.results-grid {
  grid-template-columns: repeat(auto-fit, minmax(235px, 1fr));
  margin-top: 1rem;
}

.media-card {
  overflow: hidden;
  background: var(--panel-strong);
  border-color: rgba(30, 86, 49, 0.12);
}

.media-image-wrap {
  position: relative;
  aspect-ratio: 3 / 4;
  background:
    linear-gradient(135deg, rgba(30, 86, 49, 0.22), rgba(76, 175, 80, 0.18)),
    var(--panel-muted);
}

.media-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-button {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  padding: 0.55rem 0.85rem;
  background: rgba(30, 86, 49, 0.76);
  color: #fff;
}

.media-content {
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
}

.media-score {
  color: var(--accent-strong);
  font-weight: 700;
  font-family: "Space Grotesk", sans-serif;
}

.media-title,
.leaderboard-title {
  margin: 0;
  font-size: 1.08rem;
}

.media-tags {
  gap: 0.45rem;
}

.tag {
  padding: 0.24rem 0.58rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(169, 223, 191, 0.34);
  color: var(--muted);
  font-size: 0.8rem;
}

.media-summary {
  min-height: 3.3rem;
  margin: 0;
  font-size: 0.93rem;
}

.vote-count,
.leaderboard-votes,
.leaderboard-rank {
  font-family: "Space Grotesk", sans-serif;
  font-weight: 700;
}

.vote-button {
  padding: 0.78rem 1rem;
}

.vote-button:disabled {
  background: #8ca891;
  color: #f1f1e8;
  cursor: not-allowed;
  opacity: 0.92;
}

.leaderboard-filters {
  flex-wrap: wrap;
  margin: 1rem 0;
}

.leaderboard-toolbar {
  gap: 1rem;
  align-items: center;
  margin: 1rem 0;
}

.leaderboard-list {
  display: grid;
  gap: 0.9rem;
  min-height: 29rem;
  align-content: start;
}

.leaderboard-entry {
  gap: 0.9rem;
  padding: 0.95rem;
  border-radius: var(--radius-md);
  background:
    linear-gradient(135deg, rgba(169, 223, 191, 0.78), rgba(255, 255, 255, 0.12)),
    linear-gradient(180deg, rgba(46, 139, 87, 0.08), transparent);
}

.leaderboard-entry.is-highlighted {
  outline: 3px solid rgba(34, 139, 34, 0.35);
  transform: translateY(-2px);
}

.leaderboard-rank {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #228b22, #2e8b57);
  color: #fff;
}

.leaderboard-meta {
  display: grid;
  gap: 0.22rem;
}

.empty-state {
  padding: 1.25rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.28);
}

.rankings-link {
  text-decoration: none;
  white-space: nowrap;
}

.skeleton-card {
  overflow: hidden;
}

.skeleton-block,
.skeleton-line,
.skeleton-pill {
  position: relative;
  overflow: hidden;
  background: rgba(140, 160, 145, 0.18);
}

.skeleton-block::after,
.skeleton-line::after,
.skeleton-pill::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  animation: shimmer 1.2s infinite;
}

.skeleton-block {
  aspect-ratio: 3 / 4;
}

.skeleton-content {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.skeleton-line {
  height: 0.9rem;
  border-radius: 999px;
}

.skeleton-line.short {
  width: 42%;
}

.skeleton-line.medium {
  width: 68%;
}

.skeleton-pill {
  width: 35%;
  height: 2.2rem;
  border-radius: 999px;
}

.details-modal {
  width: min(980px, calc(100% - 1.5rem));
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
}

.details-modal::backdrop {
  background: rgba(6, 10, 8, 0.65);
}

.modal-shell {
  padding: 1rem;
}

.modal-close {
  margin-left: auto;
  display: inline-flex;
  padding: 0.65rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(242, 255, 246, 0.45);
  color: var(--muted);
}

.modal-grid {
  grid-template-columns: minmax(240px, 0.6fr) minmax(0, 1fr);
  margin-top: 0.9rem;
}

.modal-image-wrap {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--panel-muted);
}

.modal-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-content {
  display: grid;
  gap: 0.85rem;
  align-content: start;
}

.modal-stats {
  flex-wrap: wrap;
}

.modal-stat {
  padding: 0.55rem 0.8rem;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.24);
  color: var(--muted);
  font-size: 0.88rem;
}

.modal-meta,
.modal-summary {
  margin: 0;
}

.section-heading-compact h2 {
  font-size: 1.25rem;
}

.comments-list {
  display: grid;
  gap: 0.85rem;
}

.comment-form textarea {
  resize: vertical;
  min-height: 7rem;
}

.comment-actions {
  gap: 0.75rem;
}

.comment-card {
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.24);
  border: 1px solid var(--line);
}

.comment-card strong {
  display: block;
}

.comment-header {
  align-items: flex-start;
  gap: 0.75rem;
}

.comment-body {
  margin: 0.45rem 0 0;
}

.report-button {
  padding: 0.45rem 0.8rem;
  border-color: var(--line);
  background: transparent;
}

.report-button:hover {
  background: var(--accent-soft);
}

.toast-region {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 60;
  display: grid;
  gap: 0.65rem;
}

.toast {
  min-width: 240px;
  max-width: 320px;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--panel-strong);
  box-shadow: var(--shadow-soft);
}

.toast.is-error,
.status-row.is-error {
  color: var(--danger);
}

.chip.is-empty {
  cursor: default;
  opacity: 0.75;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 980px) {
  .hero-grid,
  .search-panel,
  .modal-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .page-shell {
    width: min(100% - 1rem, 100%);
  }

  .hero-topbar,
  .search-row,
  .media-footer,
  .leaderboard-toolbar,
  .media-actions,
  .modal-actions,
  .comment-actions,
  .comment-header {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-actions {
    width: 100%;
    justify-content: space-between;
  }

  .hero h1 {
    font-size: clamp(2.5rem, 13vw, 4rem);
  }

  .vote-button,
  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
