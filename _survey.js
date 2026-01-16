export function normalizeEmail(raw) {
  let email = String(raw || "").trim();
  // '+' can be decoded as space by some systems; restore if it looks like an email
  if (email.includes(" ") && email.includes("@")) email = email.replaceAll(" ", "+");
  return email.toLowerCase();
}

export function readTrackingParams(url) {
  const sp = url.searchParams;
  return {
    email: normalizeEmail(sp.get("email") || sp.get("e") || ""),
    campaign: sp.get("campaign") || "ai_verification_survey",
    source: sp.get("source") || "apollo",
    sent_at: sp.get("sent_at") || sp.get("sentAt") || "",
  };
}

export async function sendToN8n(payload, env) {
  if (!env.WEBHOOK_URL) return;

  const headers = { "content-type": "application/json" };
  if (env.WEBHOOK_SECRET) headers["x-webhook-secret"] = env.WEBHOOK_SECRET;

  const res = await fetch(env.WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) console.log("n8n webhook failed", res.status);
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderLandingPage(tracking) {
  const t = {
    email: esc(tracking.email),
    campaign: esc(tracking.campaign),
    source: esc(tracking.source),
    sent_at: esc(tracking.sent_at),
  };

  const oneClickReasons = [
    { code: "busy_forgot", label: "Got busy/forgot", btn: "Got busy/forgot \u2192 Let's schedule!" },
    { code: "timing_not_right", label: "The timing isn't right", btn: "The timing isn't right" },
    { code: "lack_info", label: "Lack of information about the process/service", btn: "Lack of information about the process/service" },
    { code: "no_longer_interested", label: "Changed my mind / no longer interested", btn: "Changed my mind / no longer interested" },
  ];

  const oneClickForms = oneClickReasons.map(r => `
    <form method="POST" action="/r" class="answer-form">
      <input type="hidden" name="reason_code" value="${esc(r.code)}" />
      <input type="hidden" name="reason_label" value="${esc(r.label)}" />

      <input type="hidden" name="email" value="${t.email}" />
      <input type="hidden" name="campaign" value="${t.campaign}" />
      <input type="hidden" name="source" value="${t.source}" />
      <input type="hidden" name="sent_at" value="${t.sent_at}" />

      <button type="submit" class="answer-btn">${esc(r.btn)}</button>
    </form>
  `).join("\n");

  const somethingElseBlock = `
    <details class="other-details">
      <summary class="answer-btn other-summary">Something else</summary>
      <div class="other-panel">
        <form method="POST" action="/r" class="other-form">
          <input type="hidden" name="reason_code" value="something_else" />
          <input type="hidden" name="reason_label" value="Something else" />

          <input type="hidden" name="email" value="${t.email}" />
          <input type="hidden" name="campaign" value="${t.campaign}" />
          <input type="hidden" name="source" value="${t.source}" />
          <input type="hidden" name="sent_at" value="${t.sent_at}" />

          <label class="other-label" for="free_text">Optional: tell us why</label>
          <textarea
            id="free_text"
            name="free_text"
            class="other-textarea"
            maxlength="1000"
            placeholder="Type a short note (optional)"
          ></textarea>

          <button type="submit" class="answer-btn other-submit">Submit response</button>
        </form>
      </div>
    </details>
  `;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <title>Quick check-in</title>
  <style>
    :root { --btn:#4f80ff; --bg:#f2f3f5; --card:#ffffff; --text:#111827; --muted:#6b7280; --purple:#7c3aed; --border:#e5e7eb; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 48px 16px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      background: var(--bg); color: var(--text);
    }
    .wrap { max-width: 760px; margin: 0 auto; }
    .card {
      background: var(--card);
      border-radius: 18px;
      box-shadow: 0 14px 40px rgba(0,0,0,0.10);
      padding: 38px 26px;
      text-align: center;
    }
    .icon {
      width: 72px; height: 72px;
      margin: 0 auto 14px;
      border-radius: 18px;
      display: grid; place-items: center;
      background: var(--purple);
      color: #fff;
      font-weight: 900;
      font-size: 28px;
    }
    h1 { margin: 10px 0 6px; font-size: 34px; }
    h2 { margin: 0 0 22px; font-size: 20px; font-weight: 500; color: var(--muted); }
    .answers { display: grid; gap: 14px; margin: 18px auto; max-width: 560px; }
    .answer-form { margin: 0; }
    .answer-btn {
      width: 100%;
      border: 0;
      background: var(--btn);
      color: white;
      padding: 16px 18px;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 800;
      cursor: pointer;
      display: inline-block;
      text-align: center;
    }
    .answer-btn:hover { filter: brightness(0.98); }
    .other-details { max-width: 560px; margin: 0 auto; }
    .other-details summary { list-style: none; }
    .other-details summary::-webkit-details-marker { display: none; }
    .other-panel {
      margin-top: 10px;
      text-align: left;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      background: #fff;
    }
    .other-label { display: block; font-weight: 700; margin: 6px 0 8px; }
    .other-textarea {
      width: 100%;
      min-height: 96px;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 16px;
      resize: vertical;
      outline: none;
    }
    .other-submit { margin-top: 10px; }
    .foot { margin-top: 18px; color: var(--muted); font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="icon">AI</div>
      <h1>Quick check-in</h1>
      <h2>What stopped you from scheduling your evaluation?</h2>

      <div class="answers">
        ${oneClickForms}
        ${somethingElseBlock}
      </div>

      <div class="foot">We appreciate your feedback! ❤️</div>
    </div>
  </div>
</body>
</html>`;
}
