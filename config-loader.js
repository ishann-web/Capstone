import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const authLaunchButton = document.querySelector("#auth-launch-button");

if (authLaunchButton) {
  authLaunchButton.addEventListener("click", () => {
    window.location.href = "./account.html";
  });
}

let authStarted = false;

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
    setSignedOutState();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  initializeTopbarAuth(supabase).catch((error) => {
    console.error(error);
    setSignedOutState();
  });
}

async function initializeTopbarAuth(supabase) {
  const { data } = await supabase.auth.getSession();
  applySession(data.session);

  supabase.auth.onAuthStateChange((_, session) => {
    applySession(session);
  });
}

function applySession(session) {
  const user = session?.user || null;
  if (!user) {
    setSignedOutState();
    return;
  }

  const username = user.user_metadata?.username || user.email?.split("@")[0] || "Account";
  if (authLaunchButton) {
    authLaunchButton.textContent = username;
  }

  window.MEDIA_AUTH_STATE = {
    signedIn: true,
    email: user.email || "",
    username,
  };
}

function setSignedOutState() {
  if (authLaunchButton) {
    authLaunchButton.textContent = "Sign in";
  }

  window.MEDIA_AUTH_STATE = {
    signedIn: false,
    email: "",
    username: "",
  };
}
