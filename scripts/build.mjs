import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, relative } from 'node:path';
import { headers } from './security.mjs';
const source = resolve('public');
const target = resolve('dist');
mkdirSync(target, { recursive: true });
// Fail closed on stale artifacts without deleting anyone's files.
for (const file of walk(target)) {
  const name = relative(target, file);
  if (!['_headers','_redirects'].includes(name) && !existsSync(join(source,name))) {
    throw new Error('Stale build artifact detected. Review and move it out of dist before rebuilding.');
  }
}
// Copy only a dedicated public directory; never publish the repository root.
cpSync(source, target, { recursive: true });
function walk(dir) { return readdirSync(dir).flatMap((n) => statSync(join(dir,n)).isDirectory() ? walk(join(dir,n)) : [join(dir,n)]); }
const hashes = walk(source).filter((p) => p.endsWith('.html')).flatMap((p) => {
  const text = readFileSync(p,'utf8');
  return [...text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => createHash('sha256').update(m[1]).digest('base64'));
});
const secure = headers({ hashes: [...new Set(hashes)] });
writeFileSync(join(target,'_headers'), '/*\n' + Object.entries(secure).map(([k,v]) => `  ${k}: ${v}`).join('\n') + '\n');
writeFileSync(join(target,'_redirects'), '/privacy /privacy/ 301\n/consent /consent/ 301\n/terms /terms/ 301\n/security /security/ 301\n');
console.log('Production artifact built in dist. Publication requires release:check and owner approval.');
