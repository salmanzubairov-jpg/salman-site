import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { headers } from '../scripts/security.mjs';
function walk(dir){return readdirSync(dir).flatMap((n)=>statSync(join(dir,n)).isDirectory()?walk(join(dir,n)):[join(dir,n)]);}
const files=walk('public');
const textual=files.filter((p)=>/\.(html|js|css|json|txt|xml|webmanifest|svg)$/.test(p));
const html=readFileSync('public/index.html','utf8');
test('No automatic collection, leaked tokens, runtime compilation or browser storage',()=>{
  for(const p of textual){const s=readFileSync(p,'utf8');
    assert.doesNotMatch(s,/\b\d{6,12}:[A-Za-z0-9_-]{25,}\b/,p);
    assert.doesNotMatch(s,/api\.telegram\.org|chat_id|TG_TOKEN|TG_CHAT/,p);
    assert.doesNotMatch(s,/<(?:input|textarea|form)\b|\bon\w+\s*=|\beval\s*\(|new Function\s*\(/i,p);
  }
  const js=readFileSync('public/assets/site.js','utf8');
  assert.doesNotMatch(js,/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|document\.cookie/);
});
test('All resource URLs stay local; no executable inline code or inline styles',()=>{
  for(const p of files.filter((f)=>f.endsWith('.html'))){const s=readFileSync(p,'utf8');
    assert.doesNotMatch(s,/\b(?:src|style)\s*=\s*["'](?:https?:|data:|blob:)/i,p);
    assert.doesNotMatch(s,/\sstyle\s*=|<style\b|<iframe\b|\{\{/i,p);
    for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))assert.ok(m[1].includes('src=') || m[1].includes('application/ld+json'),p);
    assert.match(s,/<html lang="ru">/,p);
    for(const path of ['/privacy/','/consent/','/terms/'])assert.ok(s.includes(`href="${path}"`),p);
  }
});
test('Native disclosure and contact links are present without JavaScript',()=>{
  assert.equal((html.match(/name="services"/g)||[]).length,5);
  assert.equal((html.match(/name="faq"/g)||[]).length,8);
  for(const target of ['https://t.me/salmzyb','https://wa.me/79038294592','tel:+79038294592'])assert.ok(html.includes(`href="${target}"`));
  assert.doesNotMatch(html,/href="(?:https:\/\/(?:t\.me|wa\.me)[^"]*\?)/);
});
test('CSP blocks unsolicited data submission and external resources',()=>{
  const h=headers();const csp=h['Content-Security-Policy'];
  for(const directive of ["default-src 'none'","connect-src 'none'","form-action 'none'","frame-ancestors 'none'","base-uri 'none'","object-src 'none'"])assert.ok(csp.includes(directive));
  assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval|\*/);
  assert.equal(h['X-Content-Type-Options'],'nosniff');assert.equal(h['X-Frame-Options'],'DENY');
  assert.equal(h['Strict-Transport-Security'],'max-age=31536000');
  assert.ok(!('Access-Control-Allow-Origin' in h));
});
test('Built files preserve headers and contain only current public files plus Netlify config',()=>{
  const emitted=readFileSync('dist/_headers','utf8');
  for(const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){
    JSON.parse(m[1]);assert.ok(emitted.includes(createHash('sha256').update(m[1]).digest('base64')));
  }
  for(const file of walk('dist')){
    assert.doesNotMatch(file,/\.map$|\.env|node_modules|\.git/);
    if(!file.endsWith('_headers')&&!file.endsWith('_redirects'))assert.ok(files.includes(file.replace(/^dist/,'public')),'Stale artifact: '+file);
  }
});
test('security.txt and legal drafts are explicit',()=>{
  const s=readFileSync('public/.well-known/security.txt','utf8');
  assert.match(s,/Contact: https:\/\/t.me\/salmzyb/);assert.match(s,/Canonical: https:\/\/salmanzub.pro\/\.well-known\/security.txt/);
  assert.ok(Date.parse(s.match(/Expires: (.*)/)[1])>Date.now());
  for(const slug of ['privacy','consent','terms'])assert.match(readFileSync(`public/${slug}/index.html`,'utf8'),/Черновик для проверки владельцем/);
  assert.ok(Object.values(JSON.parse(readFileSync('release-review.json','utf8'))).every((v)=>v===false));
});
