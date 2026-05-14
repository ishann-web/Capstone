import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const authStatus = document.querySelector("#auth-status");
const capBanner = document.querySelector("#cap-banner");
const signedOutPanel = document.querySelector("#auth-signed-out");
const signedInPanel = document.querySelector("#auth-signed-in");
const authViewButtons = document.querySelectorAll("[data-auth-view]");
const authViews = document.querySelectorAll("[data-auth-panel]");
const recoveryPanel = document.querySelector("#password-recovery-panel");
const signInEmail = document.querySelector("#signin-email");
const signInPassword = document.querySelector("#signin-password");
const signUpEmail = document.querySelector("#signup-email");
const signUpUsername = document.querySelector("#signup-username");
const signUpPassword = document.querySelector("#signup-password");
const signUpPasswordConfirm = document.querySelector("#signup-password-confirm");
const resetEmail = document.querySelector("#reset-email");
const recoveryPassword = document.querySelector("#recovery-password");
const recoveryPasswordConfirm = document.querySelector("#recovery-password-confirm");
const authAvatar = document.querySelector("#auth-avatar");
const authUsernameDisplay = document.querySelector("#auth-username-display");
const authEmailDisplay = document.querySelector("#auth-email-display");
const signInForm = document.querySelector("#signin-form");
const signUpForm = document.querySelector("#signup-form");
const resetForm = document.querySelector("#reset-form");
const recoveryForm = document.querySelector("#recovery-form");
const signOutButton = document.querySelector("#signout-button");
const goHomeButton = document.querySelector("#go-home-button");
const themeToggle = document.querySelector("#account-theme-toggle");
const strengthFill = document.querySelector("#password-strength-fill");
const strengthText = document.querySelector("#password-strength-text");
const signInButton = document.querySelector("#signin-button");
const signUpButton = document.querySelector("#signup-button");
const resetRequestButton = document.querySelector("#reset-request-button");
const recoveryButton = document.querySelector("#recovery-button");

let supabase = null;
let authStarted = false;

authViewButtons.forEach((button) => {
  button.addEventListener("click", () => activateAuthView(button.dataset.authView));
});

signInForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleSignIn();
});

signUpForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleSignUp();
});

resetForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleResetRequest();
});

recoveryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleRecoveryUpdate();
});

signOutButton?.addEventListener("click", handleSignOut);
goHomeButton?.addEventListener("click", () => {
  window.location.href = "./index.html";
});

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
});

signUpPassword?.addEventListener("input", () => {
  renderPasswordStrength(signUpPassword.value);
});

window.addEventListener("media-config-ready", startAuth, { once: true });

function startAuth() {
  if (authStarted) {
    return;
  }

  authStarted = true;
  const appConfig = window.APP_CONFIG || {};
  const supabaseUrl = (appConfig.supabase?.url || "").replace(/\/+$/, "");
  const supabaseAnonKey = (appConfig.supabase?.anonKey || "").trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    setAuthStatus(
      "Account auth needs your free Supabase URL and anon key in config.js or config.local.js.",
      true
    );
    return;
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  initializeAuth().catch((error) => {
    console.error(error);
    setAuthStatus("Auth setup failed. Check your Supabase configuration.", true);
  });
}

async function initializeAuth() {
  applyTheme(localStorage.getItem("mediaTheme") || "light");
  activateAuthView("signin");
  await hydrateSignupCap();

  const { data } = await supabase.auth.getSession();
  applySession(data.session);

  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "recovery") {
    recoveryPanel.classList.add("active");
    setAuthStatus("Enter a new password to finish recovery.", false);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      recoveryPanel.classList.add("active");
      authViewButtons.forEach((button) => button.classList.remove("active"));
      setAuthStatus("Enter a new password to finish recovery.", false);
    }

    if (event === "SIGNED_IN") {
      setAuthStatus("Signed in successfully.", false);
    }

    if (event === "SIGNED_OUT") {
      setAuthStatus("Signed out.", false);
    }

    if (event === "USER_UPDATED") {
      setAuthStatus("Password updated.", false);
    }

    applySession(session);
  });
}

async function hydrateSignupCap() {
  const cap = await checkSignupAllowed();
  if (!capBanner) {
    return;
  }

  if (!cap.allowed) {
    capBanner.textContent = cap.message;
    capBanner.classList.remove("hidden");
    return;
  }

  if (cap.maxUsers && cap.userCount >= 0) {
    const remaining = cap.maxUsers - cap.userCount;
    if (remaining <= Math.max(1, Math.floor(cap.maxUsers * 0.1))) {
      capBanner.textContent = `Only ${remaining} signup spot${remaining === 1 ? "" : "s"} remaining.`;
      capBanner.classList.remove("hidden");
      capBanner.classList.add("warning");
    }
  }
}

async function checkSignupAllowed() {
  try {
    const [countRes, configRes] = await Promise.all([
      supabase.rpc("get_user_count"),
      supabase.from("site_config").select("value").eq("key", "max_users").maybeSingle(),
    ]);

    if (countRes.error || configRes.error || !configRes.data?.value) {
      return { allowed: true };
    }

    const userCount = countRes.data;
    const maxUsers = parseInt(configRes.data.value, 10);

    if (Number.isFinite(maxUsers) && userCount >= maxUsers) {
      return {
        allowed: false,
        message: "Signups are currently closed because the free user limit has been reached.",
      };
    }

    return { allowed: true, userCount, maxUsers };
  } catch (error) {
    console.error(error);
    return { allowed: true };
  }
}

function activateAuthView(view) {
  authViewButtons.forEach((button) =>
    button.classList.toggle("active", button.dataset.authView === view)
  );
  authViews.forEach((panel) =>
    panel.classList.toggle("active", panel.dataset.authPanel === view)
  );
  recoveryPanel.classList.remove("active");
}

function setAuthStatus(message, isError) {
  authStatus.textContent = message;
  authStatus.classList.toggle("is-error", Boolean(isError));
}

function applySession(session) {
  const user = session?.user || null;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";

  if (!user) {
    signedOutPanel.classList.remove("hidden");
    signedInPanel.classList.add("hidden");
    return;
  }

  signedOutPanel.classList.add("hidden");
  signedInPanel.classList.remove("hidden");
  authUsernameDisplay.textContent = username;
  authEmailDisplay.textContent = user.email || "";
  authAvatar.textContent = buildInitials(username);
}

async function handleSignIn() {
  const email = signInEmail.value.trim();
  const password = signInPassword.value;

  if (!email || !password) {
    setAuthStatus("Enter both email and password.", true);
    return;
  }

  await withButtonLoading(signInButton, "Signing in...", async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthStatus(error.message || "Sign-in failed.", true);
      return;
    }
    window.location.href = "./index.html";
  });
}

async function handleSignUp() {
  const email = signUpEmail.value.trim();
  const username = signUpUsername.value.trim();
  const password = signUpPassword.value;
  const confirmation = signUpPasswordConfirm.value;

  const cap = await checkSignupAllowed();
  if (!cap.allowed) {
    setAuthStatus(cap.message, true);
    return;
  }

  const usernameError = validateUsername(username);
  if (usernameError) {
    setAuthStatus(usernameError, true);
    return;
  }

  const passwordError = validatePassword(password, confirmation);
  if (passwordError) {
    setAuthStatus(passwordError, true);
    return;
  }

  await withButtonLoading(signUpButton, "Creating account...", async () => {
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (existingUsername) {
      setAuthStatus("That username is already taken. Please choose another.", true);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: { username },
      },
    });

    if (error) {
      setAuthStatus(error.message || "Sign-up failed.", true);
      return;
    }

    if (data.user?.id) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        username: username.toLowerCase(),
      });

      if (profileError) {
        setAuthStatus(profileError.message || "Profile setup failed.", true);
        return;
      }
    }

    setAuthStatus("Account created. Check your email and confirm your address.", false);
    activateAuthView("signin");
  });
}

async function handleResetRequest() {
  const email = resetEmail.value.trim();
  if (!email) {
    setAuthStatus("Enter your account email first.", true);
    return;
  }

  await withButtonLoading(resetRequestButton, "Sending email...", async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(true),
    });

    if (error) {
      setAuthStatus(error.message || "Password reset request failed.", true);
      return;
    }

    setAuthStatus("Reset email sent. Check your inbox for the secure reset link.", false);
  });
}

async function handleRecoveryUpdate() {
  const password = recoveryPassword.value;
  const confirmation = recoveryPasswordConfirm.value;
  const passwordError = validatePassword(password, confirmation);

  if (passwordError) {
    setAuthStatus(passwordError, true);
    return;
  }

  await withButtonLoading(recoveryButton, "Updating password...", async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setAuthStatus(error.message || "Password update failed.", true);
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState({}, "", url);
    recoveryPanel.classList.remove("active");
    setAuthStatus("Password updated. You can keep using your account.", false);
  });
}

async function handleSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    setAuthStatus(error.message || "Sign-out failed.", true);
  }
}

function validateUsername(username) {
  if (!username) {
    return "Enter a username.";
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return "Username must be 3-20 characters using letters, numbers, or underscores.";
  }

  return "";
}

function validatePassword(password, confirmation) {
  if (!password || !confirmation) {
    return "Enter and confirm your password.";
  }

  if (password !== confirmation) {
    return "Passwords do not match.";
  }

  if (password.length < 12) {
    return "Use at least 12 characters for better security.";
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^\w\s]/.test(password)) {
    return "Use uppercase, lowercase, a number, and a symbol in your password.";
  }

  return "";
}

function getRedirectUrl(isRecovery = false) {
  const url = new URL(window.location.href);
  if (isRecovery) {
    url.searchParams.set("auth", "recovery");
  } else {
    url.searchParams.delete("auth");
  }
  return url.toString();
}

function buildInitials(name) {
  return String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AU";
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  }
  localStorage.setItem("mediaTheme", theme);
}

function renderPasswordStrength(password) {
  if (!strengthFill || !strengthText) {
    return;
  }

  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\w\s]/.test(password)) score += 1;

  const width = [0, 25, 50, 75, 100][score];
  const labels = [
    "Password strength will appear here.",
    "Weak password.",
    "Fair password.",
    "Good password.",
    "Strong password.",
  ];

  strengthFill.style.width = `${width}%`;
  strengthText.textContent = labels[score];
}

async function withButtonLoading(button, loadingLabel, callback) {
  if (!button) {
    await callback();
    return;
  }

  const label = button.querySelector(".button-label") || button;
  const originalText = label.textContent;
  button.disabled = true;
  label.textContent = loadingLabel;

  try {
    await callback();
  } finally {
    button.disabled = false;
    label.textContent = originalText;
  }
}
