import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/landing/footer";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function Home() {
  useDocumentTitle("Memo+ — A private workspace, built for one person.");

  return (
    <main>
      <Nav />
      <Hero />
      <Footer />
    </main>
  );
}
