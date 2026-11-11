import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Style = "clean" | "dynamic" | "motion";

// Drop the rendered sample in public/samples/<style>.mp4 and set the path here.
// null = show the animated mock of that style.
const SAMPLES: Record<Style, string | null> = {
  clean: "/samples/clean.mp4",
  dynamic: "/samples/dynamic.mp4",
  motion: "/samples/motion.mp4",
};

const STYLES: { id: Style; name: string; what: string }[] = [
  {
    id: "clean",
    name: "Clean",
    what: "Your face fills the frame. Soft zoom on the words that matter, captions timed to your voice, low music. Nothing in the way.",
  },
  {
    id: "dynamic",
    name: "Dynamic",
    what: "The screen splits when there is something to show: a chart with real numbers, a photo that lands on the word. Back to you when you talk.",
  },
  {
    id: "motion",
    name: "Motion",
    what: "Every idea turns into a drawn animation in your channel's colors: numbers counting, lines falling, bars racing. You sit in a window that grows when you speak to camera.",
  },
];

const LINE = ["Most", "people", "quit", "right", "before", "it", "starts", "to", "work."];
const KEY = new Set([6, 7, 8]);

function useWordClock(count: number) {
  const [n, setN] = useState(count);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    const id = window.setInterval(() => setN((v) => (v >= count + 4 ? 0 : v + 1)), 320);
    return () => window.clearInterval(id);
  }, [count]);
  return Math.min(n, count);
}

function Caption({ shown, pill }: { shown: number; pill?: boolean }) {
  return (
    <p className={pill ? "cap cap-pill" : "cap"} aria-hidden="true">
      {LINE.map((w, i) => (
        <span key={i} className={`${i < shown ? "on" : ""} ${KEY.has(i) ? "key" : ""}`}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

function Mock({ style }: { style: Style }) {
  const shown = useWordClock(LINE.length);
  if (style === "clean")
    return (
      <div className="mock mock-clean">
        <div className="face" />
        <Caption shown={shown} />
      </div>
    );
  if (style === "dynamic")
    return (
      <div className="mock mock-dynamic">
        <div className="panel">
          {[38, 52, 61, 70, 22].map((h, i) => (
            <i key={i} style={{ height: `${shown > i + 3 ? h : 6}%` }} />
          ))}
        </div>
        <div className="face" />
        <Caption shown={shown} pill />
      </div>
    );
  return (
    <div className="mock mock-motion">
      <div className="count">Day {Math.round((Math.min(shown, 7) / 7) * 90)}</div>
      <div className="count-label">when it starts to work</div>
      <div className="face face-window" />
      <Caption shown={shown} pill />
    </div>
  );
}

function Phone() {
  const [style, setStyle] = useState<Style>("clean");
  const src = SAMPLES[style];
  return (
    <div className="demo">
      <div className="phone">
        {src ? (
          <video key={src} src={src} autoPlay muted loop playsInline className="phone-video" />
        ) : (
          <Mock key={style} style={style} />
        )}
      </div>
      <div className="switch" role="tablist" aria-label="Edit style">
        {STYLES.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={style === s.id}
            className={style === s.id ? "is-on" : ""}
            onClick={() => setStyle(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="switch-note">Same clip, same cuts. Only the edit changes.</p>
      <p className="credit">
        Sample cut from{" "}
        <a href="https://youtu.be/CjzWwfc3QDk" target="_blank" rel="noopener noreferrer">
          Reggie Bryant's video
        </a>{" "}
        (CC BY). He is not a client.
      </p>
    </div>
  );
}

function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const channel = String(f.get("channel") || "").trim();
    const note = String(f.get("message") || "").trim();
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: f.get("name"),
          reply_to: f.get("email"),
          // Channel goes inside the message so the existing EmailJS template keeps working.
          message: `Channel: ${channel}\n\n${note || "(no message)"}`,
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
        <p>I'll watch your channel and reply by email with the first moment I'd cut.</p>
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
      <label className="wide">
        Your YouTube channel
        <input name="channel" type="url" placeholder="https://youtube.com/@yourchannel" required />
      </label>
      <label className="wide">
        Anything I should know (optional)
        <textarea
          name="message"
          rows={4}
          placeholder="Which video you'd start with, the style you liked, deadlines…"
        />
      </label>
      <button className="btn wide" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Request the $75 test"}
      </button>
      {state === "error" && (
        <p className="form-error wide" role="alert">
          The request didn't go through. Email me at{" "}
          <a href="mailto:henrique.dobscha@gmail.com">henrique.dobscha@gmail.com</a> instead.
        </p>
      )}
    </form>
  );
}

function Index() {
  return (
    <div className="site">
      <header className="top">
        <a href="/" className="logo">
          Dobs<span>Design</span>
        </a>
        <nav>
          <a href="#styles">Styles</a>
          <a href="#process">Process</a>
          <a href="#price">Price</a>
          <a href="#start" className="btn btn-small">
            Start the test
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Your long videos, cut into shorts people watch to the end.</h1>
            <p className="lede">
              Send me one long video. I cut it into 30–45 second shorts with your face, your words and
              captions that land on every word. The first one comes in three edit styles so you can pick yours.
            </p>
            <div className="hero-cta">
              <a href="#start" className="btn">
                Get 5 shorts for $75
              </a>
              <a href="#styles" className="link">
                See the three styles
              </a>
            </div>
          </div>
          <Phone />
        </section>

        <section id="styles" className="block">
          <h2>Three ways to edit the same 40 seconds</h2>
          <div className="styles">
            {STYLES.map((s) => (
              <article key={s.id} className={`style style-${s.id}`}>
                <h3>{s.name}</h3>
                <p>{s.what}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="block rules">
          <h2>What I won't do to your video</h2>
          <ul>
            <li>
              <strong>Cut you mid-sentence.</strong> Cuts happen between full sentences, in the silence. Your
              pauses after a strong line stay.
            </li>
            <li>
              <strong>Cover your face.</strong> Charts and images sit below your mouth or beside you, never on
              top.
            </li>
            <li>
              <strong>Make up numbers.</strong> Every figure on screen comes from a public source, and I send you
              the link.
            </li>
            <li>
              <strong>Bury you in memes.</strong> Serious niche, serious edit. Sound effects and memes only if
              your channel is built on humor.
            </li>
            <li>
              <strong>Drown your voice.</strong> Music sits low and dips further every time you talk.
            </li>
          </ul>
        </section>

        <section id="process" className="block">
          <h2>How the test works</h2>
          <ol className="steps">
            <li>
              <h3>You send a link</h3>
              <p>Your channel, or one long video you want cut. No files, no brief.</p>
            </li>
            <li>
              <h3>I find the moments</h3>
              <p>I pick the parts your viewers already rewatch and build each short around the strongest line.</p>
            </li>
            <li>
              <h3>You pick a style</h3>
              <p>The first short arrives in Clean, Dynamic and Motion. Tell me which one feels like your channel.</p>
            </li>
            <li>
              <h3>You get five shorts</h3>
              <p>Ready to upload, with a title and description for each. Two rounds of changes included.</p>
            </li>
          </ol>
        </section>

        <section id="price" className="block price">
          <div>
            <h2>One test, one price</h2>
            <p>
              Five shorts from your existing videos for <strong>$75</strong>. If you like them, we set up a
              monthly batch that fits how often you post.
            </p>
          </div>
          <div className="ticket">
            <div className="ticket-price">$75</div>
            <ul className="ticket-what">
              <li>5 shorts, 30–45 s each</li>
              <li>First short in all 3 styles</li>
              <li>2 rounds of changes</li>
            </ul>
            <a href="#start" className="btn">
              Start the test
            </a>
          </div>
        </section>

        <section id="start" className="block start">
          <h2>Start with your channel</h2>
          <p className="lede">Send the link. I reply by email with the first moment I'd cut.</p>
          <Contact />
        </section>
      </main>

      <footer className="foot">
        <span>© {new Date().getFullYear()} DobsDesign</span>
        <a href="mailto:henrique.dobscha@gmail.com">henrique.dobscha@gmail.com</a>
      </footer>
    </div>
  );
}
