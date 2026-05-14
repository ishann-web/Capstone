<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1E5631" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; media-src 'self' https: data:; upgrade-insecure-requests"
    />
    <meta
      http-equiv="Permissions-Policy"
      content="camera=(), microphone=(), geolocation=(), browsing-topics=()"
    />
    <title>Account | Media Voting</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Work+Sans:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./account.css" />
  </head>
  <body>
    <main class="account-shell">
      <div class="account-topbar">
        <a class="back-link" href="./index.html">Back to media voting</a>
        <button id="account-theme-toggle" class="secondary-button theme-toggle" type="button" aria-pressed="false">
          Dark mode
        </button>
      </div>

      <section class="account-layout">
        <aside class="account-aside">
          <p class="eyebrow">Forest access</p>
          <h1>Sign in or create your account.</h1>
          <p class="account-copy">
            This page uses the same free Supabase Auth flow as the rest of the site. No paid services required.
          </p>
          <div class="feature-list">
            <span>Free email/password auth</span>
            <span>Reset password by email</span>
            <span>Username saved in your profile</span>
          </div>
        </aside>

        <section class="account-card">
          <p id="auth-status" class="status-row">
            Use your email and password.
          </p>

          <div id="cap-banner" class="banner hidden"></div>

          <div id="auth-signed-out">
            <div class="account-switcher" role="tablist" aria-label="Account actions">
              <button class="switch-chip active" type="button" data-auth-view="signin">Sign in</button>
              <button class="switch-chip" type="button" data-auth-view="signup">Create account</button>
              <button class="switch-chip" type="button" data-auth-view="reset">Forgot password</button>
            </div>

            <div class="auth-view active" data-auth-panel="signin">
              <form class="auth-form" id="signin-form" novalidate>
                <label class="input-stack">
                  <span>Email</span>
                  <input id="signin-email" type="email" autocomplete="email" placeholder="you@example.com" />
                </label>
                <label class="input-stack">
                  <span>Password</span>
                  <input id="signin-password" type="password" autocomplete="current-password" placeholder="Your password" />
                </label>
                <button id="signin-button" class="primary-button" type="submit">
                  <span class="button-label">Sign in</span>
                </button>
              </form>
            </div>

            <div class="auth-view" data-auth-panel="signup">
              <form class="auth-form" id="signup-form" novalidate>
                <label class="input-stack">
                  <span>Username</span>
                  <input id="signup-username" type="text" maxlength="20" autocomplete="username" placeholder="cooluser42" />
                </label>
                <label class="input-stack">
                  <span>Email</span>
                  <input id="signup-email" type="email" autocomplete="email" placeholder="you@example.com" />
                </label>
                <label class="input-stack">
                  <span>Password</span>
                  <input id="signup-password" type="password" autocomplete="new-password" placeholder="At least 12 characters" />
                </label>
                <div class="strength-wrap" aria-live="polite">
                  <div class="strength-bar">
                    <span id="password-strength-fill" class="strength-fill"></span>
                  </div>
                  <p id="password-strength-text" class="helper-copy">Password strength will appear here.</p>
                </div>
                <label class="input-stack">
                  <span>Confirm password</span>
                  <input id="signup-password-confirm" type="password" autocomplete="new-password" placeholder="Repeat your password" />
                </label>
                <p class="helper-copy">
                  Use uppercase, lowercase, a number, and a symbol.
                </p>
                <button id="signup-button" class="primary-button" type="submit">
                  <span class="button-label">Create account</span>
                </button>
              </form>
            </div>

            <div class="auth-view" data-auth-panel="reset">
              <form class="auth-form" id="reset-form" novalidate>
                <label class="input-stack">
                  <span>Email</span>
                  <input id="reset-email" type="email" autocomplete="email" placeholder="you@example.com" />
                </label>
                <button id="reset-request-button" class="primary-button" type="submit">
                  <span class="button-label">Send reset email</span>
                </button>
              </form>
            </div>

            <div id="password-recovery-panel" class="auth-view">
              <form class="auth-form" id="recovery-form" novalidate>
                <label class="input-stack">
                  <span>New password</span>
                  <input id="recovery-password" type="password" autocomplete="new-password" placeholder="New password" />
                </label>
                <label class="input-stack">
                  <span>Confirm new password</span>
                  <input id="recovery-password-confirm" type="password" autocomplete="new-password" placeholder="Repeat new password" />
                </label>
                <button id="recovery-button" class="primary-button" type="submit">
                  <span class="button-label">Update password</span>
                </button>
              </form>
            </div>
          </div>

          <div id="auth-signed-in" class="signed-in-card hidden">
            <div class="profile-row">
              <div class="profile-avatar" id="auth-avatar">AU</div>
              <div>
                <strong id="auth-username-display">Signed in</strong>
                <p id="auth-email-display"></p>
              </div>
            </div>
            <div class="signed-in-actions">
              <button id="go-home-button" class="secondary-button" type="button">Go to homepage</button>
              <button id="signout-button" class="secondary-button" type="button">Sign out</button>
            </div>
          </div>
        </section>
      </section>
    </main>

    <script src="./config.js"></script>
    <script src="./config-loader.js"></script>
    <script type="module" src="./account.js"></script>
  </body>
</html>
