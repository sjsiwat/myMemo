import { Nav } from "@/components/landing/nav";
import { DemoIndex } from "@/components/landing/demo-index";
import { Capabilities } from "@/components/landing/capabilities";
import { Process } from "@/components/landing/process";
import { PointOfView } from "@/components/landing/pov";
import { Testimonial } from "@/components/landing/testimonial";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function About() {
  useDocumentTitle("Memo+ — About");

  return (
    <main>
      <Nav />
      <DemoIndex />
      <Capabilities />
      <Process />
      <PointOfView />
      <Testimonial />
      <FinalCta />
      <Footer />
    </main>
  );
}
