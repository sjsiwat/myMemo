import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/landing/footer";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function Home() {
  useDocumentTitle("Memo+ — A private workspace, built for one person.");
  const navigate = useNavigate();

  // Supabase's own redirect_to allow-list matching sometimes drops our
  // /dashboard path and lands the magic-link callback on "/" instead — hand
  // off to the app ourselves rather than depending on Supabase getting that
  // exactly right. Also covers a returning user with an existing session
  // landing back on the marketing page. Dynamic import keeps the Supabase
  // client out of the landing page's main chunk (see the note in App.jsx).
  useEffect(() => {
    if (location.hash.includes("access_token")) {
      navigate(`/dashboard${location.hash}`, { replace: true });
      return;
    }
    import("@/lib/supabaseClient").then(({ db }) => {
      db.auth.getSession().then(({ data }) => {
        if (data.session) navigate("/dashboard", { replace: true });
      });
    });
  }, [navigate]);

  return (
    <main>
      <Nav />
      <Hero />
      <Footer />
    </main>
  );
}
