import { Link } from "@tanstack/react-router";
import heroPoster from "@/assets/hero-poster.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const frames = [
  { src: heroPoster, alt: "African market stall at golden hour", delay: "0s" },
  { src: hero2, alt: "Hands kneading traditional bread dough", delay: "-6s" },
  { src: hero3, alt: "African art, masks and medicinal herbs", delay: "-12s" },
];

const ticker = [
  "Jollof & spice blends",
  "Fresh-baked heritage breads",
  "Traditional medicinals",
  "Hand-carved art",
  "Beadwork & textiles",
  "Shea, baobab & moringa",
];

export function VideoHero() {
  return (
    <section className="relative isolate min-h-[92svh] w-full overflow-hidden bg-char">
      {/* Motion backdrop */}
      <div className="absolute inset-0 -z-10">
        {frames.map((f) => (
          <div
            key={f.src}
            className="hero-frame absolute inset-0 overflow-hidden opacity-0"
            style={{ animationDelay: f.delay }}
          >
            <img
              src={f.src}
              alt={f.alt}
              width={1920}
              height={1088}
              className="h-full w-full object-cover will-change-transform"
              style={{ animationDelay: f.delay }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-char via-char/60 to-char/30" />
        <div
          className="flicker absolute inset-0 mix-blend-soft-light"
          style={{ background: "var(--gradient-ember)" }}
        />
      </div>

      <div className="mx-auto flex min-h-[92svh] w-full max-w-7xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
        <span
          className="hero-rise inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-char/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-accent backdrop-blur-sm"
          style={{ animationDelay: "0.05s" }}
        >
          Africa's living-foods marketplace
        </span>

        <h1
          className="hero-rise mt-6 max-w-5xl font-display text-[clamp(3rem,13vw,10rem)] leading-[0.86] uppercase tracking-tight text-background"
          style={{ animationDelay: "0.15s" }}
        >
          Taste the
          <span
            className="block bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-ember)" }}
          >
            heritage
          </span>
        </h1>

        <p
          className="hero-rise mt-6 max-w-xl text-base leading-relaxed text-background/80 sm:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          Foods, baking, traditional medicinals and art — sold direct by African
          makers. Open your own store, upload your products and sell to the world.
        </p>

        <div
          className="hero-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "0.45s" }}
        >
          <Link
            to="/"
            className="rounded-full px-8 py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[var(--shadow-warm)] transition-transform hover:scale-105"
            style={{ backgroundImage: "var(--gradient-ember)" }}
          >
            Shop the market
          </Link>
          <Link
            to="/"
            className="rounded-full border border-background/40 px-8 py-4 text-sm font-bold uppercase tracking-widest text-background backdrop-blur-sm transition-colors hover:bg-background/10"
          >
            Start selling
          </Link>
        </div>

        <dl
          className="hero-rise mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-background/15 pt-6"
          style={{ animationDelay: "0.6s" }}
        >
          {[
            ["540+", "Heritage sellers"],
            ["12k", "Products listed"],
            ["38", "Countries served"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="font-display text-4xl text-accent sm:text-5xl">{v}</dt>
              <dd className="mt-1 text-[11px] uppercase tracking-widest text-background/60">
                {l}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Scrolling ticker */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden border-y border-background/15 bg-char/70 py-3 backdrop-blur-sm">
        <div className="ticker-track flex w-max gap-10 pr-10">
          {[...ticker, ...ticker].map((t, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.3em] text-background/70"
            >
              {t} <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
