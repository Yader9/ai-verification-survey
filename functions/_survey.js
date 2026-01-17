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

  const oneClickForms = oneClickReasons
    .map(
      (r) => `
    <form method="POST" action="/r" class="answer-form">
      <input type="hidden" name="reason_code" value="${esc(r.code)}" />
      <input type="hidden" name="reason_label" value="${esc(r.label)}" />

      <input type="hidden" name="email" value="${t.email}" />
      <input type="hidden" name="campaign" value="${t.campaign}" />
      <input type="hidden" name="source" value="${t.source}" />
      <input type="hidden" name="sent_at" value="${t.sent_at}" />

      <button type="submit" class="answer-btn">${esc(r.btn)}</button>
    </form>
  `
    )
    .join("\n");

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
    :root { --btn:#4f80ff; --bg:#f2f3f5; --card:#ffffff; --text:#111827; --muted:#6b7280; --border:#e5e7eb; }
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

    /* A.Team logo */
    .logo {
      margin: 0 auto 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo svg {
      width: 82px;
      height: auto;
      display: block;
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

      <div class="logo" role="img" aria-label="A.Team">
        <!-- inlined A.Team icon -->
        <svg width="82" height="72" viewBox="0 0 82 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M48.309 3.9244C46.3855 0.318612 41.8935 -1.05023 38.2758 0.866997C34.6582 2.78423 33.2848 7.26151 35.2084 10.8673L65.7265 68.0754C67.65 71.6812 72.142 73.05 75.7596 71.1328C79.3773 69.2155 80.7506 64.7383 78.8271 61.1325L48.309 3.9244Z" fill="url(#paint0)" />
          <path d="M48.0337 10.8675C49.9573 7.26175 48.5839 2.78447 44.9663 0.867238C41.3486 -1.04999 36.8566 0.318853 34.9331 3.92464L21.2341 29.6042C24.3172 33.878 28.6937 36.7076 33.5007 38.1105L48.0337 10.8675Z" fill="url(#paint1)" />
          <path d="M24.5664 54.8585C19.9377 53.0895 15.6051 50.545 11.8326 47.2279L4.41498 61.1327C2.49145 64.7385 3.86479 69.2158 7.48243 71.133C11.1001 73.0502 15.5921 71.6814 17.5156 68.0756L24.5664 54.8585Z" fill="url(#paint2)" />
          <path d="M48.5463 40.0685C34.1519 44.1029 16.3898 36.5314 14.8137 17.0659C14.4842 12.9954 10.9063 9.96181 6.82233 10.2903C2.73838 10.6188 -0.305148 14.185 0.024431 18.2555C2.56843 49.676 32.693 61.5227 55.6857 53.4518L48.5463 40.0685Z" fill="url(#paint3)" />
          <path d="M71.4949 43.1859C77.1334 37.0771 80.9958 28.7625 81.811 18.2295C82.1261 14.1577 79.07 10.6023 74.9849 10.2882C70.8998 9.97415 67.3327 13.0203 67.0175 17.092C66.6765 21.4987 65.4791 25.3035 63.6621 28.5028L71.4949 43.1859Z" fill="url(#paint4)" />
          <defs>
            <linearGradient id="paint0" gradientUnits="userSpaceOnUse" x1="223.55" y1="-34.007" x2="244.19" y2="97.1408">
              <stop stop-color="#A54CFF"/>
              <stop offset="1" stop-color="#7000E3"/>
            </linearGradient>
            <linearGradient id="paint1" gradientUnits="userSpaceOnUse" x1="223.55" y1="-34.007" x2="244.19" y2="97.1408">
              <stop stop-color="#A54CFF"/>
              <stop offset="1" stop-color="#7000E3"/>
            </linearGradient>
            <linearGradient id="paint2" gradientUnits="userSpaceOnUse" x1="223.55" y1="-34.007" x2="244.19" y2="97.1408">
              <stop stop-color="#A54CFF"/>
              <stop offset="1" stop-color="#7000E3"/>
            </linearGradient>
            <linearGradient id="paint3" gradientUnits="userSpaceOnUse" x1="223.55" y1="-34.007" x2="244.19" y2="97.1408">
              <stop stop-color="#A54CFF"/>
              <stop offset="1" stop-color="#7000E3"/>
            </linearGradient>
            <linearGradient id="paint4" gradientUnits="userSpaceOnUse" x1="223.55" y1="-34.007" x2="244.19" y2="97.1408">
              <stop stop-color="#A54CFF"/>
              <stop offset="1" stop-color="#7000E3"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

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
