import { useEffect, useRef, useState } from "react";

import { Auth } from "@/lib/auth";
import { db } from "@/lib/supabaseClient";
import { ROW_MAPPERS, Storage } from "@/lib/storage";
import { defaultAppState, setLocalMutationListener, useStore } from "@/lib/store";
import { useToastStore } from "@/lib/toastStore";
import { normalizeStatus } from "@/lib/constants";

// Guard against onSignedIn firing twice for the same user — Auth.init()'s
// synchronous session check and the async SIGNED_IN event can both fire for
// the same login.
let syncedUserId = null;

function normalizeTask(t) {
  return {
    ...t,
    description: t.description ?? "",
    labels: Array.isArray(t.labels) ? t.labels : [],
    target_value: t.target_value ?? null,
    target_unit: t.target_unit ?? "",
    progress_value: t.progress_value ?? 0,
    status: normalizeStatus(t.status),
  };
}

function withTaskDefaults(state) {
  return {
    ...state,
    tasks: (state.tasks || []).map(normalizeTask),
    notes: state.notes || [],
    expenses: state.expenses || [],
  };
}

function getSnapshot() {
  const s = useStore.getState();
  return {
    theme: s.theme,
    tasks: s.tasks,
    notes: s.notes,
    expenses: s.expenses,
    logs: s.logs,
  };
}

export function useAuthBootstrap() {
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [lineInfo, setLineInfo] = useState(null);
  const [gateError, setGateError] = useState(null);
  const [initialGateTab, setInitialGateTab] = useState("login");

  const authedRef = useRef(authed);
  const uidRef = useRef(null);
  const syncingRef = useRef(false);
  authedRef.current = authed;

  const showToast = useToastStore((s) => s.showToast);
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const setAll = useStore((s) => s.setAll);
  const setAllFromSync = useStore((s) => s.setAllFromSync);
  const setHydrated = useStore((s) => s.setHydrated);

  function clearToLoggedOut() {
    Storage.setAuthHint(false);
    Storage.clearLocal();
    uidRef.current = null;
    const theme = useStore.getState().theme || "light";
    setAll({ ...defaultAppState, theme });
    setAuthed(false);
    setUser(null);
    setLineInfo(null);
  }

  async function syncWithCloud(uid, { showToastOnLoad = false } = {}) {
    if (!uid || syncingRef.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSyncStatus("offline");
      return;
    }

    syncingRef.current = true;
    try {
      // 1. Flush any queued offline creates/edits/deletes first
      await Storage.flushOutbox(uid);

      // 2. Pull latest cloud state and merge with any remaining pending outbox ops
      if (showToastOnLoad) setSyncStatus("loading");
      const merged = await Storage.pullAndMerge(uid, useStore.getState());

      if (merged && uidRef.current === uid) {
        const current = useStore.getState();
        const nextState = withTaskDefaults({
          theme: current.theme,
          logs: current.logs,
          tasks: merged.tasks,
          notes: merged.notes,
          expenses: merged.expenses,
        });
        setAllFromSync(nextState);
        Storage.saveSnapshot(nextState, true);

        if (showToastOnLoad) {
          showToast(
            nextState.tasks.length > 0
              ? `โหลดข้อมูลจาก cloud (${nextState.tasks.length} งาน)`
              : "เชื่อมต่อแล้ว ✓",
            "success"
          );
        }
      }

      const st = useStore.getState().syncStatus;
      if (Storage.getOutbox().length === 0 && (st === "loading" || st === "offline")) {
        setSyncStatus("idle");
      }
    } finally {
      syncingRef.current = false;
    }
  }

  async function onSignedIn(signedInUser) {
    if (syncedUserId === signedInUser.id) return;
    syncedUserId = signedInUser.id;
    uidRef.current = signedInUser.id;
    Storage.setAuthHint(true);

    setAuthed(true);
    setUser(signedInUser);

    const info = await Auth.fetchLineInfo();
    setLineInfo(info);

    await syncWithCloud(signedInUser.id, { showToastOnLoad: true });
  }

  useEffect(() => {
    // ── Query-param handling: ?auth_error= (from LINE callback) and
    // ?auth=signup (from site/'s Sign Up CTA) ──
    const params = new URLSearchParams(location.search);
    const authErr = params.get("auth_error");
    if (authErr) {
      history.replaceState(null, "", location.pathname + location.hash);
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${authErr}`, "error");
    }
    if (params.get("auth") === "signup") {
      history.replaceState(null, "", location.pathname + location.hash);
      setInitialGateTab("signup");
    }

    // ── Synchronous local hydration, gated on the auth hint ──
    const usedCachedLocal = Storage.hasAuthHint();
    const initial = withTaskDefaults(
      usedCachedLocal ? Storage.loadLocal(defaultAppState) : defaultAppState
    );
    setAll(initial);
    setHydrated(true);

    // ── Async session check ──
    (async () => {
      const sessionUser = await Auth.init();
      setUser(sessionUser);
      if (sessionUser) {
        uidRef.current = sessionUser.id;
        setAuthed(true);
        await onSignedIn(sessionUser);
      } else {
        if (usedCachedLocal) clearToLoggedOut();
        setAuthed(false);
      }
      setAuthReady(true);
    })();

    const { data: sub } = Auth.onChange((event, changedUser) => {
      setUser(changedUser);
      if (event === "SIGNED_IN" && changedUser) onSignedIn(changedUser);
      if (event === "SIGNED_OUT") {
        syncedUserId = null;
        clearToLoggedOut();
        showToast("ออกจากระบบแล้ว");
      }
    });

    Storage.onSyncChange((status, message) => {
      setSyncStatus(status, message);
      if (status === "synced") {
        setTimeout(() => {
          if (useStore.getState().syncStatus === "synced") setSyncStatus("idle");
        }, 3000);
      }
      if (status === "error") {
        showToast(
          message ? `sync error: ${message}` : "บันทึกไม่สำเร็จ — เปิด Console (F12) ดู [storage] error",
          "error"
        );
      }
    });

    // ── Auto-sync when connectivity returns or tab becomes visible ──
    const handleOnline = () => {
      if (authedRef.current && uidRef.current) {
        syncWithCloud(uidRef.current);
      } else {
        setSyncStatus("idle");
      }
    };
    const handleOffline = () => setSyncStatus("offline");
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false &&
        authedRef.current &&
        uidRef.current
      ) {
        syncWithCloud(uidRef.current);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSyncStatus("offline");
    }

    return () => {
      sub.subscription.unsubscribe();
      Storage.onSyncChange(null);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Outbox & local snapshot hook: ONLY local mutations enqueue to Outbox.
  // Remote sync / Realtime updates use setAllFromSync & applyRemote*, so they
  // never echo back into the Outbox. ──
  useEffect(() => {
    setLocalMutationListener((event) => {
      if (!useStore.getState().hydrated) return;
      if (!authedRef.current || !uidRef.current) return;

      Storage.saveSnapshot(getSnapshot(), true);

      if (event.op === "upsert") {
        Storage.enqueueUpsert(event.table, event.item, true, uidRef.current);
      } else if (event.op === "delete") {
        Storage.enqueueDelete(event.table, event.id, true, uidRef.current);
      }
    });

    return () => setLocalMutationListener(null);
  }, []);

  // ── Supabase Realtime live sync (StrictMode-safe lifecycle) ──
  useEffect(() => {
    const uid = authed ? user?.id : null;
    if (!uid) return;

    const handleRealtimeEvent = (table, payload) => {
      if (uidRef.current !== uid) return;
      const store = useStore.getState();

      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const mapper = ROW_MAPPERS[table];
        if (!mapper || !payload.new) return;
        let item = mapper(payload.new);
        if (table === "tasks") item = normalizeTask(item);

        // Do not let stale remote events clobber a newer pending local mutation
        const pending = Storage.getPendingOp(table, item.id);
        if (pending?.op === "delete") return;
        if (pending?.op === "upsert" && pending.updatedAt >= item.updatedAt) return;

        store.applyRemoteUpsert(table, item);
        Storage.saveSnapshot(getSnapshot(), true);
      } else if (payload.eventType === "DELETE") {
        const deletedId = payload.old?.id;
        if (!deletedId) return;

        const pending = Storage.getPendingOp(table, deletedId);
        if (pending?.op === "upsert") return;

        store.applyRemoteDelete(table, deletedId);
        Storage.saveSnapshot(getSnapshot(), true);
      }
    };

    const channel = db
      .channel(`memo-sync-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${uid}` },
        (payload) => handleRealtimeEvent("tasks", payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${uid}` },
        (payload) => handleRealtimeEvent("notes", payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${uid}` },
        (payload) => handleRealtimeEvent("expenses", payload)
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [authed, user?.id]);

  return {
    authReady,
    authed,
    user,
    lineInfo,
    gateError,
    clearGateError: () => setGateError(null),
    signInWithLine: () => Auth.signInWithLine(),
    async signInWithPassword(email, password) {
      setGateError(null);
      try {
        await Auth.signInWithPassword(email, password);
      } catch (err) {
        setGateError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
        throw err;
      }
    },
    async signUp(email, password) {
      setGateError(null);
      try {
        const data = await Auth.signUp(email, password);
        if (!data.session) {
          showToast("สมัครสมาชิกสำเร็จ — โปรดยืนยันอีเมลก่อนเข้าสู่ระบบ", "success");
        }
      } catch (err) {
        setGateError(err.message || "สมัครสมาชิกไม่สำเร็จ");
        throw err;
      }
    },
    async signOut() {
      await Auth.signOut();
    },
    initialGateTab,
  };
}
