import { normalizeEmail, sendToN8n } from "./_survey";

export async function onRequestPost(context) {
  const form = await context.request.formData();

  const reason_code = String(form.get("reason_code") || "");
  const reason_label = String(form.get("reason_label") || "");

  const free_text = String(form.get("free_text") || "").trim().slice(0, 1000);
  const email = normalizeEmail(form.get("email"));

  const payload = {
    timestamp_utc: new Date().toISOString(),
    event_id: crypto.randomUUID(),
    email,
    reason_code,
    reason_label,
    free_text,
    campaign: String(form.get("campaign") || ""),
    source: String(form.get("source") || ""),
    sent_at: String(form.get("sent_at") || ""),
    user_agent: context.request.headers.get("user-agent") || "",
  };

  // Log async (keeps redirect fast)
  const p = sendToN8n(payload, context.env);
  if (typeof context.waitUntil === "function") context.waitUntil(p);
  else await p;

  const redirectTo =
    reason_code === "busy_forgot"
      ? (context.env.SCHEDULING_URL || "/")
      : (context.env.THANK_YOU_URL || "/");

  return Response.redirect(redirectTo, 303);
}
