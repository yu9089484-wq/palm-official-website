import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'SOURCE-MANIFEST.json'),'utf8'));
for(const item of manifest){
 const bytes=fs.readFileSync(path.join(root,item.path));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Snapshot mismatch: '+item.path);
 if(item.path.endsWith('.js')||item.path.endsWith('.mjs'))execFileSync(process.execPath,['--check',path.join(root,item.path)]);
}
const html=fs.readFileSync(path.join(root,'web/index.html'),'utf8');
for(const [,ref]of html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)){
 if(ref.includes(':')||ref.startsWith('/'))continue;
 if(!fs.existsSync(path.join(root,'web',ref)))throw Error('Missing asset: '+ref);
}
console.log('Snapshot hashes, JavaScript syntax and page assets verified: '+manifest.length+' source files.');
