// Minimal SWA API function to relay form data to your Logic App
module.exports = async function (context, req) {
  // CORS (harmless even on same-origin)
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: cors };
    return;
  }

  if (req.method !== 'POST') {
    context.res = { status: 405, headers: cors, body: 'Method Not Allowed' };
    return;
  }

  const LOGIC_APP_URL = process.env.LOGIC_APP_URL;
  if (!LOGIC_APP_URL) {
    context.res = { status: 500, headers: cors, body: 'Missing LOGIC_APP_URL' };
    return;
  }

  const { name, phone, email, message, page, honeypot } = req.body || {};

  // Basic spam/validation
  if (honeypot) {                      // hidden field should be empty
    context.res = { status: 204, headers: cors };
    return;
  }
  if (!name || !phone) {
    context.res = { status: 400, headers: cors, body: 'name and phone are required' };
    return;
  }

  try {
    // Forward to Logic App
    const resp = await fetch(LOGIC_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, message, page })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      context.res = { status: 502, headers: cors, body: `Upstream error: ${text}` };
      return;
    }

    context.res = { status: 200, headers: cors, body: { ok: true } };
  } catch (err) {
    context.res = { status: 502, headers: cors, body: `Relay failed: ${err.message}` };
  }
};
