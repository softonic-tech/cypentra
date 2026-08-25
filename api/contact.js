const TO = 'info@cypentra.com';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const body = readBody(req);
  const trap = String(body.website || body._honey || '').trim();
  if (trap) return res.status(200).json({ ok: true });

  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const business = String(body.business || '').trim().slice(0, 160);
  const message = String(body.message || '').trim().slice(0, 4000);

  if (!EMAIL.test(email) || !name || !message) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(TO), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        name,
        email,
        business,
        message,
        _subject: 'New enquiry from cypentra.com',
        _replyto: email,
        _template: 'table',
        _captcha: 'false'
      })
    });
    const data = await r.json().catch(() => ({}));
    const ok = r.ok && (data.success === true || data.success === 'true');
    if (!ok) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false });
  } finally {
    clearTimeout(timer);
  }
};
