// Server-only Cloudflare Pages Function. Never include secrets in static assets.
const ORIGIN = 'https://revivestetik-dev.pages.dev';
const CALLBACK = `${ORIGIN}/api/callback`;
const COOKIE = '__Host-revivestetik-oauth';
const encoder = new TextEncoder();
const base64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const random = () => base64(crypto.getRandomValues(new Uint8Array(32)));
const headers = {'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff'};
const cookie = (value, age = 600) => `${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;
async function signature(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return base64(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
function text(message, status = 400) {
  return new Response(message, {status, headers: {...headers, 'Content-Type': 'text/plain; charset=utf-8', 'Set-Cookie': cookie('', 0)}});
}
function popup(payload) {
  const nonce = random();
  const literal = JSON.stringify(`authorization:github:success:${JSON.stringify(payload)}`).replaceAll('<', '\\u003c');
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>RevivEstetik sign-in</title><p>Completing sign-in. You can close this window once the editor opens.</p><script nonce="${nonce}">
const origin=${JSON.stringify(ORIGIN)};
history.replaceState(null,'','/api/callback');
if(window.opener){
  window.addEventListener('message',function receive(event){
    if(event.origin!==origin||event.source!==window.opener||event.data!=='authorizing:github')return;
    window.removeEventListener('message',receive);
    window.opener.postMessage(${literal},origin);
  });
  window.opener.postMessage('authorizing:github',origin);
}
</script></html>`, {headers: {...headers, 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('', 0), 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`}});
}
export async function onRequest({request, env}) {
  const url = new URL(request.url);
  if (!['/api/auth', '/api/callback'].includes(url.pathname)) return text('Not found', 404);
  if (request.method !== 'GET') return text('Method not allowed', 405);
  if (url.origin !== ORIGIN) return text(`Use the editor at ${ORIGIN}/admin/`, 403);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return text('Online sign-in is not configured yet.', 503);
  try {
    if (url.pathname === '/api/auth') {
      if (url.searchParams.get('provider') !== 'github') return text('Unsupported login provider');
      const session = {state: random(), verifier: random(), expires: Date.now() + 600000};
      const encoded = base64(encoder.encode(JSON.stringify(session)));
      const signed = `${encoded}.${await signature(encoded, env.GITHUB_CLIENT_SECRET)}`;
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.search = new URLSearchParams({client_id: env.GITHUB_CLIENT_ID, redirect_uri: CALLBACK, scope: 'public_repo', state: session.state, code_challenge: base64(await crypto.subtle.digest('SHA-256', encoder.encode(session.verifier))), code_challenge_method: 'S256'}).toString();
      return new Response(null, {status: 302, headers: {...headers, Location: authorize.href, 'Set-Cookie': cookie(signed)}});
    }
    const raw = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!raw) return text('Sign-in session expired. Close this window and try again.');
    const [encoded, mac] = raw.split('.');
    if (!encoded || mac !== await signature(encoded, env.GITHUB_CLIENT_SECRET)) return text('Invalid sign-in session.');
    const session = JSON.parse(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')));
    if (session.expires < Date.now() || !url.searchParams.get('state') || url.searchParams.get('state') !== session.state) return text('Invalid or expired sign-in state.');
    if (url.searchParams.has('error') || !url.searchParams.get('code')) return text('GitHub sign-in was cancelled. Close this window and try again.');
    const exchange = await fetch('https://github.com/login/oauth/access_token', {method: 'POST', headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}, body: JSON.stringify({client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, redirect_uri: CALLBACK, code: url.searchParams.get('code'), code_verifier: session.verifier})});
    const token = await exchange.json();
    if (!exchange.ok || !token.access_token) return text('GitHub could not complete sign-in. Please try again.', 502);
    const access = await fetch('https://api.github.com/repos/FazDeb/RevivEstetik-Repository', {headers: {'Authorization': `Bearer ${token.access_token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'RevivEstetik-CMS'}});
    const repository = await access.json();
    if (!access.ok || !repository.permissions?.push) return text('This GitHub account needs write access to the RevivEstetik repository.', 403);
    return popup({token: token.access_token, provider: 'github'});
  } catch {
    // Never return or log codes, secrets, or tokens on failure.
    return text('Sign-in could not complete. Close this window and try again.', 502);
  }
}
