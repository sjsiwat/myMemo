import liff from "@line/liff";

const LIFF_ID = import.meta.env.VITE_LIFF_ID || "2010502491-uIBFxjTa";
const SESSION_KEY = "memo_liff_session";
const API_BASE = import.meta.env.VITE_API_BASE || "";

let isInitialized = false;
let initPromise = null;
let currentProfile = null;
let currentSession = null;

export const LiffAuth = {
  isInitialized() {
    return isInitialized;
  },

  getProfile() {
    return currentProfile;
  },

  getToken() {
    return currentSession?.token || null;
  },

  getUser() {
    return currentSession?.user || null;
  },

  isInClient() {
    try {
      return liff.isInClient();
    } catch {
      return false;
    }
  },

  async init() {
    // If already in progress, reuse the existing promise so we never call liff.init concurrently
    if (initPromise) {
      return initPromise;
    }

    if (isInitialized && currentSession?.token) {
      return { success: true, user: currentSession.user };
    }

    initPromise = (async () => {
      try {
        // 1. Try to restore cached session if still valid
        const cached = sessionStorage.getItem(SESSION_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.token && parsed.user) {
              currentSession = parsed;
              currentProfile = parsed.user;
            }
          } catch {}
        }

        // 2. Initialize LINE LIFF SDK (once)
        if (!isInitialized) {
          await liff.init({ liffId: LIFF_ID, withLoginStatus: true });
          isInitialized = true;
        }

        // 3. Handle Login
        if (!liff.isLoggedIn()) {
          if (liff.isInClient()) {
            console.warn("[LIFF] In client but not logged in");
          } else {
            const cleanRedirect = window.location.origin + window.location.pathname;
            return {
              success: false,
              needsLogin: true,
              login: () => liff.login({ redirectUri: cleanRedirect }),
            };
          }
        }

        // 4. Retrieve ID token and Access Token from LIFF SDK
        const idToken = liff.getIDToken();
        const accessToken = liff.getAccessToken();

        // If we already have a cached valid session, return it
        if (currentSession?.token && currentSession?.user) {
          return { success: true, user: currentSession.user };
        }

        if (!idToken && !accessToken) {
          if (!liff.isInClient()) {
            const cleanRedirect = window.location.origin + window.location.pathname;
            return {
              success: false,
              needsLogin: true,
              login: () => liff.login({ redirectUri: cleanRedirect }),
            };
          }
        }

        // 5. Get UI profile from LIFF
        try {
          currentProfile = await liff.getProfile();
        } catch (err) {
          console.warn("[LIFF] Could not get profile:", err);
        }

        // 6. Verify with backend & obtain secure session
        const authRes = await fetch(`${API_BASE}/api/liff/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, accessToken }),
        });

        if (!authRes.ok) {
          const errText = await authRes.text();
          throw new Error(`Backend auth failed (${authRes.status}): ${errText}`);
        }

        const authData = await authRes.json();
        currentSession = authData;
        currentProfile = authData.user;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(authData));

        return { success: true, user: authData.user };
      } catch (err) {
        console.error("[LIFF Init Error]", err);
        // If dev mode, fallback gracefully
        if (import.meta.env.DEV) {
          console.warn("[LIFF] Falling back to dev mode session");
          currentSession = {
            token: "dev_mock_token",
            user: {
              id: "00000000-0000-0000-0000-000000000001",
              lineUserId: "U_dev_fallback",
              displayName: "Developer",
              pictureUrl: null,
              plan: "pro",
            },
          };
          isInitialized = true;
          return { success: true, user: currentSession.user, devMode: true };
        }
        return { success: false, error: err.message };
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    currentSession = null;
    currentProfile = null;
    if (liff.isLoggedIn()) {
      liff.logout();
    }
    window.location.reload();
  },

  close() {
    if (liff.isInClient()) {
      liff.closeWindow();
    }
  },
};
