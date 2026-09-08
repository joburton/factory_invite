import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'github-pages');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'dist', 'client'), output, { recursive: true });

let html = await readFile(path.join(root, 'dist', 'server', 'prerendered-routes', 'index.html'), 'utf8');
html = html
  .replaceAll('href="/_next/', 'href="./_next/')
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/_next/', 'src="./_next/')
  .replaceAll('src="/', 'src="./');

await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, '.nojekyll'), '');
