import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { Pillars } from "@/components/landing/Pillars";
import { TelemetryDemo } from "@/components/landing/TelemetryDemo";
import { Benchmarks } from "@/components/landing/Benchmarks";
import { QuickStart } from "@/components/landing/QuickStart";
import { SiteFooter } from "@/components/landing/SiteFooter";

const title = "NeuroStream-X — Zero-Copy MLSys Streaming Framework";
const description =
  "Zero-copy, memory-mapped streaming framework for local foundation model fine-tuning and high-density MLSys execution.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <TrustBar />
        <Pillars />
        <TelemetryDemo />
        <Benchmarks />
        <QuickStart />
      </main>
      <SiteFooter />
    </>
  );
}
