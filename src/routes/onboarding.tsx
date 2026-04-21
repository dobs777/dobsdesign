import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { toast, Toaster } from "sonner";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_ONBOARDING_TEMPLATE_ID,  // <-- Trocado
  EMAILJS_PUBLIC_KEY,
} from "@/lib/emailjs-config";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Website Onboarding — DobsDesign" },
      {
        name: "description",
        content:
          "Tell us about your business and project so we can craft the perfect website.",
      },
      { property: "og:title", content: "Website Onboarding — DobsDesign" },
      {
        property: "og:description",
        content:
          "Share your vision and let our team design a website that converts.",
      },
    ],
  }),
  component: OnboardingPage,
});

type Field = {
  id: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "url";
  placeholder?: string;
  required?: boolean;
  hint?: string;
};

type Section = { title: string; description: string; fields: Field[] };

const SECTIONS: Section[] = [
  {
    title: "Your Business",
    description: "Let's start with the basics.",
    fields: [
      { id: "business_name", label: "Name of Your Business", required: true },
      { id: "owner_name", label: "Company Owner Name", required: true },
      { id: "personal_email", label: "Personal Email", type: "email", required: true },
      { id: "personal_number", label: "Personal Number", type: "tel" },
      { id: "business_email", label: "Business Email — For Customers", type: "email" },
      { id: "business_number", label: "Business Number — For Customers", type: "tel" },
    ],
  },
  {
    title: "Your Story",
    description: "Help us understand who you are and why you're different.",
    fields: [
      { id: "about_business", label: "Tell us about your company and your history", type: "textarea", required: true, hint: "In as many sentences as you like, describe your business." },
      { id: "why_choose", label: "Why should someone choose you?", type: "textarea", hint: "Price / Quality / Care / Local / Honest / 5★ Reviews / Guarantees…" },
      { id: "special_sauce", label: "Your brand's special sauce", type: "textarea", hint: "What makes your company special / unique?" },
    ],
  },
  {
    title: "Services & Offers",
    description: "What do you do, and what makes it irresistible?",
    fields: [
      { id: "services", label: "What services do you offer?", type: "textarea", required: true },
      { id: "special_offers", label: "Special Offers", type: "textarea", hint: "Discounts, credit / finance options? Please elaborate." },
      { id: "trust_badges", label: "Trust badges to include", type: "textarea", hint: "List as many as you can — we'll find the graphics." },
      { id: "features_benefits", label: "Features and benefits", type: "textarea", hint: "Give visitors a reason to choose you." },
      { id: "customer_journey", label: "Your customer journey", type: "textarea", hint: "e.g. Call or form → Inspection → Estimate → Build" },
      { id: "working_areas", label: "Preferred working areas / locations", type: "textarea", hint: "Up to 20." },
    ],
  },
  {
    title: "Brand & Vision",
    description: "Tell us how you want to be seen.",
    fields: [
      { id: "key_messages", label: "Key messages", type: "textarea", hint: "Your vision, your views, your saying. What's your key message?" },
      { id: "company_history", label: "History of the company", type: "textarea", hint: "2–3 sentences. Feel free to include dates." },
      { id: "competitors", label: "Key competitors", type: "textarea", hint: "Please list a few." },
      { id: "owners_vision", label: "Owners / partners & their vision", type: "textarea" },
    ],
  },
  {
    title: "Assets & Website",
    description: "Last details to bring it all together.",
    fields: [
      { id: "owner_images_link", label: "Link to images of each owner / partner", type: "url", hint: "Drive / Dropbox / WeTransfer link." },
      { id: "banner_image_link", label: "Link to website banner picture", type: "url" },
      { id: "faqs", label: "FAQs", type: "textarea", hint: "Frequent questions and your answers." },
      { id: "website_address", label: "Current website address", type: "url" },
      { id: "website_login", label: "Website admin login details", type: "textarea" },
      { id: "additional_login", label: "Additional login info / hosting provider (optional)", type: "textarea" },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

// ── Custom cursor (matches main site) ──
function useCustomCursor() {
  useEffect(() => {
    const cx = document.getElementById("ob-cx") as HTMLDivElement | null;
    const cr = document.getElementById("ob-cr") as HTMLDivElement | null;
    if (!cx || !cr) return;
    let mx = -200, my = -200, rx = -200, ry = -200, raf = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      cx.style.left = mx + "px"; cx.style.top = my + "px";
    };
    const loop = () => {
      rx += (mx - rx) * 0.36; ry += (my - ry) * 0.36;
      cr.style.left = rx + "px"; cr.style.top = ry + "px";
      raf = requestAnimationFrame(loop);
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    const hoverEls = document.querySelectorAll(
      "a,button,input,select,textarea,[role=button]",
    );
    const onEnter = () => document.body.classList.add("ob-hov");
    const onLeave = () => document.body.classList.remove("ob-hov");
    hoverEls.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      hoverEls.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      document.body.classList.remove("ob-hov");
    };
  }, []);
}

// ── WebGL shader background (same look as homepage) ──
function useShaderBg(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const sh = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`;
    const fs = `precision mediump float;
      uniform vec2 r;uniform float t;uniform vec2 m;
      void main(){
        vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
        vec2 mo=(m-.5*r)/min(r.x,r.y);
        float d=length(uv-mo*.4);
        float g=exp(-d*1.4);
        vec3 blue=vec3(.18,.37,1.0);
        vec3 gold=vec3(.91,.72,.42);
        vec3 col=mix(blue,gold,smoothstep(.0,1.2,d+sin(t*.0004)*.15));
        col*=g*1.1;
        col+=.02*sin(t*.001+uv.y*8.0);
        gl_FragColor=vec4(col,1.0);
      }`;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(vs, gl.VERTEX_SHADER));
    gl.attachShader(prog, sh(fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const rLoc = gl.getUniformLocation(prog, "r");
    const tLoc = gl.getUniformLocation(prog, "t");
    const mLoc = gl.getUniformLocation(prog, "m");

    let tmx = innerWidth / 2, tmy = innerHeight / 2;
    let smx = tmx, smy = tmy;
    const onMove = (e: MouseEvent) => {
      tmx = e.clientX;
      tmy = innerHeight - e.clientY;
    };
    document.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const frame = (ts: number) => {
      smx += (tmx - smx) * 0.05;
      smy += (tmy - smy) * 0.05;
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.uniform1f(tLoc, ts);
      gl.uniform2f(mLoc, smx * dpr, smy * dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}

function OnboardingPage() {
  const initial = Object.fromEntries(ALL_FIELDS.map((f) => [f.id, ""]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCustomCursor();
  useShaderBg(canvasRef);

  const update = (id: string, v: string) =>
    setValues((p) => ({ ...p, [id]: v }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    // Validação usando o template do onboarding
    if (
      EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
      EMAILJS_ONBOARDING_TEMPLATE_ID === "YOUR_ONBOARDING_TEMPLATE_ID" ||
      EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"
    ) {
      toast.error("EmailJS is not configured yet. Set VITE_EMAILJS_* env vars on Vercel.");
      return;
    }
    setSubmitting(true);
    try {
      const summary = ALL_FIELDS.map((f) => {
        const v = values[f.id]?.trim();
        return v ? `${f.label}:\n${v}\n` : null;
      }).filter(Boolean).join("\n");
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_ONBOARDING_TEMPLATE_ID,  // <-- Trocado
        {
          ...values,
          from_name: values.owner_name,
          reply_to: values.personal_email,
          subject: `New Website Onboarding — ${values.business_name || "New client"}`,
          summary,
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      );
      setDone(true);
      toast.success("Submission sent! We'll be in touch soon.");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again or email us.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ob-root">
      <style>{OB_STYLES}</style>
      <Toaster richColors position="top-center" />

      {/* Custom cursor */}
      <div id="ob-cx" />
      <div id="ob-cr" />

      {/* Shader bg */}
      <canvas ref={canvasRef} id="ob-sc" />

      {/* Top bar — matches main site */}
      <nav className="ob-navbar">
        <Link to="/" className="ob-logo">
          <svg className="ob-logo-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="34" height="34" rx="4" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            <path d="M8 6 L8 30 L19 30 C26.18 30 31 24.627 31 18 C31 11.373 26.18 6 19 6 Z" fill="none" stroke="url(#ob-lg1)" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 11 Q20 8 29 11" stroke="rgba(201,146,58,0.4)" strokeWidth=".75" fill="none"/>
            <path d="M8 18 Q21 14 31 18" stroke="rgba(201,146,58,0.55)" strokeWidth=".75" fill="none"/>
            <path d="M8 25 Q20 24 29 25" stroke="rgba(201,146,58,0.35)" strokeWidth=".75" fill="none"/>
            <line x1="8" y1="6" x2="8" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
            <defs>
              <linearGradient id="ob-lg1" x1="8" y1="6" x2="31" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5b82ff"/>
                <stop offset="100%" stopColor="#e8b86d"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="ob-logo-text">Dobs<span>Design</span></span>
        </Link>

        <ul className="ob-nav-links">
          <li><a href="/#services">Services</a></li>
          <li><a href="/#industries">Industries</a></li>
          <li><a href="/#process">Process</a></li>
          <li><a href="/#pricing">Pricing</a></li>
          <li><a href="/#contact">Contact</a></li>
          <li><Link to="/onboarding" className="ob-nav-active">Onboarding</Link></li>
        </ul>
        <a className="ob-nav-cta" href="/">Go Back</a>
      </nav>

      {/* Hero */}
      <section className="ob-hero">
        <span className="ob-tag">— Onboarding Form —</span>
        <h1 className="ob-h1">
          Tell us about <em>your project</em>
        </h1>
        <p className="ob-sub">
          The more you share, the better we'll tailor your website. Takes about
          8–12 minutes — and you only need to do it once.
        </p>
      </section>

      {done ? (
        <section className="ob-wrap">
          <div className="ob-done">
            <div className="ob-done-ico">✓</div>
            <h2>Thank you!</h2>
            <p>
              Your onboarding details are on their way to our team. We'll
              respond within 24 hours.
            </p>
            <Link to="/" className="ob-btn ob-btn-p">Back to homepage</Link>
          </div>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="ob-wrap">
          {SECTIONS.map((section, sIdx) => (
            <fieldset key={section.title} className="ob-card">
              <div className="ob-step">
                <span className="ob-step-num">{sIdx + 1}</span>
                <span className="ob-step-label">
                  Step {sIdx + 1} of {SECTIONS.length}
                </span>
              </div>
              <h2 className="ob-card-title">{section.title}</h2>
              <p className="ob-card-desc">{section.description}</p>

              <div className="ob-grid">
                {section.fields.map((f) => {
                  const isWide = f.type === "textarea";
                  return (
                    <div key={f.id} className={isWide ? "ob-full" : ""}>
                      <label htmlFor={f.id} className="ob-label">
                        {f.label}
                        {f.required && <span className="ob-req">*</span>}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          id={f.id}
                          name={f.id}
                          required={f.required}
                          rows={4}
                          maxLength={5000}
                          value={values[f.id]}
                          onChange={(e) => update(f.id, e.target.value)}
                          placeholder={f.placeholder}
                          className="ob-input"
                        />
                      ) : (
                        <input
                          id={f.id}
                          name={f.id}
                          type={f.type ?? "text"}
                          required={f.required}
                          maxLength={500}
                          value={values[f.id]}
                          onChange={(e) => update(f.id, e.target.value)}
                          placeholder={f.placeholder}
                          className="ob-input"
                        />
                      )}
                      {f.hint && <p className="ob-hint">{f.hint}</p>}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="ob-submit">
            <button type="submit" disabled={submitting} className="ob-btn ob-btn-p">
              {submitting ? "Sending…" : "Submit Onboarding →"}
            </button>
            <p className="ob-fineprint">
              We respect your privacy. Your info is sent directly to our team.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

const OB_STYLES = `
.ob-root {
  --ink:   #06090f;
  --paper: #edf2fa;
  --blue:  #2f5fff;
  --blue2: #5b82ff;
  --gold:  #c9923a;
  --gold2: #e8b86d;
  --muted: #7a84a0;
  --edge:  rgba(255,255,255,0.07);
  --edge2: rgba(47,95,255,0.22);
  background: var(--ink);
  color: var(--paper);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-weight: 300;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  cursor: none;
}
.ob-root *, .ob-root *::before, .ob-root *::after { box-sizing: border-box; }
.ob-root a, .ob-root button, .ob-root input, .ob-root select, .ob-root textarea {
  cursor: none !important;
}

/* Cursor */
#ob-cx {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--gold2);
  position: fixed; top: 0; left: 0;
  pointer-events: none; z-index: 9999;
  transform: translate(-50%, -50%);
  transition: transform .1s;
}
#ob-cr {
  width: 30px; height: 30px; border-radius: 50%;
  border: 1px solid rgba(201,146,58,.5);
  position: fixed; top: 0; left: 0;
  pointer-events: none; z-index: 9998;
  transform: translate(-50%, -50%);
  transition: width .25s, height .25s, border-color .25s, background .25s;
}
body.ob-hov #ob-cr {
  width: 48px; height: 48px;
  background: rgba(47,95,255,.07);
  border-color: rgba(47,95,255,.45);
}
@media (hover: none), (pointer: coarse) {
  .ob-root { cursor: auto; }
  .ob-root a, .ob-root button, .ob-root input, .ob-root select, .ob-root textarea { cursor: auto !important; }
  #ob-cx, #ob-cr { display: none; }
}

/* Shader bg */
#ob-sc {
  position: fixed; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 0; opacity: .55;
}

/* Navbar — matches main site EXACTLY */
.ob-navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 22px 52px;
  background: rgba(6,9,15,.72);
  backdrop-filter: blur(28px);
  border-bottom: 1px solid var(--edge);
}
.ob-logo {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: inherit; overflow: visible;
  justify-self: start;
}
.ob-logo-mark { width: 36px; height: 36px; flex-shrink: 0; display: block; }
.ob-logo-text {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500; font-size: 18px; letter-spacing: -.2px;
  color: var(--paper); line-height: 1;
  display: flex; align-items: center;
}
.ob-logo-text span { color: var(--gold2); }
.ob-nav-links {
  display: flex; gap: 36px; list-style: none; padding: 0; margin: 0;
  justify-self: center;
}
.ob-nav-links a {
  color: var(--muted); text-decoration: none;
  font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
  font-weight: 500;
  transition: color .2s;
}
.ob-nav-links a:hover { color: var(--gold2); }
.ob-nav-active { color: var(--gold2) !important; }
.ob-nav-cta {
  justify-self: end;
  width: 172px;
  box-sizing: border-box;
  text-align: center;
  padding: 10px 24px;
  background: transparent; color: var(--gold2) !important;
  border: 1px solid rgba(201,146,58,.4);
  text-decoration: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  border-radius: 2px;
  transition: all .25s;
}
.ob-nav-cta:hover {
  background: var(--gold);
  color: #fff !important;
  border-color: var(--gold);
}
@media (max-width: 880px) {
  .ob-nav-links { display: none; }
  .ob-navbar { padding: 18px 22px; grid-template-columns: auto auto; }
  .ob-nav-cta { width: 132px; }
}

/* Hero */
.ob-hero {
  position: relative; z-index: 1;
  text-align: center;
  padding: 160px 24px 60px;
  max-width: 780px; margin: 0 auto;
}
.ob-tag {
  display: inline-block;
  font-size: 10px; letter-spacing: .28em; text-transform: uppercase;
  color: var(--gold2); margin-bottom: 28px;
}
.ob-h1 {
  font-family: 'DM Sans', sans-serif; font-weight: 500;
  font-size: clamp(40px, 6.5vw, 76px);
  line-height: 1.12; letter-spacing: -.5px;
  margin-bottom: 24px;
}
.ob-h1 em {
  font-style: normal;
  display: inline-block;
  padding: .05em 6px .18em; margin: 0 -6px;
  background: linear-gradient(110deg, var(--blue2) 0%, var(--gold2) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.ob-sub {
  font-size: 16px; line-height: 1.85; color: var(--muted);
  max-width: 520px; margin: 0 auto;
}

/* Form wrap */
.ob-wrap {
  position: relative; z-index: 1;
  max-width: 880px; margin: 0 auto;
  padding: 20px 24px 100px;
  display: flex; flex-direction: column; gap: 28px;
}

/* Card */
.ob-card {
  border: 1px solid var(--edge);
  background: rgba(13,18,28,.55);
  backdrop-filter: blur(14px);
  padding: 36px;
  border-radius: 4px;
  position: relative;
}
.ob-card::before {
  content: ''; position: absolute; inset: 0;
  border-radius: 4px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(91,130,255,.25), rgba(232,184,109,.18) 60%, transparent);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none;
}

/* Step badge — properly centered */
.ob-step {
  display: inline-flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.ob-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue), var(--gold));
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
  padding: 0;
  flex-shrink: 0;
}
.ob-step-label {
  font-size: 10px; letter-spacing: .24em; text-transform: uppercase;
  color: var(--gold2); font-weight: 500;
}

.ob-card-title {
  font-family: 'DM Sans', sans-serif; font-weight: 500;
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1.18; letter-spacing: -.3px;
}
.ob-card-desc {
  margin-top: 6px;
  font-size: 15px; color: rgba(237,242,250,.78); line-height: 1.7;
}

/* Grid */
.ob-grid {
  margin-top: 26px;
  display: grid; gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.ob-full { grid-column: 1 / -1; }
@media (max-width: 640px) {
  .ob-grid { grid-template-columns: 1fr; }
  .ob-card { padding: 24px; }
  .ob-nav { padding: 18px 22px; }
  .ob-hero { padding: 70px 20px 40px; }
}

.ob-label {
  display: block; margin-bottom: 8px;
  font-size: 12px; font-weight: 500;
  letter-spacing: .04em;
  color: var(--paper);
}
.ob-req { color: var(--gold2); margin-left: 4px; }

.ob-input {
  width: 100%;
  background: rgba(6,9,15,.65);
  color: var(--paper);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 2px;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px; font-weight: 300;
  outline: none;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.ob-input::placeholder { color: rgba(122,132,160,.6); }
.ob-input:hover { border-color: rgba(91,130,255,.3); }
.ob-input:focus {
  border-color: var(--gold2);
  background: rgba(6,9,15,.85);
  box-shadow: 0 0 0 3px rgba(232,184,109,.12);
}
textarea.ob-input { resize: vertical; min-height: 110px; line-height: 1.6; }
.ob-hint {
  margin-top: 6px;
  font-size: 12px; color: rgba(237,242,250,.62); line-height: 1.55;
}

/* Submit */
.ob-submit {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding-top: 8px;
}
.ob-btn {
  display: inline-block;
  padding: 16px 48px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600; font-size: 13px;
  letter-spacing: .08em; text-transform: uppercase;
  text-decoration: none; border: none;
  border-radius: 2px;
  transition: all .25s;
}
.ob-btn-p {
  background: var(--blue); color: #fff;
}
.ob-btn-p:hover:not(:disabled) {
  background: var(--blue2);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -12px rgba(47,95,255,.6);
}
.ob-btn:disabled { opacity: .55; }
.ob-fineprint {
  font-size: 11px; color: var(--muted);
  letter-spacing: .04em; text-align: center;
}

/* Done state */
.ob-done {
  text-align: center;
  border: 1px solid var(--edge);
  background: rgba(13,18,28,.55);
  backdrop-filter: blur(14px);
  padding: 60px 40px;
  border-radius: 4px;
}
.ob-done-ico {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue), var(--gold));
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 700;
  margin-bottom: 20px;
}
.ob-done h2 {
  font-family: 'DM Sans', sans-serif; font-weight: 500;
  font-size: 32px; letter-spacing: -.3px;
  margin-bottom: 10px;
}
.ob-done p {
  color: var(--muted); font-size: 15px; line-height: 1.7;
  max-width: 420px; margin: 0 auto 28px;
}
`;