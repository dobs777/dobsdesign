import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import siteHtml from "../../public/site.html?raw";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Re-execute any <script> tags injected via dangerouslySetInnerHTML
    // (React does not run them on its own).
    const scripts = Array.from(root.querySelectorAll("script"));
    const replacements: { old: HTMLScriptElement; fresh: HTMLScriptElement }[] = [];
    scripts.forEach((old) => {
      const fresh = document.createElement("script");
      // copy attributes
      for (const attr of Array.from(old.attributes)) {
        fresh.setAttribute(attr.name, attr.value);
      }
      // Wrap inline scripts in an IIFE so re-mounts (StrictMode / route revisit)
      // don't clash with previously declared top-level const/let identifiers.
      const code = old.textContent || "";
      fresh.text = old.src ? "" : `(function(){\n${code}\n})();`;
      old.parentNode?.replaceChild(fresh, old);
      replacements.push({ old, fresh });
    });

    return () => {
      // Cleanup cursor classes / animation frames left behind on body
      document.body.classList.remove("hov");
    };
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: siteHtml }} />;
}
