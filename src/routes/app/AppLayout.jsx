import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthBootstrap } from "@/lib/useAuthBootstrap";
import { useStore } from "@/lib/store";
import { AuthGate } from "@/components/shared/AuthGate";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { Toast } from "@/components/shared/Toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function AppLayout() {
  const auth = useAuthBootstrap();
  const theme = useStore((s) => s.theme);

  // Signed out, no page renders under the Outlet, so name the gate itself.
  useDocumentTitle(auth.authed ? null : "Memo+ — เข้าสู่ระบบ");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // If a LIFF deep link inadvertently resolved to desktop app routes, route back to /liff
  useEffect(() => {
    const search = window.location.search;
    if (search.includes("liff.state") || search.includes("liff=")) {
      const cleanPath = window.location.pathname.replace(/^\/liff/, "");
      window.location.replace(`/liff${cleanPath}${window.location.search}`);
    }
  }, []);

  if (!auth.authReady) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (!auth.authed) {
    return (
      <>
        <AuthGate auth={auth} />
        <Toast />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar auth={auth} />
        <main className="min-w-0 flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
