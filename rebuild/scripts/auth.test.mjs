import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {onRequest} from '../functions/api/[[path]].js';
const origin='https://revivestetik-dev.pages.dev';
const env={GITHUB_CLIENT_ID:'test-id',GITHUB_CLIENT_SECRET:'test-secret'};
const call=(path,options={},bindings=env)=>onRequest({request:new Request(origin+path,options),env:bindings});
async function begin(){
  const response=await call('/api/auth?provider=github');
  assert.equal(response.status,302);
  return {cookie:response.headers.get('set-cookie').split(';')[0],url:new URL(response.headers.get('location'))};
}
test('reject missing configuration, unsupported provider, methods and preview origins',async()=>{
  assert.equal((await call('/api/auth?provider=github',{},{})).status,503);
  assert.equal((await call('/api/auth?provider=other')).status,400);
  assert.equal((await call('/api/auth',{method:'POST'})).status,405);
  assert.equal((await onRequest({request:new Request('https://preview.pages.dev/api/auth?provider=github'),env})).status,403);
});
test('authorization uses fixed callback, public scope, PKCE and secure session cookie',async()=>{
  const response=await call('/api/auth?provider=github&scope=repo&site_id=evil.example');
  const url=new URL(response.headers.get('location'));
  assert.equal(url.origin,'https://github.com');
  assert.equal(url.searchParams.get('scope'),'public_repo');
  assert.equal(url.searchParams.get('redirect_uri'),origin+'/api/callback');
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.searchParams.get('code_challenge').length,43);
  assert.match(response.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax; Max-Age=600/);
});
test('callback rejects missing, forged, expired or mismatched sessions before token exchange',async()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=()=>{throw new Error('Must not fetch');};
  try {
    assert.equal((await call('/api/callback?code=abc&state=wrong')).status,400);
    const {cookie,url}=await begin();
    assert.equal((await call('/api/callback?code=abc&state=wrong',{headers:{Cookie:cookie}})).status,400);
    assert.equal((await call('/api/callback?code=abc&state='+url.searchParams.get('state'),{headers:{Cookie:cookie+'tampered'}})).status,400);
    const now=Date.now;
    try {
      Date.now=()=>now()+601000;
      assert.equal((await call('/api/callback?code=abc&state='+url.searchParams.get('state'),{headers:{Cookie:cookie}})).status,400);
    } finally {Date.now=now;}
  } finally {globalThis.fetch=saved;}
});
test('callback requires repository write permission and uses a restricted popup handshake',async()=>{
  const saved=globalThis.fetch;
  try {
    for(const push of [false,true]) {
      const {cookie,url}=await begin(); let calls=0;
      globalThis.fetch=async(target,options)=>{
        calls++;
        if(calls===1){
          assert.equal(target,'https://github.com/login/oauth/access_token');
          const body=JSON.parse(options.body);
          assert.equal(body.redirect_uri,origin+'/api/callback');
          assert.ok(body.code_verifier);
          return Response.json({access_token:'fake-test-token'});
        }
        assert.equal(target,'https://api.github.com/repos/FazDeb/RevivEstetik-Repository');
        return Response.json({permissions:{push}});
      };
      const result=await call('/api/callback?code=abc&state='+url.searchParams.get('state'),{headers:{Cookie:cookie}});
      const html=await result.text();
      assert.equal(result.status,push?200:403);
      assert.equal(html.includes('fake-test-token'),push);
      assert.match(result.headers.get('set-cookie'),/Max-Age=0/);
      if(push){
        assert.equal(result.headers.get('cache-control'),'no-store');
        assert.match(result.headers.get('content-security-policy'),/frame-ancestors 'none'/);
        assert.match(html,/event.source!==window.opener/);
        assert.match(html,/authorization:github:success:/);
        assert.ok(!html.includes(env.GITHUB_CLIENT_SECRET));
      }
    }
  }finally{globalThis.fetch=saved;}
});
test('editor keeps filesystem mode locally and uses only dev branch online',async()=>{
  const script=await readFile(new URL('../public/admin/start.js',import.meta.url),'utf8');
  const original=JSON.parse(await readFile(new URL('../public/admin/config.yml',import.meta.url),'utf8'));
  for(const host of ['127.0.0.1','revivestetik-dev.pages.dev','unexpected.pages.dev']) {
    const context={location:{hostname:host,origin:'https://'+host},window:{},fetch:async()=>({ok:true,json:async()=>structuredClone(original)}),document:{body:{appendChild(){}},createElement(){return {};}}};
    await vm.runInNewContext(script,context);
    const config=context.window.REVIVESTETIK_CMS_CONFIG;
    if(host==='unexpected.pages.dev'){assert.equal(config,undefined);continue;}
    assert.equal(config.load_config_file,false);
    if(host==='127.0.0.1')assert.equal(config.backend.name,'git-gateway');
    else {assert.equal(config.backend.branch,'dev/cms-rebuild');assert.equal(config.local_backend,false);assert.equal(config.backend.auth_endpoint,'api/auth');}
  }
});
