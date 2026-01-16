import { readTrackingParams, renderLandingPage } from "./_survey";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const tracking = readTrackingParams(url);

  return new Response(renderLandingPage(tracking), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}
