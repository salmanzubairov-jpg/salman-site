import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
function walk(dir) {return readdirSync(dir).flatMap((n)=>statSync(join(dir,n)).isDirectory()?walk(join(dir,n)):[join(dir,n)]);}
const files=[...walk('scripts'),...walk('tests'),...walk('public')].filter((f)=>/\.(mjs|js)$/.test(f));
for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
console.log(`JavaScript syntax: ${files.length} files passed. No TypeScript in this project.`);
