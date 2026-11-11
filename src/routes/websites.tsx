import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/websites")({
  head: () => ({
    meta: [
      { title: "DobsDesign | Websites for local businesses" },
      {
        name: "description",
        content: "A fast one-page website built around your Google reviews. Free preview first, live in 7 days, $500 flat.",
      },
      { property: "og:title", content: "DobsDesign | Websites for local businesses" },
      {
        property: "og:description",
        content: "A fast one-page website built around your Google reviews. Free preview first, live in 7 days, $500 flat.",
      },
    ],
  }),
  component: Websites,
});

const EMAIL = "henrique.dobscha@gmail.com";

type Sample = "dentist" | "plumber" | "salon";

// Fictional businesses: the page says so under the phone.
const SAMPLES: Record<
  Sample,
  { tab: string; name: string; line: string; color: string; rating: string; reviews: string; cta: string; quotes: string[] }
> = {
  dentist: {
    tab: "Dentist",
    name: "Bayview Family Dental",
    line: "Gentle, trusted dental care for the whole family.",
    color: "#0e7490",
    rating: "4.9",
    reviews: "612",
    cta: "Book an appointment",
    quotes: ["Explained everything and it didn't hurt one bit.", "My kids actually like going here now."],
  },
  plumber: {
    tab: "Plumber",
    name: "Riverside Plumbing Co.",
    line: "Fast, honest plumbing. Same-day service.",
    color: "#0c4a6e",
    rating: "4.8",
    reviews: "1,204",
    cta: "Call now",
    quotes: ["Showed up within an hour on a Sunday.", "Fair price, told me what I didn't need."],
  },
  salon: {
    tab: "Hair salon",
    name: "Maple Street Salon",
    line: "Color, cuts and blowouts by people who listen.",
    color: "#9d174d",
    rating: "4.9",
    reviews: "438",
    cta: "Book now",
    quotes: ["Best color I've had in years.", "They actually listened to what I wanted."],
  },
};

function Phone() {
  const [id, setId] = useState<Sample>("dentist");
  const s = SAMPLES[id];
  return (
    <div className="demo">
      <div className="phone">
        <div className="ws-mock" style={{ ["--biz" as string]: s.color }}>
          <div className="ws-hero">
            <span className="ws-badge">
              <b>★ {s.rating}</b> · {s.reviews} Google reviews
            </span>
            <strong className="ws-name">{s.name}</strong>
            <span className="ws-line">{s.line}</span>
            <span className="ws-cta">{s.cta}</span>
          </div>
          <div className="ws-body">
            <span className="ws-h">What customers say</span>
            {s.quotes.map((q) => (
              <span key={q} className="ws-quote">
                <i>★★★★★</i>
                {q}
              </span>
            ))}
            <span className="ws-h">Hours &amp; directions</span>
            <span className="ws-map" />
          </div>
          <span className="ws-sticky">{s.cta}</span>
        </div>
      </div>
      <div className="switch" role="tablist" aria-label="Sample website">
        {(Object.keys(SAMPLES) as Sample[]).map((k) => (
          <button key={k} role="tab" aria-selected={id === k} className={id === k ? "is-on" : ""} onClick={() => setId(k)}>
            {SAMPLES[k].tab}
          </button>
        ))}
      </div>
      <p className="credit">Sample designs. Fictional businesses.</p>
    </div>
  );
}

function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const field = (k: string) => String(f.get(k) || "").trim();
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: f.get("name"),
          reply_to: f.get("email"),
          // Everything goes inside the message so the existing EmailJS template keeps working.
          message: `[Website request]\nBusiness: ${field("business")}\nLink: ${field("link")}\n\n${field("message") || "(no message)"}`,
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <div className="form-done" role="status">
        <h3>Request sent.</h3>
        <p>I'll build your free preview and email you the link, usually within 2 business days.</p>
      </div>
    );

  return (
    <form className="form" onSubmit={send}>
      <label>
        Your name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Business name
        <input name="business" autoComplete="organization" required />
      </label>
      <label>
        Google Maps or current website link
        <input name="link" type="url" placeholder="https://maps.app.goo.gl/…" />
      </label>
      <label className="wide">
        Anything I should know (optional)
        <textarea name="message" rows={4} placeholder="What you want people to do on the site: call, book, get a quote…" />
      </label>
      <button className="btn wide" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Get my free preview"}
      </button>
      {state === "error" && (
        <p className="form-error wide" role="alert">
          The request didn't go through. Email me at <a href={`mailto:${EMAIL}`}>{EMAIL}</a> instead.
        </p>
      )}
    </form>
  );
}

function Websites() {
  return (
    <div className="site">
      <header className="top">
        <a href="/" className="logo">
          Dobs<span>Design</span>
        </a>
        <nav>
          <a href="#included">What's included</a>
          <a href="#process">Process</a>
          <a href="#price">Price</a>
          <a href="#start" className="btn btn-small">
            Free preview
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Your Google reviews, turned into a website that gets calls.</h1>
            <p className="lede">
              You already did the hard part: hundreds of five-star reviews. I build a fast one-page site around them,
              made for phones, with one big button to call or book. You see a free preview before you pay anything.
            </p>
            <div className="hero-cta">
              <a href="#start" className="btn">
                Get a free preview
              </a>
              <a href="#price" className="link">
                $500 flat, live in 7 days
              </a>
            </div>
          </div>
          <Phone />
        </section>

        <section id="included" className="block rules">
          <h2>What your site comes with</h2>
          <ul>
            <li>
              <strong>Built for phones first.</strong> Most people find you on their phone. The site loads fast and
              reads well there.
            </li>
            <li>
              <strong>One clear button.</strong> Call, book or get a quote, always on screen. No hunting for your
              number.
            </li>
            <li>
              <strong>Your real reviews and photos.</strong> The best ones from your Google profile, with a link to
              all of them.
            </li>
            <li>
              <strong>Hours, map and directions.</strong> The three things people look for before they visit.
            </li>
            <li>
              <strong>Secure and on your own domain.</strong> https included. If you don't have a domain yet, I help you
              get one.
            </li>
            <li>
              <strong>Ready for Google.</strong> Proper titles and descriptions, and the site linked to your Google
              Business profile.
            </li>
          </ul>
        </section>

        <section id="process" className="block">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              <h3>You send a link</h3>
              <p>Your Google Maps listing or your current site. That's all I need to start.</p>
            </li>
            <li>
              <h3>I build a free preview</h3>
              <p>With your real photos, reviews and hours. You see exactly what you'd get.</p>
            </li>
            <li>
              <h3>You ask for changes</h3>
              <p>Text, colors, photos, the main button. Two rounds of changes included.</p>
            </li>
            <li>
              <h3>It goes live</h3>
              <p>On your domain within 7 days. You own the site and its files.</p>
            </li>
          </ol>
        </section>

        <section id="price" className="block price">
          <div>
            <h2>One site, one price</h2>
            <p>
              <strong>$500</strong> one time: half to start, half when the site is live. Paid by invoice, with card or
              PayPal. If you want me to keep it running, hosting and small edits are <strong>$29 a month</strong>. Cancel
              anytime.
            </p>
          </div>
          <div className="ticket">
            <div className="ticket-price">$500</div>
            <ul className="ticket-what">
              <li>Free preview first</li>
              <li>Live in 7 days</li>
              <li>2 rounds of changes</li>
              <li>You own the site</li>
            </ul>
            <a href="#start" className="btn">
              Get a free preview
            </a>
          </div>
        </section>

        <section id="start" className="block start">
          <h2>See your site before you decide</h2>
          <p className="lede">Send your business link. I reply by email with a preview built from your real reviews.</p>
          <Contact />
        </section>
      </main>

      <footer className="foot">
        <span>© {new Date().getFullYear()} DobsDesign</span>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </footer>
    </div>
  );
}
