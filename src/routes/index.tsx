import { createFileRoute } from "@tanstack/react-router";
import { VideoHero } from "@/components/VideoHero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Living Culture Health — Africa's Heritage Marketplace" },
      {
        name: "description",
        content:
          "Buy African foods, baking, traditional medicinals and art direct from heritage makers. Sellers get their own store with two simple plans.",
      },
      {
        property: "og:title",
        content: "Living Culture Health — Africa's Heritage Marketplace",
      },
      {
        property: "og:description",
        content:
          "Buy African foods, baking, traditional medicinals and art direct from heritage makers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const categories = [
  { name: "Foods", copy: "Grains, spices, sauces and staples from every region." },
  { name: "Baking", copy: "Heritage breads, flours and sweet traditions." },
  { name: "Medicinals", copy: "Roots, barks and herbal remedies, traditionally prepared." },
  { name: "Art", copy: "Carvings, canvases, beadwork and textiles." },
];

function Index() {
  return (
    <main className="min-h-screen bg-background font-sans">
      <VideoHero />

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <h2 className="font-display text-5xl uppercase tracking-tight text-foreground sm:text-6xl">
          Four worlds, one market
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <article
              key={c.name}
              className="group rounded-xl border border-border bg-card p-6 transition-transform hover:-translate-y-1"
            >
              <span className="font-display text-3xl uppercase text-primary">{c.name}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
