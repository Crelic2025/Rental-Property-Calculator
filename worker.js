/**
 * worker.js — Cloudflare Worker proxy for RentCast + HUD FMR
 *
 * Routes:
 *   /rentcast/*  → https://api.rentcast.io/v1/*   (injects X-Api-Key)
 *   /hud/*       → https://www.huduser.gov/hudapi/public/*  (injects Bearer token)
 *
 * Deploy:
 *   npx wrangler deploy
 *   npx wrangler secret put RENTCAST_API_KEY
 *   npx wrangler secret put HUD_API_TOKEN
 *
 * Free tier: 100,000 requests/day — more than enough for personal use.
 */

// Origins allowed to call this worker.
// Add your GitHub Pages URL, local file path (shown as "null"), etc.
const ALLOWED_ORIGINS = [
  'null',                        // file:// in iOS Safari / desktop
  'https://your-custom.page',   // replace with your actual hosting URL if any
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || 'null';

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only GET supported downstream
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders(origin) });
    }

    try {
      let upstreamUrl, upstreamHeaders = {};

      if (url.pathname.startsWith('/rentcast/')) {
        upstreamUrl = 'https://api.rentcast.io/v1/' + url.pathname.slice('/rentcast/'.length) + url.search;
        upstreamHeaders['X-Api-Key'] = env.RENTCAST_API_KEY;
        upstreamHeaders['Accept'] = 'application/json';

      } else if (url.pathname.startsWith('/hud/')) {
        upstreamUrl = 'https://www.huduser.gov/hudapi/public/' + url.pathname.slice('/hud/'.length) + url.search;
        upstreamHeaders['Authorization'] = 'Bearer ' + env.HUD_API_TOKEN;
        upstreamHeaders['Accept'] = 'application/json';

      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
      }

      const upstream = await fetch(upstreamUrl, { headers: upstreamHeaders });
      const body = await upstream.text();

      return new Response(body, {
        status: upstream.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'  // cache 1h — saves API calls
        }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }
  }
};

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
