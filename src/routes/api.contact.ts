import { createFileRoute } from "@tanstack/react-router";

interface ContactPayload {
  from_name?: string;
  reply_to?: string;
  business?: string;
  industry?: string;
  budget?: string;
  message?: string;
}

function sanitize(v: unknown, max = 2000): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max).trim();
}

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ContactPayload;
        try {
          body = (await request.json()) as ContactPayload;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const templateParams = {
          from_name: sanitize(body.from_name, 200),
          reply_to: sanitize(body.reply_to, 200),
          business: sanitize(body.business, 200),
          industry: sanitize(body.industry, 200),
          budget: sanitize(body.budget, 200),
          message: sanitize(body.message, 5000),
        };

        if (!templateParams.reply_to || !templateParams.message) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY; // optional

        if (!serviceId || !templateId || !publicKey) {
          console.error("Missing EmailJS env vars");
          return new Response(
            JSON.stringify({ error: "Server not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const emailjsBody: Record<string, unknown> = {
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: templateParams,
        };
        if (privateKey) emailjsBody.accessToken = privateKey;

        const res = await fetch(
          "https://api.emailjs.com/api/v1.0/email/send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // EmailJS REST checks Origin; using api.emailjs.com is fine when
              // accessToken (private key) is provided. If you don't pass a
              // private key, ensure your EmailJS account allows API calls
              // from non-browser sources.
              Origin: "https://api.emailjs.com",
            },
            body: JSON.stringify(emailjsBody),
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("EmailJS error", res.status, text);
          return new Response(
            JSON.stringify({ error: "Failed to send" }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
