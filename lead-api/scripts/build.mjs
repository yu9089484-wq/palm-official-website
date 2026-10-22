import {mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
mkdirSync(resolve(root,'dist/server'),{recursive:true});
copyFileSync(resolve(root,'worker/index.js'),resolve(root,'dist/server/index.js'));
console.log('Built worker module; configure the DB binding and ALLOWED_ORIGIN on your host before deployment.');
